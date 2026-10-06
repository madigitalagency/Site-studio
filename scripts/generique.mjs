// Générique « pochette d'album » : le morceau entier sur deux ou trois images, en 9:16 et 16:9.
// Usage : node scripts/generique.mjs <config.json>   (DUREE=20 pour un essai court)
// La typographie des cartons est celle du site (rendue par Chrome, polices auto-hébergées), puis composée par ffmpeg.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const cfg = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const out = cfg.sortie; mkdirSync(out, { recursive: true });
const fps = 25;
const duree = process.env.DUREE ? Number(process.env.DUREE) : cfg.duree_s;
const n = cfg.images.length;
const fondu = 2.5;                                   // fondu enchaîné entre deux images
const seg = (duree + (n - 1) * fondu) / n;           // durée de chaque image, fondus compris
const suffixe = process.env.DUREE ? '-essai' : '';

/** Carton de texte rendu en PNG transparent, avec les polices du site. */
async function carton(w, h, nom) {
  const large = w > h;
  const fonts = readFileSync('src/styles/fonts.css', 'utf8').replace(/url\(\/fonts\//g, 'url(file:///C:/dev/studio-site/public/fonts/');
  const html = `<!doctype html><meta charset="utf-8"><style>${fonts}
  html,body{margin:0;width:${w}px;height:${h}px;background:transparent;overflow:hidden}
  .haut{position:absolute;left:${large ? 96 : 72}px;right:${large ? 96 : 72}px;top:${large ? 60 : 110}px;display:flex;justify-content:space-between;align-items:center}
  .ia{font-family:Montserrat,sans-serif;font-weight:600;font-size:22px;letter-spacing:.12em;text-transform:uppercase;color:#CFC2E4;border:2px solid rgba(244,239,252,.35);padding:10px 16px;border-radius:4px;display:flex;gap:12px;align-items:center}
  .ia::before{content:"";width:12px;height:12px;border-radius:50%;background:#E22DE4}
  .studio{font-family:Montserrat,sans-serif;font-weight:600;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#CFC2E4;text-align:right;line-height:1.4}
  .studio b{font-family:Fraunces,serif;font-weight:500;font-size:32px;letter-spacing:0;text-transform:none;display:block}
  .c{position:absolute;left:${large ? 96 : 72}px;right:${large ? 96 : 72}px;bottom:${large ? 72 : 150}px;display:flex;flex-direction:column;color:#F4EFFC;font-family:Inter,sans-serif;${large ? 'max-width:52%;' : ''}}
  .serie{font-family:Fraunces,serif;font-weight:500;font-size:${large ? 60 : 72}px;letter-spacing:.06em;line-height:1;color:${cfg.accent}}
  .titre{font-family:Fraunces,serif;font-weight:400;font-size:${large ? 116 : 108}px;line-height:1.02;letter-spacing:-.015em;margin-top:14px}
  .sous{font-family:Montserrat,sans-serif;font-weight:600;font-size:${large ? 26 : 28}px;letter-spacing:.14em;text-transform:uppercase;color:#CFC2E4;margin-top:26px}
  </style><body>
  <div class="haut"><div class="ia">${cfg.mention}</div><div class="studio">M&amp;A Digital Agency<b>Studio</b></div></div>
  <div class="c"><div class="serie">${cfg.serie}</div><div class="titre">${cfg.titre}</div><div class="sous">${cfg.sous_titre}</div></div>
  </body>`;
  const f = `${out}/${nom}.html`; writeFileSync(f, html);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto('file:///' + resolve(f).split('\\').join('/'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/${nom}.png`, omitBackground: true });
  await browser.close();
  return `${out}/${nom}.png`;
}

/** Compose une orientation : fond flou + pochette carrée qui s'approche lentement + carton + musique. */
function composer(w, h, cartonPng, nom) {
  const large = w > h;
  const S = large ? Math.round(h * 0.70) : Math.round(w * 0.82);          // côté de la pochette
  const px = large ? Math.round(w * 0.95 - S) : Math.round((w - S) / 2); // position de la pochette
  const py = large ? Math.round((h - S) / 2) : Math.round(h * 0.21);
  const inputs = [];
  const f = [];
  cfg.images.forEach((img, i) => {
    inputs.push('-framerate', String(fps), '-loop', '1', '-t', seg.toFixed(3), '-i', img);
    f.push(`[${i}:v]scale=${Math.round(w * 1.15)}:${Math.round(h * 1.15)}:force_original_aspect_ratio=increase,crop=${w}:${h},gblur=sigma=42,eq=brightness=-0.28:saturation=0.8,setsar=1,format=yuv420p[bg${i}]`);
    // pochette : lent rapprochement (8 % sur la durée du segment), recadrage carré centré
    f.push(`[${i}:v]scale=w='${S}*1.10*(1+0.08*t/${seg.toFixed(3)})':h=-2:eval=frame,crop=${S}:${S},setsar=1,format=yuv420p[po${i}]`);
    f.push(`[bg${i}][po${i}]overlay=${px}:${py}:format=auto,settb=AVTB,fps=${fps}[seg${i}]`);
  });
  let courant = 'seg0';
  for (let i = 1; i < n; i++) {
    const offset = i * (seg - fondu);
    f.push(`[${courant}][seg${i}]xfade=transition=fade:duration=${fondu}:offset=${offset.toFixed(3)}[x${i}]`);
    courant = `x${i}`;
  }
  inputs.push('-i', cartonPng);
  f.push(`[${courant}][${n}:v]overlay=0:0:format=auto,fade=t=in:st=0:d=1.2,fade=t=out:st=${(duree - 2).toFixed(2)}:d=2,format=yuv420p[v]`);
  inputs.push('-i', cfg.audio);
  f.push(`[${n + 1}:a]atrim=0:${duree.toFixed(2)},afade=t=out:st=${(duree - 2.5).toFixed(2)}:d=2.5,aresample=48000[a]`);
  const sortie = `${out}/${nom}${suffixe}.mp4`;
  const args = ['-v', 'error', '-y', ...inputs, '-filter_complex', f.join(';'), '-map', '[v]', '-map', '[a]', '-t', duree.toFixed(2),
    '-c:v', 'libx264', '-preset', 'medium', '-profile:v', 'high', '-crf', '20', '-maxrate', '8M', '-bufsize', '16M', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-metadata', `comment=${cfg.mention_fichier}`, sortie];
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  return sortie;
}

const c916 = await carton(1080, 1920, 'carton-916');
console.log('carton 9:16 ok');
console.log(composer(1080, 1920, c916, 'generique-916'));
const c169 = await carton(1920, 1080, 'carton-169');
console.log('carton 16:9 ok');
console.log(composer(1920, 1080, c169, 'generique-169'));
