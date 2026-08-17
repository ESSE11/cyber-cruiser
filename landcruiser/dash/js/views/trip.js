// Schermata VIAGGIO: bilancio della tratta e bilancio energetico.

import { history, resetTrip } from '../store.js';
import { el, card, Stat, Spark, hhmm } from '../ui/widgets.js';

export default {
  id: 'trip',
  label: 'VIAGGIO',
  icon: '<path d="M4 20s5-6 5-11a5 5 0 0 1 10 0"/><circle cx="9" cy="9" r="2"/><path d="M15 20h5v-5"/>',

  build() {
    const root = el('div', 'view view-grid-3');

    const sKm = new Stat('DISTANZA', 'km');
    const sTime = new Stat('IN MOVIMENTO');
    const sAvgSpeed = new Stat('MEDIA', 'km/h');
    const sMax = new Stat('VEL. MAX', 'km/h');
    const sCons = new Stat('CONSUMO MEDIO', 'L/100');
    const sFuelUsed = new Stat('GASOLIO USATO', 'L');
    const gTrip = el('div', 'stats cols-3');
    [sKm, sTime, sAvgSpeed, sMax, sCons, sFuelUsed].forEach((s) => gTrip.appendChild(s.root));
    const cTrip = card('TRATTA CORRENTE', gTrip);
    cTrip.classList.add('span2');

    const sOdo = new Stat('ODOMETRO', 'km');
    const sAscent = new Stat('DISLIVELLO +', 'm');
    const gOdo = el('div', 'stats');
    [sOdo, sAscent].forEach((s) => gOdo.appendChild(s.root));
    const resetBtn = el('button', 'btn accent', 'AZZERA TRATTA');
    resetBtn.addEventListener('click', () => {
      if (resetBtn.dataset.armed) { resetTrip(); delete resetBtn.dataset.armed; resetBtn.textContent = 'AZZERA TRATTA'; }
      else { resetBtn.dataset.armed = '1'; resetBtn.textContent = 'CONFERMA?'; setTimeout(() => { delete resetBtn.dataset.armed; resetBtn.textContent = 'AZZERA TRATTA'; }, 4000); }
    });
    const brow = el('div', 'btn-row');
    brow.appendChild(resetBtn);
    const cOdo = card('TOTALI', gOdo, brow);

    const sUsed = new Stat('CONSUMATO', 'kWh');
    const sSolar = new Stat('DA SOLARE', 'kWh');
    const sBal = new Stat('COPERTURA SOLARE', '%');
    const gEn = el('div', 'stats cols-3');
    [sUsed, sSolar, sBal].forEach((s) => gEn.appendChild(s.root));
    const sparkSolar = new Spark({ min: 0 });
    const box = el('div', 'gauge-wrap h-sm');
    box.appendChild(sparkSolar.root);
    const cEnergy = card('BILANCIO ENERGETICO  ·  RESA SOLARE (W)', gEn, box);
    cEnergy.classList.add('span2');
    cEnergy.style.gridColumn = 'span 3';

    root.append(cTrip, cOdo, cEnergy);

    return {
      root,
      update(s) {
        const t = s.trip;
        sKm.set(t.km.toFixed(1));
        sTime.set(hhmm(t.movingS));
        sAvgSpeed.set(t.movingS > 30 ? (t.km / (t.movingS / 3600)).toFixed(0) : '--');
        sMax.set(t.maxSpeed.toFixed(0));
        sCons.set(t.avgConsumption > 0.5 ? t.avgConsumption.toFixed(1) : '--');
        sFuelUsed.set(((t.avgConsumption * t.km) / 100).toFixed(1));

        sOdo.set(Math.round(s.vehicle.odo).toLocaleString('it-IT'));
        sAscent.set(Math.round(t.ascent));

        sUsed.set(t.kwhUsed.toFixed(2));
        sSolar.set(t.kwhSolar.toFixed(2));
        sBal.set(t.kwhUsed > 0.001 ? Math.min(999, Math.round((t.kwhSolar / t.kwhUsed) * 100)) : '--',
          t.kwhSolar >= t.kwhUsed ? 'ok' : '');

        sparkSolar.set(history.solarW);
      }
    };
  }
};
