import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import univers from './data/univers.json';
import formats from './data/formats.json';

// Les registres (univers, formats) sont des données : on en tire les énumérations
// pour que toute référence inconnue fasse échouer la construction (CDC v2 §4.6).
const universIds = univers.map((u) => u.id) as [string, ...string[]];
const formatIds = formats.map((f) => f.id) as [string, ...string[]];

const bilingue = z.object({ fr: z.string(), en: z.string().optional() });
const bilingueListe = z.object({ fr: z.array(z.string()), en: z.array(z.string()).optional() });

const imageCoulisses = z.union([
  z.object({ image: z.string(), legende: bilingue }),
  z.object({
    avant: z.string(),
    apres: z.union([z.string(), z.object({ t: z.number(), recadrage: z.array(z.number()).length(4).optional() })]),
    legende: bilingue,
  }),
]);

const coulisses = z.object({
  texte: bilingue,
  genere: bilingueListe.optional(),
  manuel: bilingueListe.optional(),
  postes: bilingueListe.optional(),
  images: z.array(imageCoulisses).max(4).optional(),
  chiffre: bilingue.optional(),
});

// L'identifiant d'une entrée est son nom de fichier (le champ `slug` sert à l'adresse publique).
const idFichier = ({ entry }: { entry: string }) => entry.replace(/\.json$/, '');

const pieces = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/pieces', generateId: idFichier }),
  schema: z.object({
    slug: z.string(),
    serie: reference('series').optional(),
    saison: z.number().int().optional(),
    episode: z.number().int().optional(),
    titre: bilingue,
    pitch: bilingue,
    format: z.enum(formatIds),
    univers: z.array(z.enum(universIds)).min(1),
    rendu: z.enum(['photorealiste', 'cinematographique', 'archive-reconstituee', 'roman-photo', 'animation-stylise']),
    duree_s: z.object({ fr: z.number(), en: z.number().optional() }),
    orientations: z.array(z.enum(['9:16', '16:9', '4:3', '4:5'])).min(1),
    langues: z.array(z.enum(['fr', 'en'])).min(1),
    date_publication: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    statut: z.enum(['brouillon', 'programme', 'publie']),
    une: z.boolean().default(false),
    roger: z.boolean().default(false),
    annexe: z.boolean().default(false),
    fiche: z.boolean().default(true),
    vitrine: z.boolean().default(false),
    // Fichiers publiés (relatifs à /media/<id>/), produits par `npm run media`
    media: z.object({
      poster: z.string().default('poster-916'),
      v916: z.object({ fr: z.string().optional(), en: z.string().optional() }).optional(),
      h169: z.object({ fr: z.string().optional(), en: z.string().optional() }).optional(),
      teaser: z.string().optional(),
      planches: z.number().int().optional(),
      muet: z.boolean().default(false),
    }),
    // Masters dans le coffre (chemins relatifs à Claude/), lus par `npm run media`
    sources_media: z.record(z.any()).optional(),
    coulisses: coulisses.optional(),
    notions: z.array(z.string()).default([]),
    carnet: z.string().nullable().default(null),
    sources: z.array(z.object({ titre: z.string(), url: z.string().optional(), note: bilingue.optional() })).default([]),
    transcription: bilingue.optional(),
    planches_texte: bilingueListe.optional(),
    liens: z.object({ instagram: z.string().nullable().default(null), tiktok: z.string().nullable().default(null) }).default({}),
    mention_ia: bilingue,
  }),
});

const series = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/series', generateId: idFichier }),
  schema: z.object({
    slug: z.string(),
    titre: bilingue,
    sous_titre: bilingue,
    pitch: bilingue,
    mention: bilingue.optional(),
    univers: z.enum(universIds),
    format_defaut: z.enum(formatIds),
    rendu: z.string(),
    statut: z.enum(['en-preparation', 'en-cours', 'terminee']),
    rythme: bilingue.optional(),
    // Les fiches d'épisode n'affichent que le titre, sans résumé
    episodes_titre_seul: z.boolean().default(false),
    identite: z.object({ accent: z.string().optional(), logo: z.string().optional(), couverture: z.string().optional() }).default({}),
    reseaux: z.object({ hashtags: z.array(z.string()).default([]) }).default({}),
    coulisses: coulisses.optional(),
    notions: z.array(z.string()).default([]),
    // Bande originale de la série : le morceau entier, en écoute sur la page
    bande_originale: z.object({ titre: z.string(), fichiers: z.array(z.string()), duree_s: z.number(), pochette: z.string().optional(), note: bilingue.optional(), mention: bilingue }).optional(),
  }),
});

const notions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notions' }),
  schema: z.object({
    titre: bilingue,
    famille: z.enum(['generer', 'diriger', 'coherence', 'voix-son', 'monter-finir', 'produire-diffuser', 'grammaire']),
    definition: bilingue,
    impact: bilingue,
    aussi_appele: bilingueListe.optional(),
    carnet: z.string().nullable().default(null),
  }),
});

// Notes du Carnet : un fichier par langue, `<slug>.<lang>.md`
const carnet = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/carnet', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    titre: z.string(),
    description: z.string(),
    // YAML lit 2026-10-07 comme une date : on la ramène à une chaîne AAAA-MM-JJ
    date: z.union([z.string(), z.date()]).transform((d) => (typeof d === 'string' ? d : d.toISOString().slice(0, 10))),
    etiquettes: z.array(z.string()).default([]),
    notions: z.array(z.string()).default([]),
    pieces: z.array(z.string()).default([]),
    statut: z.enum(['brouillon', 'publie']).default('brouillon'),
  }),
});

// Pages de texte : un fichier par langue, `<slug>.<lang>.md`
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages', generateId: ({ entry }) => entry.replace(/.md$/, '') }),
  schema: z.object({
    titre: z.string(),
    description: z.string(),
    statut: z.enum(['brouillon', 'publie']).default('brouillon'),
  }),
});

export const collections = { pieces, series, notions, carnet, pages };
