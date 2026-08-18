// Versione single-file del modello 3D: dist/cyber-cruiser-3d.html
//
//   node tools/build-single.mjs
//
// Three.js e i moduli dell'applicazione vengono incorporati come data URI e
// risolti da un import map: così il file gira aperto da disco, senza server.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Gli import relativi diventano specificatori "bare" (@nome): dentro un data URI
// i percorsi relativi non sono risolvibili. Gli import già bare (three,
// three/addons/...) restano come sono e li risolve l'import map.
const rewrite = (src) =>
  src.replace(/(\bfrom\s*["'])(\.[^"']*?\/)?([\w.-]+)\.(m?js)(["'])/g, (_m, a, _p, nome, _e, z) => `${a}@${nome}${z}`);

const dataURI = (file) =>
  'data:text/javascript;base64,' + Buffer.from(rewrite(readFileSync(file, 'utf8')), 'utf8').toString('base64');

const imports = {
  'three': dataURI(join(ROOT, 'vendor/three.module.min.js')),
  '@three.core.min': dataURI(join(ROOT, 'vendor/three.core.min.js')),
  'three/addons/controls/OrbitControls.js': dataURI(join(ROOT, 'vendor/OrbitControls.js')),
  '@quote': dataURI(resolve(ROOT, '../docs/disegni/quote.mjs')),
  '@modello': dataURI(join(ROOT, 'js/modello.js')),
  '@app': dataURI(join(ROOT, 'js/app.js')),
};

const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
  .replace(/<script type="importmap">[\s\S]*?<\/script>/,
    `<script type="importmap">${JSON.stringify({ imports })}</script>`)
  .replace('<script type="module" src="js/app.js"></script>',
    `<script type="module">import '@app';</script>`);

mkdirSync(join(ROOT, 'dist'), { recursive: true });
const out = join(ROOT, 'dist', 'cyber-cruiser-3d.html');
writeFileSync(out, html);
console.log(`OK  ${out}  (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
