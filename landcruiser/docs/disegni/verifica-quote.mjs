// Verifica automatica delle quote: cerca compenetrazioni, fuori sagoma e
// distanze impossibili. Serve perché a mano, con 60 volumi, non si vede.
//
//   node docs/disegni/verifica-quote.mjs
//
// Uscita: elenco dei problemi. Codice 1 se ce n'è almeno uno grave.

import { V, CARROZZERIA as CAR, IMP, CABINA as CAB, EST, PORTE, STIV, PORT, PESI } from './quote.mjs';

const problemi = [];
const nota = (liv, testo) => problemi.push({ liv, testo });

/** Volume normalizzato in coordinate assolute (y da terra). */
function vol(nome, m, { y0, y1 } = {}) {
  const a0 = y0 ?? (m.y0 != null ? V.pavTerra + m.y0 : null);
  const a1 = y1 ?? (m.y1 != null ? V.pavTerra + m.y1 : null);
  return { nome, x0: m.t0, x1: m.t1, y0: a0, y1: a1, z0: m.l0, z1: m.l1 };
}

function tocca(a, b, gioco = 0) {
  const sov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) - gioco;
  const sx = sov(a.x0, a.x1, b.x0, b.x1);
  const sy = a.y0 == null || b.y0 == null ? 1 : sov(a.y0, a.y1, b.y0, b.y1);
  const sz = sov(a.z0, a.z1, b.z0, b.z1);
  return sx > 0 && sy > 0 && sz > 0 ? Math.min(sx, sy, sz) : 0;
}

// ---------------------------------------------------------------- sotto scocca
const sotto = ['serbatoioMezzo'].map((k) => vol(k, V[k]))
  .concat(['serbGrigie', 'riscald', 'presaAria'].map((k) => vol(k, IMP[k])));

for (let i = 0; i < sotto.length; i++) {
  for (let j = i + 1; j < sotto.length; j++) {
    const c = tocca(sotto[i], sotto[j]);
    if (c > 0) nota('GRAVE', `sotto scocca: ${sotto[i].nome} e ${sotto[j].nome} si compenetrano di ${c.toFixed(0)} cm`);
  }
}

// ---------------------------------------------------------------- vano interno
const dentro = [
  ...['frigo', 'cucina', 'cassetti', 'attrezzi', 'pozzetto', 'tecnico', 'stiva'].map((k) => {
    const m = V[k];
    return vol(k, { ...m, y0: V.falsoPav, y1: m.h ?? V.piano });
  }),
  ...['batteria', 'mppt', 'inverter', 'dcdc', 'boiler', 'pompa', 'filtro'].map((k) => vol(k, IMP[k])),
];

for (const c of dentro) {
  if (c.z0 < -1 || c.z1 > V.L + 1) nota('GRAVE', `${c.nome}: esce dal vano in lunghezza (${c.z0}…${c.z1} contro 0…${V.L})`);
  if (c.x0 < -1 || c.x1 > V.T + 1) nota('GRAVE', `${c.nome}: esce dal vano in larghezza (${c.x0}…${c.x1} contro 0…${V.T})`);
  if (c.y1 > V.pavTerra + V.H + 1) nota('GRAVE', `${c.nome}: supera l'altezza del vano`);
}

// impianti dentro i loro contenitori
const contiene = (grande, piccolo, gioco = 0) =>
  piccolo.x0 >= grande.x0 - gioco && piccolo.x1 <= grande.x1 + gioco &&
  piccolo.z0 >= grande.z0 - gioco && piccolo.z1 <= grande.z1 + gioco;

const tecnico = vol('tecnico', { ...V.tecnico, y0: V.falsoPav, y1: V.piano });
const stiva = vol('stiva', { ...V.stiva, y0: V.falsoPav, y1: V.piano });
for (const k of ['batteria', 'mppt', 'inverter', 'dcdc', 'shunt', 'fusibiliera']) {
  const c = vol(k, IMP[k]);
  if (!contiene(tecnico, c, 1)) nota('GRAVE', `${k}: sta fuori dal vano tecnico`);
  if (c.y1 > V.pavTerra + V.piano) nota('AVVISO', `${k}: sfonda il piano di lavoro di ${(c.y1 - V.pavTerra - V.piano).toFixed(0)} cm`);
}
for (const k of ['boiler', 'pompa', 'filtro']) {
  const c = vol(k, IMP[k]);
  if (!contiene(stiva, c, 1)) nota('GRAVE', `${k}: sta fuori dalla stiva`);
  if (c.y1 > V.pavTerra + V.piano) nota('AVVISO', `${k}: sfonda il piano di lavoro di ${(c.y1 - V.pavTerra - V.piano).toFixed(0)} cm`);
}

// passaruota: nessun modulo può occuparne il volume
const archi = [
  { nome: 'arco sx', x0: 0, x1: V.arco.w, y0: V.pavTerra, y1: V.pavTerra + V.arco.h, z0: V.arco.l0, z1: V.arco.l1 },
  { nome: 'arco dx', x0: V.T - V.arco.w, x1: V.T, y0: V.pavTerra, y1: V.pavTerra + V.arco.h, z0: V.arco.l0, z1: V.arco.l1 },
];
for (const a of archi) {
  for (const c of dentro) {
    const s = tocca(a, c);
    if (s > 0) nota('GRAVE', `${c.nome} occupa il ${a.nome} per ${s.toFixed(0)} cm`);
  }
}

