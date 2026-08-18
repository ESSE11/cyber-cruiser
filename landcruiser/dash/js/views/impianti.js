// Schermata IMPIANTI — pensata per il secondo schermo (7", montante centrale).
// Risponde a tre domande, senza dover toccare niente:
//   quanta corrente entra ed esce ora, quanto ho nei serbatoi, come sta l'acqua.

import { state, history } from '../store.js';
import { el, svg, card, Bar, Stat, Toggle, Spark, Gauge } from '../ui/widgets.js';

/** Schema del flusso di energia: sorgenti -> batteria -> utenze. */
class Flusso {
  constructor() {
    this.root = svg('svg', { class: 'flow', viewBox: '0 0 340 190' });
    this.nodi = {};
    this.rami = {};

    const nodo = (id, x, y, w, h, testo, cls) => {
      const g = svg('g', { class: 'fnode ' + cls, transform: `translate(${x} ${y})` });
      g.appendChild(svg('rect', { x: 0, y: 0, width: w, height: h, rx: 6 }));
      const t = svg('text', { x: w / 2, y: 16, class: 'fk' });
      t.textContent = testo;
      const v = svg('text', { x: w / 2, y: 36, class: 'fv' });
      v.textContent = '--';
      g.append(t, v);
      this.root.appendChild(g);
      this.nodi[id] = v;
    };

    const ramo = (id, d) => {
      const p = svg('path', { class: 'fpath', d, fill: 'none' });
      const f = svg('path', { class: 'fflow', d, fill: 'none' });
      this.root.append(p, f);
      this.rami[id] = f;
    };

    // i rami vanno disegnati prima dei nodi per passarci sotto
    ramo('solare', 'M 78 40 L 140 40 L 140 82');
    ramo('alternatore', 'M 78 150 L 140 150 L 140 108');
    ramo('utenze', 'M 208 95 L 262 95');

    nodo('solare', 10, 20, 68, 44, 'SOLARE', 'src');
    nodo('alternatore', 10, 130, 68, 44, 'ALTERNAT.', 'src');
    nodo('batteria', 130, 70, 78, 50, 'BATTERIA', 'batt');
    nodo('utenze', 262, 70, 68, 50, 'UTENZE', 'load');
  }

  /** @param {number} v valore in W @param {number} scala W che saturano l'animazione */
  ramo(id, v, scala = 400) {
    const f = this.rami[id];
    const attivo = Math.abs(v) > 3;
    f.classList.toggle('on', attivo);
    // più corrente passa, più veloce scorre il tratteggio
    f.style.animationDuration = attivo ? `${Math.max(0.25, 1.6 - Math.abs(v) / scala)}s` : '0s';
  }

  set(p) {
    this.nodi.solare.textContent = Math.round(p.solarW) + ' W';
    this.nodi.alternatore.textContent = Math.round(p.alternatorW) + ' W';
    this.nodi.batteria.textContent = `${(p.battA >= 0 ? '+' : '')}${p.battA.toFixed(1)} A`;
    this.nodi.utenze.textContent = Math.round(p.consumptionW) + ' W';
    this.ramo('solare', p.solarW);
    this.ramo('alternatore', p.alternatorW);
    this.ramo('utenze', p.consumptionW, 200);
    this.root.classList.toggle('carica', p.battA > 0.5);
  }
}

