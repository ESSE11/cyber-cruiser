// Schermata FUORISTRADA: inclinometro, bussola, quota, dati di trazione.
// È la schermata che si guarda con il mezzo fermo o a passo d'uomo, quindi
// pochi numeri e molto grandi.

import { el, card, Stat, Tilt, cardinal } from '../ui/widgets.js';

export default {
  id: 'offroad',
  label: 'OFFROAD',
  icon: '<path d="M3 18l5-9 4 5 3-4 6 8z"/><circle cx="8" cy="6" r="2"/>',

  build() {
    const root = el('div', 'view view-grid-2');

    // --- inclinometro -----------------------------------------------------
    const tilt = new Tilt();
    const tiltBox = el('div', 'gauge-wrap h-md');
    tiltBox.appendChild(tilt.root);

    const angles = el('div', 'big-angle');
    const mk = (k) => {
      const d = el('div');
      d.appendChild(el('div', 'k', k));
      const v = el('div', 'v', '0°');
      d.appendChild(v);
      angles.appendChild(d);
      return v;
    };
    const vPitch = mk('BECCHEGGIO');
    const vRoll = mk('ROLLIO');

    const cTilt = card('ASSETTO', tiltBox, angles);
    cTilt.style.gridRow = 'span 2';

    // --- navigazione ------------------------------------------------------
    const sHead = new Stat('BUSSOLA');
    const sAlt = new Stat('QUOTA', 'm');
    const sSlope = new Stat('PENDENZA', '%');
    const sSpeed = new Stat('VELOCITÀ', 'km/h');
    const gNav = el('div', 'stats');
    [sHead, sAlt, sSlope, sSpeed].forEach((s) => gNav.appendChild(s.root));
    const cNav = card('NAVIGAZIONE', gNav);

    // --- posizione --------------------------------------------------------
    const rows = el('div', 'rows');
    const mkRow = (k) => {
      const r = el('div', 'row');
      r.appendChild(el('div', 'k', k));
      const v = el('div', 'v', '--');
      r.appendChild(v);
      rows.appendChild(r);
      return v;
    };
    const rLat = mkRow('LATITUDINE');
    const rLon = mkRow('LONGITUDINE');
    const rFix = mkRow('FIX GPS');
    const rTemp = mkRow('TEMP. ESTERNA');
    const rMax = mkRow('ROLLIO MAX SESSIONE');

    const btns = el('div', 'btn-row');
    const bReset = el('button', 'btn', 'AZZERA ROLLIO MAX');
    const bCopy = el('button', 'btn accent', 'COPIA COORDINATE');
    btns.append(bReset, bCopy);
    const cPos = card('POSIZIONE', rows, btns);

    let maxRoll = 0;
    bReset.addEventListener('click', () => { maxRoll = 0; });
    bCopy.addEventListener('click', () => {
      const txt = rLat.textContent + ', ' + rLon.textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
      bCopy.textContent = 'COPIATO';
      setTimeout(() => { bCopy.textContent = 'COPIA COORDINATE'; }, 1500);
    });

    root.append(cTilt, cNav, cPos);

    return {
      root,
      update(s) {
        const a = s.attitude, set = s.settings;
        tilt.set(a.pitch, a.roll);

        vPitch.textContent = `${a.pitch >= 0 ? '+' : ''}${a.pitch.toFixed(1)}°`;
        vRoll.textContent = `${a.roll >= 0 ? '+' : ''}${a.roll.toFixed(1)}°`;
        const absRoll = Math.abs(a.roll);
        vRoll.style.color = absRoll >= set.tiltAlarm ? 'var(--alarm)'
          : absRoll >= set.tiltWarn ? 'var(--warn)' : '';

        sHead.set(`${Math.round(a.heading)}° ${cardinal(a.heading)}`);
        sAlt.set(Math.round(a.altitude));
        sSlope.set((Math.tan((a.pitch * Math.PI) / 180) * 100).toFixed(0));
        sSpeed.set(s.vehicle.speed.toFixed(0));

        rLat.textContent = s.gps.lat.toFixed(5);
        rLon.textContent = s.gps.lon.toFixed(5);
        rFix.textContent = s.gps.fix >= 3 ? `3D · ${s.gps.sats} sat` : s.gps.fix === 2 ? '2D' : 'assente';
        rTemp.textContent = s.camper.outsideTemp.toFixed(1) + ' °C';
        maxRoll = Math.max(maxRoll, absRoll);
        rMax.textContent = maxRoll.toFixed(1) + '°';
      }
    };
  }
};
