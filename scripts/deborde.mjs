// Liste les éléments qui dépassent la largeur de la fenêtre (diagnostic de débordement horizontal).
import puppeteer from 'puppeteer-core';
const [url, w] = [process.argv[2], Number(process.argv[3] ?? 390)];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage(); await p.setViewport({ width: w, height: 900 });
await p.goto(url, { waitUntil: 'networkidle0' });
const r = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map(e => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')} right=${Math.round(e.getBoundingClientRect().right)} w=${Math.round(e.getBoundingClientRect().width)}`));
console.log(`${w}px :`); console.log(r.join('\n')); await b.close();
