// Impagina le tavole in un unico PDF A3 orizzontale, una tavola per pagina.
//
//   node genera-disegni.mjs && node crea-pdf.mjs   → cyber-cruiser-tavole.pdf
//
// Richiede Playwright (già presente negli ambienti Claude Code; altrimenti
// `npm i -D playwright`). Non serve nessun altro strumento di impaginazione.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

async function loadChromium() {
  try {
    return (await import('playwright')).chromium;
  } catch {
    // installazione globale (tipica nei container preconfigurati)
    return (await import('/opt/node22/lib/node_modules/playwright/index.mjs')).chromium;
  }
}

const TAVOLE = [
  ['tav-0-rilievo.svg', 'Tav. 0 — Scheda di rilievo, da compilare sul mezzo'],
  ['tav-1-pianta.svg', 'Tav. 1 — Pianta dell’allestimento'],
  ['tav-2-sezione-aa.svg', 'Tav. 2 — Sezione longitudinale A-A'],
  ['tav-3-sezione-bb.svg', 'Tav. 3 — Sezione trasversale B-B'],
  ['tav-4-cucina.svg', 'Tav. 4 — Cucina estraibile'],
  ['tav-5-retro.svg', 'Tav. 5 — Vista posteriore, cucina in uso'],
];

const RENDER = [
  ['r1-giorno-tre-quarti.png', 'R1 — Configurazione giorno: soffietto aperto, cucina e frigo estratti'],
  ['r2-cucina-posteriore.png', 'R2 — Cucina in uso dal portellone, tavolo ruotato fuori'],
  ['r5-postazione-interno.png', 'R5 — Postazione PC: pozzetto piedi, scrivania a +76, letto ripiegato'],
  ['r3-notte-laterale.png', 'R3 — Configurazione notte: letto disteso 190 × 130'],
  ['r4-pianta-alto.png', 'R4 — Vista dall\u2019alto a soffietto chiuso'],
  ['r6-chiuso-marcia.png', 'R6 — Assetto di marcia: tutto chiuso, 1,97 m di altezza'],
];

const pagine = TAVOLE.map(([file, titolo]) => {
  const svg = readFileSync(join(OUT, file), 'utf8').replace(/<\?xml[^>]*\?>/, '');
  return `<section class="page"><h2>${titolo}</h2><div class="art">${svg}</div></section>`;
}).join('\n');

const paginaRender = RENDER
  .filter(([f]) => existsSync(join(OUT, 'render', f)))
  .map(([f, titolo]) => {
    const b64 = readFileSync(join(OUT, 'render', f)).toString('base64');
    return `<section class="page"><h2>${titolo}</h2><div class="art"><img src="data:image/png;base64,${b64}"></div></section>`;
  }).join('\n');

const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
<style>
  @page { size: A3 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0e12; color: #e6edf3; font-family: "DejaVu Sans Mono", monospace; }
  .page {
    width: 420mm; height: 297mm; padding: 12mm 14mm 10mm;
    display: flex; flex-direction: column; page-break-after: always;
    background: #0a0e12;
  }
  .page:last-child { page-break-after: auto; }
  h2 { font-size: 11pt; letter-spacing: 2px; color: #8494a3; font-weight: 600; margin-bottom: 6mm; }
  .art { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
  .art svg, .art img { max-width: 100%; max-height: 100%; height: auto; width: auto; }

  /* copertina */
  .cover { justify-content: center; }
  .cover h1 { font-size: 34pt; letter-spacing: 8px; margin-bottom: 4mm; }
  .cover h1 span { color: #ffb020; }
  .cover .sub { font-size: 13pt; color: #8494a3; letter-spacing: 2px; margin-bottom: 16mm; }
  .cover .cols { display: flex; gap: 18mm; }
  .cover ul { list-style: none; font-size: 10.5pt; line-height: 2.1; }
  .cover ul li span { color: #ffb020; }
  .cover .key { font-size: 10.5pt; line-height: 2.1; color: #9fb3c4; }
  .cover .key b { color: #e6edf3; font-weight: 600; }
  .cover .foot { margin-top: auto; font-size: 9pt; color: #6c8296; letter-spacing: 1px; }
</style></head><body>

<section class="page cover">
  <h1>CYBER<span>CRUISER</span></h1>
  <div class="sub">Toyota Land Cruiser KDJ120 — allestimento camper · tavole tecniche · rev. B</div>
  <div class="cols">
    <ul>
      ${TAVOLE.map(([, t]) => `<li><span>▸</span> ${t}</li>`).join('\n      ')}
      <li><span>▸</span> R1-R6 — Render 3D dell’allestimento</li>
    </ul>
    <div class="key">
      <b>Quote chiave</b> (in cm)<br>
      vano utile 165 × 130 × 90 · pavimento a 78 da terra<br>
      piano continuo a +50 · falso pavimento 12 · serbatoio 60 L<br>
      cucina estraibile 85 × 60, corsa 60, piano a 98 da terra<br>
      scrivania 70 × 45 a +76 su braccio orientabile<br>
      pozzetto piedi 70 × 30 · letto 190 × 130 ripiegabile<br>
      tetto a soffietto +95 → 185 di altezza interna<br><br>
      <b>Attenzione:</b> le quote esterne (484 × 185,5 × 184,5, passo 279) sono da<br>
      scheda tecnica; quelle interne del vano sono valori di progetto, da<br>
      confermare col metro sul mezzo — vedi la Tav. 0.
    </div>
  </div>
  <div class="foot">quote in cm salvo diversa indicazione · disegni generati da docs/disegni/genera-disegni.mjs</div>
</section>

${pagine}
${paginaRender}
</body></html>`;

const tmp = join(OUT, '.tavole-print.html');
writeFileSync(tmp, html);

const chromium = await loadChromium();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
const pdf = join(OUT, 'cyber-cruiser-tavole.pdf');
await page.pdf({ path: pdf, format: 'A3', landscape: true, printBackground: true });
await browser.close();

console.log('PDF:', pdf);
