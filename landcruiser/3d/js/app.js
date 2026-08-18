// Modello 3D navigabile dell'allestimento.
// Gira offline: Three.js è vendorizzato in vendor/, nessuna richiesta di rete.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { V, EST } from '../../docs/disegni/quote.mjs';

const EST_ANGOLO = EST.tenda.angolo;
import { costruisciAllestimento, COL, Y } from './modello.js';

// ---------------------------------------------------------------- scena

const canvas = document.getElementById('vista');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(COL.bg);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(COL.bg, 1800, 5200);

const camera = new THREE.PerspectiveCamera(32, 1, 10, 8000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 120;
controls.maxDistance = 4200;   // su finestre strette la camera deve poter arretrare
controls.maxPolarAngle = Math.PI / 2 - 0.02;   // non si va sotto il piano stradale
controls.target.set(0, 110, 0);

scene.add(new THREE.HemisphereLight(0x9fc4e8, 0x0a0e12, 1.5));
const sole = new THREE.DirectionalLight(0xfff0d8, 2.1);
sole.position.set(-380, 520, -260);
scene.add(sole);
const controluce = new THREE.DirectionalLight(0x5fa8d3, 0.7);
controluce.position.set(420, 260, 380);
scene.add(controluce);

const { root, parti } = costruisciAllestimento();
scene.add(root);

// ---------------------------------------------------------------- stato

const stato = {
  tetto: 1,        // 0 = chiuso, 1 = soffietto aperto
  cucina: 1,       // 0 = a riposo, 1 = estratta
  frigo: 0.5,      // 0 = chiuso, 0,5 = a metà (posizione d'uso), 1 = tutto fuori
  letto: 0,        // 0 = ripiegato (giorno), 1 = disteso (notte)
  scrivania: 0,    // 0 = dentro (postazione PC), 1 = ruotata fuori (tavolo)
  portellone: 1,   // 0 = chiuso, 1 = aperto: senza non esci la cucina
  tenda: 0,        // tenda a ventaglio: 0 = chiusa sul cassonetto, 1 = aperta
  persone: 1,
};
const target = { ...stato };     // valori animati
const anim = { ...stato };

const VISTE = {
  'tre-quarti': { pos: [-520, 380, -500], target: [-10, 130, 10] },
  'laterale':   { pos: [-880, 210, 30], target: [0, 128, 30] },
  'alto':       { pos: [-60, 1220, 60], target: [-30, 60, 10] },
  'posteriore': { pos: [-230, 240, -600], target: [0, 130, -30] },
  'interno':    { pos: [-45, 190, -300], target: [5, 120, 90] },
  'cabina':     { pos: [430, 330, -40], target: [20, 100, 235] },
  'impianti':   { pos: [-560, 300, -330], target: [10, 70, 80] },
};

// Gruppi accendibili: non sono animazioni, solo visibilità.
const visibili = { impianti: 1, cabina: 1, esterni: 1, porte: 1, stivaggio: 1, etichette: 0, scocca: 0 };

function applicaVisibilita() {
  parti.impianti.visible = !!visibili.impianti;
  parti.cabina.visible = !!visibili.cabina;
  parti.esterni.visible = !!visibili.esterni;
  for (const n of parti.esterni.userData.suGuscio || []) n.visible = !!visibili.esterni;
  parti.etichette.visible = !!visibili.etichette;
  parti.porte.visible = !!visibili.porte;
  parti.stivaggio.visible = !!visibili.stivaggio;
  parti.scocca.visible = !!visibili.scocca;
  // con la scocca reale a schermo, quella schematica sparisce
  parti.carrozzeria.visible = !visibili.scocca;
  for (const b of document.querySelectorAll('[data-vis]')) {
    b.classList.toggle('on', !!visibili[b.dataset.vis]);
  }
}

let vistaCorrente = 'tre-quarti';

function vista(nome, immediata = false) {
  const v = VISTE[nome] || VISTE['tre-quarti'];
  vistaCorrente = VISTE[nome] ? nome : 'tre-quarti';

  // Le inquadrature sono tarate su uno schermo orizzontale: su un telefono o
  // su una finestra stretta il mezzo uscirebbe dal quadro, quindi si arretra.
  const aspetto = Math.max(0.35, canvas.clientWidth / Math.max(1, canvas.clientHeight));
  const k = aspetto < 1.35 ? Math.min(1.9, 1.35 / aspetto) : 1;

  const t = new THREE.Vector3(...v.target);
  const pos = new THREE.Vector3(...v.pos).sub(t).multiplyScalar(k).add(t);
  camera.position.copy(pos);
  controls.target.copy(t);
  controls.update();
  for (const b of document.querySelectorAll('[data-vista]')) {
    b.classList.toggle('on', b.dataset.vista === nome);
  }
  if (immediata) render();
}

// ---------------------------------------------------------------- animazione

function applica(dt) {
  for (const k of Object.keys(target)) {
    anim[k] += (target[k] - anim[k]) * Math.min(1, dt * 6);
  }

  // soffietto: guscio e tessuto salgono di popUp
  const lift = anim.tetto * V.popUp;
  parti.guscio.position.y = lift;
  // il tessuto è alto 1 cm a riposo: lo si scala e ricentra fra tetto e guscio
  parti.tessuto.scale.y = Math.max(0.001, lift);
  parti.tessuto.position.y = Y(V.H) + lift / 2;

  // il letto vive nel guscio: sale con lui
  parti.letto.position.y = lift;
  parti.lettoFisso.position.y = 0;

  // metà mobile del letto: la cerniera è l'origine del suo gruppo, quindi
  // basta ruotarla. 0° = distesa sopra i sedili, 180° = ripiegata all'indietro.
  const ang = (1 - anim.letto) * Math.PI;
  parti.lettoMobile.rotation.x = -ang;
  parti.lettoMobile.position.y = Y(V.H) + Math.sin(ang) * 16;   // il guscio alza già il gruppo

  // portellone: 100° attorno alla cerniera sul fianco sinistro
  parti.portellone.rotation.y = anim.portellone * Math.PI * 0.56;

  // tenda: le stecche si aprono a ventaglio dal cassonetto, che resta sempre
  // montato sulle barre; i piedi scendono solo a tenda quasi tutta aperta
  {
    const t = parti.tenda, n = t.settori.length;
    const passo = (EST_ANGOLO / n) * (Math.PI / 180);
    t.settori.forEach((s, i) => { s.rotation.y = anim.tenda * passo * i; });
    t.ventaglio.visible = anim.tenda > 0.02;
    t.ventaglio.orlo.visible = anim.tenda > 0.98;   // l'orlo ha senso solo a tenda tesa
    for (const p of t.piedi) p.visible = anim.tenda > 0.9;
  }

  // cucina e frigo sulle guide
  parti.cucina.position.z = -anim.cucina * V.cucina.corsa;
  parti.frigo.position.z = -anim.frigo * 40;

  // scrivania: ruota sul braccio e scorre verso il portellone
  parti.scrivania.rotation.y = anim.scrivania * Math.PI / 2;
  parti.scrivania.position.z = V.scrivania.l0 + 3 - anim.scrivania * 55;

  // persone: il cuoco compare con la cucina estratta, il seduto con la scrivania dentro
  const p = anim.persone;
  parti.cuoco.visible = p > 0.5 && anim.cucina > 0.5;
  parti.seduto.visible = p > 0.5 && anim.scrivania < 0.5 && anim.tetto > 0.5;
}

let ultimo = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - ultimo) / 1000);
  ultimo = t;
  applica(dt);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function render() { applica(1); renderer.render(scene, camera); }

