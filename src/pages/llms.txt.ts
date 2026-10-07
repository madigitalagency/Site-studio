import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { catalogue, seriesActives, serieDe, urlPiece, urlSerie } from '../lib/content';
import { ui, t, route, numero, type Lang } from '../lib/i18n';

/** llms.txt : le site en Markdown, pour les assistants qui lisent le web. Généré depuis les mêmes données que les pages. */
const SITE = 'https://studio.madigitalagency.net';

async function section(lang: Lang) {
  const d = ui(lang);
  const L: string[] = [];
  const lien = (titre: string, chemin: string, note?: string) => L.push(`- [${titre}](${SITE}${chemin})${note ? `: ${note}` : ''}`);
  const h = (titre: string) => L.push('', `## ${titre}`, '');

  h(d.nav.films);
  for (const p of await catalogue()) {
    if (lang === 'en' && !p.data.titre.en) continue;
    const serie = await serieDe(p);
    const note = serie?.data.episodes_titre_seul ? `${t(lang, serie.data.titre)}, ${numero(p.data.saison, p.data.episode)}` : t(lang, p.data.pitch);
    lien(t(lang, p.data.titre), urlPiece(lang, p, serie), note);
  }
  h(d.nav.series);
  for (const { serie, episodes } of await seriesActives()) lien(t(lang, serie.data.titre), urlSerie(lang, serie), `${t(lang, serie.data.sous_titre)} (${episodes.length} ${lang === 'fr' ? 'épisodes en ligne' : 'episodes online'}). ${t(lang, serie.data.pitch)}`);
  h(d.nav.coulisses);
  lien(d.methode.titre, route(lang, 'methode'), lang === 'fr' ? 'les sept étapes de fabrication, avec un cas réel chacune, et ce que l’IA ne sait pas encore faire' : 'the seven production steps, each with a real case, and what AI cannot do yet');
  lien(d.lexique.titre, route(lang, 'lexique'), d.lexique.description);
  lien(d.carnet.titre, route(lang, 'carnet'), d.carnet.description);
  lien('Roger', route(lang, 'roger'), d.roger.accroche);
  h(d.lexique.titre);
  for (const n of (await getCollection('notions')).sort((a, b) => t(lang, a.data.titre).localeCompare(t(lang, b.data.titre), lang))) lien(t(lang, n.data.titre), route(lang, 'lexique', `${n.id}/`), t(lang, n.data.definition));
  h(d.carnet.titre);
  for (const n of (await getCollection('carnet')).filter((n) => n.id.endsWith(`.${lang}`) && n.data.statut === 'publie')) lien(n.data.titre, route(lang, 'carnet', `${n.id.replace(/\.(fr|en)$/, '')}/`), n.data.description);
  h('Studio');
  lien(d.nav.prestations, route(lang, 'prestations'), lang === 'fr' ? 'cinq offres sur devis : pub, film court, série de marque, film patrimonial, clip' : 'five offers, quoted per project: commercial, short film, brand series, heritage film, music video');
  lien(lang === 'fr' ? 'À propos' : 'About', route(lang, 'apropos'));
  lien(d.nav.contact, route(lang, 'contact'));
  return L;
}

export const GET: APIRoute = async () => {
  const fr = ui('fr');
  const en = ui('en');
  const L = [
    `# ${fr.site.signature}`,
    '',
    `> ${fr.site.promesse} ${fr.site.description}`,
    '',
    `Toutes les images, voix et musiques des films sont générées par IA ; aucune personne, marque ni œuvre réelle n’est imitée, et chaque film dit ce qui est généré et ce qui est fait à la main. Site en français, version anglaise sous ${SITE}/en/. Contact : contact@madigitalagency.net.`,
    ...(await section('fr')),
    '',
    '# English',
    '',
    `> ${en.site.promesse} ${en.site.description}`,
    ...(await section('en')),
    '',
  ];
  return new Response(L.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
