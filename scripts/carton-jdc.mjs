// Nouveau carton de fin de « Jour de collecte » : « JOUR DE COLLECTE » + « Paris » (au lieu de « eau de Paris »).
// Le titre d'origine est incrusté dans le master : on garde le master jusqu'à l'image qui précède son apparition,
// puis on fige cette image et on pose le nouveau carton (même police, même place, fondu 0,5 s, même grain).
// Usage : node scripts/carton-jdc.mjs <master.mp4> <sortie.mp4>
// Police : Cormorant Garamond (licence OFL), dans work/police (npm pack @fontsource/cormorant-garamond).
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';

const [master, sortie] = process.argv.slice(2);
const COUPE = 22.875; // 549 images à 24 i/s : dernière image avant l'ancien titre (22,9 s)
const FIN = 24.833;
const N = Math.round(COUPE * 24); // images gardées
const M = Math.round(FIN * 24) - N; // images du carton
const url = (p) => 'file:///' + resolve(p).split('\\').join('/');

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:C;font-weight:500;font-style:normal;src:url(${url('work/police/package/files/cormorant-garamond-latin-500-normal.woff2')})}
@font-face{font-family:C;font-weight:500;font-style:italic;src:url(${url('work/police/package/files/cormorant-garamond-latin-500-italic.woff2')})}
html,body{margin:0;width:1080px;height:1920px;background:transparent}
.b{position:absolute;left:0;right:0;top:780px;height:360px;background:linear-gradient(180deg,rgba(20,14,10,0) 0%,rgba(20,14,10,.42) 30%,rgba(20,14,10,.42) 70%,rgba(20,14,10,0) 100%)}
.t{position:absolute;left:0;right:0;top:870px;text-align:center;font:500 84px/1 C;letter-spacing:.12em;color:#fbf6ee;text-shadow:0 2px 18px rgba(0,0,0,.45)}
.s{position:absolute;left:0;right:0;top:985px;text-align:center;font:italic 500 54px/1 C;letter-spacing:.04em;color:#fbf6ee;text-shadow:0 2px 14px rgba(0,0,0,.45)}
</style><div class="b"></div><div class="t">JOUR DE COLLECTE</div><div class="s">Paris</div>`;
writeFileSync('work/carton-jdc.html', html);
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await nav.newPage();
await page.setViewport({ width: 1080, height: 1920 });
await page.goto(url('work/carton-jdc.html'));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'work/carton-jdc.png', omitBackground: true });
await nav.close();

const ff = (args) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
// 1. Partie gardée, et sa dernière image
ff(['-i', master, '-vf', `trim=end_frame=${N},setpts=PTS-STARTPTS`, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', 'work/jdc-a.mp4']);
ff(['-sseof', '-0.05', '-i', 'work/jdc-a.mp4', '-frames:v', '1', '-update', '1', 'work/jdc-fige.png']);
// 2. Image figée + carton en fondu, grain identique au montage d'origine
ff(['-loop', '1', '-framerate', '24', '-i', 'work/jdc-fige.png', '-loop', '1', '-framerate', '24', '-i', 'work/carton-jdc.png', '-filter_complex',
  '[1:v]format=rgba,fade=t=in:st=0:d=0.5:alpha=1[c];[0:v][c]overlay=0:0,noise=alls=4:allf=t+u,format=yuv420p',
  '-frames:v', String(M), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', 'work/jdc-b.mp4']);
// 3. Assemblage, piste son muette de la durée totale (comme le master d'origine)
writeFileSync('work/jdc-liste.txt', "file 'jdc-a.mp4'\nfile 'jdc-b.mp4'\n");
ff(['-f', 'concat', '-safe', '0', '-i', 'work/jdc-liste.txt', '-f', 'lavfi', '-t', String(FIN), '-i', 'anullsrc=r=48000:cl=stereo',
  '-c:v', 'libx264', '-preset', 'slow', '-b:v', '8M', '-r', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', sortie]);
console.log(`carton refait : ${sortie} (${N} images gardées + ${M} images de carton)`);
