// Stato globale della dashboard.
// Unica fonte di verità: le sorgenti (simulatore o bridge) applicano patch,
// le viste leggono e basta. Nessuna vista scrive nello stato.

export const state = {
  source: 'sim',          // 'sim' | 'live' | 'offline'
  vehicle: {
    speed: 0, rpm: 0, gear: 'P', coolant: 20, oilTemp: 20, boost: 0,
    fuelLevel: 0.8, egt: 150, consumption: 0, odo: 248000
  },
  attitude: { pitch: 0, roll: 0, heading: 0, altitude: 250 },
  power: {
    soc: 0.9, battV: 13.2, battA: 0, solarW: 0,
    alternatorW: 0, consumptionW: 0, toEmptyH: 99
  },
  camper: {
    waterFresh: 1, waterGrey: 0, gasKg: 5,
    fridgeTemp: 5, insideTemp: 20, outsideTemp: 15,
    heater: false, pump: false,
    lights: { interior: false, awning: false }
  },
  gps: { lat: 45.0703, lon: 7.6869, fix: 0, sats: 0 },
  trip: {
    startedAt: Date.now(), km: 0, movingS: 0, maxSpeed: 0,
    avgConsumption: 0, ascent: 0, kwhUsed: 0, kwhSolar: 0
  },
  settings: {
    speedCorrection: 1.0,     // correzione per gomme maggiorate
    tankFreshL: 60,
    tankGreyL: 20,
    battAh: 200,
    consumptionCal: 1.0,      // calibrazione consumo stimato
    tiltWarn: 20,             // ° di rollio: avviso
    tiltAlarm: 30             // ° di rollio: allarme
  }
};

// Storico per i grafici: campioni ogni ~2 s, finestra di 2 ore.
export const history = {
  soc: [], solarW: [], speed: [], insideTemp: []
};
const HISTORY_MAX = 3600;

const listeners = new Set();

/** Sottoscrive un callback invocato a ogni patch. Restituisce la funzione di rimozione. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function deepMerge(target, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
}

/** Applica una patch parziale allo stato e notifica le viste. */
export function applyPatch(patch) {
  deepMerge(state, patch);
  for (const fn of listeners) fn(state);
}

function push(arr, v) {
  arr.push(v);
  if (arr.length > HISTORY_MAX) arr.shift();
}

/** Campiona lo storico: chiamato dal loop principale, non dalle sorgenti. */
export function sampleHistory() {
  push(history.soc, state.power.soc * 100);
  push(history.solarW, state.power.solarW);
  push(history.speed, state.vehicle.speed);
  push(history.insideTemp, state.camper.insideTemp);
}

/** Reset dei dati di viaggio (pulsante nella schermata VIAGGIO). */
export function resetTrip() {
  applyPatch({ trip: {
    startedAt: Date.now(), km: 0, movingS: 0, maxSpeed: 0,
    avgConsumption: 0, ascent: 0, kwhUsed: 0, kwhSolar: 0
  }});
}

// ---- impostazioni persistenti -------------------------------------------

const LS_KEY = 'cybercruiser.settings';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) deepMerge(state.settings, JSON.parse(raw));
  } catch { /* localStorage non disponibile: si usano i valori di default */ }
}

export function saveSettings() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state.settings)); } catch { /* ignora */ }
}
