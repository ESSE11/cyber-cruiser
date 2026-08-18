// Sorgente SIMULATA: genera dati plausibili per sviluppare l'interfaccia
// senza veicolo, senza Raspberry e senza sensori.
// Modella un viaggio di montagna: tratti in movimento alternati a soste.

import { state, applyPatch } from '../store.js';

const HZ = 5;
const DT = 1 / HZ;

export class Simulator {
  constructor() {
    this.t = 0;
    this.timer = null;
    this.moving = true;
    this.phaseEnd = 300;          // secondi simulati alla prossima transizione
    this.targetSpeed = 60;
    this.speed = 0;
    this.odo = state.vehicle.odo;
    this.altitude = 320;
    this.heading = 180;
    // impianto idrico: rubinetto aperto a tratti, pompa a pressostato
    this.rubinetto = false;
    this.rubinettoFine = 0;
    this.pompaSec = 0;         // secondi di pompa nell'ultima ora simulata
    this.press = 0;
  }

  start() {
    applyPatch({ source: 'sim', gps: { fix: 3, sats: 11 } });
    this.timer = setInterval(() => this.tick(), 1000 / HZ);
  }

  stop() { clearInterval(this.timer); this.timer = null; }

  /** In modalità simulata i comandi agiscono direttamente sullo stato. */
  command(target, value) {
    const path = target.split('.');
    const patch = {};
    let node = patch;
    for (let i = 0; i < path.length - 1; i++) node = (node[path[i]] = {});
    node[path[path.length - 1]] = value;
    applyPatch(patch);
  }