function ridimensiona() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// cambiando forma alla finestra l'inquadratura va ricalcolata, non solo scalata
let riquadro;
addEventListener('resize', () => {
  clearTimeout(riquadro);
  riquadro = setTimeout(() => vista(vistaCorrente), 120);
});
addEventListener('resize', ridimensiona);

// ---------------------------------------------------------------- interfaccia

const ETICHETTE = {
  tetto: ['SOFFIETTO CHIUSO', 'SOFFIETTO APERTO'],
  cucina: ['CUCINA A RIPOSO', 'CUCINA ESTRATTA'],
  frigo: ['FRIGO DENTRO', 'FRIGO A METÀ', 'FRIGO ESTRATTO'],
  letto: ['LETTO RIPIEGATO', 'LETTO DISTESO'],
  scrivania: ['SCRIVANIA DENTRO', 'TAVOLO FUORI'],
  portellone: ['PORTELLONE CHIUSO', 'PORTELLONE APERTO'],
  tenda: ['TENDA CHIUSA', 'TENDA APERTA'],
  persone: ['SENZA PERSONE', 'CON PERSONE'],
};

// Il frigo ha tre posizioni: chiuso, a metà (come lo si usa davvero, per
// aprire il coperchio senza sfilarlo tutto), tutto fuori per la manutenzione.
const CICLO_FRIGO = [0, 0.5, 1];

