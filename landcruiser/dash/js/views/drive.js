// Schermata GUIDA: quello che serve mentre si viaggia.

import { el, card, Gauge, Stat, cardinal } from '../ui/widgets.js';

export default {
  id: 'drive',
  label: 'GUIDA',
  icon: '<circle cx="12" cy="12" r="9"/><path d="M12 12l4.5-3.5"/><path d="M12 3v2M21 12h-2M3 12h2"/>',

  build() {
    const root = el('div', 'view view-drive');

    const speed = new Gauge({ label: 'VELOCITÀ', unit: 'km/h', min: 0, max: 160 });
    const speedWrap = el('div', 'gauge-wrap');
    speedWrap.appendChild(speed.root);
    const cSpeed = card(null, speedWrap);

    const rpm = new Gauge({ label: 'GIRI MOTORE', unit: 'rpm ×100', min: 0, max: 45, decimals: 0, warn: 34, alarm: 40 });
    const rpmWrap = el('div', 'gauge-wrap');
    rpmWrap.appendChild(rpm.root);

    const sGear = new Stat('MARCIA');
    const sHead = new Stat('DIREZIONE');
    const sAlt = new Stat('QUOTA', 'm');
    const sFuel = new Stat('GASOLIO', '%');
    const grid = el('div', 'stats');
    [sGear, sHead, sAlt, sFuel].forEach((s) => grid.appendChild(s.root));
    const cEngine = card(null, rpmWrap, grid);

    const sCool = new Stat('REFRIGERANTE', '°C');
    const sOil = new Stat('OLIO', '°C');
    const sEgt = new Stat('GAS SCARICO', '°C');
    const sBoost = new Stat('SOVRALIM.', 'bar');
    const sCons = new Stat('CONSUMO', 'L/100');
    const sRange = new Stat('AUTONOMIA', 'km');
    const grid2 = el('div', 'stats cols-3');
    [sCool, sOil, sEgt, sBoost, sCons, sRange].forEach((s) => grid2.appendChild(s.root));
    const cVitals = card('PARAMETRI MOTORE', grid2);
    cVitals.classList.add('span2');

    root.append(cSpeed, cEngine, cVitals);

    return {
      root,
      update(s) {
        const v = s.vehicle;
        speed.set(v.speed);
        rpm.set(v.rpm / 100);

        sGear.set(v.gear);
        sHead.set(`${Math.round(s.attitude.heading)}° ${cardinal(s.attitude.heading)}`);
        sAlt.set(Math.round(s.attitude.altitude));
        sFuel.set(Math.round(v.fuelLevel * 100), v.fuelLevel < 0.12 ? 'alarm' : v.fuelLevel < 0.25 ? 'warn' : '');

        sCool.set(Math.round(v.coolant), v.coolant > 104 ? 'alarm' : v.coolant > 98 ? 'warn' : '');
        sOil.set(Math.round(v.oilTemp), v.oilTemp > 125 ? 'alarm' : v.oilTemp > 115 ? 'warn' : '');
        sEgt.set(Math.round(v.egt), v.egt > 700 ? 'alarm' : v.egt > 620 ? 'warn' : '');
        sBoost.set(v.boost.toFixed(2));
        sCons.set(v.consumption > 0.1 ? v.consumption.toFixed(1) : '--');

        // autonomia stimata: 87 L di serbatoio sul passo lungo
        const cons = s.trip.avgConsumption > 1 ? s.trip.avgConsumption : 11.5;
        sRange.set(Math.round((v.fuelLevel * 87) / cons * 100));
      }
    };
  }
};
