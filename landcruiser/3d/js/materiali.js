// Due modi di guardare lo stesso modello.
//
//   TECNICO   — tutto trasparente con gli spigoli in evidenza: serve a leggere
//               quote e ingombri, è la modalità con cui si progetta.
//   REALISTICO — superfici piene, legno, lamiera, vetro, ombre: serve a far
//               vedere il mezzo a chi non legge un disegno tecnico.
//
// Il modello è lo stesso: cambiano solo i materiali, in base al ruolo che ogni
// pezzo dichiara quando viene costruito (mesh.userData.ruolo).

import * as THREE from 'three';

/** Texture di multistrato: venatura chiara generata al volo, niente file. */
function texturaLegno(scuro = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = scuro ? '#6b4f2a' : '#c9a978';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 120; i++) {
    const y = Math.random() * 256;
    g.strokeStyle = `rgba(${scuro ? '40,28,14' : '150,116,70'},${0.06 + Math.random() * 0.12})`;
    g.lineWidth = 0.6 + Math.random() * 2.2;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin((x + i) / 22) * 2.4);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

/** Tessuto: trama fitta per materassi, cuscini e tela della tenda. */
function texturaTessuto(colore) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = colore;
  g.fillRect(0, 0, 128, 128);
  g.globalAlpha = 0.12;
  for (let i = 0; i < 128; i += 3) {
    g.fillStyle = i % 6 ? '#000' : '#fff';
    g.fillRect(i, 0, 1.5, 128);
    g.fillRect(0, i, 128, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  return t;
}

let cache = null;

function materiali() {
  if (cache) return cache;
  cache = {
    scocca: new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.42, metalness: 0.25 }),
    vetro: new THREE.MeshPhysicalMaterial({
      color: 0x1d2b33, roughness: 0.08, metalness: 0, transparent: true,
      opacity: 0.55, transmission: 0.35, thickness: 1,
    }),
    mobile: new THREE.MeshStandardMaterial({ map: texturaLegno(), roughness: 0.72, metalness: 0.02 }),
    piano: new THREE.MeshStandardMaterial({ map: texturaLegno(true), roughness: 0.5, metalness: 0.03 }),
    tessuto: new THREE.MeshStandardMaterial({ map: texturaTessuto('#8b9bab'), roughness: 1 }),
    tela: new THREE.MeshStandardMaterial({
      map: texturaTessuto('#c9a276'), roughness: 1, side: THREE.DoubleSide,
    }),
    metallo: new THREE.MeshStandardMaterial({ color: 0x8b959f, roughness: 0.35, metalness: 0.8 }),
    guscio: new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.55, metalness: 0.1 }),
    soffietto: new THREE.MeshStandardMaterial({
      map: texturaTessuto('#6f7a86'), roughness: 1, side: THREE.DoubleSide,
      transparent: true, opacity: 0.92,
    }),
    tecnico: new THREE.MeshStandardMaterial({ color: 0x2b3541, roughness: 0.6, metalness: 0.3 }),
    acqua: new THREE.MeshStandardMaterial({ color: 0x2f7fa8, roughness: 0.4, metalness: 0.1 }),
    energia: new THREE.MeshStandardMaterial({ color: 0xb5702a, roughness: 0.5, metalness: 0.35 }),
  };
  return cache;
}

/**
 * Applica il modo a tutta la scena.
 * @param {THREE.Object3D} root
 * @param {'tecnico'|'reale'} modo
 */
export function applicaModo(root, modo) {
  const M = materiali();
  const reale = modo === 'reale';

  root.traverse((n) => {
    if (n.isLineSegments || n.isLine) {
      // in modalità realistica restano solo gli spigoli della carrozzeria,
      // che fanno da linea di stacco; il resto sparisce
      const tieni = n.userData.ruolo === 'scocca';
      n.visible = reale ? tieni : true;
      if (n.material) n.material.opacity = reale ? 0.12 : (n.userData.opacitaOrig ?? n.material.opacity);
      return;
    }
    if (!n.isMesh) return;

    if (!n.userData.matOrig) n.userData.matOrig = n.material;
    const ruolo = n.userData.ruolo;

    if (!reale) {
      n.material = n.userData.matOrig;
      n.castShadow = n.receiveShadow = false;
      return;
    }

    n.material = M[ruolo] || n.userData.matOrig;
    if (ruolo === 'scocca') {
      // la scocca resta leggermente trasparente: altrimenti l'allestimento,
      // che è il soggetto del disegno, non si vede più
      n.material = M.scocca;
      n.material.transparent = true;
      n.material.opacity = 0.34;
      n.material.side = THREE.DoubleSide;
    }
    n.castShadow = ruolo !== 'suolo';
    n.receiveShadow = true;
  });
}
