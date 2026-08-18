// Modello 3D navigabile dell'allestimento.
// Gira offline: Three.js è vendorizzato in vendor/, nessuna richiesta di rete.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { V } from '../../docs/disegni/quote.mjs';
import { costruisciAllestimento, COL, Y } from './modello.js';

// ---------------------------------------------------------------- scena

const canvas = document.getElementById('vista');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(COL.bg);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(COL.bg, 1100, 2600);

const camera = new THREE.PerspectiveCamera(32, 1, 10, 3000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 120;
controls.maxDistance = 1400;
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
  frigo: 0,
  letto: 0,        // 0 = ripiegato (giorno), 1 = disteso (notte)
  scrivania: 0,    // 0 = dentro (postazione PC), 1 = ruotata fuori (tavolo)
  persone: 1,
};
const target = { ...stato };     // valori animati
const anim = { ...stato };

const VISTE = {
  'tre-quarti': { pos: [-520, 380, -500], target: [-10, 130, 10] },
  'laterale':   { pos: [-880, 210, 30], target: [0, 128, 30] },
  'alto':       { pos: [-40, 900, 60], target: [0, 70, 20] },
  'posteriore': { pos: [-230, 240, -600], target: [0, 130, -30] },
  'interno':    { pos: [-45, 190, -300], target: [5, 120, 90] },
};

function vista(nome, immediata = false) {
  const v = VISTE[nome] || VISTE['tre-quarti'];
  camera.position.set(...v.pos);
  controls.target.set(...v.target);
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

  // metà mobile del letto: ruotando attorno alla cerniera passa da distesa
  // (in avanti, sopra i sedili) a ripiegata (sopra la metà posteriore).
  const lt = V.letto, cerniera = lt.off + lt.l / 2, braccio = lt.l / 4;
  const ang = (1 - anim.letto) * Math.PI;                 // 0 = distesa, π = ribaltata
  parti.lettoMobile.position.z = cerniera + Math.cos(ang) * braccio;
  parti.lettoMobile.position.y = Y(V.H + 7) + Math.sin(ang) * 15;   // scavalca la metà fissa
  parti.lettoMobile.rotation.x = -ang;

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
addEventListener('resize', ridimensiona);

// ---------------------------------------------------------------- interfaccia

const ETICHETTE = {
  tetto: ['SOFFIETTO CHIUSO', 'SOFFIETTO APERTO'],
  cucina: ['CUCINA A RIPOSO', 'CUCINA ESTRATTA'],
  frigo: ['FRIGO DENTRO', 'FRIGO ESTRATTO'],
  letto: ['LETTO RIPIEGATO', 'LETTO DISTESO'],
  scrivania: ['SCRIVANIA DENTRO', 'TAVOLO FUORI'],
  persone: ['SENZA PERSONE', 'CON PERSONE'],
};

function aggiornaBottoni() {
  for (const b of document.querySelectorAll('[data-stato]')) {
    const k = b.dataset.stato;
    b.textContent = ETICHETTE[k][target[k] ? 1 : 0];
    b.classList.toggle('on', !!target[k]);
  }
}

for (const b of document.querySelectorAll('[data-stato]')) {
  b.addEventListener('click', () => {
    const k = b.dataset.stato;
    target[k] = target[k] ? 0 : 1;
    if (k === 'letto' && target[k]) target.scrivania = 0;   // di notte la scrivania è d'intralcio
    if (k === 'scrivania' && target[k]) target.letto = 0;
    aggiornaBottoni();
  });
}
for (const b of document.querySelectorAll('[data-vista]')) {
  b.addEventListener('click', () => vista(b.dataset.vista));
}

aggiornaBottoni();
ridimensiona();
vista('tre-quarti');
requestAnimationFrame(loop);

// API usata dallo script di rendering (tools/render.mjs)
window.CC = {
  setStato(s) { Object.assign(target, s); Object.assign(anim, target); aggiornaBottoni(); applica(1); },
  setVista(nome) { vista(nome, true); },
  render,
  pronto: true,
};
