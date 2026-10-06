// `npm run check` — la structure se protège elle-même (CDC v2 §4.6, v3 §4.3).
// Erreurs (sortie 1) : liste interdite, noms d'outils, identifiants de génération, coulisses manquantes sur une
// pièce publiée, notions inconnues, archive sans source, médias déclarés absents, poids > 25 Mo, code en ligne dans dist/.
// Avertissements : série sans coulisses, notion jamais citée, version EN absente, tournures à éviter.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const racine = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const lire = (p) => readFileSync(join(racine, p), 'utf8');
const listeFichiers = (d, ext) => (existsSync(join(racine, d)) ? readdirSync(join(racine, d)).filter((f) => f.endsWith(ext)) : []);
const erreurs = [];
const avis = [];
const err = (m) => erreurs.push(m);
const warn = (m) => avis.push(m);

const interdits = lire('ops/liste-interdite.txt').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const outils = lire('ops/outils-interdits.txt').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const tournures = lire('ops/tournures-a-eviter.txt').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

const pieces = listeFichiers('src/content/pieces', '.json').map((f) => ({ id: f.replace(/\.json$/, ''), f, data: JSON.parse(lire('src/content/pieces/' + f)) }));
const series = listeFichiers('src/content/series', '.json').map((f) => ({ id: f.replace(/\.json$/, ''), f, data: JSON.parse(lire('src/content/series/' + f)) }));
const notions = listeFichiers('src/content/notions', '.md').map((f) => f.replace(/\.md$/, ''));

/** Toutes les chaînes d'un objet, pour les contrôles de texte. */
function chaines(o, chemin = '') {
  if (typeof o === 'string') return [[chemin, o]];
  if (Array.isArray(o)) return o.flatMap((v, i) => chaines(v, `${chemin}[${i}]`));
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => chaines(v, chemin ? `${chemin}.${k}` : k));
  return [];
}
const motEntier = (mot) => new RegExp(`(^|[^\\p{L}\\p{N}])${mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}])`, 'u');
const uuid = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

function controlerTextes(label, obj, champsPublies) {
  for (const [chemin, s] of chaines(obj)) {
    if (chemin.startsWith('sources_media')) continue; // chemins du coffre, jamais publiés
    for (const m of interdits) if (motEntier(m).test(s)) err(`${label} · ${chemin} : nom interdit « ${m} »`);
    for (const m of outils) if (motEntier(m).test(s)) err(`${label} · ${chemin} : nom d'outil « ${m} »`);
    if (uuid.test(s)) err(`${label} · ${chemin} : identifiant de génération`);
    for (const t of tournures) if (new RegExp(t, 'iu').test(s)) warn(`${label} · ${chemin} : tournure à éviter « ${t} »`);
  }
}

