// « Points de vue impossibles » : montage de démonstration à partir de deux rushes POV (baleine à bosse, biplan de 1925).
// Chaque rush garde son son d'origine ; une légende s'affiche au début de chacun ; carton de fin aux couleurs du site.
// Usage : node scripts/pov.mjs <dossier des rushes> <sortie.mp4>
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';

const [dossier, sortie] = process.argv.slice(2);
mkdirSync('work/pov', { recursive: true });
const url = (p) => 'file:///' + resolve(p).split('\\').join('/');
const fraunces = url('public/fonts/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeA.woff2');
const montserrat = url('public/fonts/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2');
const base = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:F;src:url(${fraunces})}
@font-face{font-family:M;font-weight:600;src:url(${montserrat})}
html,body{margin:0;width:1080px;height:1920px;background:transparent;color:#f4effc}
.ombre{position:absolute;left:0;right:0;top:0;height:620px;background:linear-gradient(180deg,rgba(14,6,24,.62) 0%,rgba(14,6,24,.38) 55%,rgba(14,6,24,0) 100%)}
.leg{position:absolute;left:72px;right:72px;top:190px;padding:0 0 30px;border-bottom:2px solid rgba(244,239,252,.7);text-shadow:0 2px 16px rgba(0,0,0,.55)}
.n{font:600 26px/1 M;letter-spacing:.16em;text-transform:uppercase;opacity:.9}
.t{font:400 64px/1.08 F;margin-top:16px}
.fin{position:absolute;inset:0;background:#2a0a4a;display:flex;flex-direction:column;justify-content:center;padding:0 90px}
.fin .k{font:600 28px/1 M;letter-spacing:.16em;text-transform:uppercase;color:#f27af3}
.fin .h{font:400 104px/1.02 F;margin-top:28px}
.fin .p{font:400 40px/1.3 F;margin-top:34px;color:#cfc2e4}
.fin .s{position:absolute;left:90px;bottom:150px;font:600 26px/1 M;letter-spacing:.16em;text-transform:uppercase;color:#cfc2e4}
</style>`;
const cartons = {
  leg1: `${base}<div class="ombre"></div><div class="leg"><div class="n">Point de vue nº 1</div><div class="t">Sur le dos d’une baleine à bosse, au moment où elle sort de l’eau.</div></div>`,
  leg2: `${base}<div class="ombre"></div><div class="leg"><div class="n">Point de vue nº 2</div><div class="t">Dans le cockpit d’un biplan de 1925, au‑dessus des nuages.</div></div>`,
  fin: `${base}<div class="fin"><div class="k">Vidéo générative</div><div class="h">Points de vue impossibles</div><div class="p">Là où aucune caméra ne peut aller, ni aucune époque revenir.</div><div class="s">M&amp;A Digital Agency · Studio</div></div>`,
};
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await nav.newPage();
await page.setViewport({ width: 1080, height: 1920 });
for (const [nom, html] of Object.entries(cartons)) {
  writeFileSync(`work/pov/${nom}.html`, html);
  await page.goto(url(`work/pov/${nom}.html`));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `work/pov/${nom}.png`, omitBackground: nom !== 'fin' });
}
await nav.close();

const ff = (args) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
// Rush agrandi en 1080×1920, légende en fondu de 0,3 s à 3,2 s, son d'origine normalisé
const rush = (src, leg, out) => ff(['-i', src, '-loop', '1', '-framerate', '24', '-i', leg, '-filter_complex',
  '[0:v]scale=1080:1920:flags=lanczos,setsar=1,fps=24[v];[1:v]format=rgba,fade=t=in:st=0.3:d=0.4:alpha=1,fade=t=out:st=3.2:d=0.5:alpha=1[l];[v][l]overlay=0:0:shortest=1,format=yuv420p[o];[0:a]loudnorm=I=-18:TP=-2,aresample=48000,afade=t=out:st=7.6:d=0.45[a]',
  '-map', '[o]', '-map', '[a]', '-t', '8.04', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-c:a', 'aac', '-b:a', '160k', out]);
rush(join(dossier, 'POV_baleine.mp4'), 'work/pov/leg1.png', 'work/pov/a.mp4');
rush(join(dossier, 'POV_biplan_1925.mp4'), 'work/pov/leg2.png', 'work/pov/b.mp4');
// Carton de fin, 2,5 s, silencieux, fondu d'entrée
ff(['-loop', '1', '-framerate', '24', '-i', 'work/pov/fin.png', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-vf', 'fade=t=in:st=0:d=0.4,format=yuv420p', '-t', '2.5', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-c:a', 'aac', '-shortest', 'work/pov/c.mp4']);
writeFileSync('work/pov/liste.txt', "file 'a.mp4'\nfile 'b.mp4'\nfile 'c.mp4'\n");
ff(['-f', 'concat', '-safe', '0', '-i', 'work/pov/liste.txt', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-r', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', sortie]);
console.log('montage POV :', sortie);
