// Costruzione della geometria dell'allestimento a partire dalle quote condivise.
// Tutto è in centimetri: 1 unità Three.js = 1 cm.
//
// Riferimento: x = trasversale (0 = fiancata sx), y = altezza da terra,
//              z = longitudinale (0 = filo portellone, +z verso l'avanti).

import * as THREE from 'three';
import { V, CARROZZERIA as CAR } from '../../docs/disegni/quote.mjs';

export const COL = {
  bg: 0x0d1219,
  carrozzeria: 0x8fa3b5,
  modulo: 0x263341,
  spigolo: 0xd7e2ec,
  ambra: 0xffb020,
  teal: 0x35d0c0,
  tessuto: 0x9fb3c4,
  persona: 0x6c8296,
};

/** Altezza assoluta a partire dalla quota interna h (0 = pavimento del vano). */
export const Y = (h) => V.pavTerra + h;

/** Scatola con spigoli evidenziati, nello stesso stile delle tavole 2D. */
export function box({ x0, x1, y0, y1, z0, z1 }, color = COL.modulo, o = {}) {
  const g = new THREE.Group();
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const geo = new THREE.BoxGeometry(w, h, d);

  if (!o.soloSpigoli) {
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color,
      roughness: o.roughness ?? 0.85,
      metalness: o.metalness ?? 0.05,
      transparent: o.opacity != null,
      opacity: o.opacity ?? 1,
      depthWrite: o.opacity == null || o.opacity > 0.6,
    }));
    g.add(mesh);
  }

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({
      color: o.spigolo ?? (o.soloSpigoli ? color : COL.spigolo),
      transparent: true,
      opacity: o.opacitaSpigoli ?? (o.soloSpigoli ? 0.9 : 0.35),
    })
  );
  g.add(edges);

  g.position.set(x0 + w / 2, y0 + h / 2, z0 + d / 2);
  return g;
}

/** Modulo dell'allestimento definito con le quote dei disegni (l = z, t = x). */
function modulo(m, h0, h1, color, o) {
  return box({ x0: m.t0, x1: m.t1, y0: Y(h0), y1: Y(h1), z0: m.l0, z1: m.l1 }, color, o);
}

/** Sagoma umana stilizzata, in piedi o seduta. */
export function persona({ seduta = false } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: COL.persona, roughness: 0.9 });
  const add = (geo, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    g.add(m);
    return m;
  };
  const cil = (r, l) => new THREE.CapsuleGeometry(r, l, 4, 10);

  if (seduta) {
    add(cil(9, 46), 0, 88, 0);                       // busto
    add(new THREE.SphereGeometry(10, 16, 12), 0, 124, 0);
    add(cil(6, 38), -9, 60, -22, Math.PI / 2);       // cosce
    add(cil(6, 38), 9, 60, -22, Math.PI / 2);
    add(cil(5, 36), -9, 40, -40);                    // gambe
    add(cil(5, 36), 9, 40, -40);
    add(cil(4.5, 34), -14, 84, -16, Math.PI / 2.6);  // braccia verso il piano
    add(cil(4.5, 34), 14, 84, -16, Math.PI / 2.6);
  } else {
    add(cil(10, 52), 0, 118, 0);
    add(new THREE.SphereGeometry(10.5, 16, 12), 0, 162, 0);
    add(cil(6.5, 62), -10, 47, 0);
    add(cil(6.5, 62), 10, 47, 0);
    add(cil(4.8, 46), -19, 116, 6, 0.5);
    add(cil(4.8, 46), 19, 116, 6, 0.5);
  }
  return g;
}

/** Carrozzeria: profilo laterale estruso in larghezza + ruote. */
function carrozzeria() {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  const p = [
    [-12, 45], [-12, 186], [230, 186], [246, 190], [318, 186],
    [352, 140], [430, 128], [472, 122], [478, 96], [478, 58],
    [458, 46], [300, 42], [-12, 45],
  ];
  s.moveTo(p[0][0], p[0][1]);
  p.slice(1).forEach(([z, y]) => s.lineTo(z, y));

  const geo = new THREE.ExtrudeGeometry(s, { depth: CAR.larghezza, bevelEnabled: false });
  // Il profilo è disegnato nel piano (z, y) ed estruso lungo +z: ruotandolo di
  // -90° attorno a Y l'estrusione diventa la larghezza e il profilo torna nel
  // verso giusto (con +90° il veicolo risulterebbe specchiato in lunghezza).
  geo.rotateY(-Math.PI / 2);
  geo.translate(V.T + (CAR.larghezza - V.T) / 2, 0, 0);

  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: COL.carrozzeria, transparent: true, opacity: 0.09,
    roughness: 0.6, side: THREE.DoubleSide, depthWrite: false,
  }));
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: COL.carrozzeria, transparent: true, opacity: 0.5 })
  );
  g.add(mesh, edges);

  // ruote
  const ruota = new THREE.CylinderGeometry(CAR.ruota.r, CAR.ruota.r, CAR.ruota.w, 22);
  ruota.rotateZ(Math.PI / 2);
  const matR = new THREE.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.95 });
  const sporgenza = (CAR.larghezza - V.T) / 2;
  for (const z of [CAR.assePost, CAR.assePost + CAR.passo]) {
    for (const x of [-sporgenza + 6, V.T + sporgenza - 6]) {
      const m = new THREE.Mesh(ruota, matR);
      m.position.set(x, CAR.ruota.r, z);
      g.add(m);
      const cerchio = new THREE.Mesh(
        new THREE.TorusGeometry(CAR.ruota.r * 0.55, 2, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0x4a5b6b, roughness: 0.7 })
      );
      cerchio.position.set(x + (x < 0 ? -1 : 1) * (CAR.ruota.w / 2), CAR.ruota.r, z);
      cerchio.rotation.y = Math.PI / 2;
      g.add(cerchio);
    }
  }
  return g;
}