// Pièces
for (const p of pieces) {
  const d = p.data;
  controlerTextes(`pièce ${p.id}`, d);
  const publie = d.statut === 'publie' || d.statut === 'programme';
  if (publie && d.fiche !== false && !d.annexe && !d.coulisses?.texte?.fr) err(`pièce ${p.id} : publiée sans texte de coulisses (FR)`);
  for (const n of d.notions ?? []) if (!notions.includes(n)) err(`pièce ${p.id} : notion inconnue « ${n} »`);
  if (d.format === 'archive-narree' && !(d.sources?.length)) err(`pièce ${p.id} : archive sans source`);
  if (d.serie && !series.some((s) => s.id === d.serie)) err(`pièce ${p.id} : série inconnue « ${d.serie} »`);
  if (d.titre?.en && !d.pitch?.en) err(`pièce ${p.id} : titre EN sans pitch EN`);
  if (!d.titre?.en) warn(`pièce ${p.id} : pas de version EN`);
  if (d.coulisses?.texte?.fr) {
    const mots = d.coulisses.texte.fr.replace(/\*\*/g, '').split(/\s+/).length;
    if (mots < 70 || mots > 190) warn(`pièce ${p.id} : coulisses de ${mots} mots (cible 100 à 150)`);
  }
  // Médias
  const dossier = join(racine, 'public/media', p.id);
  const attendus = [];
  if (d.media?.poster) attendus.push(`${d.media.poster}.webp`, ...(d.fiche !== false && !d.annexe ? [`${d.media.poster}.jpg`] : []));
  for (const base of Object.values(d.media?.v916 ?? {})) attendus.push(`${base}-1080.mp4`, `${base}-720.mp4`);
  if (d.media?.teaser) attendus.push(d.media.teaser);
  for (const im of d.coulisses?.images ?? []) for (const k of ['image', 'avant', 'apres']) if (typeof im[k] === 'string') { const f = join(racine, 'public', im[k]); if (!existsSync(f)) err(`pièce ${p.id} : image de coulisses absente ${im[k]}`); }
  if (publie) {
    for (const a of attendus) { const f = join(dossier, a); if (!existsSync(f)) err(`pièce ${p.id} : média absent public/media/${p.id}/${a}`); }
    // Budget : 25 Mo par version de langue (1080 + 720), hors versions déclinées (CDC v2 §8.2)
    for (const [l, base] of Object.entries(d.media?.v916 ?? {})) {
      let poids = 0;
      for (const a of [`${base}-1080.mp4`, `${base}-720.mp4`]) { const f = join(dossier, a); if (existsSync(f)) poids += statSync(f).size; }
      if (poids > 25 * 1024 * 1024) err(`pièce ${p.id} (${l}) : ${(poids / 1048576).toFixed(1)} Mo de vidéo (budget 25 Mo)`);
    }
  }
}
const unes = pieces.filter((p) => p.data.une);
if (unes.length > 1) err(`plusieurs pièces « à la une » : ${unes.map((p) => p.id).join(', ')}`);

// Séries
for (const s of series) {
  controlerTextes(`série ${s.id}`, s.data);
  if (!s.data.coulisses?.texte?.fr) warn(`série ${s.id} : sans coulisses`);
  for (const n of s.data.notions ?? []) if (!notions.includes(n)) err(`série ${s.id} : notion inconnue « ${n} »`);
  for (const im of s.data.coulisses?.images ?? []) if (im.image && !existsSync(join(racine, 'public', im.image))) err(`série ${s.id} : image absente ${im.image}`);
}

// Notions : textes + « Vu dans »
for (const n of notions) {
  const md = lire(`src/content/notions/${n}.md`);
  controlerTextes(`notion ${n}`, { md });
  const citee = pieces.some((p) => (p.data.notions ?? []).includes(n)) || series.some((s) => (s.data.notions ?? []).includes(n));
  if (!citee) warn(`notion ${n} : jamais citée (« Vu dans » vide)`);
}

// Textes d'interface et gabarits
for (const f of ['src/i18n/fr.json', 'src/i18n/en.json']) controlerTextes(f, JSON.parse(lire(f)));
for (const f of ['src/routes', 'src/components', 'src/layouts']) for (const g of listeFichiers(f, '.astro')) controlerTextes(`${f}/${g}`, { src: lire(`${f}/${g}`) });

// dist : aucun code en ligne (si construit)
if (existsSync(join(racine, 'dist'))) {
  const parcourir = (d) => readdirSync(join(racine, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? parcourir(join(d, e.name)) : e.name.endsWith('.html') ? [join(d, e.name)] : []));
  for (const h of parcourir('dist')) {
    const html = lire(h);
    if (/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/i.test(html)) err(`${h} : script en ligne`);
    if (/<style[^>]*>/i.test(html)) err(`${h} : style en ligne`);
    if (/\sstyle="/i.test(html)) err(`${h} : attribut style en ligne`);
  }
}

for (const a of avis) console.log(`  avertissement · ${a}`);
for (const e of erreurs) console.log(`  ERREUR · ${e}`);
console.log(`\n${pieces.length} pièces, ${series.length} séries, ${notions.length} notions · ${erreurs.length} erreur(s), ${avis.length} avertissement(s)`);
process.exit(erreurs.length ? 1 : 0);
