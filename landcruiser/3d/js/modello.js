// Costruzione della geometria dell'allestimento a partire dalle quote condivise.
// Tutto è in centimetri: 1 unità Three.js = 1 cm.
//
// Riferimento: x = trasversale (0 = fiancata sx), y = altezza da terra,
//              z = longitudinale (0 = filo portellone, +z verso l'avanti).

import * as THREE from 'three';
import { V, CARROZZERIA as CAR, IMP, CABINA as CAB, EST, PORTE, STIV } from '../../docs/disegni/quote.mjs';

export const COL = {
  bg: 0x0d1219,
  carrozzeria: 0x8fa3b5,
  modulo: 0x263341,
  spigolo: 0xd7e2ec,
  ambra: 0xffb020,
  teal: 0x35d0c0,
  tessuto: 0x9fb3c4,
  persona: 0x6c8296,
  rame: 0xe08a3c,      // energia: batteria, cavi, convertitori
  acqua: 0x3aa0e0,     // idrico: serbatoi, boiler, pompa
  calore: 0xe0553a,    // riscaldamento e scarico
  vetro: 0x7fa8c8,
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
  // profilo laterale (z, y) sulle quote di catalogo: 484 lungo, 184,5 alto
  const p = [
    [-12, 45], [-12, 182], [230, 182], [246, 184.5], [320, 182],
    [354, 138], [434, 126], [476, 120], [484, 94], [484, 57],
    [462, 45], [300, 41], [-12, 45],
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

  parti.carrozzeria = carrozzeria();
  root.add(parti.carrozzeria);

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

  // --- impianti, cabina, esterni -------------------------------------------
  parti.impianti = gruppoImpianti();
  parti.cabina = gruppoCabina();
  parti.esterni = gruppoEsterni(parti);
  parti.etichette = gruppoEtichette();
  parti.portellone = gruppoPortellone();
  parti.porte = gruppoPorte();
  parti.tenda = gruppoTenda();
  root.add(parti.tenda);
  parti.stivaggio = gruppoStivaggio();
  parti.etichette.add(gruppoEtichetteExtra());
  root.add(parti.impianti, parti.cabina, parti.esterni, parti.etichette,
    parti.portellone, parti.porte, parti.stivaggio);

  // contenitore per la scocca reale caricata da assets/scocca.glb (se presente)
  parti.scocca = new THREE.Group();
  parti.scocca.visible = false;
  root.add(parti.scocca);

  // il modello è centrato sul vano, così l'orbita gira attorno all'allestimento
  root.position.set(-V.T / 2, 0, -80);
  return { root, parti };
}

// ===========================================================================
// Impianti, cabina, allestimento esterno.
// Servono a chi costruisce: ogni componente è alla sua quota reale, con
// l'etichetta di cosa è. Sono gruppi separati, accendibili e spegnibili.
// ===========================================================================

/** Componente definito con le quote di IMP: l = z, t = x, y relativo al pavimento. */
function comp(m, color, o = {}) {
  return box(
    { x0: m.t0, x1: m.t1, y0: Y(m.y0), y1: Y(m.y1), z0: m.l0, z1: m.l1 },
    color,
    { spigolo: o.spigolo ?? color, opacitaSpigoli: 0.9, opacity: o.opacity ?? 0.92, ...o }
  );
}

/** Etichetta leggibile a schermo, sempre rivolta alla camera. */
function etichetta(testo, [x, y, z], colore = '#d7e2ec') {
  const cv = document.createElement('canvas');
  const scala = 4;
  const ctx = cv.getContext('2d');
  ctx.font = `${11 * scala}px "DejaVu Sans Mono", monospace`;
  const w = Math.ceil(ctx.measureText(testo).width) + 14 * scala;
  cv.width = w;
  cv.height = 20 * scala;

  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(10,14,18,0.78)';
  c.fillRect(0, 0, cv.width, cv.height);
  c.strokeStyle = 'rgba(120,140,160,0.55)';
  c.lineWidth = scala;
  c.strokeRect(scala / 2, scala / 2, cv.width - scala, cv.height - scala);
  c.font = `${11 * scala}px "DejaVu Sans Mono", monospace`;
  c.fillStyle = colore;
  c.textBaseline = 'middle';
  c.fillText(testo, 7 * scala, cv.height / 2);

  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(cv.width / scala / 2.6, cv.height / scala / 2.6, 1);
  sp.position.set(x, y, z);
  sp.renderOrder = 10;
  return sp;
}

/** Centro di un componente, per appenderci l'etichetta. */
function centro(m, dy = 6) {
  return [(m.t0 + m.t1) / 2, Y((m.y0 + m.y1) / 2) + (m.y1 - m.y0) / 2 + dy, (m.l0 + m.l1) / 2];
}

function gruppoImpianti() {
  const g = new THREE.Group();

  // energia (rame)
  for (const k of ['batteria', 'mppt', 'inverter', 'shunt', 'fusibiliera', 'dcdc']) {
    g.add(comp(IMP[k], k === 'batteria' ? 0x3a2a16 : 0x2a2015, { spigolo: COL.rame }));
  }
  // acqua (azzurro)
  for (const k of ['serbGrigie', 'boiler', 'pompa', 'filtro']) {
    g.add(comp(IMP[k], 0x10222e, { spigolo: COL.acqua }));
  }
  // calore: riscaldatore sotto scocca, condotto e bocchette dentro
  for (const k of ['riscald', 'condotto', 'bocchetta1', 'bocchetta2', 'presaAria']) {
    g.add(comp(IMP[k], 0x2a1512, { spigolo: COL.calore }));
  }
  // schermo secondario incassato nel fianco del mobile
  g.add(comp(IMP.schermo2, 0x0a0e12, { spigolo: COL.spigolo, opacity: 1 }));

  // dorsale cavi: dal vano tecnico verso la cabina, sotto il piano
  const cavo = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(6, Y(20), 150),
        new THREE.Vector3(6, Y(20), 96),
        new THREE.Vector3(6, Y(46), 40),
        new THREE.Vector3(20, Y(46), 4),
      ]), 24, 1.6, 8, false
    ),
    new THREE.MeshStandardMaterial({ color: COL.rame, roughness: 0.7 })
  );
  g.add(cavo);

  // tubo acqua: serbatoio -> pompa -> boiler -> presa doccia esterna
  const tubo = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(V.serbatoio.t1 - 6, Y(6), (V.serbatoio.l0 + V.serbatoio.l1) / 2),
        new THREE.Vector3(68, Y(16), 128),
        new THREE.Vector3(96, Y(30), 140),
        new THREE.Vector3(120, Y(30), 96),
        new THREE.Vector3(126, Y(42), 20),
      ]), 28, 1.2, 8, false
    ),
    new THREE.MeshStandardMaterial({ color: COL.acqua, roughness: 0.6 })
  );
  g.add(tubo);

  return g;
}

