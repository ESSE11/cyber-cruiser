// Costruisce una versione single-file della dashboard: dist/cyber-cruiser.html
// Serve per copiarla su una chiavetta, aprirla da telefono o mandarla a qualcuno
// senza dover avviare un server.
//
//   node tools/build-single.mjs
//
// Come funziona: i moduli ES non possono usare import relativi se incorporati
// come data URI, quindi ogni import viene riscritto a uno specificatore "bare"
// (@nomefile) e risolto da un import map che punta ai moduli inline.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const modules = walk(join(root, 'js')).filter((f) => f.endsWith('.js'));

// I nomi dei file devono essere unici: è il presupposto della riscrittura.
const names = modules.map((f) => basename(f, '.js'));
const dup = names.find((n, i) => names.indexOf(n) !== i);
if (dup) throw new Error(`Nome modulo duplicato: ${dup}.js — rinominane uno.`);

const rewrite = (src) =>
  src.replace(/(\bfrom\s+['"])([^'"]+?)\/?([\w.-]+)\.js(['"])/g, (_m, a, _p, name, z) => `${a}@${name}${z}`);

const imports = {};
for (const file of modules) {
  const code = rewrite(readFileSync(file, 'utf8'));
  const b64 = Buffer.from(code, 'utf8').toString('base64');
  imports['@' + basename(file, '.js')] = `data:text/javascript;base64,${b64}`;
}

const css = readFileSync(join(root, 'css', 'dash.css'), 'utf8');
let html = readFileSync(join(root, 'index.html'), 'utf8');

html = html
  .replace('<link rel="stylesheet" href="css/dash.css">', `<style>\n${css}\n</style>`)
  .replace(
    '<script type="module" src="js/app.js"></script>',
    `<script type="importmap">${JSON.stringify({ imports }, null, 0)}</script>\n` +
      `<script type="module">import '@app';</script>`
  );

mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', 'cyber-cruiser.html');
writeFileSync(out, html);

console.log(`OK  ${out}  (${(Buffer.byteLength(html) / 1024).toFixed(0)} kB, ${modules.length} moduli)`);