  tick() {
    this.t += DT;
    const s = state;

    // --- alternanza marcia / sosta ---------------------------------------
    if (this.t > this.phaseEnd) {
      this.moving = !this.moving;
      this.phaseEnd = this.t + (this.moving ? 240 + Math.random() * 400 : 90 + Math.random() * 200);
      this.targetSpeed = this.moving ? 30 + Math.random() * 60 : 0;
    }
    if (this.moving && Math.random() < 0.01) this.targetSpeed = 25 + Math.random() * 65;

    // --- dinamica veicolo -------------------------------------------------
    const accel = this.moving ? 3.5 : 6;
    this.speed += Math.max(-accel * DT * 6, Math.min(accel * DT * 6, this.targetSpeed - this.speed));
    this.speed = Math.max(0, this.speed + (Math.random() - 0.5) * 0.4);

    // km/h per 1000 rpm di ogni marcia (automatico a 5 rapporti del 1KD-FTV)
    const gearRatios = [0, 9.5, 17, 25, 34, 43];
    let gearIdx = 1;
    // sale di marcia finché il regime resta sopra il minimo di trascinamento
    while (gearIdx < 5 && (this.speed / gearRatios[gearIdx + 1]) * 1000 > 1250) gearIdx++;
    const rpm = this.speed < 1
      ? 700 + Math.sin(this.t) * 25
      : Math.max(750, (this.speed / gearRatios[gearIdx]) * 1000 + Math.sin(this.t * 2) * 60);

    const load = this.speed < 1 ? 0.08 : Math.min(1, 0.25 + this.speed / 160 + Math.sin(this.t / 40) * 0.2);
    const boost = Math.max(0, load * 1.5 - 0.15 + Math.sin(this.t * 3) * 0.05);
    const egt = 180 + load * 520 + Math.sin(this.t * 1.3) * 25;

    // temperature motore: salgono in marcia, calano da fermo
    const coolTarget = this.speed > 1 ? 88 + load * 6 : 84;
    const coolant = s.vehicle.coolant + (coolTarget - s.vehicle.coolant) * 0.004;
    const oilTarget = this.speed > 1 ? 95 + load * 15 : 88;
    const oilTemp = s.vehicle.oilTemp + (oilTarget - s.vehicle.oilTemp) * 0.003;

    // consumo istantaneo: stima da carico e velocità (come sul mezzo vero)
    const lPerH = (1.1 + load * 9.5) * state.settings.consumptionCal;
    const consumption = this.speed > 3 ? (lPerH / this.speed) * 100 : 0;

    const dKm = (this.speed / 3600) * DT;
    this.odo += dKm;

    // --- assetto e posizione ---------------------------------------------
    const climb = Math.sin(this.t / 90) * 7;                   // pendenza del percorso
    this.altitude = Math.max(0, this.altitude + (climb / 100) * dKm * 1000);
    this.heading = (this.heading + (Math.sin(this.t / 25) * 1.2 * (this.speed > 2 ? 1 : 0)) + 360) % 360;
    const pitch = this.speed > 1 ? climb * 0.8 + (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 0.6;
    const roll = this.speed > 1
      ? Math.sin(this.t / 11) * 6 + (Math.random() - 0.5) * 2.5
      : state.attitude.roll * 0.98;

    // --- energia -----------------------------------------------------------
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    const sun = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const solarW = Math.round(sun * 340 * (0.75 + Math.sin(this.t / 30) * 0.25));
    const alternatorW = this.speed > 3 ? 580 : 0;

    const fridgeDuty = s.camper.fridgeTemp > 5 ? 1 : 0;
    const loadsW = 6                                     // parassiti
      + (fridgeDuty ? 45 : 0)
      + (s.camper.lights.interior ? 8 : 0)
      + (s.camper.lights.awning ? 14 : 0)
      + (s.camper.pump && this.press < state.settings.pressWork[1] ? 50 : 0)
      + (s.water.boilerOn && s.water.boilerTemp < state.settings.boilerTarget ? 200 : 0)
      + (s.camper.heater ? 28 : 0)
      + s.camper.fan * 11
      + 14;                                              // Raspberry + schermo

    const netW = solarW + alternatorW - loadsW;
    const capWh = state.settings.battAh * 12.8;
    const soc = Math.max(0.02, Math.min(1, s.power.soc + (netW * DT / 3600) / capWh));
    const battA = netW / 13.1;
    const battV = 12.9 + soc * 0.7 + (battA > 0 ? 0.35 : -0.1);

    // --- acqua ---------------------------------------------------------------
    // il rubinetto si apre ogni tanto; la pompa a pressostato insegue la pressione
    if (this.t > this.rubinettoFine) {
      this.rubinetto = !this.rubinetto && Math.random() < 0.6;
      this.rubinettoFine = this.t + (this.rubinetto ? 8 + Math.random() * 50 : 120 + Math.random() * 600);
    }
    const [pMin, pMax] = state.settings.pressWork;
    const pompaOn = s.camper.pump && (this.rubinetto || this.press < pMin);
    this.press += pompaOn ? (pMax + 0.2 - this.press) * 0.06 : (this.rubinetto ? -0.35 : -0.004);
    this.press = Math.max(0, Math.min(4, this.press));
    const flowLpm = this.rubinetto && s.camper.pump ? 4.5 + Math.sin(this.t) * 0.6 : 0;
    this.pompaSec += pompaOn ? DT : 0;

    const boilerOn = s.water.boilerOn;
    const boilerTarget = state.settings.boilerTarget;
    const boilerTemp = s.water.boilerTemp
      + (boilerOn && s.water.boilerTemp < boilerTarget ? 0.06 : 0)
      - (s.water.boilerTemp - s.camper.insideTemp) * 0.0004
      - (flowLpm > 0 ? flowLpm * 0.02 : 0);

    // --- camper -------------------------------------------------------------
    const fridgeTemp = s.camper.fridgeTemp + (fridgeDuty ? -0.02 : 0.012) * (1 + s.camper.outsideTemp / 40);
    const outsideTemp = 6 + sun * 14 - this.altitude / 250;
    const insideTemp = s.camper.insideTemp
      + (outsideTemp - s.camper.insideTemp) * (0.0015 + s.camper.fan * 0.004)
      + (s.camper.heater ? 0.02 : 0);
    // i serbatoi si muovono con i litri davvero erogati, non "un po' a caso"
    const litri = (flowLpm / 60) * DT;
    const waterFresh = Math.max(0, s.camper.waterFresh - litri / state.settings.tankFreshL);
    const waterGrey = Math.min(1, s.camper.waterGrey + (s.water.showerExt ? 0 : litri / state.settings.tankGreyL));

    // --- dati di viaggio ----------------------------------------------------
    const trip = s.trip;
    const movingS = trip.movingS + (this.speed > 3 ? DT : 0);
    const km = trip.km + dKm;
    const avg = km > 0.3
      ? (trip.avgConsumption * 0.999 + consumption * 0.001)
      : trip.avgConsumption;

    applyPatch({
      vehicle: {
        speed: this.speed * state.settings.speedCorrection,
        rpm, gear: this.speed < 1 ? 'P' : 'D' + gearIdx,
        coolant, oilTemp, boost, egt,
        fuelLevel: Math.max(0.05, s.vehicle.fuelLevel - dKm / 900),
        consumption, odo: this.odo
      },
      attitude: { pitch, roll, heading: this.heading, altitude: this.altitude },
      power: {
        soc, battV, battA, solarW, alternatorW,
        consumptionW: loadsW,
        toEmptyH: netW < -5 ? (soc * capWh) / -netW : 99,
        solarWh: s.power.solarWh + (solarW * DT) / 3600,
        altWh: s.power.altWh + (alternatorW * DT) / 3600,
        loadWh: s.power.loadWh + (loadsW * DT) / 3600
      },
      water: {
        pressureBar: this.press,
        flowLpm,
        litersOut: s.water.litersOut + litri,
        boilerTemp,
        pumpDuty: Math.min(1, this.pompaSec / Math.max(60, Math.min(3600, this.t))),
        leak: false
      },
      camper: {
        fridgeTemp, insideTemp, outsideTemp, waterFresh, waterGrey,
        // con l'estrattore acceso l'interno insegue l'esterno molto più in fretta
        coPpm: Math.max(0, s.camper.coPpm + (s.camper.heater ? 0.02 : -0.05))
      },
      gps: {
        lat: s.gps.lat + Math.cos((this.heading * Math.PI) / 180) * dKm * 0.009,
        lon: s.gps.lon + Math.sin((this.heading * Math.PI) / 180) * dKm * 0.012,
        fix: 3, sats: 9 + Math.round(Math.sin(this.t / 60) * 2)
      },
      trip: {
        km, movingS,
        maxSpeed: Math.max(trip.maxSpeed, this.speed),
        avgConsumption: avg,
        ascent: trip.ascent + Math.max(0, (climb / 100) * dKm * 1000),
        kwhUsed: trip.kwhUsed + (loadsW * DT) / 3600 / 1000,
        kwhSolar: trip.kwhSolar + (solarW * DT) / 3600 / 1000
      }
    });
  }
}
