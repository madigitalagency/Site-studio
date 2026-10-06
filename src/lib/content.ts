import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import univers from '../data/univers.json';
import formats from '../data/formats.json';
import { route, type Lang } from './i18n';

export type Piece = CollectionEntry<'pieces'>;
export type Serie = CollectionEntry<'series'>;

// Date de construction : `STUDIO_DATE=2026-10-22 npm run build` construit le site tel qu'il sera ce jour-là.
const today = () => process.env.STUDIO_DATE ?? (import.meta.env.STUDIO_DATE as string | undefined) ?? new Date().toISOString().slice(0, 10);
const brouillons = () => (process.env.STUDIO_BROUILLONS ?? import.meta.env.STUDIO_BROUILLONS) === '1';

/** Une pièce est construite si elle est publiée, ou programmée à une date passée (CDC v2 §4.6). */
export function estVisible(p: Piece) {
  if (brouillons()) return true;
  if (p.data.statut === 'publie') return true;
  if (p.data.statut === 'programme') return p.data.date_publication <= today();
  return false;
}

export async function piecesVisibles() {
  const all = await getCollection('pieces');
  return all.filter(estVisible).sort((a, b) => (a.data.date_publication < b.data.date_publication ? 1 : -1));
}

/** Catalogue : hors annexes et hors pièces sans fiche. */
export async function catalogue() {
  return (await piecesVisibles()).filter((p) => !p.data.annexe && p.data.fiche);
}

export async function episodesDe(serieId: string) {
  return (await piecesVisibles())
    .filter((p) => p.data.serie?.id === serieId && !p.data.annexe)
    .sort((a, b) => (a.data.saison! - b.data.saison!) || (a.data.episode! - b.data.episode!));
}

export async function annexesDe(serieId: string) {
  return (await piecesVisibles())
    .filter((p) => p.data.serie?.id === serieId && p.data.annexe)
    .sort((a, b) => (a.data.date_publication < b.data.date_publication ? -1 : 1));
}

export async function seriesActives() {
  const series = await getCollection('series');
  const out: { serie: Serie; episodes: Piece[]; dernier: Piece | undefined }[] = [];
  for (const s of series) {
    const eps = await episodesDe(s.id);
    if (!eps.length && s.data.statut !== 'en-preparation') continue;
    out.push({ serie: s, episodes: eps, dernier: eps[eps.length - 1] });
  }
  return out.sort((a, b) => ((a.dernier?.data.date_publication ?? '') < (b.dernier?.data.date_publication ?? '') ? 1 : -1));
}

export function universDe(id: string) {
  return univers.find((u) => u.id === id)!;
}
export function formatDe(id: string) {
  return formats.find((f) => f.id === id)!;
}

/** Univers actifs = ceux qui ont au moins une pièce visible. */
export async function universActifs() {
  const pieces = await catalogue();
  return univers
    .filter((u) => pieces.some((p) => p.data.univers.includes(u.id)))
    .sort((a, b) => a.ordre - b.ordre)
    .map((u) => ({ ...u, n: pieces.filter((p) => p.data.univers.includes(u.id)).length }));
}

/** Adresse de la fiche d'une pièce. */
export function urlPiece(lang: Lang, p: Piece, serie?: Serie) {
  if (p.data.serie) {
    const slug = serie?.data.slug ?? p.data.serie.id;
    return route(lang, 'series', `${slug}/${p.data.slug}/`);
  }
  return route(lang, 'films', `${p.data.slug}/`);
}

export function urlSerie(lang: Lang, s: Serie) {
  return route(lang, 'series', `${s.data.slug}/`);
}

export async function serieDe(p: Piece) {
  return p.data.serie ? await getEntry('series', p.data.serie.id) : undefined;
}

export function media(p: Piece, fichier: string) {
  return `/media/${p.id}/${fichier}`;
}

/** Source vidéo verticale dans la langue demandée, sinon l'autre. */
export function videoSrc(p: Piece, lang: Lang) {
  const v = p.data.media.v916;
  if (!v) return undefined;
  const base = (lang === 'en' && v.en) || v.fr || v.en;
  if (!base) return undefined;
  return { l1080: media(p, `${base}-1080.mp4`), l720: media(p, `${base}-720.mp4`), lang: (lang === 'en' && v.en) ? 'en' : 'fr' };
}
