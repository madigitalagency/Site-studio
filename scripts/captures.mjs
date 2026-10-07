// Captures d'écran pleine page, trois largeurs, avec le Chrome installé sur le PC.
// Usage : node scripts/captures.mjs [base=http://127.0.0.1:4321] [sortie=.impeccable/review]
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:4321';
const out = process.argv[3] ?? '.impeccable/review';
const pages = [
  ['accueil', '/'],
  ['serie-rouvray', '/series/rouvray/'],
  ['fiche-rouvray-2', '/series/rouvray/02-un-dimanche-a-orly/'],
  ['films', '/films/'],
  ['series', '/series/'],
  ['univers', '/univers/'],
  ['methode', '/methode/'],
  ['coulisses', '/coulisses/'],
  ['roger', '/roger/'],
  ['contact', '/contact/'],
  ['prestations', '/prestations/'],
  ['a-propos', '/a-propos/'],
  ['carnet', '/carnet/'],
  ['note-musique', '/carnet/une-musique-par-style/'],
  ['serie-varenne', '/series/varenne/'],
  ['fiche-generique', '/films/varenne-nothing-shows/'],
  ['fiche-varenne-2', '/series/varenne/s1e02-les-chiffres/'],
  ['lexique', '/lexique/'],
  ['notion-vitesse', '/lexique/vitesse-a-l-ecran/'],
];
const largeurs = (process.env.LARGEURS ?? '390,1024,1440').split(',').map(Number);
const seules = process.env.PAGES?.split(',');
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--hide-scrollbars', '--force-prefers-reduced-motion'],
});
for (const [nom, chemin] of pages.filter(([n]) => !seules || seules.includes(n))) {
  for (const w of largeurs) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
    await page.goto(base + chemin, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll('img')) img.loading = 'eager';
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
      window.scrollTo(0, 0);
      await document.fonts.ready;
    });
    await page.waitForNetworkIdle({ idleTime: 400 });
    const fichier = `${out}/${nom}-${w}.png`;
    await page.screenshot({ path: fichier, fullPage: true });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`${fichier}  hauteur ${h}px${sw > w ? `  ⚠ débordement horizontal (${sw}px)` : ''}`);
    await page.close();
  }
}
await browser.close();
