// Generatore dei disegni tecnici dell'allestimento.
// Le quote stanno tutte qui: cambia un numero e i cinque disegni si riallineano.
//
//   node genera-disegni.mjs      → tav-1 ... tav-5 (.svg) + index.html
//
// Sistema di riferimento del veicolo (KDJ120 passo lungo, sedili post. rimossi):
//   L = longitudinale, 0 = filo portellone, 165 = schienale sedili anteriori
//   T = trasversale,   0 = fiancata sinistra, 130 = fiancata destra
//   H = verticale,     0 = pavimento del vano (che sta a 78 cm da terra)

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- quote

import { V } from './quote.mjs';

// ---------------------------------------------------------------- stile

const C = {
  bg: '#0d1219', body: '#8fa3b5', mod: '#e6edf3',
  fillMod: '#182029', fillZone: '#131b23', acc: '#ffb020', acc2: '#35d0c0',
  dim: '#6c8296', text: '#e6edf3', dimText: '#9fb3c4'
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

class Sheet {
  constructor({ w, h, scale, title, subtitle }) {
    Object.assign(this, { w, h, s: scale, title, subtitle });
    this.parts = [];
  }
  cm(v) { return v * this.s; }
  add(s) { this.parts.push(s); return this; }

  rect(x, y, w, h, o = {}) {
    return this.add(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.abs(w).toFixed(1)}" height="${Math.abs(h).toFixed(1)}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.mod}" stroke-width="${o.sw || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.rx ? ` rx="${o.rx}"` : ''}/>`);
  }
  line(x1, y1, x2, y2, o = {}) {
    return this.add(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${o.stroke || C.body}" stroke-width="${o.sw || 1.2}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
  }
  circle(cx, cy, r, o = {}) {
    return this.add(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.mod}" stroke-width="${o.sw || 1.4}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
  }
  path(d, o = {}) {
    return this.add(`<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.stroke || C.mod}" stroke-width="${o.sw || 1.6}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`);
  }
  text(x, y, s, o = {}) {
    return this.add(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${o.fill || C.text}" font-size="${o.size || 11}" font-family="DejaVu Sans Mono, monospace" letter-spacing="${o.ls ?? 0.8}" text-anchor="${o.anchor || 'start'}"${o.weight ? ` font-weight="${o.weight}"` : ''}${o.rotate ? ` transform="rotate(${o.rotate} ${x.toFixed(1)} ${y.toFixed(1)})"` : ''}>${esc(s)}</text>`);
  }
  label(x, y, w, h, name, sub, o = {}) {
    const cx = x + w / 2, cy = y + h / 2;
    this.text(cx, cy - (sub ? 4 : -4), name, { anchor: 'middle', size: o.size || 11, fill: o.fill || C.text, weight: 600 });
    if (sub) this.text(cx, cy + 11, sub, { anchor: 'middle', size: 9.5, fill: C.dimText });
    return this;
  }
  /** Richiamo con linea di richiamo e testo. */
  callout(x1, y1, x2, y2, txt, o = {}) {
    this.line(x1, y1, x2, y2, { stroke: o.stroke || C.dim, sw: 1 });
    this.circle(x1, y1, 2.4, { fill: o.stroke || C.dim, stroke: 'none' });
    this.text(x2 + (o.anchor === 'end' ? -6 : 6), y2 + 3.5, txt, { size: 9.5, fill: o.fill || C.dimText, anchor: o.anchor || 'start' });
    return this;
  }
  dimH(x1, x2, y, label, o = {}) {
    const t = 5;
    this.line(x1, y, x2, y, { stroke: C.dim, sw: 1 });
    for (const x of [x1, x2]) this.line(x - t / 2, y + t / 2, x + t / 2, y - t / 2, { stroke: C.dim, sw: 1 });
    if (o.ext != null) {
      this.line(x1, o.ext, x1, y, { stroke: C.dim, sw: 0.6, dash: '2 3' });
      this.line(x2, o.ext, x2, y, { stroke: C.dim, sw: 0.6, dash: '2 3' });
    }
    this.text((x1 + x2) / 2, y - 5, label, { anchor: 'middle', size: 10, fill: C.dimText });
    return this;
  }
  dimV(y1, y2, x, label, o = {}) {
    const t = 5;
    this.line(x, y1, x, y2, { stroke: C.dim, sw: 1 });
    for (const y of [y1, y2]) this.line(x - t / 2, y + t / 2, x + t / 2, y - t / 2, { stroke: C.dim, sw: 1 });
    if (o.ext != null) {
      this.line(o.ext, y1, x, y1, { stroke: C.dim, sw: 0.6, dash: '2 3' });
      this.line(o.ext, y2, x, y2, { stroke: C.dim, sw: 0.6, dash: '2 3' });
    }
    this.text(x - 5, (y1 + y2) / 2, label, { anchor: 'middle', size: 10, fill: C.dimText, rotate: -90 });
    return this;
  }
  scaleBar(x, y, cmLen = 100) {
    const px = this.cm(cmLen);
    this.line(x, y, x + px, y, { stroke: C.dimText, sw: 1.4 });
    this.rect(x, y - 4, px / 2, 8, { fill: C.dimText, stroke: C.dimText, sw: 1 });
    for (let i = 0; i <= 2; i++) this.line(x + (px / 2) * i, y - 4, x + (px / 2) * i, y + 4, { stroke: C.dimText, sw: 1.4 });
    this.text(x, y + 16, '0', { size: 9, fill: C.dimText });
    this.text(x + px / 2, y + 16, String(cmLen / 2), { size: 9, fill: C.dimText, anchor: 'middle' });
    this.text(x + px, y + 16, `${cmLen} cm`, { size: 9, fill: C.dimText, anchor: 'end' });
    return this;
  }
  cartiglio() {
    const w = 330, h = 64, x = this.w - w - 24, y = this.h - h - 20;
    this.rect(x, y, w, h, { stroke: C.dim, sw: 1.2, fill: C.fillZone });
    this.line(x, y + 24, x + w, y + 24, { stroke: C.dim, sw: 1 });
    this.text(x + 10, y + 16, this.title, { size: 11.5, weight: 700, fill: C.acc, ls: 1.6 });
    this.text(x + 10, y + 39, this.subtitle, { size: 8.6, fill: C.dimText, ls: 0.4 });
    this.text(x + 10, y + 53, 'CYBER CRUISER · KDJ120 · quote in cm · rev. B', { size: 9, fill: C.dim });
    return this;
  }
  /** Sagoma umana in piedi (h in cm), per dare la scala. */
  omino(x, base, hcm = 175, col = C.dim) {
    const s = this.s, H = hcm / 175;
    this.circle(x, base - s * 160 * H, s * 9 * H, { stroke: col, sw: 1.6 });
    this.path(`M ${x} ${base - s * 151 * H} L ${x} ${base - s * 88 * H}
               M ${x} ${base - s * 140 * H} L ${x - s * 20 * H} ${base - s * 112 * H}
               M ${x} ${base - s * 140 * H} L ${x + s * 20 * H} ${base - s * 112 * H}
               M ${x} ${base - s * 88 * H} L ${x - s * 12 * H} ${base}
               M ${x} ${base - s * 88 * H} L ${x + s * 12 * H} ${base}`, { stroke: col, sw: 1.6 });
    return this;
  }
  /** Sagoma umana seduta, vista di lato (seduta a quota `sit`, piedi a `foot`). */
  ominoSeduto(x, sitY, footY, s, col = C.dim) {
    this.circle(x - s * 4, sitY - s * 72, s * 9, { stroke: col, sw: 1.6 });
    this.path(`M ${x - s * 4} ${sitY - s * 63} L ${x} ${sitY - s * 5}
               M ${x} ${sitY - s * 5} L ${x - s * 42} ${sitY - s * 2}
               M ${x - s * 42} ${sitY - s * 2} L ${x - s * 44} ${footY}
               M ${x - s * 2} ${sitY - s * 48} L ${x - s * 34} ${sitY - s * 26}`, { stroke: col, sw: 1.6 });
    return this;
  }
  render() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" font-family="DejaVu Sans Mono, monospace">
