import { getCollection } from 'astro:content';
import { estVisible } from './content';

/** Chemins statiques des pages série, pour les routes FR et EN. */
export async function cheminsSeries() {
  const series = await getCollection('series');
  return series.map((serie) => ({ params: { serie: serie.data.slug }, props: { serie } }));
}

/** Chemins statiques des fiches d'épisode (pièces rattachées à une série, avec fiche). */
export async function cheminsEpisodes() {
  const series = await getCollection('series');
  const pieces = (await getCollection('pieces')).filter((p) => estVisible(p) && p.data.serie && p.data.fiche && !p.data.annexe);
  return pieces.map((piece) => {
    const serie = series.find((s) => s.id === piece.data.serie!.id)!;
    return { params: { serie: serie.data.slug, episode: piece.data.slug }, props: { piece, serie } };
  });
}

/** Chemins statiques des films autonomes. */
export async function cheminsFilms() {
  const pieces = (await getCollection('pieces')).filter((p) => estVisible(p) && !p.data.serie && p.data.fiche && !p.data.annexe);
  return pieces.map((piece) => ({ params: { slug: piece.data.slug }, props: { piece } }));
}
