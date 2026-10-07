// Vérifie que chaque lien, image, vidéo et feuille de style internes de dist/ pointe sur un fichier qui existe.
// Usage : node scripts/liens.mjs   (après `astro build`)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const htmls = [];
const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) htmls.push(p); } };
walk(DIST);

const attrs = /(?:href|src|poster|content)="([^"]*)"/g;
const srcsets = /srcset="([^"]*)"/g;
// /api/ est servi par le serveur (formulaire) ; /404/ n'est que l'adresse canonique de la page d'erreur
const ignorer = (u) => !u.startsWith('/') || u.startsWith('//') || u.startsWith('/api/') || u === '/404/';
const existe = (u) => {
  const chemin = decodeURI(u.replace(/[?#].*$/, ''));
  const base = join(DIST, chemin);
  if (chemin.endsWith('/')) return existsSync(join(base, 'index.html'));
  return existsSync(base) || existsSync(join(base, 'index.html'));
};

const casses = new Map();
let n = 0;
for (const f of htmls) {
  const html = readFileSync(f, 'utf8');
  const cibles = new Set();
  for (const m of html.matchAll(attrs)) cibles.add(m[1]);
  for (const m of html.matchAll(srcsets)) for (const part of m[1].split(',')) cibles.add(part.trim().split(/\s+/)[0]);
  for (const u of cibles) {
    const url = u.startsWith('https://studio.madigitalagency.net') ? u.slice('https://studio.madigitalagency.net'.length) : u;
    if (!url || ignorer(url)) continue;
    n++;
    if (!existe(url)) { if (!casses.has(url)) casses.set(url, []); casses.get(url).push(f); }
  }
}
for (const [u, fs] of casses) console.log(`  CASSÉ · ${u}  (${fs.length} page(s), ex. ${fs[0]})`);
console.log(`${htmls.length} pages, ${n} références internes, ${casses.size} cassée(s)`);
process.exit(casses.size ? 1 : 0);