<rect width="${this.w}" height="${this.h}" fill="${C.bg}"/>
${this.parts.join('\n')}
</svg>`;
  }
}

// ============================================================ TAV. 1 — PIANTA

function tavolaPianta() {
  const s = 3.2, M = { x: 300, y: 200 };
  const sh = new Sheet({
    w: M.x + s * V.L + 260, h: M.y + s * V.T + 210, scale: s,
    title: 'TAV. 1 — PIANTA ALLESTIMENTO',
    subtitle: 'sedili rimossi — sezione orizzontale a +40 cm'
  });
  const X = (l) => M.x + s * l;
  const Y = (t) => M.y + s * t;

  sh.rect(X(0), Y(0), s * V.L, s * V.T, { stroke: C.body, sw: 2.2, fill: C.fillZone });

  const a = V.arco;
  for (const [t0, t1] of [[0, a.w], [V.T - a.w, V.T]]) {
    sh.rect(X(a.l0), Y(t0), s * (a.l1 - a.l0), s * (t1 - t0), { stroke: C.body, sw: 1.2, fill: '#101820', dash: '5 3' });
  }
  sh.text(X(85), Y(a.w / 2) + 4, 'PASSARUOTA', { anchor: 'middle', size: 8.5, fill: C.dimText });
  sh.text(X(85), Y(V.T - a.w / 2) + 4, 'PASSARUOTA', { anchor: 'middle', size: 8.5, fill: C.dimText });

  const mod = (m, name, sub, o = {}) => {
    sh.rect(X(m.l0), Y(m.t0), s * (m.l1 - m.l0), s * (m.t1 - m.t0),
      { stroke: o.stroke || C.mod, sw: o.sw || 1.6, fill: o.fill || C.fillMod, dash: o.dash });
    sh.label(X(m.l0), Y(m.t0), s * (m.l1 - m.l0), s * (m.t1 - m.t0), name, sub, { size: o.size, fill: o.textFill });
  };

  mod(V.frigo, 'FRIGO 50 L', '45 × 75 · slitta', { stroke: C.acc2 });
  mod(V.cucina, 'CUCINA ESTRAIBILE', '85 × 60 · piano a +20', { stroke: C.acc });
  mod(V.cassetti, '2 CASSETTONI', '72 × 35', {});
  mod(V.attrezzi, 'ATTREZZI', '32 × 50', {});
  mod(V.pozzetto, 'POZZETTO PIEDI', '70 × 30', { stroke: C.acc2, fill: '#0f1c1e', size: 11 });
  mod(V.tecnico, 'VANO TECNICO', 'batteria · MPPT', { stroke: C.acc2, size: 10 });
  mod(V.stiva, 'STIVAGGIO', 'tavolo · sedie', { size: 10 });
  sh.callout(X(145), Y(4), X(126), Y(-34), 'SEDUTA / DINETTE sopra questi due vani');

  // scrivania orientabile (tratteggiata: sta sopra il piano di sezione)
  const sc = V.scrivania;
  sh.rect(X(sc.l0), Y(sc.t0), s * (sc.l1 - sc.l0), s * (sc.t1 - sc.t0), { stroke: C.acc, sw: 1.4, dash: '7 4' });
  sh.callout(X(114), Y(50), X(40), Y(-56), 'SCRIVANIA / TAVOLO 70 × 45 — quota +76 — su braccio orientabile:', { stroke: C.acc, fill: C.acc });
  sh.text(X(40) + 6, Y(-56) + 13, 'dentro è la postazione PC, ruotato esce dal portellone come tavolo', { size: 9, fill: C.dimText });
  // perno del braccio e arco di rotazione verso il portellone
  const px = X(95), py = Y(45);
  sh.circle(px, py, 4, { stroke: C.acc, sw: 1.6 });
  sh.path(`M ${px + s * 42} ${py} A ${s * 42} ${s * 42} 0 0 0 ${px} ${py + s * 42}`, { stroke: C.acc, sw: 1, dash: '4 4' });

  // serbatoio nel falso pavimento
  const sb = V.serbatoio;
  sh.rect(X(sb.l0), Y(sb.t0), s * (sb.l1 - sb.l0), s * (sb.t1 - sb.t0), { stroke: C.acc2, sw: 1.2, dash: '7 4' });
  sh.callout(X(70), Y(110), X(70), Y(V.T) + 34, 'SERBATOIO 60 L (100 × 50 × 12) nel falso pavimento', { stroke: C.acc2, fill: C.acc2 });

  // estrazione della cucina fuori dal portellone
  const cu = V.cucina;
  sh.rect(X(-cu.corsa), Y(cu.t0), s * cu.corsa, s * (cu.t1 - cu.t0), { stroke: C.acc, sw: 1.2, dash: '6 4' });
  sh.text(X(-cu.corsa / 2), Y((cu.t0 + cu.t1) / 2) - 4, 'CUCINA IN USO', { anchor: 'middle', size: 10, fill: C.acc, weight: 600 });
  sh.text(X(-cu.corsa / 2), Y((cu.t0 + cu.t1) / 2) + 10, 'fuori dal portellone', { anchor: 'middle', size: 9, fill: C.acc });
  sh.path(`M ${X(-4)} ${Y(cu.t1 + 10)} L ${X(-cu.corsa + 5)} ${Y(cu.t1 + 10)}`, { stroke: C.acc, sw: 1.2 });
  sh.path(`M ${X(-cu.corsa + 5)} ${Y(cu.t1 + 10)} l 8 -4 l 0 8 z`, { stroke: C.acc, fill: C.acc, sw: 1 });
  sh.text(X(-cu.corsa / 2), Y(cu.t1 + 26), 'corsa 60', { anchor: 'middle', size: 9, fill: C.acc });

  // frigo estraibile
  sh.path(`M ${X(-4)} ${Y(34)} L ${X(-38)} ${Y(34)}`, { stroke: C.acc2, sw: 1.2, dash: '5 3' });
  sh.path(`M ${X(-38)} ${Y(34)} l 8 -4 l 0 8 z`, { stroke: C.acc2, fill: C.acc2, sw: 1 });
  sh.text(X(-42), Y(34) + 4, 'frigo: corsa 40', { size: 9, fill: C.acc2, anchor: 'end' });

  // portellone a battente e sedili
  sh.line(X(0), Y(-8), X(0), Y(V.T + 8), { stroke: C.acc, sw: 2.5 });
  sh.text(X(-58), Y(-18), 'FILO PORTELLONE (a battente, ruota di scorta sulla porta)', { size: 9.5, fill: C.acc });
  for (const t0 of [8, 72]) {
    sh.rect(X(V.L + 6), Y(t0), s * 46, s * 50, { stroke: C.body, sw: 1, dash: '4 4' });
    sh.label(X(V.L + 6), Y(t0), s * 46, s * 50, 'SEDILE', null, { size: 9, fill: C.dimText });
  }

  // tracce di sezione
  const aY = Y(85);
  sh.line(X(-72), aY, X(V.L + 60), aY, { stroke: C.acc, sw: 0.9, dash: '14 5 3 5' });
  sh.text(X(-72), aY - 7, 'A', { size: 12, fill: C.acc, weight: 700 });
  sh.text(X(V.L + 56), aY - 7, 'A', { size: 12, fill: C.acc, weight: 700 });
  const bX = X(110);
  sh.line(bX, Y(-34), bX, Y(V.T + 34), { stroke: C.acc, sw: 0.9, dash: '14 5 3 5' });
  sh.text(bX - 5, Y(-38), 'B', { size: 12, fill: C.acc, weight: 700, anchor: 'middle' });
  sh.text(bX - 5, Y(V.T + 48), 'B', { size: 12, fill: C.acc, weight: 700, anchor: 'middle' });

  // quote
  const yd1 = Y(V.T) + 70, yd2 = yd1 + 30;
  sh.dimH(X(0), X(60), yd1, '60', { ext: Y(V.T) });
  sh.dimH(X(60), X(95), yd1, '35', { ext: Y(V.T) });
  sh.dimH(X(95), X(125), yd1, '30', { ext: Y(V.T) });
  sh.dimH(X(125), X(V.L), yd1, '40', { ext: Y(V.T) });
  sh.dimH(X(0), X(V.L), yd2, '165  (portellone → sedili anteriori)');

  const xd1 = X(-V.cucina.corsa) - 34, xd2 = xd1 - 30;
  sh.dimV(Y(0), Y(45), xd1, '45', { ext: X(0) });
  sh.dimV(Y(45), Y(V.T), xd1, '85', { ext: X(0) });
  sh.dimV(Y(0), Y(V.T), xd2, '130  (largh. max)');

  sh.text(X(V.L + 58), Y(66), 'AVANTI →', { size: 9.5, fill: C.dimText });
  sh.text(X(2), Y(V.T) + 20, 'LATO DESTRO', { size: 9.5, fill: C.dimText });

  sh.scaleBar(M.x, sh.h - 40);
  sh.cartiglio();
  return sh.render();
}

// ================================================ TAV. 2 — SEZIONE LONGITUDINALE

function tavolaSezioneAA() {
  const s = 3.1, M = { x: 190, y: 96 }, HMAX = 200;
  const sh = new Sheet({
    w: M.x + s * 300 + 270, h: M.y + s * (HMAX + 78) + 120, scale: s,
    title: 'TAV. 2 — SEZIONE A-A',
    subtitle: 'lato destro — cucina estratta, soffietto aperto'
  });
  const X = (l) => M.x + s * (l + 72);
  const Yh = (h) => M.y + s * (HMAX - h);

  // terreno + pavimento
  const terra = Yh(-V.pavTerra);
  sh.line(X(-72), terra, X(228), terra, { stroke: C.dim, sw: 2.2 });
  sh.text(X(-70), terra + 16, 'PIANO STRADA', { size: 9, fill: C.dim });
  sh.dimV(terra, Yh(0), X(-72) - 20, '78  (soglia da terra)');
  sh.line(X(-8), Yh(0), X(V.L + 58), Yh(0), { stroke: C.body, sw: 2.2 });
  sh.line(X(0), Yh(0), X(0), Yh(V.H), { stroke: C.acc, sw: 2.5 });
  sh.line(X(0), Yh(V.H), X(V.L + 58), Yh(V.H), { stroke: C.body, sw: 1.4, dash: '6 4' });
  sh.text(X(-64), Yh(V.H) + 16, 'linea tetto originale +90', { size: 9, fill: C.dimText });

  // falso pavimento + serbatoio
  sh.rect(X(0), Yh(V.falsoPav), s * V.L, s * V.falsoPav, { stroke: C.body, sw: 1.2, fill: '#101820' });
  sh.rect(X(V.serbatoio.l0), Yh(V.falsoPav), s * (V.serbatoio.l1 - V.serbatoio.l0), s * V.falsoPav, { stroke: C.acc2, sw: 1.4, fill: '#0f1c1e' });
  sh.text(X(87), Yh(V.falsoPav / 2) + 3, 'SERBATOIO 60 L', { size: 8.5, fill: C.acc2, anchor: 'middle' });

  const box = (l0, l1, h0, h1, name, sub, o = {}) => {
    sh.rect(X(l0), Yh(h1), s * (l1 - l0), s * (h1 - h0), { stroke: o.stroke || C.mod, sw: 1.6, fill: o.fill || C.fillMod, dash: o.dash });
    sh.label(X(l0), Yh(h1), s * (l1 - l0), s * (h1 - h0), name, sub, o);
  };

  // cucina estratta, bassa: piano di lavoro a +20 (= 98 da terra)
  const cu = V.cucina;
  box(-cu.corsa, 0, 0, cu.h, 'CUCINA IN USO', 'piano a 98 da terra', { stroke: C.acc, size: 10 });
  sh.rect(X(0), Yh(cu.h), s * 60, s * cu.h, { stroke: C.acc, sw: 1.2, dash: '6 4' });
  sh.text(X(30), Yh(cu.h / 2) + 3, 'sede a riposo', { size: 9, fill: C.acc, anchor: 'middle' });

  box(60, 95, V.falsoPav, 31, 'CASSETTONE 1', null, {});
  box(60, 95, 31, V.piano, 'CASSETTONE 2', null, {});

  // pozzetto piedi: vuoto sotto il piano, cassa amovibile tratteggiata
  sh.rect(X(95), Yh(V.piano), s * 30, s * (V.piano - V.falsoPav), { stroke: C.acc2, sw: 1.6, fill: '#0f1c1e', dash: '7 4' });
  sh.text(X(110), Yh(30) + 4, 'POZZETTO', { size: 9.5, fill: C.acc2, anchor: 'middle' });
  sh.text(X(110), Yh(30) + 15, 'PIEDI', { size: 9.5, fill: C.acc2, anchor: 'middle' });

  box(125, V.L, V.falsoPav, V.piano, 'VANO TECNICO', 'batteria · MPPT', { stroke: C.acc2, size: 10 });

  // piano continuo + seduta
  sh.rect(X(0), Yh(V.piano + V.pianoSp), s * 95, s * V.pianoSp, { stroke: C.acc, sw: 1.8, fill: '#241c08' });
  sh.rect(X(125), Yh(V.piano + V.pianoSp), s * 40, s * V.pianoSp, { stroke: C.acc, sw: 1.8, fill: '#241c08' });
  sh.text(X(48), Yh(V.piano + V.pianoSp) - 8, 'PIANO CONTINUO +50', { size: 9.5, fill: C.acc, anchor: 'middle' });
  sh.rect(X(125), Yh(V.piano + 8), s * 40, s * 5, { stroke: C.mod, sw: 1.4, fill: '#20272f', rx: 3 });
  sh.text(X(145), Yh(V.piano + 8) - 7, 'CUSCINO SEDUTA', { size: 9, fill: C.dimText, anchor: 'middle' });
  sh.rect(X(V.L - 2), Yh(V.piano + 48), s * 6, s * 40, { stroke: C.mod, sw: 1.4, fill: '#20272f', rx: 3 });
  sh.callout(X(V.L + 1), Yh(V.piano + 30), X(V.L + 66), Yh(V.piano + 30), 'schienale ribaltabile');

  // scrivania su braccio orientabile
  const sc = V.scrivania;
  sh.rect(X(sc.l0), Yh(sc.h + 3), s * (sc.l1 - sc.l0), s * 3, { stroke: C.acc, sw: 2, fill: '#241c08' });
  sh.text(X((sc.l0 + sc.l1) / 2), Yh(sc.h) + 15, 'SCRIVANIA +76  (70 × 45)', { size: 10, fill: C.acc, anchor: 'middle', weight: 600 });
  sh.line(X(94), Yh(sc.h), X(94), Yh(V.piano + 3), { stroke: C.acc, sw: 2.4 });
  sh.text(X(90), Yh(64), 'braccio orientabile', { size: 8.5, fill: C.acc, rotate: -90, anchor: 'middle' });

  // persona seduta al PC
  sh.ominoSeduto(X(150), Yh(V.piano + 5), Yh(V.falsoPav), s);
  sh.rect(X(100), Yh(sc.h + 27), s * 2.5, s * 24, { stroke: C.dim, sw: 1.4, fill: '#20272f' });
  sh.callout(X(101), Yh(sc.h + 20), X(72), Yh(112), 'monitor / laptop', { anchor: 'end' });

  // tetto a soffietto + letto
  const hOpen = V.H + V.popUp;
  sh.rect(X(-8), Yh(hOpen + 12), s * (V.L + 72), s * 12, { stroke: C.body, sw: 2, fill: '#141c25' });
  sh.text(X(V.L / 2), Yh(hOpen + 12) - 8, 'GUSCIO TETTO A SOFFIETTO', { size: 9.5, fill: C.dimText, anchor: 'middle' });
  sh.path(`M ${X(0)} ${Yh(V.H)} L ${X(-8)} ${Yh(hOpen)}`, { stroke: C.body, sw: 1.4, dash: '5 3' });
  sh.path(`M ${X(V.L + 58)} ${Yh(V.H)} L ${X(V.L + 64)} ${Yh(hOpen)}`, { stroke: C.body, sw: 1.4, dash: '5 3' });
  const lt = V.letto;
  // posizione notte: letto disteso su tutta la lunghezza (tratteggiato)
  sh.rect(X(lt.off), Yh(V.H + 14), s * lt.l, s * 14, { stroke: C.acc2, sw: 1.2, fill: 'none', dash: '7 4' });
  sh.text(X(76), Yh(V.H + 7) + 4, 'letto disteso — posizione notte', { size: 9, fill: C.acc2 });
  // posizione giorno: metà anteriore ripiegata verso il portellone, sopra la cucina
  sh.rect(X(lt.off), Yh(V.H + 28), s * (lt.l / 2), s * 28, { stroke: C.acc2, sw: 1.8, fill: '#0f1c1e' });
  sh.text(X(lt.off + lt.l / 4), Yh(V.H + 14) + 4, 'LETTO RIPIEGATO', { size: 9.5, fill: C.acc2, anchor: 'middle', weight: 600 });
  sh.text(X(lt.off + lt.l / 4), Yh(V.H + 14) + 16, 'posizione giorno', { size: 9, fill: C.acc2, anchor: 'middle' });
  sh.callout(X(20), Yh(V.H + 28), X(-66), Yh(160), 'il letto si ripiega a metà verso il portellone:', { stroke: C.acc2, fill: C.acc2 });
  sh.text(X(-60), Yh(160) + 16, 'di giorno sopra la dinette restano 135 cm liberi,', { size: 9, fill: C.dimText });
  sh.text(X(-60), Yh(160) + 28, 'altrimenti sotto il letto disteso ce ne sarebbero 40', { size: 9, fill: C.dimText });

  // quote verticali
  const xd = X(-72) - 52;
  sh.dimV(Yh(0), Yh(V.piano), xd, '50', { ext: X(0) });
  sh.dimV(Yh(V.piano), Yh(V.H), xd, '40', { ext: X(0) });
  sh.dimV(Yh(0), Yh(hOpen), xd - 30, '185  (in piedi)', { ext: X(0) });
  sh.dimV(Yh(V.piano + 5), Yh(sc.h), X(88), '21', { ext: X(94) });

  // quote orizzontali
  const yd = Yh(0) + 44;
  sh.dimH(X(-60), X(0), yd, '60', { ext: Yh(0) });
  sh.dimH(X(0), X(60), yd, '60', { ext: Yh(0) });
  sh.dimH(X(60), X(95), yd, '35', { ext: Yh(0) });
  sh.dimH(X(95), X(125), yd, '30', { ext: Yh(0) });
  sh.dimH(X(125), X(V.L), yd, '40', { ext: Yh(0) });
  sh.dimH(X(lt.off), X(lt.off + lt.l), Yh(hOpen + 28), '190  (letto, sbalzo sui sedili)');

  sh.text(X(-72), Yh(HMAX - 8), 'A', { size: 13, fill: C.acc, weight: 700 });
  sh.text(X(226), Yh(HMAX - 8), 'A', { size: 13, fill: C.acc, weight: 700, anchor: 'end' });

  sh.scaleBar(M.x, sh.h - 40);
  sh.cartiglio();
  return sh.render();
}

// ================================================ TAV. 3 — SEZIONE TRASVERSALE

function tavolaSezioneBB() {
  const s = 3.4, M = { x: 150, y: 80 }, HMAX = 200;
  const sh = new Sheet({
    w: M.x + s * V.T + 430, h: M.y + s * HMAX + 140, scale: s,
    title: 'TAV. 3 — SEZIONE B-B',
    subtitle: 'sul pozzetto (L = 110) — postazione scrivania'
  });
  const X = (t) => M.x + s * t;
  const Yh = (h) => M.y + s * (HMAX - h);

  sh.line(X(0), Yh(0), X(V.T), Yh(0), { stroke: C.body, sw: 2.2 });
  sh.line(X(0), Yh(0), X(0), Yh(V.H), { stroke: C.body, sw: 2.2 });
  sh.line(X(V.T), Yh(0), X(V.T), Yh(V.H), { stroke: C.body, sw: 2.2 });
  sh.line(X(0), Yh(V.H), X(V.T), Yh(V.H), { stroke: C.body, sw: 1.4, dash: '6 4' });

  const a = V.arco;
  sh.rect(X(0), Yh(a.h), s * a.w, s * a.h, { stroke: C.body, sw: 1.4, fill: '#101820' });
  sh.rect(X(V.T - a.w), Yh(a.h), s * a.w, s * a.h, { stroke: C.body, sw: 1.4, fill: '#101820' });

  sh.rect(X(0), Yh(V.falsoPav), s * V.T, s * V.falsoPav, { stroke: C.body, sw: 1.2, fill: '#101820' });
  sh.rect(X(13), Yh(V.falsoPav), s * 100, s * V.falsoPav, { stroke: C.acc2, sw: 1.4, fill: '#0f1c1e' });
  sh.text(X(63), Yh(V.falsoPav / 2) + 3, 'SERBATOIO 100 × 50 × 12', { size: 8.5, fill: C.acc2, anchor: 'middle' });

  // cassetto attrezzi a sinistra, pozzetto al centro
  sh.rect(X(13), Yh(V.piano), s * 32, s * (V.piano - V.falsoPav), { stroke: C.mod, sw: 1.6, fill: C.fillMod });
  sh.label(X(13), Yh(V.piano), s * 32, s * (V.piano - V.falsoPav), 'ATTREZZI', '32', { size: 9.5 });
  sh.rect(X(45), Yh(V.piano), s * 70, s * (V.piano - V.falsoPav), { stroke: C.acc2, sw: 1.8, fill: '#0f1c1e' });
  sh.label(X(45), Yh(V.piano), s * 70, s * 20, 'POZZETTO PIEDI', 'cassa amovibile 70 × 30', { size: 10, fill: C.acc2 });

  // piano interrotto sul pozzetto (è il vuoto in cui scendono le gambe)
  sh.rect(X(0), Yh(V.piano + V.pianoSp), s * 45, s * V.pianoSp, { stroke: C.acc, sw: 1.8, fill: '#241c08' });
  sh.rect(X(115), Yh(V.piano + V.pianoSp), s * 15, s * V.pianoSp, { stroke: C.acc, sw: 1.8, fill: '#241c08' });

  // scrivania
  const sc = V.scrivania;
  sh.rect(X(sc.t0), Yh(sc.h + 3), s * (sc.t1 - sc.t0), s * 3, { stroke: C.acc, sw: 2, fill: '#241c08' });
  sh.text(X((sc.t0 + sc.t1) / 2), Yh(sc.h + 3) - 9, 'SCRIVANIA 70 × 45 — quota +76', { size: 10, fill: C.acc, anchor: 'middle', weight: 600 });
  sh.line(X(46), Yh(sc.h), X(46), Yh(V.piano + 3), { stroke: C.acc, sw: 2.4 });

  // persona seduta, vista frontale
  const px = X(84), sit = Yh(V.piano + 5);
  sh.circle(px, sit - s * 68, s * 9, { stroke: C.dim, sw: 1.6 });
  sh.path(`M ${px} ${sit - s * 59} L ${px} ${sit - s * 8}
           M ${px} ${sit - s * 48} L ${px - s * 17} ${sit - s * 26} M ${px} ${sit - s * 48} L ${px + s * 17} ${sit - s * 26}
           M ${px - s * 8} ${sit - s * 8} L ${px - s * 8} ${Yh(V.falsoPav)}
           M ${px + s * 8} ${sit - s * 8} L ${px + s * 8} ${Yh(V.falsoPav)}`, { stroke: C.dim, sw: 1.6 });
  sh.text(X(V.T) + 16, sit - s * 30, 'seduta sul piano, gambe nel pozzetto:', { size: 9, fill: C.dimText });
  sh.text(X(V.T) + 16, sit - s * 30 + 13, 'postura da sedia vera (38 cm seduta-piedi)', { size: 9, fill: C.dimText });

  for (const x of [2, V.T - 2]) sh.line(X(x), Yh(a.h + 2), X(x), Yh(V.H - 2), { stroke: C.acc2, sw: 3 });
  sh.text(X(V.T) + 16, Yh(72), 'ARMAFLEX 19 mm su tutte le lamiere', { size: 9, fill: C.acc2 });

  const hOpen = V.H + V.popUp;
  sh.rect(X(-4), Yh(hOpen + 12), s * (V.T + 8), s * 12, { stroke: C.body, sw: 2, fill: '#141c25' });
  sh.path(`M ${X(0)} ${Yh(V.H)} L ${X(-4)} ${Yh(hOpen)}`, { stroke: C.body, sw: 1.4, dash: '5 3' });
  sh.path(`M ${X(V.T)} ${Yh(V.H)} L ${X(V.T + 4)} ${Yh(hOpen)}`, { stroke: C.body, sw: 1.4, dash: '5 3' });
  // qui il letto è ripiegato verso il portellone: se ne disegna solo l'ingombro notte
  sh.rect(X(0), Yh(V.H + 14), s * V.T, s * 14, { stroke: C.acc2, sw: 1.2, dash: '7 4' });
  sh.text(X(V.T / 2), Yh(V.H + 7) + 4, 'ingombro letto (largh. 130) — solo di notte', { size: 9, fill: C.acc2, anchor: 'middle' });
  sh.text(X(V.T / 2), Yh(hOpen + 12) - 8, 'GUSCIO SOLLEVATO +95', { size: 9.5, fill: C.dimText, anchor: 'middle' });
  sh.text(X(V.T) + 16, Yh(V.H + 34), 'di giorno il letto è ripiegato sulla metà posteriore:', { size: 9, fill: C.dimText });
  sh.text(X(V.T) + 16, Yh(V.H + 34) + 13, 'sopra la postazione restano 135 cm liberi', { size: 9, fill: C.dimText });
  sh.text(X(V.T) + 16, Yh(V.H + 34) + 26, 'col soffietto chiuso ce ne sarebbero 40: si usa a tetto aperto', { size: 9, fill: C.dimText });

  const yd = Yh(0) + 44;
  sh.dimH(X(0), X(13), yd, '13', { ext: Yh(0) });
  sh.dimH(X(13), X(45), yd, '32', { ext: Yh(0) });
  sh.dimH(X(45), X(115), yd, '70  (pozzetto)', { ext: Yh(0) });
  sh.dimH(X(115), X(V.T), yd, '15', { ext: Yh(0) });
  sh.dimH(X(0), X(V.T), yd + 30, '130');

  const xd = X(0) - 30;
  sh.dimV(Yh(V.falsoPav), Yh(V.piano), xd, '38', { ext: X(0) });
  sh.dimV(Yh(V.piano), Yh(sc.h), xd, '26', { ext: X(45) });
  sh.dimV(Yh(0), Yh(hOpen), xd - 32, '185');

  sh.scaleBar(M.x, sh.h - 40);
  sh.cartiglio();
  return sh.render();
}

// ==================================================== TAV. 4 — CUCINA (pianta)

function tavolaCucina() {
  const s = 5.2, M = { x: 116, y: 104 };
  const cu = V.cucina;
  const W = cu.t1 - cu.t0, D = cu.l1 - cu.l0;
  const sh = new Sheet({
    w: M.x + s * W + 560, h: M.y + s * (D + cu.corsa) + 130, scale: s,
    title: 'TAV. 4 — CUCINA ESTRAIBILE',
    subtitle: 'blocco estratto — guide 120 cm, portata 120 kg'
  });
  const X = (t) => M.x + s * t;
  const Y = (d) => M.y + s * d;

  sh.rect(X(0), Y(0), s * W, s * D, { stroke: C.acc, sw: 2.2, fill: C.fillZone });

  // fornello
  sh.rect(X(3), Y(6), s * 44, s * 32, { stroke: C.mod, sw: 1.6, fill: C.fillMod });
  sh.text(X(25), Y(4) - 7, 'FORNELLO 2 FUOCHI 44 × 32', { size: 9.5, fill: C.text, anchor: 'middle' });
  for (const [cx, r] of [[15, 9], [36, 6.5]]) {
    sh.circle(X(cx), Y(22), s * r, { stroke: C.acc, sw: 1.6 });
    sh.circle(X(cx), Y(22), s * r * 0.45, { stroke: C.acc, sw: 1 });
  }

  // lavello
  sh.rect(X(50), Y(6), s * 32, s * 32, { stroke: C.mod, sw: 1.6, fill: C.fillMod });
  sh.rect(X(53), Y(9), s * 26, s * 21, { stroke: C.acc2, sw: 1.4, rx: 5 });
  sh.circle(X(66), Y(35), s * 2.4, { stroke: C.acc2, sw: 1.4 });
  sh.text(X(66), Y(4) - 7, 'LAVELLO 32 × 32', { size: 9.5, fill: C.text, anchor: 'middle' });
  sh.text(X(66), Y(20) + 4, 'rubinetto', { size: 8.5, fill: C.acc2, anchor: 'middle' });
  sh.text(X(66), Y(20) + 15, 'a scomparsa', { size: 8.5, fill: C.acc2, anchor: 'middle' });

  // piano di lavoro / prolunga ribaltabile
  sh.rect(X(3), Y(42), s * 79, s * 14, { stroke: C.mod, sw: 1.4, fill: C.fillMod });
  sh.text(X(56), Y(50) + 4, 'PIANO DI LAVORO · prolunga ribaltabile +25', { size: 9.5, fill: C.dimText, anchor: 'middle' });

  // guide e battuta
  for (const t of [1.5, W - 1.5]) sh.line(X(t), Y(2), X(t), Y(D + cu.corsa - 2), { stroke: C.acc2, sw: 2.6 });
  sh.rect(X(0), Y(D), s * W, s * cu.corsa, { stroke: C.body, sw: 1, dash: '6 4', fill: '#101820' });
  sh.text(X(W / 2), Y(D + cu.corsa / 2), 'SEDE A RIPOSO (sotto il piano +50)', { size: 9.5, fill: C.dimText, anchor: 'middle' });
  sh.line(X(-12), Y(D), X(W + 12), Y(D), { stroke: C.acc, sw: 2.5 });

  // richiami: tutto ciò che serve perché funzioni davvero
  const R = X(W) + 8;
  const co = (yc, dy, txt, col) => sh.callout(X(W - 2), Y(yc), R + 26, Y(dy), txt, { stroke: col, fill: col });
  co(10, 2, 'fermo di fine corsa + blocco in chiusura', C.acc);
  co(20, 10, 'gas: tubo su spirale, bombola 5 kg nel vano aerato', C.acc);
  co(30, 18, 'acqua: innesto rapido + tubo spiralato dalla pompa', C.acc2);
  co(38, 26, 'scarico: tanica grigie 20 L sotto il lavello, estraibile', C.acc2);
  co(46, 34, 'presa 12 V + USB-C PD + striscia LED sotto il piano', C.acc2);
  co(54, 42, 'tagliere che copre il lavello · barra magnetica coltelli', C.dimText);
  sh.text(R + 26, Y(52), 'ergonomia: piano a 98 cm da terra', { size: 9.5, fill: C.acc, weight: 600 });
  sh.text(R + 26, Y(58), 'coperto dal tendalino posteriore 2 × 2,5 m', { size: 9.5, fill: C.dimText });

  // bombola e tanica (sotto, tratteggiati)
  sh.circle(X(16), Y(48), s * 13, { stroke: C.dim, sw: 1, dash: '4 4' });
  sh.callout(X(16), Y(48), X(-34), Y(66), 'bombola 5 kg nel vano aerato a pavimento', { anchor: 'start' });

  const yd = Y(0) - 46;
  sh.dimH(X(3), X(47), yd, '44', { ext: Y(0) });
  sh.dimH(X(50), X(82), yd, '32', { ext: Y(0) });
  sh.dimH(X(0), X(W), yd - 28, '85  (largh. blocco)');
  const xd = X(0) - 30;
  sh.dimV(Y(0), Y(D), xd, '60  (prof.)', { ext: X(0) });
  sh.dimV(Y(D), Y(D + cu.corsa), xd, '60  (corsa)', { ext: X(0) });

  sh.scaleBar(M.x, sh.h - 40, 50);
  sh.cartiglio();
  return sh.render();
}

// ============================================ TAV. 5 — VISTA POSTERIORE IN USO

function tavolaRetro() {
  const s = 2.9, M = { x: 150, y: 74 }, HMAX = 300;
  const sh = new Sheet({
    w: M.x + s * 300 + 210, h: M.y + s * HMAX + 120, scale: s,
    title: 'TAV. 5 — VISTA POSTERIORE',
    subtitle: 'quote da terra — portellone aperto, tendalino esteso'
  });
  const X = (t) => M.x + s * (t + 40);      // 0 = fiancata sx del vano
  const Yg = (h) => M.y + s * (HMAX - h);   // altezza da terra

  const larghezza = 179, sbalzo = (larghezza - V.T) / 2;

  // terreno
  sh.line(X(-40), Yg(0), X(260), Yg(0), { stroke: C.dim, sw: 2.2 });

  // sagoma posteriore del veicolo
  sh.rect(X(-sbalzo), Yg(V.pavTerra + V.H + 10), s * larghezza, s * (V.pavTerra + V.H + 10 - 32), { stroke: C.body, sw: 2.2, fill: C.fillZone });
  sh.line(X(-sbalzo), Yg(V.pavTerra), X(larghezza - sbalzo), Yg(V.pavTerra), { stroke: C.body, sw: 1.8 });
  sh.text(X(V.T / 2), Yg(V.pavTerra) - 8, 'PAVIMENTO DEL VANO', { size: 9, fill: C.dimText, anchor: 'middle' });
  // ruote
  for (const cx of [-sbalzo + 22, larghezza - sbalzo - 22]) sh.circle(X(cx), Yg(38), s * 38, { stroke: C.body, sw: 2 });

  // portellone a battente aperto (di taglio, con ruota di scorta)
  sh.rect(X(larghezza - sbalzo + 6), Yg(V.pavTerra + V.H + 4), s * 10, s * (V.H + 4 - 8), { stroke: C.body, sw: 1.6, fill: '#101820' });
  sh.text(X(larghezza - sbalzo + 26), Yg(120), 'PORTELLONE APERTO 180°', { size: 9, fill: C.dimText, rotate: -90, anchor: 'middle' });
  sh.circle(X(larghezza - sbalzo + 11), Yg(112), s * 33, { stroke: C.body, sw: 1.4, dash: '5 3' });
  sh.text(X(larghezza - sbalzo + 11), Yg(112) + 4, 'scorta', { size: 8, fill: C.dimText, anchor: 'middle' });

  // blocco cucina estratto (visto di testa) — piano a 98 da terra
  const topCucina = V.pavTerra + V.cucina.h;
  sh.rect(X(V.cucina.t0), Yg(topCucina), s * 85, s * V.cucina.h, { stroke: C.acc, sw: 2.4, fill: '#1d1809' });
  sh.line(X(V.cucina.t0), Yg(topCucina), X(V.cucina.t1), Yg(topCucina), { stroke: C.acc, sw: 3 });
  sh.text(X(V.cucina.t0 + 42), Yg(topCucina - 10) + 4, 'CUCINA ESTRATTA 85 cm', { size: 10, fill: C.acc, anchor: 'middle', weight: 600 });
  // fornello e lavello visti di testa
  sh.rect(X(48), Yg(topCucina + 9), s * 44, s * 9, { stroke: C.acc, sw: 1.4, fill: '#241c08' });
  sh.text(X(70), Yg(topCucina + 9) - 6, 'fornello', { size: 8.5, fill: C.acc, anchor: 'middle' });
  sh.rect(X(96), Yg(topCucina + 2), s * 30, s * 2, { stroke: C.acc2, sw: 1.4 });
  sh.text(X(111), Yg(topCucina + 4) - 6, 'lavello', { size: 8.5, fill: C.acc2, anchor: 'middle' });

  // frigo estratto sul lato sinistro
  sh.rect(X(0), Yg(V.pavTerra + V.frigo.h), s * 45, s * V.frigo.h, { stroke: C.acc2, sw: 1.8, fill: '#0f1c1e' });
  sh.text(X(22), Yg(V.pavTerra + 24) + 4, 'FRIGO', { size: 9.5, fill: C.acc2, anchor: 'middle' });

  // tendalino posteriore
  sh.line(X(-sbalzo - 20), Yg(V.pavTerra + V.H + 26), X(larghezza - sbalzo + 60), Yg(V.pavTerra + V.H + 20), { stroke: C.acc2, sw: 2.4 });
  sh.text(X(V.T / 2), Yg(V.pavTerra + V.H + 26) - 8, 'TENDALINO POSTERIORE 2 × 2,5 m', { size: 9.5, fill: C.acc2, anchor: 'middle' });

  // soffietto aperto
  const hOpen = V.pavTerra + V.H + V.popUp;
  sh.rect(X(-sbalzo - 2), Yg(hOpen + 12), s * (larghezza + 4), s * 12, { stroke: C.body, sw: 2, fill: '#141c25' });
  sh.path(`M ${X(-sbalzo)} ${Yg(V.pavTerra + V.H)} L ${X(-sbalzo - 2)} ${Yg(hOpen)}`, { stroke: C.body, sw: 1.4, dash: '5 3' });
  sh.path(`M ${X(larghezza - sbalzo)} ${Yg(V.pavTerra + V.H)} L ${X(larghezza - sbalzo + 2)} ${Yg(hOpen)}`, { stroke: C.body, sw: 1.4, dash: '5 3' });
  sh.text(X(V.T / 2), Yg(hOpen + 12) - 8, 'GUSCIO APERTO — ingombro totale 2,73 m', { size: 9.5, fill: C.dimText, anchor: 'middle' });

  // persona che cucina
  sh.omino(X(V.T + 96), Yg(0), 175);
  sh.text(X(V.T + 112), Yg(150), '175 cm', { size: 9, fill: C.dim });

  // quote da terra
  const xd = X(-40) - 24;
  sh.dimV(Yg(0), Yg(V.pavTerra), xd, '78  (pavimento)', { ext: X(-sbalzo) });
  sh.dimV(Yg(0), Yg(topCucina), xd - 32, '98  (piano cucina)', { ext: X(V.cucina.t0) });
  sh.dimV(Yg(0), Yg(V.pavTerra + V.H + 10), xd - 64, '189  (tetto chiuso)', { ext: X(-sbalzo) });
  sh.dimV(Yg(0), Yg(hOpen + 12), xd - 96, '273  (tetto aperto)', { ext: X(-sbalzo) });
  sh.dimH(X(0), X(V.T), Yg(0) + 40, '130  (interno)', { ext: Yg(0) });
  sh.dimH(X(-sbalzo), X(larghezza - sbalzo), Yg(0) + 70, '179  (largh. veicolo)');

  sh.text(X(-36), Yg(214), 'piano a 98 cm da terra: altezza di lavoro giusta', { size: 9.5, fill: C.acc });
  sh.text(X(-36), Yg(214) - 13, 'per una persona di 175-185 cm', { size: 9.5, fill: C.dimText });
  sh.text(X(-36), Yg(214) - 26, 'il blocco è estratto verso l’osservatore', { size: 9.5, fill: C.dimText });
  sh.callout(X(V.cucina.t0 + 10), Yg(V.pavTerra + 6), X(-36), Yg(150),
    'attacchi a sgancio rapido: gas · acqua · 12 V', { stroke: C.acc2, fill: C.acc2 });
  sh.text(X(-30), Yg(150) - 13, 'tanica grigie 20 L estraibile sotto il lavello', { size: 9, fill: C.dimText });

  sh.scaleBar(M.x, sh.h - 40);
  sh.cartiglio();
  return sh.render();
}

// ---------------------------------------------------------------- output

const tavole = [
  ['tav-1-pianta.svg', 'Tav. 1 — Pianta dell’allestimento', tavolaPianta()],
  ['tav-2-sezione-aa.svg', 'Tav. 2 — Sezione longitudinale A-A (cucina estratta, scrivania, letto)', tavolaSezioneAA()],
  ['tav-3-sezione-bb.svg', 'Tav. 3 — Sezione trasversale B-B (pozzetto piedi e postazione PC)', tavolaSezioneBB()],
  ['tav-4-cucina.svg', 'Tav. 4 — Cucina estraibile, pianta di dettaglio', tavolaCucina()],
  ['tav-5-retro.svg', 'Tav. 5 — Vista posteriore con cucina in uso', tavolaRetro()],
];

for (const [file, , svgText] of tavole) writeFileSync(join(OUT, file), svgText);

const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cyber Cruiser — disegni tecnici degli interni</title>
<style>
  body { margin:0; background:#0a0e12; color:#e6edf3; font-family:"DejaVu Sans Mono",monospace; }
  .wrap { max-width:1500px; margin:0 auto; padding:28px 20px 60px; }
  h1 { font-size:20px; letter-spacing:3px; margin:0 0 4px; }
  h1 span { color:#ffb020; }
  p.sub { color:#8494a3; font-size:13px; margin:0 0 28px; line-height:1.6; }
  figure { margin:0 0 34px; border:1px solid #24303c; border-radius:10px; background:#121820; padding:14px; overflow-x:auto; }
  figcaption { color:#8494a3; font-size:12px; letter-spacing:1.6px; margin-bottom:10px; text-transform:uppercase; }
  img { width:100%; min-width:760px; height:auto; display:block; }
</style></head><body><div class="wrap">
<h1>CYBER<span>CRUISER</span> — DISEGNI TECNICI INTERNI</h1>
<p class="sub">Land Cruiser KDJ120 passo lungo · quote in cm · rev. B<br>
Pavimento del vano a 78 cm da terra: è la quota che comanda l’ergonomia di tutto il progetto.</p>
${tavole.map(([f, t]) => `<figure><figcaption>${t}</figcaption><img src="${f}" alt="${t}"></figure>`).join('\n')}
</div></body></html>`;

writeFileSync(join(OUT, 'index.html'), html);
console.log('generate:', tavole.map(([f]) => f).join(', '), '+ index.html');
