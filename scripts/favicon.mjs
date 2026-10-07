// Jeu d'icônes du site à partir des rubans du monogramme M&A (charte graphique), même marque que le site principal.
//  - favicon-16x16.png, favicon-32x32.png : rubans sur fond transparent (onglets)
//  - favicon.ico : les deux tailles + 48 px, PNG encapsulés
//  - apple-touch-icon.png (180), icon-192.png, icon-512.png : rubans sur fond nuit (iOS et Android n'acceptent pas la transparence)
// Usage : node scripts/favicon.mjs <monogramme.png>
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) throw new Error('chemin du monogramme attendu');
const NUIT = { r: 42, g: 10, b: 74, alpha: 1 };

// Rubans = pixels opaques et non clairs du haut de l'image (la ligne de texte est plus bas)
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let minx = Infinity, maxx = 0, miny = Infinity, maxy = 0;
for (let y = 0; y < Math.round(info.height * 0.66); y++) for (let x = 0; x < info.width; x++) {
  const i = (y * info.width + x) * 4;
  if (data[i + 3] > 128 && data[i] + data[i + 1] + data[i + 2] < 600) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
}
const rubans = await sharp(src).extract({ left: minx, top: miny, width: maxx - minx + 1, height: maxy - miny + 1 }).png().toBuffer();
console.log(`rubans : ${maxx - minx + 1}×${maxy - miny + 1}`);

async function icone(taille, fond, marge) {
  const utile = Math.round(taille * (1 - 2 * marge));
  const r = await sharp(rubans).resize({ width: utile, height: utile, fit: 'inside', kernel: 'lanczos3' }).toBuffer();
  const m = await sharp(r).metadata();
  return sharp({ create: { width: taille, height: taille, channels: 4, background: fond } })
    .composite([{ input: r, left: Math.round((taille - m.width) / 2), top: Math.round((taille - m.height) / 2) }])
    .png({ compressionLevel: 9 }).toBuffer();
}

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const p16 = await icone(16, transparent, 0.02);
const p32 = await icone(32, transparent, 0.03);
const p48 = await icone(48, transparent, 0.04);
writeFileSync('public/favicon-16x16.png', p16);
writeFileSync('public/favicon-32x32.png', p32);
writeFileSync('public/apple-touch-icon.png', await icone(180, NUIT, 0.16));
writeFileSync('public/icon-192.png', await icone(192, NUIT, 0.16));
writeFileSync('public/icon-512.png', await icone(512, NUIT, 0.16));

// ICO : en-tête + un répertoire par image + PNG tels quels (accepté par tous les navigateurs actuels)
const images = [[16, p16], [32, p32], [48, p48]];
const tete = Buffer.alloc(6); tete.writeUInt16LE(0, 0); tete.writeUInt16LE(1, 2); tete.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const dirs = [], corps = [];
for (const [t, buf] of images) {
  const d = Buffer.alloc(16);
  d.writeUInt8(t === 256 ? 0 : t, 0); d.writeUInt8(t === 256 ? 0 : t, 1); d.writeUInt8(0, 2); d.writeUInt8(0, 3);
  d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6); d.writeUInt32LE(buf.length, 8); d.writeUInt32LE(offset, 12);
  dirs.push(d); corps.push(buf); offset += buf.length;
}
writeFileSync('public/favicon.ico', Buffer.concat([tete, ...dirs, ...corps]));
writeFileSync('public/site.webmanifest', JSON.stringify({ name: 'M&A Digital Agency · Studio', short_name: 'Studio M&A', icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }], theme_color: '#2A0A4A', background_color: '#2A0A4A', display: 'browser' }, null, 2) + '\n');
console.log('favicon-16x16, favicon-32x32, favicon.ico, apple-touch-icon (180), icon-192, icon-512, site.webmanifest');
