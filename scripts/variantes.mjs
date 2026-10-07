// Variantes d'images dérivées des médias de chaque pièce (idempotent, ne refait que ce qui manque) :
//  - poster-916-720.jpg / poster-169-720.jpg : affiche du lecteur (image LCP), 720 px de large
//  - poster-*-480.avif/.webp : cartes du catalogue
//  - partage.jpg : image de partage 1200×630 (fond flou + affiche centrée pour les films verticaux)
//  - planches/NN-540.webp et coulisses/*-540.webp : variantes pour les écrans étroits
// Usage : node scripts/variantes.mjs [--force]
import sharp from 'sharp';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const force = process.argv.includes('--force');
const racine = 'public/media';
let faits = 0;
const manque = (f) => force || !existsSync(f);
const dossiers = readdirSync(racine).filter((d) => statSync(join(racine, d)).isDirectory());

async function partage(src, dest, vertical) {
  if (!manque(dest)) return;
  if (!vertical) { await sharp(src).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(dest); faits++; return; }
  const fond = await sharp(src).resize(1200, 630, { fit: 'cover' }).blur(40).modulate({ brightness: 0.6 }).toBuffer();
  const devant = await sharp(src).resize({ height: 630 }).toBuffer();
  const { width } = await sharp(devant).metadata();
  await sharp(fond).composite([{ input: devant, left: Math.round((1200 - width) / 2), top: 0 }]).jpeg({ quality: 82, mozjpeg: true }).toFile(dest);
  faits++;
}

for (const d of dossiers) {
  const dir = join(racine, d);
  for (const base of ['poster-916', 'poster-169']) {
    const src = join(dir, base + '.jpg');
    if (!existsSync(src)) continue;
    const s = () => sharp(src).rotate();
    if (manque(join(dir, base + '-720.jpg'))) { await s().resize({ width: 720 }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(dir, base + '-720.jpg')); faits++; }
    if (manque(join(dir, base + '-480.avif'))) { await s().resize({ width: 480 }).avif({ quality: 50 }).toFile(join(dir, base + '-480.avif')); faits++; }
    if (manque(join(dir, base + '-480.webp'))) { await s().resize({ width: 480 }).webp({ quality: 80 }).toFile(join(dir, base + '-480.webp')); faits++; }
  }
  // Image de partage : 16:9 si elle existe, sinon composition depuis la 9:16
  if (existsSync(join(dir, 'poster-169.jpg'))) await partage(join(dir, 'poster-169.jpg'), join(dir, 'partage.jpg'), false);
  else if (existsSync(join(dir, 'poster-916.jpg'))) await partage(join(dir, 'poster-916.jpg'), join(dir, 'partage.jpg'), true);
  else if (d === 'roger' && existsSync(join(dir, 'portrait.jpg'))) await partage(join(dir, 'portrait.jpg'), join(dir, 'partage.jpg'), true);
  for (const sous of ['planches', 'coulisses']) {
    const sd = join(dir, sous);
    if (!existsSync(sd)) continue;
    for (const f of readdirSync(sd).filter((f) => f.endsWith('.webp') && !f.endsWith('-540.webp'))) {
      const dest = join(sd, f.replace(/\.webp$/, '-540.webp'));
      if (manque(dest)) { await sharp(join(sd, f)).resize({ width: 540, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest); faits++; }
    }
  }
}
console.log(`${dossiers.length} dossiers, ${faits} fichier(s) produit(s)`);
