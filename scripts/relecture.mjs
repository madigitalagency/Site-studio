// Document de relecture : rassemble tous les textes du site écrits à la place de Mourad, en un seul Markdown, dans l'ordre d'importance.
// Usage : node scripts/relecture.mjs <sortie.md>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const sortie = process.argv[2];
const lire = (p) => readFileSync(p, 'utf8');
const json = (p) => JSON.parse(lire(p));
const fr = json('src/i18n/fr.json');
const pieces = readdirSync('src/content/pieces').filter((f) => f.endsWith('.json')).map((f) => ({ id: f.replace('.json', ''), ...json('src/content/pieces/' + f) }));
const series = readdirSync('src/content/series').filter((f) => f.endsWith('.json')).map((f) => ({ id: f.replace('.json', ''), ...json('src/content/series/' + f) }));
const methode = json('src/data/methode.json');
const prestations = json('src/data/prestations.json');
const univers = json('src/data/univers.json');
const notions = readdirSync('src/content/notions').filter((f) => f.endsWith('.md')).map((f) => ({ id: f.replace('.md', ''), md: lire('src/content/notions/' + f) }));
const carnet = readdirSync('src/content/carnet').filter((f) => f.endsWith('.fr.md')).map((f) => ({ id: f.replace('.fr.md', ''), md: lire('src/content/carnet/' + f) }));
const pages = ['a-propos', 'mentions-legales', 'confidentialite'].map((s) => ({ id: s, md: lire(`src/content/pages/${s}.fr.md`) }));

