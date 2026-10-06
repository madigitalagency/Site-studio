import { getCollection } from 'astro:content';
import { catalogue, type Piece } from './content';

/** « Vu dans » : pour chaque notion, les pièces visibles qui la citent (CDC v2 §4.7), calculé à la construction. */
let cache: Map<string, Piece[]> | undefined;
export async function vuDans() {
  if (cache) return cache;
  const pieces = await catalogue();
  const notions = await getCollection('notions');
  cache = new Map();
  for (const n of notions) {
    cache.set(n.id, pieces.filter((p) => p.data.notions.includes(n.id)));
  }
  return cache;
}
