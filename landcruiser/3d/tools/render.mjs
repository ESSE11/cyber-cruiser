// Render statici del modello 3D, usati nella documentazione e nel PDF.
//
//   (servi la cartella del repo, poi)  node tools/render.mjs [baseURL]
//
// Ogni render è una combinazione di vista + stato dell'allestimento: gli stessi
// pulsanti dell'interfaccia, pilotati via window.CC.

import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/disegni/render');
const BASE = process.argv[2] || 'http://localhost:8099/landcruiser/3d/index.html';

const SCATTI = [
  ['r1-giorno-tre-quarti', 'tre-quarti', { tetto: 1, cucina: 1, frigo: 1, letto: 0, scrivania: 0, persone: 1 }],
  ['r2-cucina-posteriore', 'posteriore', { tetto: 1, cucina: 1, frigo: 1, letto: 0, scrivania: 1, persone: 1 }],
  ['r3-notte-laterale', 'laterale', { tetto: 1, cucina: 0, frigo: 0, letto: 1, scrivania: 0, persone: 0 }],
  ['r4-pianta-alto', 'alto', { tetto: 0, cucina: 0, frigo: 0, letto: 0, scrivania: 0, persone: 0 }],
  ['r5-postazione-interno', 'interno', { tetto: 1, cucina: 0, frigo: 0, letto: 0, scrivania: 0, persone: 1 }],
  ['r6-chiuso-marcia', 'tre-quarti', { tetto: 0, cucina: 0, frigo: 0, letto: 0, scrivania: 0, persone: 0 }],
];

async function chromium() {
  try { return (await import('playwright')).chromium; }
  catch { return (await import('/opt/node22/lib/node_modules/playwright/index.mjs')).chromium; }
}

const browser = await (await chromium()).launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 });
await page.goto(BASE, { waitUntil: 'load' });
await page.waitForFunction(() => window.CC?.pronto, null, { timeout: 30000 });

// l'interfaccia non serve nelle immagini statiche
await page.addStyleTag({ content: '.comandi { display: none !important; }' });

mkdirSync(OUT, { recursive: true });
for (const [nome, vista, stato] of SCATTI) {
  await page.evaluate(([v, s]) => { window.CC.setStato(s); window.CC.setVista(v); }, [vista, stato]);
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(OUT, nome + '.png') });
  console.log('render:', nome);
}
await browser.close();