function gruppoCabina() {
  const g = new THREE.Group();
  const matSed = { spigolo: COL.spigolo, opacitaSpigoli: 0.4, opacity: 0.85 };

  for (const s of [CAB.sedile, CAB.sedileDx]) {
    // seduta + schienale (quote assolute da terra: qui non passa per Y())
    g.add(box({ x0: s.t0, x1: s.t1, y0: s.y0, y1: s.y1, z0: s.l0 + 14, z1: s.l1 }, 0x232c36, matSed));
    g.add(box({
      x0: s.t0, x1: s.t1, y0: s.y1 - 6, y1: s.y1 + CAB.schienale.h,
      z0: s.l0, z1: s.l0 + CAB.schienale.sp,
    }, 0x232c36, matSed));
  }

  // plancia
  const p = CAB.plancia;
  g.add(box({ x0: p.t0, x1: p.t1, y0: p.y0, y1: p.y1, z0: p.l0, z1: p.l1 }, 0x1a222b, { opacity: 0.7 }));

  // volante
  const vol = new THREE.Mesh(
    new THREE.TorusGeometry(CAB.volante.r, 2.2, 8, 28),
    new THREE.MeshStandardMaterial({ color: 0x2b3541, roughness: 0.8 })
  );
  vol.position.set(CAB.volante.t, CAB.volante.y, CAB.volante.l);
  vol.rotation.x = Math.PI / 2 - 0.38;
  g.add(vol);

  // i due schermi della dashboard: 10,1" in plancia + 7" impianti di fianco
  const sc = CAB.schermo, sc2 = CAB.schermoSec;
  g.add(box({ x0: sc.t0, x1: sc.t0 + sc.w, y0: sc.y0, y1: sc.y0 + sc.h, z0: sc.l, z1: sc.l + 2.5 },
    0x0a0e12, { spigolo: COL.ambra, opacitaSpigoli: 1, opacity: 1 }));
  g.add(box({ x0: sc2.t0, x1: sc2.t0 + sc2.w, y0: sc2.y0, y1: sc2.y0 + sc2.h, z0: sc2.l, z1: sc2.l + 2.5 },
    0x0a0e12, { spigolo: COL.teal, opacitaSpigoli: 1, opacity: 1 }));

  // Raspberry Pi sotto il sedile passeggero
  const pi = CAB.pi;
  g.add(box({ x0: pi.t0, x1: pi.t1, y0: pi.y0, y1: pi.y1, z0: pi.l0, z1: pi.l1 },
    0x14262a, { spigolo: COL.teal, opacitaSpigoli: 0.9 }));

  return g;
}

