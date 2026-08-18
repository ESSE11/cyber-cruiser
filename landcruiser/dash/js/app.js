// CYBER CRUISER — avvio dell'applicazione.
// Gestisce: sorgente dati (bridge reale con fallback al simulatore),
// navigazione fra schermate, barra di stato, allarmi.

import { state, applyPatch, sampleHistory, loadSettings } from './store.js';
import { Simulator } from './sources/simulator.js';
import { Bridge } from './sources/bridge.js';
import { el } from './ui/widgets.js';

import drive from './views/drive.js';
import camper from './views/camper.js';
import impianti from './views/impianti.js';
import offroad from './views/offroad.js';
import trip from './views/trip.js';
import settings from './views/settings.js';

const VIEWS = [drive, camper, impianti, offroad, trip, settings];
const BRIDGE_TIMEOUT_MS = 2500;

loadSettings();

// --- sorgenti dati ---------------------------------------------------------

const params = new URLSearchParams(location.search);
const bridgeUrl = params.get('ws') || `ws://${location.hostname || 'localhost'}:8765`;
const forceSim = params.get('sim') === '1';

// Secondo schermo: ?view=impianti&kiosk=1 blocca l'app su una sola schermata e
// toglie la navigazione. Sul Pi 5 i due schermi sono due finestre Chromium.
const kiosk = params.get('kiosk') === '1';
const viewParam = params.get('view');
if (kiosk) document.body.classList.add('kiosk');

const sim = new Simulator();
let autoFallback = !forceSim;   // se il veicolo non risponde, si passa al simulatore

const bridge = new Bridge(bridgeUrl, (connected) => {
  if (connected) {
    sim.stop();
    applyPatch({ source: 'live' });
  } else if (autoFallback) {
    startSim();
  } else {
    applyPatch({ source: 'offline' });
  }
});

function startSim() {
  if (state.source === 'sim' && sim.timer) return;
  sim.start();
}

const ctx = {
  bridgeUrl,
  /** Invia un comando all'utenza: al veicolo se connesso, altrimenti al simulatore. */
  command(target, value) {
    if (state.source === 'live' && bridge.command(target, value)) return;
    sim.command(target, value);
  },
  /** Cambio manuale di sorgente dalla schermata SETUP. */
  setSource(mode) {
    if (mode === 'sim') {
      autoFallback = false;
      bridge.stop();
      startSim();
    } else {
      autoFallback = true;
      sim.stop();
      applyPatch({ source: 'offline' });
      bridge.start();
    }
  }
};

if (forceSim) {
  startSim();
} else {
  bridge.start();
  setTimeout(() => { if (!bridge.connected) startSim(); }, BRIDGE_TIMEOUT_MS);
}

// --- navigazione -----------------------------------------------------------

const navEl = document.getElementById('nav');
const screenEl = document.getElementById('screen');
const instances = new Map();
let current = null;

function show(view) {
  if (current && current.view === view) return;
  screenEl.replaceChildren();

  if (!instances.has(view.id)) instances.set(view.id, view.build(ctx));
  const inst = instances.get(view.id);
  screenEl.appendChild(inst.root);
  current = { view, inst };

  for (const btn of navEl.children) btn.classList.toggle('on', btn.dataset.id === view.id);
  inst.update(state);
  if (!kiosk) {
    try { localStorage.setItem('cybercruiser.view', view.id); } catch { /* ignora */ }
  }
}

VIEWS.forEach((v, i) => {
  const b = el('button', 'navbtn');
  b.dataset.id = v.id;
  b.innerHTML = `<svg viewBox="0 0 24 24">${v.icon}</svg>`;
  b.appendChild(el('span', null, v.label));
  b.addEventListener('click', () => show(v));
  navEl.appendChild(b);

  // scorciatoie da tastiera 1..5, comode in sviluppo e con una tastiera BT a bordo
  window.addEventListener('keydown', (e) => { if (e.key === String(i + 1)) show(v); });
});

let startId = viewParam || 'drive';
if (!viewParam) {
  try { startId = localStorage.getItem('cybercruiser.view') || 'drive'; } catch { /* ignora */ }
}
show(VIEWS.find((v) => v.id === startId) || VIEWS[0]);

