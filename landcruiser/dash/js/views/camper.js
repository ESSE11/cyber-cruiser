// Schermata CAMPER: energia, serbatoi, temperature e comandi delle utenze.

import { state, history } from '../store.js';
import { el, card, Bar, Stat, Toggle, Spark } from '../ui/widgets.js';

export default {
  id: 'camper',
  label: 'CAMPER',
  icon: '<path d="M3 17V8a2 2 0 0 1 2-2h9l6 5v6"/><circle cx="8" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M3 17h3M10 18h5"/><path d="M6 9h5v4H6z"/>',

  build(ctx) {
    const root = el('div', 'view view-grid-2');

    // --- energia ---------------------------------------------------------
    const bSoc = new Bar('BATTERIA SERVIZI');
    const sV = new Stat('TENSIONE', 'V');
    const sA = new Stat('CORRENTE', 'A');
    const sSolar = new Stat('SOLARE', 'W');
    const sAlt = new Stat('ALTERNATORE', 'W');
    const sCons = new Stat('CONSUMO', 'W');
    const sAut = new Stat('AUTONOMIA', 'h');
    const g = el('div', 'stats cols-3');
    [sV, sA, sSolar, sAlt, sCons, sAut].forEach((s) => g.appendChild(s.root));
    const cPower = card('ENERGIA', bSoc.root, g);

    // --- serbatoi ---------------------------------------------------------
    const bFresh = new Bar('ACQUA PULITA');
    const bGrey = new Bar('ACQUE GRIGIE');
    const bGas = new Bar('GAS');
    const cTanks = card('SERBATOI', bFresh.root, bGrey.root, bGas.root);

    // --- comandi -----------------------------------------------------------
    const send = (target, value) => ctx.command(target, value);
    const tInt = new Toggle('LUCI INTERNE', () => send('camper.lights.interior', !state.camper.lights.interior));
    const tAwn = new Toggle('LUCI TENDALINO', () => send('camper.lights.awning', !state.camper.lights.awning));
    const tPump = new Toggle('POMPA ACQUA', () => send('camper.pump', !state.camper.pump));
    const tHeat = new Toggle('RISCALDATORE', () => send('camper.heater', !state.camper.heater));
    const tg = el('div', 'toggles');
    [tInt, tAwn, tPump, tHeat].forEach((t) => tg.appendChild(t.root));
    const cCmd = card('COMANDI', tg);

    // --- temperature + storico -------------------------------------------
    const sFridge = new Stat('FRIGO', '°C');
    const sIn = new Stat('INTERNO', '°C');
    const sOut = new Stat('ESTERNO', '°C');
    const gT = el('div', 'stats cols-3');
    [sFridge, sIn, sOut].forEach((s) => gT.appendChild(s.root));

    const spark = new Spark({ min: 0, max: 100 });
    const sparkBox = el('div', 'gauge-wrap h-sm');
    sparkBox.appendChild(spark.root);
    const cTemp = card('TEMPERATURE  ·  STORICO BATTERIA %', gT, sparkBox);

    root.append(cPower, cTanks, cCmd, cTemp);

    return {
      root,
      update(s) {
        const p = s.power, c = s.camper, set = s.settings;

        bSoc.set(p.soc, `${Math.round(p.soc * 100)}%  ·  ${(p.soc * set.battAh).toFixed(0)} Ah`,
          p.soc < 0.15 ? 'alarm' : p.soc < 0.3 ? 'warn' : '');
        sV.set(p.battV.toFixed(2));
        sA.set((p.battA >= 0 ? '+' : '') + p.battA.toFixed(1), p.battA >= 0 ? 'ok' : '');
        sSolar.set(Math.round(p.solarW));
        sAlt.set(Math.round(p.alternatorW));
        sCons.set(Math.round(p.consumptionW));
        sAut.set(p.toEmptyH > 90 ? '∞' : p.toEmptyH.toFixed(1), p.toEmptyH < 8 ? 'warn' : '');

        bFresh.set(c.waterFresh, `${Math.round(c.waterFresh * set.tankFreshL)} L`,
          c.waterFresh < 0.1 ? 'alarm' : c.waterFresh < 0.25 ? 'warn' : '');
        bGrey.set(c.waterGrey, `${Math.round(c.waterGrey * set.tankGreyL)} L`,
          c.waterGrey > 0.9 ? 'alarm' : c.waterGrey > 0.75 ? 'warn' : '');
        bGas.set(c.gasKg / 5, `${c.gasKg.toFixed(1)} kg`, c.gasKg < 0.6 ? 'warn' : '');

        tInt.set(c.lights.interior);
        tAwn.set(c.lights.awning);
        tPump.set(c.pump);
        tHeat.set(c.heater);

        sFridge.set(c.fridgeTemp.toFixed(1), c.fridgeTemp > 8 ? 'alarm' : c.fridgeTemp > 6 ? 'warn' : 'ok');
        sIn.set(c.insideTemp.toFixed(1));
        sOut.set(c.outsideTemp.toFixed(1));

        spark.set(history.soc);
      }
    };
  }
};