const corps = (md) => md.replace(/^---[\s\S]*?---\s*/, '').trim().replace(/^## /gm, '#### ');
const fm = (md, cle) => { const m = md.match(new RegExp(`^${cle}:\\s*(.*)$`, 'm')); return m ? m[1].replace(/^"|"$/g, '') : ''; };
const fmBloc = (md, cle) => { const m = md.match(new RegExp(`^${cle}:\\n\\s+fr:\\s*"(.*)"`, 'm')); return m ? m[1] : ''; };
const titreNotion = (md) => { const m = md.match(/^titre:\s*\{\s*fr:\s*"(.*?)"/m); return m ? m[1] : ''; };
const ordrePieces = ['rouvray-s1e02', 'rouvray-s1e01', 'horsjeu-teaser', 'varenne-s1e01', 'varenne-s1e02', 'varenne-s1e03', 'varenne-s1e04', 'varenne-s1e05', 'varenne-s1e06', 'varenne-s1e07', 'varenne-generique'];
const L = [];
const h = (n, t) => L.push('', '#'.repeat(n) + ' ' + t, '');
const p = (t) => L.push(t, '');
const champ = (label, t) => { if (t) L.push(`**${label}** · ${t}`, ''); };

L.push('---', 'titre: Relecture des textes du site Studio', `date: ${new Date().toISOString().slice(0, 10)}`, 'statut: à relire par Mourad ; corriger directement dans ce fichier, Claude Code reporte dans le site', 'généré par: studio-site/scripts/relecture.mjs', '---', '');
h(1, 'Relecture des textes du site Studio');
p('Tout ce qui a été rédigé à ta place, dans l\'ordre d\'importance. **Corrige directement dans ce fichier** (remplace, barre, annote entre crochets), ou dis-moi « OK » section par section. Les textes anglais suivent les français : je les aligne après ta relecture. Règles déjà appliquées : aucun nom d\'outil, aucun client, « formé au droit » jamais « juridique », mention IA partout.');
p('Trois questions qui ne sont pas des textes : la date de sortie du générique « Nothing Shows » (fixée au 22/10 par défaut) · la version EN de VARENNE (titres seulement pour l\'instant) · le choix d\'une voix pour Roger (bloque les doléances).');

h(2, '1. Accueil');
champ('Promesse', fr.site.promesse);
champ('Description (moteurs)', fr.site.description);
champ('Comment c\'est fait', 'Chaque film part d\'une image fixe validée, plan par plan. L\'animation, la voix et le montage viennent après. Sur chaque fiche, on dit ce qui était difficile et ce qu\'on a appris.');
champ('Roger', 'Roger est à l\'affiche de tous nos films. Pour quelqu\'un qui n\'existe pas, il se plaint beaucoup de son dos.');
champ('Fin de page', 'Un film pour votre marque, fabriqué de la même façon.');
champ('Pied de page', fr.pied.rappel);

h(2, '2. Prestations');
champ('Intro', prestations.intro.fr);
champ('Devis', prestations.devis.fr);
for (const o of prestations.offres) {
  h(3, o.titre.fr);
  p(o.pitch.fr);
  champ('Livrables', o.livrables.fr.join(' · '));
  champ('Généré', o.genere.fr.join(', '));
  champ('Fait à la main', o.manuel.fr.join(', '));
  if (o.demo_note) champ('Note', o.demo_note.fr);
}
h(3, prestations.processus.titre.fr);
prestations.processus.etapes.forEach((e, i) => L.push(`${i + 1}. ${e.fr}`)); L.push('');
h(3, prestations.faq.titre.fr);
for (const f of prestations.faq.liste) { L.push(`**${f.q.fr}**`, '', f.r.fr, ''); }
champ('Appel final', `${fr.prestations.cta} ${fr.prestations.cta_texte}`);

h(2, '3. Fiches des films (pitch, coulisses, mention)');
for (const id of ordrePieces) {
  const x = pieces.find((q) => q.id === id); if (!x) continue;
  h(3, `${x.titre.fr}${x.serie ? ` (${x.serie.toUpperCase()} S${x.saison}·E${String(x.episode ?? 0).padStart(2, '0')})` : ''}`);
  if (!series.find((s) => s.id === x.serie)?.episodes_titre_seul) champ('Pitch', x.pitch.fr);
  if (x.coulisses?.texte?.fr) { L.push('**Coulisses**', '', x.coulisses.texte.fr.replace(/\*\*(.+?)\*\*\s*/g, '**$1** '), ''); }
  else L.push('**Coulisses** · _À ÉCRIRE_', '');
  if (x.coulisses?.chiffre?.fr) champ('Chiffre', x.coulisses.chiffre.fr);
  champ('Mention IA', x.mention_ia.fr);
  if (x.sources?.length) champ('Sources', x.sources.map((s) => s.titre + (s.note ? ` — ${s.note.fr}` : '')).join(' ; '));
}

h(2, '4. Séries');
for (const s of series) {
  h(3, s.titre.fr);
  champ('Sous-titre', s.sous_titre.fr);
  champ('Pitch', s.pitch.fr);
  champ('Mention', s.mention?.fr);
  champ('Rythme', s.rythme?.fr);
  if (s.coulisses?.texte?.fr) L.push('**Coulisses de la série**', '', s.coulisses.texte.fr, '');
  for (const im of s.coulisses?.images ?? []) champ('Légende', im.legende.fr);
  if (s.bande_originale) { champ('Bande originale, note', s.bande_originale.note?.fr); champ('Bande originale, mention', s.bande_originale.mention.fr); }
}

h(2, '5. Univers (descriptions)');
for (const u of univers.filter((u) => u.description.fr !== 'À ÉCRIRE')) champ(u.nom.fr, u.description.fr);
p('Les autres univers n\'ont pas de page tant qu\'ils n\'ont pas de film ; leurs descriptions viendront avec.');

h(2, '6. Méthode');
p(methode.intro.fr);
methode.etapes.forEach((e, i) => { h(3, `${i + 1}. ${e.titre.fr}`); p(e.texte.fr); champ('Cas réel', e.cas.fr); });
h(3, methode.limites.titre.fr);
p(methode.limites.intro.fr);
methode.limites.liste.forEach((l) => L.push(`- ${l.fr}`)); L.push('');
h(3, methode.droits.titre.fr);
p(methode.droits.fr);

h(2, '7. Lexique (19 notions)');
for (const n of notions) { h(3, titreNotion(n.md)); champ('Définition', fmBloc(n.md, 'definition')); champ('Pourquoi ça compte', fmBloc(n.md, 'impact')); }

h(2, '8. Carnet (3 notes)');
for (const c of carnet) { h(3, fm(c.md, 'titre')); champ('Chapeau', fm(c.md, 'description')); L.push(corps(c.md), ''); }

h(2, '9. Roger (page)');
for (const [k, v] of Object.entries(fr.roger)) if (typeof v === 'string' && v.length > 40) champ(k, v);

h(2, '10. Contact');
for (const k of ['intro', 'message_aide', 'consentement', 'delai', 'aside_titre', 'aside_1', 'aside_2', 'aside_3', 'merci_titre', 'merci_texte']) champ(k, fr.contact[k]);
champ('Types de projet', ['type_pub', 'type_film', 'type_serie', 'type_patrimoine', 'type_clip', 'type_autre'].map((k) => fr.contact[k]).join(' · '));
champ('Échéances', ['ech_1', 'ech_2', 'ech_3', 'ech_4', 'ech_5'].map((k) => fr.contact[k]).join(' · '));

h(2, '11. À propos, mentions légales, confidentialité');
for (const pg of pages) { h(3, fm(pg.md, 'titre')); champ('Chapeau', fm(pg.md, 'description')); L.push(corps(pg.md), ''); }

h(2, '12. Petits textes d\'interface');
champ('Menu', Object.values(fr.nav).join(' · '));
champ('Page 404', `${fr.quatre.titre} ${fr.quatre.texte}`);
champ('Lexique, intro', fr.lexique.intro);
champ('Coulisses, intro', fr.coulisses.intro);
champ('Catalogue, intro', fr.catalogue.intro);
champ('Séries, intro', fr.series_page.intro);
champ('Univers, intro', fr.univers.intro);
champ('Carnet, intro', fr.carnet.intro);

writeFileSync(sortie, L.join('\n'));
console.log(`${sortie} : ${L.length} lignes`);
