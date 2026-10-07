// Lighthouse sur les gabarits du site, avec le Chrome du PC, contre le serveur d'aperçu (astro preview sur 127.0.0.1:4321).
// Usage : node scripts/lighthouse.mjs [mobile|desktop]   → scores par page, rapport JSON dans work/lighthouse/
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4321';
const PAGES = ['/', '/series/rouvray/02-un-dimanche-a-orly/', '/series/varenne/', '/series/varenne/s1e03-keller/', '/films/', '/methode/', '/lexique/', '/prestations/', '/contact/', '/roger/', '/en/'];
const forme = process.argv[2] === 'desktop' ? 'desktop' : 'mobile';
const SEUIL = 95;

const chrome = await chromeLauncher.launch({ chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', chromeFlags: ['--headless=new', '--no-sandbox'] });
mkdirSync('work/lighthouse', { recursive: true });
const lignes = [];
let sous = 0;
try {
  for (const page of PAGES) {
    const r = await lighthouse(BASE + page, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], formFactor: forme, screenEmulation: forme === 'desktop' ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false } : undefined });
    const c = r.lhr.categories;
    const s = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)]));
    const min = Math.min(...Object.values(s));
    if (min < SEUIL) sous++;
    const audits = Object.values(r.lhr.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable').map((a) => `${a.id} (${Math.round((a.score ?? 0) * 100)})`);
    lignes.push(`${page.padEnd(42)} perf ${s.performance}  a11y ${s.accessibility}  bonnes pratiques ${s['best-practices']}  seo ${s.seo}${min < SEUIL ? '  ← sous ' + SEUIL : ''}${audits.length ? '\n' + ' '.repeat(42) + audits.join(', ') : ''}`);
    writeFileSync(`work/lighthouse/${forme}${page.replace(/\//g, '_') || '_'}.json`, r.report);
  }
} finally {
  await chrome.kill();
}
console.log(`Lighthouse ${forme}, seuil ${SEUIL}\n` + lignes.join('\n') + `\n${PAGES.length} pages, ${sous} sous le seuil`);
process.exit(sous ? 1 : 0);