function gruppoEsterni(parti) {
  const g = new THREE.Group();
  // pezzi montati sul guscio mobile: stanno in un altro genitore, quindi li
  // teniamo in lista per poterli accendere e spegnere insieme al gruppo.
  g.userData.suGuscio = [];
  const suGuscio = (n) => { parti.guscio.add(n); g.userData.suGuscio.push(n); return n; };

  // pannelli solari e oblò vivono sul guscio: si alzano con il soffietto
  const s = EST.solare;
  for (let i = 0; i < s.n; i++) {
    const x0 = s.t0 + i * (s.w + s.gap);
    suGuscio(box({
      x0, x1: x0 + s.w, y0: Y(V.H + 12), y1: Y(V.H + 12 + s.sp), z0: s.l0, z1: s.l0 + s.l,
    }, 0x101a2a, { spigolo: 0x2f6fb0, opacitaSpigoli: 0.95 }));
  }
  const ob = EST.oblo;
  suGuscio(box({
    x0: ob.t0, x1: ob.t1, y0: Y(V.H), y1: Y(V.H + 12), z0: ob.l0, z1: ob.l1,
  }, COL.vetro, { opacity: 0.22, spigolo: COL.vetro, opacitaSpigoli: 0.8 }));
  // ventola di estrazione (tipo MaxxFan): è il raffrescamento vero di bordo
  const pala = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 15, 3, 20),
    new THREE.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.8, transparent: true, opacity: 0.8 })
  );
  pala.position.set((ob.t0 + ob.t1) / 2, Y(V.H + 4), (ob.l0 + ob.l1) / 2);
  suGuscio(pala);

  // portapacchi sopra la cabina (la parte di tetto che non si alza)
  const r = EST.rack;
  const sporg = (CAR.larghezza - V.T) / 2;
  const rx0 = V.T / 2 - r.w / 2;
  g.add(box({ x0: rx0, x1: rx0 + r.w, y0: Y(V.H + 12), y1: Y(V.H + 12 + r.h), z0: r.l0, z1: r.l1 },
    0x1a222b, { opacity: 0.35, spigolo: COL.carrozzeria, opacitaSpigoli: 0.75 }));

  // cassonetto del tendalino sul fianco sinistro (la tela è in parti.tenda)
  const td = EST.tendalino;
  const tubo = new THREE.Mesh(
    new THREE.CylinderGeometry(td.d / 2, td.d / 2, td.l1 - td.l0, 14),
    new THREE.MeshStandardMaterial({ color: 0x2b3541, roughness: 0.8 })
  );
  tubo.rotation.x = Math.PI / 2;
  tubo.position.set(-sporg - td.d / 2, Y(V.H) + 2, (td.l0 + td.l1) / 2);
  g.add(tubo);

  // doccia esterna e presa di servizio sul fianco destro
  const d = EST.doccia;
  g.add(box({
    x0: V.T + sporg - d.sp, x1: V.T + sporg, y0: d.y0, y1: d.y1, z0: d.l0, z1: d.l1,
  }, 0x10222e, { spigolo: COL.acqua, opacitaSpigoli: 1 }));
  const pr = EST.presa;
  g.add(box({
    x0: V.T + sporg - 8, x1: V.T + sporg, y0: pr.y0, y1: pr.y1, z0: pr.l0, z1: pr.l1,
  }, 0x2a2015, { spigolo: COL.rame, opacitaSpigoli: 1 }));

  return g;
}

