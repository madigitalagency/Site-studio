// Encode les médias d'une pièce depuis son master : vidéo 1080 et 720, teaser 6 s muet, affiche (jpg/webp/avif), puis variantes.
// Usage : npm run media -- <id> <master.mp4> [--lang fr|en] [--large] [--poster image.png] [--t 1.5]
//   --lang   langue de la piste (défaut fr) -> v916-<lang>-1080.mp4 / -720.mp4
//   --large  master 16:9 -> h169-<lang>-1080.mp4 / -720.mp4 et poster-169
//   --poster image à utiliser comme affiche (sinon image extraite du master à --t secondes, défaut 1)
// Réglages identiques à ceux des pièces déjà en ligne : H.264, CRF 21 (1080, 8 Mb/s max) et 23 (720), AAC 128k, faststart.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const [id, master, ...rest] = process.argv.slice(2);
if (!id || !master) throw new Error('usage : npm run media -- <id> <master.mp4> [--lang fr] [--large] [--poster image] [--t 1]');
if (!existsSync(master)) throw new Error(`master introuvable : ${master}`);
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const lang = opt('--lang', 'fr');
const large = rest.includes('--large');
const t = opt('--t', '1');
const posterSrc = opt('--poster');
const dir = `public/media/${id}`;
mkdirSync(dir, { recursive: true });
const ff = (args) => { console.log('ffmpeg', args.join(' ')); execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' }); };
const base = large ? `h169-${lang}` : `v916-${lang}`;
const h = large ? 1080 : 1920;
const w = large ? 1920 : 1080;
ff(['-i', master, '-vf', `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-maxrate', '8M', '-bufsize', '16M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', `${dir}/${base}-1080.mp4`]);
ff(['-i', master, '-vf', `scale=${w / 1.5}:${h / 1.5}:force_original_aspect_ratio=decrease,pad=${w / 1.5}:${h / 1.5}:(ow-iw)/2:(oh-ih)/2`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-maxrate', '4M', '-bufsize', '8M', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', `${dir}/${base}-720.mp4`]);
if (!large) ff(['-i', master, '-t', '6', '-an', '-vf', 'scale=540:960', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${dir}/teaser.mp4`]);
// Affiche
const poster = large ? 'poster-169' : 'poster-916';
const src = posterSrc ?? `${dir}/_frame.png`;
if (!posterSrc) ff(['-ss', t, '-i', master, '-frames:v', '1', src]);
const img = sharp(src).resize({ width: w, height: h, fit: 'cover' });
await img.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(`${dir}/${poster}.jpg`);
await img.clone().webp({ quality: 82 }).toFile(`${dir}/${poster}.webp`);
await img.clone().avif({ quality: 55 }).toFile(`${dir}/${poster}.avif`);
if (!posterSrc) { try { (await import('node:fs')).rmSync(src); } catch {} }
// Durée mesurée, reportée dans la fiche si elle est à 0
const duree = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', `${dir}/${base}-1080.mp4`], { encoding: 'utf8' }).trim());
const fiche = `src/content/pieces/${id}.json`;
if (existsSync(fiche)) {
  const p = JSON.parse(readFileSync(fiche, 'utf8'));
  p.duree_s = p.duree_s ?? {}; if (!p.duree_s[lang]) p.duree_s[lang] = Math.round(duree * 10) / 10;
  p.media = p.media ?? {};
  if (large) { p.media.h169 = { ...(p.media.h169 ?? {}), [lang]: base }; if (!p.orientations.includes('16:9')) p.orientations.push('16:9'); }
  else p.media.v916 = { ...(p.media.v916 ?? {}), [lang]: base };
  if (!p.langues.includes(lang)) p.langues.push(lang);
  p.sources_media = { ...(p.sources_media ?? {}), [`${base}`]: master.replace(/\\/g, '/') };
  writeFileSync(fiche, JSON.stringify(p, null, 2) + '\n');
  console.log(`fiche mise à jour : durée ${p.duree_s[lang]} s, ${base}, langues ${p.langues.join(', ')}`);
}
// Variantes (affiches 720/480, image de partage)
execFileSync('node', ['scripts/variantes.mjs'], { stdio: 'inherit' });
console.log(`médias de ${id} prêts dans ${dir}`);
