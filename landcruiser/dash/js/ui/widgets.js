// Widget riutilizzabili. Ogni widget costruisce il DOM una volta sola in
// costruzione e poi aggiorna solo i valori: niente re-render, niente sfarfallio
// sotto le dita e consumo CPU basso sul Raspberry.

const SVGNS = 'http://www.w3.org/2000/svg';

export function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export function svg(tag, attrs = {}) {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

export function card(title, ...children) {
  const c = el('div', 'card');
  if (title) c.appendChild(el('h2', null, title));
  children.forEach((ch) => ch && c.appendChild(ch));
  return c;
}

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/** Quadrante ad arco 270°, con valore grande al centro. */
export class Gauge {
  constructor({ label, unit, min = 0, max = 100, decimals = 0, warn = null, alarm = null }) {
    Object.assign(this, { label, unit, min, max, decimals, warn, alarm });

    const S = 240, cx = 120, cy = 120, r = 96;
    const [x0, y0] = polar(cx, cy, r, 135);
    const [x1, y1] = polar(cx, cy, r, 405);
    const d = `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 1 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;

    this.root = svg('svg', { class: 'gauge', viewBox: `0 0 ${S} ${S}`, width: '100%' });
    this.root.appendChild(svg('path', { class: 'track', d, fill: 'none', 'stroke-width': 14, 'stroke-linecap': 'round' }));
    this.arc = svg('path', { class: 'fill', d, fill: 'none', 'stroke-width': 14, 'stroke-linecap': 'round' });
    this.root.appendChild(this.arc);

    this.valText = svg('text', { class: 'val', x: cx, y: cy + 8 });
    this.unitText = svg('text', { class: 'unit', x: cx, y: cy + 34 });
    this.unitText.textContent = unit || '';
    this.lblText = svg('text', { class: 'lbl', x: cx, y: cy + 72 });
    this.lblText.textContent = label || '';
    this.root.append(this.valText, this.unitText, this.lblText);

    // La lunghezza dell'arco serve per il riempimento; getTotalLength richiede
    // che il nodo sia nel documento, quindi la calcoliamo al primo aggiornamento.
    this.len = null;
    this.set(min);
  }

  set(v) {
    if (this.len == null && this.arc.getTotalLength) {
      const l = this.arc.getTotalLength();
      if (l > 0) {
        this.len = l;
        this.arc.setAttribute('stroke-dasharray', l);
      }
    }
    const f = Math.max(0, Math.min(1, (v - this.min) / (this.max - this.min)));
    if (this.len != null) this.arc.setAttribute('stroke-dashoffset', this.len * (1 - f));
    this.valText.textContent = Number.isFinite(v) ? v.toFixed(this.decimals) : '--';

    this.root.classList.toggle('alarm', this.alarm != null && v >= this.alarm);
    this.root.classList.toggle('warn', this.warn != null && v >= this.warn && !(this.alarm != null && v >= this.alarm));
  }
}

/** Riga statistica compatta: etichetta piccola + valore grande. */
export class Stat {
  constructor(key, unit = '') {
    this.root = el('div', 'stat');
    this.root.appendChild(el('div', 'k', key));
    this.v = el('div', 'v');
    this.num = document.createTextNode('--');
    this.v.appendChild(this.num);
    if (unit) this.v.appendChild(el('small', null, unit));
    this.root.appendChild(this.v);
  }

  set(v, level = '') {
    this.num.nodeValue = v;
    this.root.className = 'stat' + (level ? ' ' + level : '');
  }
}

/** Barra di livello orizzontale (serbatoi, batteria, gas). */
export class Bar {
  constructor(key) {
    this.root = el('div', 'bar');
    const top = el('div', 'top');
    top.appendChild(el('div', 'k', key));
    this.vLabel = el('div', 'v', '--');
    top.appendChild(this.vLabel);
    const track = el('div', 'track');
    this.fill = el('div', 'fill');
    track.appendChild(this.fill);
    this.root.append(top, track);
  }

  /** @param {number} frac 0..1 @param {string} label testo a destra */
  set(frac, label, level = '') {
    const f = Math.max(0, Math.min(1, frac));
    this.fill.style.width = (f * 100).toFixed(1) + '%';
    this.vLabel.textContent = label;
    this.root.className = 'bar' + (level ? ' ' + level : '');
  }
}

/** Interruttore touch per le utenze camper. */
export class Toggle {
  constructor(label, onClick) {
    this.root = el('button', 'toggle');
    this.root.appendChild(el('span', null, label));
    this.root.appendChild(el('span', 'dot'));
    this.root.addEventListener('click', onClick);
  }

  set(on) { this.root.classList.toggle('on', !!on); }
}

/** Inclinometro: orizzonte artificiale + sagoma del mezzo vista da dietro. */
export class Tilt {
  constructor() {
    this.root = svg('svg', { class: 'tilt-svg', viewBox: '0 0 240 200' });

    const clip = svg('clipPath', { id: 'tiltclip' });
    clip.appendChild(svg('circle', { cx: 120, cy: 100, r: 78 }));
    this.root.appendChild(clip);

    this.horizon = svg('g', { 'clip-path': 'url(#tiltclip)' });
    this.horizon.appendChild(svg('rect', { class: 'horizon-sky', x: -100, y: -200, width: 440, height: 400 }));
    this.earth = svg('rect', { class: 'horizon-earth', x: -100, y: 100, width: 440, height: 300 });
    this.horizon.appendChild(this.earth);
    this.root.appendChild(this.horizon);

    this.root.appendChild(svg('circle', { class: 'ring', cx: 120, cy: 100, r: 78 }));

    // tacche ogni 15° sull'anello
    for (let a = 0; a < 360; a += 15) {
      const rad = (a * Math.PI) / 180;
      const inner = a % 45 === 0 ? 66 : 72;
      this.root.appendChild(svg('line', {
        class: 'ticks',
        x1: 120 + inner * Math.cos(rad), y1: 100 + inner * Math.sin(rad),
        x2: 120 + 78 * Math.cos(rad), y2: 100 + 78 * Math.sin(rad)
      }));
    }

    // sagoma del veicolo vista da dietro, ruota con il rollio
    this.car = svg('path', {
      class: 'car',
      d: 'M -46 12 L -46 -10 L -34 -26 L 34 -26 L 46 -10 L 46 12 L 30 12 ' +
         'A 10 10 0 0 0 10 12 L -10 12 A 10 10 0 0 0 -30 12 Z'
    });
    this.carG = svg('g', { transform: 'translate(120 100)' });
    this.carG.appendChild(this.car);
    this.root.appendChild(this.carG);
  }

  set(pitch, roll) {
    // l'orizzonte si inclina all'opposto del mezzo e trasla col beccheggio
    this.horizon.setAttribute('transform', `rotate(${(-roll).toFixed(1)} 120 100) translate(0 ${(pitch * 2).toFixed(1)})`);
    this.carG.setAttribute('transform', `translate(120 100) rotate(${roll.toFixed(1)})`);
  }
}

/** Grafico a linea su serie storica (batteria, solare, ...). */
export class Spark {
  constructor({ min = null, max = null, unit = '' } = {}) {
    this.opts = { min, max, unit };
    this.root = svg('svg', { class: 'spark', viewBox: '0 0 300 100', preserveAspectRatio: 'none' });
    this.area = svg('path', { class: 'area' });
    this.line = svg('path');
    this.root.append(this.area, this.line);
  }

  set(series) {
    if (!series || series.length < 2) return;
    const data = series.length > 300 ? series.slice(-300) : series;
    const lo = this.opts.min != null ? this.opts.min : Math.min(...data);
    const hiRaw = this.opts.max != null ? this.opts.max : Math.max(...data);
    const hi = hiRaw - lo < 1e-6 ? lo + 1 : hiRaw;

    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * 300;
      const y = 100 - ((v - lo) / (hi - lo)) * 96 - 2;
      return `${x.toFixed(1)} ${Math.max(0, Math.min(100, y)).toFixed(1)}`;
    });
    const d = 'M ' + pts.join(' L ');
    this.line.setAttribute('d', d);
    this.area.setAttribute('d', `${d} L 300 100 L 0 100 Z`);
  }
}

/** Bussola numerica + punto cardinale. */
export function cardinal(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

export function hhmm(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