/**
 * Portellone posteriore incernierato sul fianco sinistro, con la ruota di
 * scorta montata sopra. Il gruppo ha l'origine sulla cerniera: per aprirlo
 * basta ruotarlo attorno a Y.
 *
 * ⚠️ Su quale fianco stia la cerniera va confermato sul mezzo vero (scheda di
 * rilievo, doc 02): è la quota che decide da che lato si estrae la cucina.
 */
function gruppoPortellone() {
  const g = new THREE.Group();
  const sporg = (CAR.larghezza - V.T) / 2;
  const cerniera = { x: -sporg, z: -9 };
  const larg = CAR.larghezza - 4;
  const yBasso = 62, yAlto = Y(V.H) + 10;

  // Nota sul verso: la cerniera è a sinistra e il battente spazza dietro/sinistra,
  // così il lato destro — cucina estratta e chi cucina — resta libero.
  // pannello + luce del lunotto, in coordinate relative alla cerniera
  g.add(box({ x0: 2, x1: larg, y0: yBasso, y1: yAlto, z0: -3, z1: 3 },
    COL.carrozzeria, { opacity: 0.14, spigolo: COL.carrozzeria, opacitaSpigoli: 0.7 }));
  g.add(box({ x0: 14, x1: larg - 12, y0: yAlto - 52, y1: yAlto - 8, z0: -1, z1: 1 },
    COL.vetro, { opacity: 0.2, spigolo: COL.vetro, opacitaSpigoli: 0.6 }));

  const sc = EST.scorta;
  const ruota = new THREE.Mesh(
    new THREE.CylinderGeometry(sc.r, sc.r, sc.w, 24),
    new THREE.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.95 })
  );
  ruota.rotation.x = Math.PI / 2;
  ruota.position.set(sc.t - cerniera.x, sc.y, sc.l - cerniera.z);
  g.add(ruota);

  g.position.set(cerniera.x, 0, cerniera.z);
  return g;
}

function gruppoEtichette() {
  const g = new THREE.Group();
  const add = (m, colore) => { if (m && m.et) g.add(etichetta(m.et, centro(m), colore)); };

  ['batteria', 'mppt', 'inverter', 'dcdc', 'shunt', 'fusibiliera'].forEach((k) => add(IMP[k], '#e08a3c'));
  ['serbGrigie', 'boiler', 'pompa'].forEach((k) => add(IMP[k], '#3aa0e0'));
  add(IMP.riscald, '#e0553a');

  // serbatoio acqua chiara: la quota sta in V, non in IMP
  const sb = V.serbatoio;
  g.add(etichetta('acqua chiara 60 L',
    [(sb.t0 + sb.t1) / 2, Y(sb.h) + 8, (sb.l0 + sb.l1) / 2], '#3aa0e0'));

  // cabina ed esterni
  g.add(etichetta(CAB.schermo.et, [CAB.schermo.t0 + CAB.schermo.w / 2, CAB.schermo.y0 + 24, CAB.schermo.l], '#ffb020'));
  g.add(etichetta(CAB.pi.et, [(CAB.pi.t0 + CAB.pi.t1) / 2, CAB.pi.y1 + 10, (CAB.pi.l0 + CAB.pi.l1) / 2], '#35d0c0'));

  const sporg = (CAR.larghezza - V.T) / 2;
  g.add(etichetta(EST.solare.et, [V.T / 2, Y(V.H + 26), EST.solare.l0 + EST.solare.l / 2], '#2f6fb0'));
  g.add(etichetta(EST.doccia.et, [V.T + sporg + 22, EST.doccia.y1 + 8, (EST.doccia.l0 + EST.doccia.l1) / 2], '#3aa0e0'));
  g.add(etichetta(EST.scorta.et, [EST.scorta.t, EST.scorta.y + EST.scorta.r + 10, EST.scorta.l], '#8fa3b5'));

  return g;
}