// --- barra superiore -------------------------------------------------------

const topStats = document.getElementById('topStats');
const srcBadge = document.getElementById('srcBadge');
const clockEl = document.getElementById('clock');

function topStat(label) {
  const d = el('div', 'ts');
  const b = el('b', null, '--');
  d.append(b, el('i', null, label));
  topStats.appendChild(d);
  return b;
}
const tsSpeed = topStat('km/h');
const tsSoc = topStat('BATT');
const tsWater = topStat('ACQUA');
const tsOut = topStat('EST.');
const tsFridge = topStat('FRIGO');

// --- allarmi ---------------------------------------------------------------

const alertsEl = document.getElementById('alerts');

function computeAlerts(s) {
  const out = [];
  const add = (text, level = 'alarm') => out.push({ text, level });

  if (s.vehicle.coolant > 104) add('TEMPERATURA REFRIGERANTE');
  if (s.vehicle.oilTemp > 125) add('TEMPERATURA OLIO');
  if (s.vehicle.egt > 700) add('TEMPERATURA GAS DI SCARICO');
  if (s.vehicle.fuelLevel < 0.12) add('GASOLIO IN RISERVA', 'warn');
  if (s.power.soc < 0.15) add('BATTERIA SERVIZI SCARICA');
  else if (s.power.soc < 0.3) add('BATTERIA SERVIZI SOTTO 30%', 'warn');
  if (s.camper.waterFresh < 0.1) add('ACQUA PULITA QUASI FINITA', 'warn');
  if (s.camper.waterGrey > 0.9) add('SERBATOIO GRIGIE PIENO', 'warn');
  if (s.camper.fridgeTemp > 8) add('FRIGO SOPRA 8 °C');
  if (s.water.leak) add('POMPA IN CICLO A RUBINETTI CHIUSI: PERDITA?');
  else if (s.camper.pump && s.water.pressureBar < s.settings.pressWork[0] * 0.5 && s.water.flowLpm < 0.2) {
    add('POMPA IN PRESSIONE MA NIENTE PORTATA: ARIA O FILTRO', 'warn');
  }
  if (s.water.pressureBar > s.settings.pressWork[1] * 1.4) add('SOVRAPRESSIONE IMPIANTO ACQUA');
  if (Math.abs(s.attitude.roll) >= s.settings.tiltAlarm) add('ROLLIO CRITICO');
  else if (Math.abs(s.attitude.roll) >= s.settings.tiltWarn) add('ROLLIO ELEVATO', 'warn');
  if (s.source === 'offline') add('NESSUN COLLEGAMENTO AL VEICOLO', 'warn');
  return out;
}

let lastAlertKey = '';
function renderAlerts(s) {
  const alerts = computeAlerts(s);
  const key = alerts.map((a) => a.level + a.text).join('|');
  if (key === lastAlertKey) return;
  lastAlertKey = key;
  alertsEl.replaceChildren();
  for (const a of alerts) alertsEl.appendChild(el('div', 'alert ' + a.level, a.text));
}

// --- ciclo di aggiornamento ------------------------------------------------

function refresh() {
  const s = state;

  tsSpeed.textContent = s.vehicle.speed.toFixed(0);
  tsSoc.textContent = Math.round(s.power.soc * 100) + '%';
  tsWater.textContent = Math.round(s.camper.waterFresh * s.settings.tankFreshL) + ' L';
  tsOut.textContent = s.camper.outsideTemp.toFixed(0) + '°';
  tsFridge.textContent = s.camper.fridgeTemp.toFixed(1) + '°';

  srcBadge.textContent = s.source === 'live' ? 'LIVE' : s.source === 'sim' ? 'SIM' : 'OFFLINE';
  srcBadge.className = 'badge ' + (s.source === 'live' ? 'badge-live' : s.source === 'sim' ? 'badge-sim' : 'badge-off');

  const now = new Date();
  clockEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  renderAlerts(s);
  if (current) current.inst.update(s);
}

setInterval(refresh, 200);
setInterval(sampleHistory, 2000);
refresh();