/**
 * Costruisce l'intera scena e restituisce i riferimenti alle parti mobili,
 * così che l'interfaccia possa animarle.
 */
export function costruisciAllestimento() {
  const root = new THREE.Group();
  const parti = {};

  root.add(carrozzeria());

  // --- terreno -----------------------------------------------------------
  const suolo = new THREE.Mesh(
    new THREE.CircleGeometry(700, 48).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x11171e, roughness: 1 })
  );
  suolo.position.set(V.T / 2, 0, 140);
  suolo.receiveShadow = true;
  root.add(suolo);

  // --- pavimento e falso pavimento ---------------------------------------
  root.add(box({ x0: 0, x1: V.T, y0: Y(0) - 2, y1: Y(0), z0: 0, z1: V.L }, 0x1b232c));
  root.add(box({ x0: 0, x1: V.T, y0: Y(0), y1: Y(V.falsoPav), z0: 0, z1: V.L }, 0x1b232c, { opacity: 0.55 }));
  root.add(modulo(V.serbatoio, 0, V.serbatoio.h, 0x0f2a2c, { spigolo: COL.teal, opacitaSpigoli: 0.8 }));

  // --- passaruota ---------------------------------------------------------
  const a = V.arco;
  for (const [t0, t1] of [[0, a.w], [V.T - a.w, V.T]]) {
    root.add(box({ x0: t0, x1: t1, y0: Y(0), y1: Y(a.h), z0: a.l0, z1: a.l1 }, 0x151d25, { opacity: 0.9 }));
  }

  // --- moduli fissi -------------------------------------------------------
  root.add(modulo(V.cassetti, V.falsoPav, 31, COL.modulo));
  root.add(modulo(V.cassetti, 31, V.piano, COL.modulo));
  root.add(modulo(V.attrezzi, V.falsoPav, V.piano, COL.modulo));
  root.add(modulo(V.tecnico, V.falsoPav, V.piano, 0x14262a, { spigolo: COL.teal, opacitaSpigoli: 0.7 }));
  root.add(modulo(V.stiva, V.falsoPav, V.piano, COL.modulo));

  // cassa amovibile del pozzetto: solo spigoli, è quella che si toglie
  parti.cassa = modulo(V.pozzetto, V.falsoPav, V.piano, COL.teal, { soloSpigoli: true });
  root.add(parti.cassa);

  // --- piano continuo, interrotto sul pozzetto ---------------------------
  const pianoY = [Y(V.piano), Y(V.piano + V.pianoSp)];
  root.add(box({ x0: 0, x1: V.T, y0: pianoY[0], y1: pianoY[1], z0: 0, z1: V.pozzetto.l0 }, 0x3a2e12, { spigolo: COL.ambra, opacitaSpigoli: 0.8 }));
  root.add(box({ x0: 0, x1: V.pozzetto.t0, y0: pianoY[0], y1: pianoY[1], z0: V.pozzetto.l0, z1: V.pozzetto.l1 }, 0x3a2e12, { spigolo: COL.ambra, opacitaSpigoli: 0.8 }));
  root.add(box({ x0: V.pozzetto.t1, x1: V.T, y0: pianoY[0], y1: pianoY[1], z0: V.pozzetto.l0, z1: V.pozzetto.l1 }, 0x3a2e12, { spigolo: COL.ambra, opacitaSpigoli: 0.8 }));
  root.add(box({ x0: 0, x1: V.T, y0: pianoY[0], y1: pianoY[1], z0: V.pozzetto.l1, z1: V.L }, 0x3a2e12, { spigolo: COL.ambra, opacitaSpigoli: 0.8 }));

  // --- seduta -------------------------------------------------------------
  root.add(box({ x0: 0, x1: V.T, y0: Y(V.piano + V.pianoSp), y1: Y(V.piano + 8), z0: V.seduta.l0, z1: V.L }, 0x2b3541));
  root.add(box({ x0: 0, x1: V.T, y0: Y(V.piano + 8), y1: Y(V.piano + 48), z0: V.L, z1: V.L + 6 }, 0x2b3541));

  // --- frigo su slitta ----------------------------------------------------
  parti.frigo = modulo(V.frigo, 0, V.frigo.h, 0x123033, { spigolo: COL.teal, opacitaSpigoli: 0.9 });
  root.add(parti.frigo);

  // --- cucina estraibile --------------------------------------------------
  const cu = V.cucina;
  parti.cucina = new THREE.Group();
  parti.cucina.add(box({ x0: cu.t0, x1: cu.t1, y0: Y(0), y1: Y(cu.h), z0: cu.l0, z1: cu.l1 }, 0x3a2e12, { spigolo: COL.ambra, opacitaSpigoli: 0.95 }));
  // fornello e lavello sul piano del blocco
  parti.cucina.add(box({ x0: cu.t0 + 3, x1: cu.t0 + 47, y0: Y(cu.h), y1: Y(cu.h + 4), z0: 6, z1: 38 }, 0x1b232c, { spigolo: COL.ambra }));
  parti.cucina.add(box({ x0: cu.t0 + 50, x1: cu.t0 + 82, y0: Y(cu.h - 12), y1: Y(cu.h), z0: 8, z1: 36 }, 0x0f2a2c, { spigolo: COL.teal }));
  root.add(parti.cucina);

  // --- scrivania su braccio orientabile ----------------------------------
  const sc = V.scrivania;
  parti.scrivania = new THREE.Group();          // il gruppo ruota attorno al perno
  const perno = { x: sc.t0, z: sc.l0 + 3 };
  const piano = box({
    x0: 0, x1: sc.t1 - sc.t0, y0: Y(sc.h), y1: Y(sc.h + 3),
    z0: 0, z1: sc.l1 - sc.l0,
  }, 0x3a2e12, { spigolo: COL.ambra, opacitaSpigoli: 0.95 });
  const colonna = box({ x0: -3, x1: 3, y0: Y(V.piano), y1: Y(sc.h), z0: -3, z1: 3 }, 0x2b3541);
  parti.scrivania.add(piano, colonna);
  parti.scrivania.position.set(perno.x, 0, perno.z);
  root.add(parti.scrivania);

  // laptop appoggiato sulla scrivania
  parti.laptop = box({ x0: 18, x1: 52, y0: Y(sc.h + 3), y1: Y(sc.h + 25), z0: 31, z1: 34 }, 0x2b3541, { spigolo: COL.spigolo });
  parti.scrivania.add(parti.laptop);

  // --- tetto a soffietto ---------------------------------------------------
  const sporgenza = (CAR.larghezza - V.T) / 2;
  parti.guscio = new THREE.Group();
  parti.guscio.add(box({
    x0: -sporgenza, x1: V.T + sporgenza, y0: Y(V.H), y1: Y(V.H + 12), z0: -12, z1: 230,
  }, 0x1c2530, { spigolo: COL.carrozzeria, opacitaSpigoli: 0.7 }));

  // tessuto del soffietto: si allunga con il sollevamento
  parti.tessuto = box({
    x0: -sporgenza + 3, x1: V.T + sporgenza - 3, y0: Y(V.H) - 1, y1: Y(V.H), z0: -9, z1: 227,
  }, COL.tessuto, { opacity: 0.18, spigolo: COL.tessuto, opacitaSpigoli: 0.45 });
  root.add(parti.tessuto, parti.guscio);

  // --- letto ---------------------------------------------------------------
  const lt = V.letto;
  parti.letto = new THREE.Group();
  parti.lettoFisso = box({ x0: 0, x1: lt.t, y0: Y(V.H), y1: Y(V.H + 14), z0: lt.off, z1: lt.off + lt.l / 2 }, 0x123033, { spigolo: COL.teal, opacitaSpigoli: 0.9 });
  parti.lettoMobile = box({ x0: 0, x1: lt.t, y0: Y(V.H), y1: Y(V.H + 14), z0: lt.off + lt.l / 2, z1: lt.off + lt.l }, 0x123033, { spigolo: COL.teal, opacitaSpigoli: 0.9 });
  parti.letto.add(parti.lettoFisso, parti.lettoMobile);
  root.add(parti.letto);

  // --- persone -------------------------------------------------------------
  parti.cuoco = persona();
  parti.cuoco.position.set(V.T + 26, 0, -34);   // di fianco alla cucina estratta
  parti.cuoco.rotation.y = -Math.PI / 2;
  root.add(parti.cuoco);

  parti.seduto = persona({ seduta: true });
  // l'origine della sagoma seduta è ai piedi: appoggiano sul falso pavimento
  parti.seduto.position.set(V.T / 2, Y(V.falsoPav), 150);
  root.add(parti.seduto);

  // il modello è centrato sul vano, così l'orbita gira attorno all'allestimento
  root.position.set(-V.T / 2, 0, -80);
  return { root, parti };
}