// ---------------------------------------------------------------- tetto
const sporg = (CAR.larghezza - V.T) / 2;
const lt = V.letto;
const lettoX0 = (V.T - lt.t) / 2;
if (lettoX0 < -sporg) nota('GRAVE', `letto largo ${lt.t}: sborda dal guscio di ${(-sporg - lettoX0).toFixed(0)} cm per lato`);
const pannelliW = EST.solare.n * EST.solare.w + (EST.solare.n - 1) * EST.solare.gap;
if (EST.solare.t0 + pannelliW > V.T + sporg) {
  nota('GRAVE', `pannelli solari: ${pannelliW} cm di larghezza non entrano nel tetto`);
}
if (EST.solare.l0 + EST.solare.l > EST.rack.l0) {
  nota('AVVISO', `pannelli solari e portapacchi si sovrappongono da z=${EST.rack.l0}`);
}
if (EST.rack.l1 > CAR.lunghezza) nota('GRAVE', 'il portapacchi sporge oltre il cofano');

// ---------------------------------------------------------------- cabina
if (CAB.sedile.l0 < V.L) nota('GRAVE', `i sedili anteriori entrano nel vano di ${(V.L - CAB.sedile.l0).toFixed(0)} cm`);
if (CAB.plancia.l1 > CAR.lunghezza) nota('AVVISO', 'la plancia sporge oltre la scocca');
if (CAB.pi.l0 < CAB.sedile.l0 || CAB.pi.l1 > CAB.sedile.l1) {
  nota('AVVISO', 'il Raspberry non è sotto al sedile passeggero');
}

// ---------------------------------------------------------------- porte
for (const [k, p] of Object.entries(PORTE)) {
  if (!p.l0) continue;
  if (p.l1 > CAR.lunghezza) nota('GRAVE', `porta ${k}: finisce a z=${p.l1}, oltre la scocca (${CAR.lunghezza})`);
  if (p.y1 > CAR.altezza) nota('GRAVE', `porta ${k}: più alta del tetto`);
}
if (PORTE.post.l0 < V.L) {
  nota('AVVISO', `la porta posteriore inizia a z=${PORTE.post.l0}, dentro il vano: mobili alti lì bloccano il battente`);
}

// ---------------------------------------------------------------- portellone
const largPortellone = CAR.larghezza - 4;
for (const [k, m] of Object.entries(PORT)) {
  const t1 = m.t1 ?? m.t0;
  if (t1 > largPortellone) nota('GRAVE', `portellone/${k}: largo oltre il battente (${t1} > ${largPortellone})`);
  if (m.y1 && m.y1 > CAR.altezza) nota('AVVISO', `portellone/${k}: sopra il bordo del tetto`);
}

// ---------------------------------------------------------------- stivaggio
for (const [k, m] of Object.entries(STIV)) {
  if (m.l1 > V.L + 1 && k !== 'tascaPort') nota('AVVISO', `stivaggio/${k}: esce dal vano (z fino a ${m.l1})`);
  if (m.y1 + V.pavTerra > V.pavTerra + V.H + 1 && !k.includes('Soffietto')) {
    nota('AVVISO', `stivaggio/${k}: più alto del vano`);
  }
}

// ---------------------------------------------------------------- acqua
const serb = V.serbatoio;
const litriChiara = ((serb.t1 - serb.t0) * (serb.l1 - serb.l0) * serb.h) / 1000;
if (litriChiara < 40) nota('AVVISO', `serbatoio acqua chiara: solo ${litriChiara.toFixed(0)} L`);

// ---------------------------------------------------------------- pesi
// Il gasolio è già contato nella massa a vuoto omologata, quindi non pesa
// sulla portata: qui serve solo per il totale su strada.
const senzaGasolio = Object.entries(PESI)
  .filter(([k]) => k !== 'gasolioPieno')
  .reduce((a, [, v]) => a + v, 0);
const portata = CAR.massaTotale - CAR.massaVuoto;
const margine = portata - senzaGasolio;

if (margine < 0) {
  nota('GRAVE', `budget pesi sforato: ${senzaGasolio} kg contro ${portata} kg di portata (${-margine} kg di troppo)`);
} else if (margine < 60) {
  nota('AVVISO', `budget pesi al limite: restano ${margine} kg su ${portata}`);
}

// ---------------------------------------------------------------- esito
const gravi = problemi.filter((p) => p.liv === 'GRAVE');
if (!problemi.length) {
  console.log('✓ nessun problema di quota');
} else {
  for (const p of problemi) console.log(`${p.liv === 'GRAVE' ? '✗' : '!'} [${p.liv}] ${p.testo}`);
  console.log(`\n${gravi.length} gravi, ${problemi.length - gravi.length} avvisi`);
}
console.log(`\nacqua chiara ${litriChiara.toFixed(0)} L · vano ${V.L}×${V.T}×${V.H} · letto ${lt.l}×${lt.t}`);
console.log(`pesi: allestimento + carico ${senzaGasolio} kg · portata ${portata} kg · margine ${margine} kg`);
process.exit(gravi.length ? 1 : 0);
