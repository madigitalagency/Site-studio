import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/** Couleur d'accent de chaque série, générée depuis les données : aucun style en ligne (CSP stricte). */
export const GET: APIRoute = async () => {
  const series = await getCollection('series');
  const css = series
    .filter((s) => s.data.identite.accent)
    .map((s) => `.serie-${s.data.slug}{--serie-accent:${s.data.identite.accent}}`)
    .join('\n');
  return new Response(css + '\n', { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
};