// ===========================================================================
// Aperture e stivaggio.
// ===========================================================================

/** Sagoma delle porte sulle due fiancate: dove si apre, lì non si addossa nulla. */
function gruppoPorte() {
  const g = new THREE.Group();
  const sporg = (CAR.larghezza - V.T) / 2;
  const lati = [-sporg, V.T + sporg];

  for (const p of [PORTE.ant, PORTE.post]) {
    for (const x of lati) {
      const sp = x < 0 ? 3 : -3;
      g.add(box({
        x0: Math.min(x, x + sp), x1: Math.max(x, x + sp),
        y0: p.y0, y1: p.y1, z0: p.l0, z1: p.l1,
      }, 0x1b2733, { opacity: 0.16, spigolo: COL.ambra, opacitaSpigoli: 0.8 }));
      // montante della cerniera, sul lato anteriore della porta
      g.add(box({
        x0: Math.min(x, x + sp * 1.6), x1: Math.max(x, x + sp * 1.6),
        y0: p.y0, y1: p.y1, z0: p.l1 - 3, z1: p.l1,
      }, COL.ambra, { opacity: 0.5, spigolo: COL.ambra, opacitaSpigoli: 1 }));
    }
  }

  // finestrini del vano: l'unica luce naturale dietro, e il punto in cui il
  // mobile alto non deve arrivare
  const vl = PORTE.vetroLat;
  for (const x of lati) {
    const sp = x < 0 ? 2 : -2;
    g.add(box({
      x0: Math.min(x, x + sp), x1: Math.max(x, x + sp),
      y0: vl.y0, y1: vl.y1, z0: vl.l0, z1: vl.l1,
    }, COL.vetro, { opacity: 0.18, spigolo: COL.vetro, opacitaSpigoli: 0.55 }));
  }
  return g;
}

/** Litri di un volume definito con le solite quote. */
function litri(m) {
  const dy = m.y1 - m.y0;
  return ((m.t1 - m.t0) * dy * (m.l1 - m.l0)) / 1000;
}

/**
 * Mensole, pensili e tasche. Le mensole hanno un bordo di ritenuta: senza,
 * su sterrato, il contenuto finisce per terra al primo avvallamento.
 */
function gruppoStivaggio() {
  const g = new THREE.Group();
  const mens = (m) => {
    const y0 = Y(m.y0), y1 = Y(m.y1);
    g.add(box({ x0: m.t0, x1: m.t1, y0, y1, z0: m.l0, z1: m.l1 },
      0x3a2e12, { spigolo: COL.ambra, opacitaSpigoli: 0.9, opacity: 0.9 }));
    if (m.bordo) {
      // bordo sul lato aperto (verso il centro del vano)
      const versoDestra = m.t0 < V.T / 2;
      const xb = versoDestra ? m.t1 : m.t0 - 2;
      g.add(box({ x0: xb, x1: xb + 2, y0: y1, y1: y1 + m.bordo, z0: m.l0, z1: m.l1 },
        0x3a2e12, { spigolo: COL.ambra, opacitaSpigoli: 0.9 }));
    }
  };

  mens(STIV.mensolaSx);
  mens(STIV.mensolaDx);

  for (const k of ['pensile', 'gavoneArcoSx', 'gavoneArcoDx']) {
    const m = STIV[k];
    g.add(box({ x0: m.t0, x1: m.t1, y0: Y(m.y0), y1: Y(m.y1), z0: m.l0, z1: m.l1 },
      COL.modulo, { spigolo: COL.spigolo, opacitaSpigoli: 0.55, opacity: 0.5 }));
  }

  // tasche sul portellone e rete nel soffietto: elementi morbidi, solo contorno
  for (const k of ['tascaPort', 'reteSoffietto']) {
    const m = STIV[k];
    g.add(box({ x0: m.t0, x1: m.t1, y0: Y(m.y0), y1: Y(m.y1), z0: m.l0, z1: m.l1 },
      COL.tessuto, { soloSpigoli: true, opacitaSpigoli: 0.75 }));
  }
  return g;
}

