import type { APIRoute } from 'astro';
import { catalogue, serieDe, urlPiece, media } from '../lib/content';
import { t, numero } from '../lib/i18n';

/** Plan du site vidéo (extension Google « video »), une entrée par film et par langue disponible. @astrojs/sitemap ne le génère pas. */
const SITE = 'https://studio.madigitalagency.net';
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

export const GET: APIRoute = async () => {
  const pieces = await catalogue();
  const urls: string[] = [];
  for (const p of pieces) {
    const serie = await serieDe(p);
    const d = p.data;
    for (const lang of ['fr', 'en'] as const) {
      if (lang === 'en' && !d.titre.en) continue;
      const v = d.media.v916 && ((lang === 'en' && d.media.v916.en) || d.media.v916.fr);
      if (!v) continue;
      const secondes = Math.round((lang === 'en' && d.duree_s.en) || d.duree_s.fr);
      const description = serie?.data.episodes_titre_seul
        ? `${t(lang, serie.data.titre)}, ${numero(d.saison, d.episode)} · ${t(lang, serie.data.sous_titre)}`
        : t(lang, d.pitch);
      urls.push(
        `  <url>\n    <loc>${SITE}${urlPiece(lang, p, serie)}</loc>\n    <video:video>\n` +
          `      <video:thumbnail_loc>${SITE}${media(p, d.media.poster)}.jpg</video:thumbnail_loc>\n` +
          `      <video:title>${esc(t(lang, d.titre))}</video:title>\n` +
          `      <video:description>${esc(description)}</video:description>\n` +
          `      <video:content_loc>${SITE}${media(p, `${v}-1080.mp4`)}</video:content_loc>\n` +
          `      <video:duration>${secondes}</video:duration>\n` +
          `      <video:publication_date>${d.date_publication}</video:publication_date>\n` +
          `      <video:family_friendly>yes</video:family_friendly>\n      <video:live>no</video:live>\n` +
          `    </video:video>\n  </url>`,
      );
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