function indiceStato(k) {
  if (k === 'frigo') return CICLO_FRIGO.indexOf(target.frigo);
  return target[k] ? 1 : 0;
}

function aggiornaBottoni() {
  for (const b of document.querySelectorAll('[data-stato]')) {
    const k = b.dataset.stato;
    const i = Math.max(0, indiceStato(k));
    b.textContent = ETICHETTE[k][i];
    b.classList.toggle('on', i > 0);
  }
}

for (const b of document.querySelectorAll('[data-stato]')) {
  b.addEventListener('click', () => {
    const k = b.dataset.stato;
    if (k === 'frigo') {
      target.frigo = CICLO_FRIGO[(CICLO_FRIGO.indexOf(target.frigo) + 1) % CICLO_FRIGO.length];
    } else {
      target[k] = target[k] ? 0 : 1;
    }
    if (k === 'letto' && target[k]) target.scrivania = 0;   // di notte la scrivania è d'intralcio
    if (k === 'scrivania' && target[k]) target.letto = 0;
    // cucina e frigo escono dal portellone: o è aperto, o non escono
    if ((k === 'cucina' || k === 'frigo') && target[k]) target.portellone = 1;
    if (k === 'portellone' && !target[k]) { target.cucina = 0; target.frigo = 0; }
    aggiornaBottoni();
  });
}
for (const b of document.querySelectorAll('[data-vista]')) {
  b.addEventListener('click', () => vista(b.dataset.vista));
}

for (const b of document.querySelectorAll('[data-vis]')) {
  b.addEventListener('click', () => {
    visibili[b.dataset.vis] = visibili[b.dataset.vis] ? 0 : 1;
    applicaVisibilita();
  });
}

// --- scocca reale opzionale (assets/scocca.glb) ----------------------------
// Il modello di carrozzeria vero non sta nel repo: è un file scaricato a parte
// con la sua licenza (vedi assets/README.md). Se c'è lo si usa, se non c'è
// resta la scocca schematica e il pulsante non compare nemmeno.

const btnScocca = document.querySelector('[data-vis="scocca"]');

async function caricaScocca() {
  if (btnScocca) btnScocca.hidden = true;
  let cfg = {};
  try {
    const r = await fetch('assets/scocca.glb', { method: 'HEAD' });
    if (!r.ok) return;
  } catch { return; }
  try {
    const rc = await fetch('assets/scocca.json');
    if (rc.ok) cfg = await rc.json();
  } catch { /* configurazione facoltativa */ }

  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync('assets/scocca.glb');
  const m = gltf.scene;

  // allineamento: scala e offset stanno in assets/scocca.json, così si registra
  // il modello sulle nostre quote senza ritoccare il codice.
  const s = cfg.scala ?? 100;                       // GLB in metri -> cm
  m.scale.setScalar(s);
  m.rotation.y = ((cfg.rotY ?? 0) * Math.PI) / 180;
  m.position.set(cfg.dx ?? 0, cfg.dy ?? 0, cfg.dz ?? 0);

  if (cfg.opacita != null) {
    m.traverse((n) => {
      if (!n.isMesh) return;
      n.material = n.material.clone();
      n.material.transparent = true;
      n.material.opacity = cfg.opacita;
      n.material.depthWrite = cfg.opacita > 0.6;
    });
  }
  parti.scocca.add(m);
  if (btnScocca) btnScocca.hidden = false;
}

caricaScocca().catch((e) => console.warn('scocca reale non caricata:', e.message));

aggiornaBottoni();
applicaVisibilita();
ridimensiona();
vista('tre-quarti');
requestAnimationFrame(loop);

// API usata dallo script di rendering (tools/render.mjs)
window.CC = {
  setStato(s) { Object.assign(target, s); Object.assign(anim, target); aggiornaBottoni(); applica(1); },
  setVisibili(v) { Object.assign(visibili, v); applicaVisibilita(); },
  setVista(nome) { vista(nome, true); },
  render,
  // esposti per gli script di rendering e per il debug dell'inquadratura
  camera, controls, parti,
  pronto: true,
};
