// Schermata IMPOSTAZIONI: sorgente dati, calibrazioni, soglie.
// Tutti i controlli sono a pulsanti grandi: si usano con i guanti e su sterrato.

import { state, saveSettings } from '../store.js';
import { el, card } from '../ui/widgets.js';

function numberRow(label, get, set, { step, min, max, fmt = (v) => v.toFixed(2) }) {
  const row = el('div', 'row');
  row.appendChild(el('div', 'k', label));
  const right = el('div', 'btn-row');
  right.style.margin = '0';
  const minus = el('button', 'btn', '−');
  const val = el('div', 'v');
  val.style.minWidth = '90px';
  val.style.textAlign = 'center';
  const plus = el('button', 'btn', '+');
  const render = () => { val.textContent = fmt(get()); };
  minus.addEventListener('click', () => { set(Math.max(min, +(get() - step).toFixed(4))); render(); saveSettings(); });
  plus.addEventListener('click', () => { set(Math.min(max, +(get() + step).toFixed(4))); render(); saveSettings(); });
  right.append(minus, val, plus);
  row.appendChild(right);
  render();
  return row;
}

export default {
  id: 'settings',
  label: 'SETUP',
  icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',

  build(ctx) {
    const root = el('div', 'view view-grid-2');

    // --- sorgente dati ----------------------------------------------------
    const rows = el('div', 'rows');

    const srcRow = el('div', 'row');
    srcRow.appendChild(el('div', 'k', 'SORGENTE DATI'));
    const srcBtns = el('div', 'btn-row');
    srcBtns.style.margin = '0';
    const bSim = el('button', 'btn', 'SIMULATORE');
    const bLive = el('button', 'btn', 'VEICOLO');
    bSim.addEventListener('click', () => ctx.setSource('sim'));
    bLive.addEventListener('click', () => ctx.setSource('live'));
    srcBtns.append(bSim, bLive);
    srcRow.appendChild(srcBtns);
    rows.appendChild(srcRow);

    const urlRow = el('div', 'row');
    urlRow.appendChild(el('div', 'k', 'DAEMON'));
    const urlVal = el('div', 'v', ctx.bridgeUrl);
    urlVal.style.fontSize = '13px';
    urlRow.appendChild(urlVal);
    rows.appendChild(urlRow);

    const stateRow = el('div', 'row');
    stateRow.appendChild(el('div', 'k', 'STATO'));
    const stateVal = el('div', 'v', '--');
    stateRow.appendChild(stateVal);
    rows.appendChild(stateRow);

    const fsRow = el('div', 'row');
    fsRow.appendChild(el('div', 'k', 'SCHERMO'));
    const fsBtns = el('div', 'btn-row');
    fsBtns.style.margin = '0';
    const bFs = el('button', 'btn', 'SCHERMO INTERO');
    bFs.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    });
    fsBtns.appendChild(bFs);
    fsRow.appendChild(fsBtns);
    rows.appendChild(fsRow);

    const cSrc = card('SORGENTE', rows);

    // --- calibrazioni -----------------------------------------------------
    const cal = el('div', 'rows');
    cal.appendChild(numberRow('CORREZIONE VELOCITÀ (gomme)',
      () => state.settings.speedCorrection, (v) => { state.settings.speedCorrection = v; },
      { step: 0.01, min: 0.8, max: 1.2, fmt: (v) => '×' + v.toFixed(2) }));
    cal.appendChild(numberRow('CALIBRAZIONE CONSUMO',
      () => state.settings.consumptionCal, (v) => { state.settings.consumptionCal = v; },
      { step: 0.02, min: 0.5, max: 1.5, fmt: (v) => '×' + v.toFixed(2) }));
    cal.appendChild(numberRow('BATTERIA SERVIZI',
      () => state.settings.battAh, (v) => { state.settings.battAh = v; },
      { step: 10, min: 50, max: 400, fmt: (v) => v + ' Ah' }));
    const cCal = card('CALIBRAZIONI', cal);

    // --- serbatoi ---------------------------------------------------------
    const tanks = el('div', 'rows');
    tanks.appendChild(numberRow('SERBATOIO PULITA',
      () => state.settings.tankFreshL, (v) => { state.settings.tankFreshL = v; },
      { step: 5, min: 10, max: 150, fmt: (v) => v + ' L' }));
    tanks.appendChild(numberRow('SERBATOIO GRIGIE',
      () => state.settings.tankGreyL, (v) => { state.settings.tankGreyL = v; },
      { step: 5, min: 5, max: 100, fmt: (v) => v + ' L' }));
    const cTanks = card('SERBATOI', tanks);

    // --- soglie -----------------------------------------------------------
    const th = el('div', 'rows');
    th.appendChild(numberRow('AVVISO ROLLIO',
      () => state.settings.tiltWarn, (v) => { state.settings.tiltWarn = v; },
      { step: 1, min: 5, max: 40, fmt: (v) => v + '°' }));
    th.appendChild(numberRow('ALLARME ROLLIO',
      () => state.settings.tiltAlarm, (v) => { state.settings.tiltAlarm = v; },
      { step: 1, min: 10, max: 50, fmt: (v) => v + '°' }));
    const note = el('div', 'row');
    note.style.color = 'var(--text-dim)';
    note.style.fontSize = '12px';
    note.textContent = 'Riferimento: un Land Cruiser carico con tetto a soffietto ribalta ben prima dei 40° teorici. Tienile basse.';
    th.appendChild(note);
    const cTh = card('SOGLIE ASSETTO', th);

    root.append(cSrc, cCal, cTanks, cTh);

    return {
      root,
      update(s) {
        bSim.classList.toggle('accent', s.source === 'sim');
        bLive.classList.toggle('accent', s.source !== 'sim');
        stateVal.textContent = s.source === 'live' ? 'CONNESSO AL VEICOLO'
          : s.source === 'sim' ? 'DATI SIMULATI' : 'DAEMON NON RAGGIUNGIBILE';
        urlVal.textContent = ctx.bridgeUrl;
      }
    };
  }
};
