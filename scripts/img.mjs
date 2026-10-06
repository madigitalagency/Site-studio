// Conversion d'images pour le site : node scripts/img.mjs <entrée> <sortie-sans-extension> [largeur] [--jpg]
// Produit .avif + .webp (+ .jpg sur demande), largeur max donnée, qualité adaptée au web.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const [input, out, w = '1080', ...flags] = process.argv.slice(2);
if (!input || !out) { console.error('usage: img.mjs <in> <out> [width] [--jpg]'); process.exit(1); }
await mkdir(dirname(out), { recursive: true });
const base = sharp(input).rotate().resize({ width: Number(w), withoutEnlargement: true });
await base.clone().avif({ quality: 55 }).toFile(out + '.avif');
await base.clone().webp({ quality: 82 }).toFile(out + '.webp');
if (flags.includes('--jpg')) await base.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(out + '.jpg');
const meta = await sharp(out + '.webp').metadata();
console.log(`${out}: ${meta.width}×${meta.height}`);
