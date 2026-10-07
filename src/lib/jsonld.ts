import { t, type Lang } from './i18n';
import { urlSerie, type Piece, type Serie } from './content';

const SITE = 'https://studio.madigitalagency.net';
/** Référence courte à l'organisation, réutilisée par tous les schémas (même @id que sur l'accueil). */
export const org = { '@type': 'Organization', '@id': SITE + '/#organisation', name: 'M&A Digital Agency · Studio' };

export const organisation = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': SITE + '/#organisation',
  name: 'M&A Digital Agency · Studio',
  url: SITE + '/',
  logo: SITE + '/apple-touch-icon.png',
  email: 'contact@madigitalagency.net',
  parentOrganization: { '@type': 'Organization', name: 'M&A Digital Agency', url: 'https://madigitalagency.net/' },
  sameAs: ['https://www.instagram.com/studio.madigitalagency/'],
};

/** Site web déclaré à Google : le nom du site s'affiche au-dessus de l'adresse dans les résultats, même quand le titre est coupé. */
export const siteWeb = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': SITE + '/#website',
  name: 'M&A Digital Agency · Studio',
  alternateName: 'Studio M&A Digital Agency',
  url: SITE + '/',
  inLanguage: ['fr', 'en'],
  publisher: org,
};

export function videoObject(lang: Lang, piece: Piece, url: string, serie?: Serie) {
  const p = piece.data;
  const base = `${SITE}/media/${piece.id}/`;
  const v = p.media.v916 && ((lang === 'en' && p.media.v916.en) || p.media.v916.fr);
  const secondes = Math.round((lang === 'en' && p.duree_s.en) || p.duree_s.fr);
  const obj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: t(lang, p.titre),
    description: t(lang, p.pitch),
    thumbnailUrl: [base + 'partage.jpg', base + p.media.poster + '.jpg'],
    uploadDate: p.date_publication,
    duration: `PT${secondes}S`,
    inLanguage: lang,
    url: SITE + url,
    isFamilyFriendly: true,
    creator: org,
    keywords: ['IA', 'vidéo générée', ...(serie ? [t(lang, serie.data.titre)] : [])].join(', '),
  };
  if (v) obj.contentUrl = `${base}${v}-1080.mp4`;
  if (serie && p.saison && p.episode) {
    obj['@type'] = ['VideoObject', 'Episode'];
    obj.episodeNumber = p.episode;
    obj.partOfSeason = { '@type': 'CreativeWorkSeason', seasonNumber: p.saison };
    obj.partOfSeries = { '@type': 'CreativeWorkSeries', '@id': SITE + urlSerie(lang, serie), name: t(lang, serie.data.titre), url: SITE + urlSerie(lang, serie) };
  }
  return obj;
}

export function serieObject(lang: Lang, serie: Serie, url: string, episodes: number, image?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWorkSeries',
    '@id': SITE + url,
    ...(image ? { image: SITE + image } : {}),
    name: t(lang, serie.data.titre),
    description: t(lang, serie.data.pitch),
    url: SITE + url,
    inLanguage: lang,
    numberOfEpisodes: episodes,
    creator: org,
  };
}

export function breadcrumb(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE + it.url })),
  };
}
