// Planches VARENNE : convertit le carrousel de chaque épisode en WebP et lit le texte des bulles dans le découpage.
// Usage : node scripts/planches.mjs [n...]   (par défaut 1 à 7)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const COFFRE = 'C:/Users/moura/Dropbox/Perso/Claude/Claude/02_DOMAINES_VIE/06_MA_Digital_Agency/Studio/Varenne/Production';
const eps = process.argv.slice(2).map(Number);
const liste = eps.length ? eps : [1, 2, 3, 4, 5, 6, 7];

/** Texte des planches depuis le découpage : { n: ['Récitatif…', 'Éléna : …'] } */
function lireTextes(md) {
  const out = {};
  let courant = null;
  let derniere = null;
  for (const brut of md.split(/\r?\n/)) {
    const ligne = brut.trimEnd();
    const h = ligne.match(/^## Planche (\d+)/);
    if (h) { courant = Number(h[1]); out[courant] = []; derniere = null; continue; }
    if (/^## /.test(ligne)) { courant = null; derniere = null; continue; }
    if (courant === null) continue;
    const m = ligne.match(/^\*\*(Récitatif[^*]*|Encadré[^*]*|Bulle [^*]+|Carton[^*]*)\*\*\s*:\s*(.*)$/);
    if (m) {
      const type = m[1].trim();
      let texte = m[2].trim();
      let prefixe = '';
      const bulle = type.match(/^Bulle (.+)$/);
      if (bulle) prefixe = bulle[1].replace(/\s*\(.*\)$/, '').trim() + ' : ';
      else if (/^Encadré/.test(type)) prefixe = 'Encadré : ';
      derniere = out[courant].length;
      out[courant].push(prefixe + texte);
      continue;
    }
    // ligne de continuation d'une bulle ou d'un récitatif
    if (derniere !== null && ligne && !/^(\*\*|>|-|\||#|Note|Prompt)/.test(ligne) && !/^\s*$/.test(ligne)) {
      out[courant][derniere] += ' ' + ligne.trim();
    } else if (!ligne) {
      derniere = null;
    }
  }
  return out;
}

for (const n of liste) {
  const dossier = join(COFFRE, `Episode-0${n}`);
  const carrousel = join(dossier, 'carrousel-tiktok');
  const images = readdirSync(carrousel).filter((f) => /^\d{2}-.*\.(jpg|png)$/i.test(f)).sort();
  const sortie = `public/media/varenne-s1e0${n}/planches`;
  mkdirSync(sortie, { recursive: true });
  const textes = lireTextes(readFileSync(join(dossier, `ep0${n}-decoupage.md`), 'utf8'));
  const dejaVu = new Set();
  const planches_texte = [];
  for (let i = 0; i < images.length; i++) {
    const f = images[i];
    const num = String(i + 1).padStart(2, '0');
    const dest = join(sortie, `${num}.webp`);
    if (!existsSync(dest)) await sharp(join(carrousel, f)).resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 82 }).toFile(dest);
    const p = f.match(/-p(\d+)-/);
    let texte;
    if (/couverture/i.test(f)) texte = 'Couverture';
    else if (/suivre/i.test(f)) texte = 'À suivre';
    else if (p) {
      const k = Number(p[1]);
      if (dejaVu.has(k)) texte = `Planche ${k}, suite`;
      else { dejaVu.add(k); texte = (textes[k] ?? []).join(' — ') || `Planche ${k}`; }
    } else texte = `Planche ${i + 1}`;
    planches_texte.push(texte);
  }
  const fichier = `src/content/pieces/varenne-s1e0${n}.json`;
  const piece = JSON.parse(readFileSync(fichier, 'utf8'));
  piece.media.planches = images.length;
  piece.planches_texte = { fr: planches_texte };
  writeFileSync(fichier, JSON.stringify(piece, null, 2) + '\n');
  console.log(`ep${n} : ${images.length} planches, ${Object.keys(textes).length} planches texte`);
}