export default {
  id: 'impianti',
  label: 'IMPIANTI',
  icon: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',

  build(ctx) {
    const root = el('div', 'view view-grid-2');

    // --- energia ------------------------------------------------------------
    const flusso = new Flusso();
    const bSoc = new Bar('STATO DI CARICA');
    const sIn = new Stat('IN', 'W');
    const sOut = new Stat('OUT', 'W');
    const sNet = new Stat('BILANCIO', 'W');
    const sAut = new Stat('AUTONOMIA', 'h');
    const gE = el('div', 'stats cols-4');
    [sIn, sOut, sNet, sAut].forEach((s) => gE.appendChild(s.root));
    const cEnergia = card('ENERGIA  ·  ORA', flusso.root, bSoc.root, gE);

    // --- giornata -----------------------------------------------------------
    const sSol = new Stat('SOLARE OGGI', 'Wh');
    const sAlt = new Stat('ALTERNAT. OGGI', 'Wh');
    const sLoad = new Stat('CONSUMO OGGI', 'Wh');
    const sRend = new Stat('RESA SOLARE', '%');
    const gG = el('div', 'stats cols-4');
    [sSol, sAlt, sLoad, sRend].forEach((s) => gG.appendChild(s.root));
    const sparkA = new Spark({});
    const boxA = el('div', 'gauge-wrap h-sm');
    boxA.appendChild(sparkA.root);
    const cGiorno = card('GIORNATA  ·  CORRENTE DI BATTERIA (A)', gG, boxA);

    // --- serbatoi -----------------------------------------------------------
    const bFresh = new Bar('ACQUA PULITA');
    const bGrey = new Bar('ACQUE GRIGIE');
    const bGas = new Bar('GAS');
    const sDocce = new Stat('DOCCE RESIDUE', '');
    const sErog = new Stat('EROGATI', 'L');
    const gS = el('div', 'stats cols-2');
    [sDocce, sErog].forEach((s) => gS.appendChild(s.root));
    const cSerb = card('SERBATOI', bFresh.root, bGrey.root, bGas.root, gS);

    // --- acqua --------------------------------------------------------------
    const gPress = new Gauge({ label: 'PRESSIONE', unit: 'bar', min: 0, max: 4, decimals: 1, warn: 3.2, alarm: 3.7 });
    const wrap = el('div', 'gauge-wrap h-fix');
    wrap.appendChild(gPress.root);
    const sFlow = new Stat('PORTATA', 'L/min');
    const sBoiler = new Stat('BOILER', '°C');
    const sDuty = new Stat('POMPA/ORA', '%');
    const gW = el('div', 'stats cols-3');
    [sFlow, sBoiler, sDuty].forEach((s) => gW.appendChild(s.root));

    const send = (target, value) => ctx.command(target, value);
    const tPump = new Toggle('POMPA', () => send('camper.pump', !state.camper.pump));
    const tBoiler = new Toggle('BOILER', () => send('water.boilerOn', !state.water.boilerOn));
    const tShower = new Toggle('DOCCIA ESTERNA', () => send('water.showerExt', !state.water.showerExt));
    const tg = el('div', 'toggles');
    [tPump, tBoiler, tShower].forEach((t) => tg.appendChild(t.root));

    const cAcqua = card('ACQUA', wrap, gW, tg);

    root.append(cEnergia, cSerb, cGiorno, cAcqua);

    return {
      root,
      update(s) {
        const p = s.power, w = s.water, c = s.camper, set = s.settings;

        flusso.set(p);
        bSoc.set(p.soc, `${Math.round(p.soc * 100)}%  ·  ${(p.soc * set.battAh).toFixed(0)} Ah`,
          p.soc < 0.15 ? 'alarm' : p.soc < 0.3 ? 'warn' : '');

        const inW = p.solarW + p.alternatorW;
        const net = inW - p.consumptionW;
        sIn.set(Math.round(inW), inW > 5 ? 'ok' : '');
        sOut.set(Math.round(p.consumptionW));
        sNet.set((net >= 0 ? '+' : '') + Math.round(net), net >= 0 ? 'ok' : net < -60 ? 'warn' : '');
        sAut.set(p.toEmptyH > 90 ? '∞' : p.toEmptyH.toFixed(1), p.toEmptyH < 8 ? 'warn' : '');

        sSol.set(Math.round(p.solarWh));
        sAlt.set(Math.round(p.altWh));
        sLoad.set(Math.round(p.loadWh));
        // resa: quanto ha reso il tetto rispetto alla sua potenza di picco
        sRend.set(Math.round((p.solarW / Math.max(1, set.solarWp)) * 100));
        sparkA.set(history.battA);

        const litriPuliti = c.waterFresh * set.tankFreshL;
        bFresh.set(c.waterFresh, `${Math.round(litriPuliti)} L`,
          c.waterFresh < 0.1 ? 'alarm' : c.waterFresh < 0.25 ? 'warn' : '');
        bGrey.set(c.waterGrey, `${Math.round(c.waterGrey * set.tankGreyL)} L`,
          c.waterGrey > 0.9 ? 'alarm' : c.waterGrey > 0.75 ? 'warn' : '');
        bGas.set(c.gasKg / 5, `${c.gasKg.toFixed(1)} kg`, c.gasKg < 0.6 ? 'warn' : '');
        // il vincolo vero non è il pulito ma il grigio: si riempie prima
        const docce = Math.min(
          litriPuliti / set.showerLitersWarn,
          ((1 - c.waterGrey) * set.tankGreyL) / set.showerLitersWarn
        );
        sDocce.set(docce.toFixed(1), docce < 1 ? 'warn' : '');
        sErog.set(w.litersOut.toFixed(1));

        gPress.set(w.pressureBar);
        sFlow.set(w.flowLpm.toFixed(1), w.flowLpm > 0.2 ? 'ok' : '');
        sBoiler.set(w.boilerTemp.toFixed(0),
          w.boilerTemp >= set.boilerTarget - 5 ? 'ok' : w.boilerOn ? 'warn' : '');
        sDuty.set(Math.round(w.pumpDuty * 100), w.leak ? 'alarm' : '');

        tPump.set(c.pump);
        tBoiler.set(w.boilerOn);
        tShower.set(w.showerExt);
      }
    };
  }
};