/** Etichette di stivaggio e aperture, con i litri calcolati dalle quote. */
function gruppoEtichetteExtra() {
  const g = new THREE.Group();
  for (const [k, m] of Object.entries(STIV)) {
    const testo = `${m.et} · ${litri(m).toFixed(0)} L`;
    g.add(etichetta(testo, centro(m, 3), '#ffb020'));
  }
  const tot = Object.values(STIV).reduce((a, m) => a + litri(m), 0);
  g.add(etichetta(`stivaggio totale ${tot.toFixed(0)} L`, [V.T / 2, Y(V.H) + 34, 80], '#ffffff'));

  const sporg = (CAR.larghezza - V.T) / 2;
  for (const p of [PORTE.ant, PORTE.post]) {
    g.add(etichetta(p.et, [V.T + sporg + 26, (p.y0 + p.y1) / 2 + 26, (p.l0 + p.l1) / 2], '#ffb020'));
  }
  return g;
}


/**
 * Tenda a ventaglio da 270°, come le batwing da rack: N settori incernierati
 * sullo stesso perno, che da chiusi stanno impilati sul cassonetto e da aperti
 * coprono il fianco e il dietro. Ogni settore è un gruppo separato, così
 * l'apertura si anima ruotandoli a ventaglio.
 */
function gruppoTenda() {
  const g = new THREE.Group();
  const td = EST.tenda, sporg = (CAR.larghezza - V.T) / 2;
  const mat = new THREE.MeshStandardMaterial({
    color: 0xc8a06a, roughness: 0.95, side: THREE.DoubleSide,
    transparent: true, opacity: 0.55,
  });
  const matBordo = new THREE.LineBasicMaterial({ color: 0xe0b478, transparent: true, opacity: 0.7 });

  const passo = (td.angolo / td.settori) * (Math.PI / 180);
  g.settori = [];

  for (let i = 0; i < td.settori; i++) {
    const s = new THREE.Group();
    // triangolo nel piano orizzontale, con l'orlo esterno che scende di `caduta`
    const p0 = new THREE.Vector3(0, 0, 0);
    const p1 = new THREE.Vector3(td.raggio, -td.caduta, 0);
    const p2 = new THREE.Vector3(
      td.raggio * Math.cos(passo), -td.caduta, -td.raggio * Math.sin(passo)
    );
    const geo = new THREE.BufferGeometry().setFromPoints([p0, p1, p2]);
    geo.computeVertexNormals();
    s.add(new THREE.Mesh(geo, mat));

    // stecca di bordo: è quella che dà la forma alla tela
    s.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p0, p1]), matBordo));
    g.add(s);
    g.settori.push(s);
  }

  // due piedi telescopici, visibili solo a tenda aperta: arrivano a terra
  const quotaPerno = Y(V.H) + td.alt;
  const lungPiede = quotaPerno - td.caduta;
  const matPiede = new THREE.MeshStandardMaterial({ color: 0x2b3541, roughness: 0.8 });
  g.piedi = [];
  for (const a of [12, td.angolo - 12]) {
    const rad = (a * Math.PI) / 180;
    const piede = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, lungPiede, 10), matPiede);
    // stesso sistema di riferimento dei settori: x = cos, z = -sin
    piede.position.set(
      td.raggio * 0.96 * Math.cos(rad),
      -td.caduta - lungPiede / 2,
      -td.raggio * 0.96 * Math.sin(rad)
    );
    g.add(piede);
    g.piedi.push(piede);
  }

  g.position.set(-sporg - 6, quotaPerno, td.perno);
  g.rotation.y = (td.ang0 * Math.PI) / 180;
  return g;
}
