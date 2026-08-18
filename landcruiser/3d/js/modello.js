// Costruzione della geometria dell'allestimento a partire dalle quote condivise.
// Tutto è in centimetri: 1 unità Three.js = 1 cm.
//
// Riferimento: x = trasversale (0 = fiancata sx), y = altezza da terra,
//              z = longitudinale (0 = filo portellone, +z verso l'avanti).

import * as THREE from 'three';
import { V, CARROZZERIA as CAR, IMP, CABINA as CAB, EST, PORTE, STIV, PORT } from '../../docs/disegni/quote.mjs';

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

/**
 * Carrozzeria del Prado: profilo laterale vero, parafanghi svasati, pedane,
 * snorkel, rack a piattaforma sul tetto. Resta traslucida — serve a leggere gli
 * ingombri dell'allestimento — ma le forme sono quelle del mezzo, non una scatola.
 */
function carrozzeria() {
  const g = new THREE.Group();
  const sporg = (CAR.larghezza - V.T) / 2;
  const xDx = V.T + sporg, xSx = -sporg;

  // Il profilo è disegnato una volta su una sagoma di riferimento 484 × 186 e
  // poi riscalato sulle quote reali del mezzo: cambiando generazione bastano i
  // numeri in CARROZZERIA, la forma segue.
  const kz = CAR.lunghezza / 484, ky = CAR.altezza / 186;
  const Z = (v) => v * kz, YY = (v) => v * ky;

  // profilo laterale (z, y) in cm: coda squadrata, padiglione piatto,
  // montante A inclinato, cofano quasi orizzontale, muso corto
  const pRif = [
    [-14, 44], [-14, 104], [-13, 158], [-11, 180], [-6, 186],
    [110, 187], [232, 186],
    [246, 185], [268, 176], [296, 154],      // parabrezza
    [318, 149], [378, 146], [424, 143],      // cofano
    [448, 138], [464, 122],                  // calandra
    [472, 100], [474, 74],
    [466, 58], [440, 50], [300, 47], [150, 47], [30, 48], [-8, 50],
  ];
  const p = pRif.map(([z, y]) => [Z(z), YY(y)]);
  const shape = new THREE.Shape();
  shape.moveTo(p[0][0], p[0][1]);
  p.slice(1).forEach(([z, y]) => shape.lineTo(z, y));
  shape.closePath();

  // passaruota: fori a mezzaluna nel profilo
  for (const zc of [CAR.assePost, CAR.assePost + CAR.passo]) {
    const r = CAR.ruota.r + 11;
    const arco = new THREE.Path();
    arco.absarc(zc, CAR.ruota.r + 4, r, Math.PI, 0, true);
    arco.lineTo(zc + r, 40);
    arco.lineTo(zc - r, 40);
    shape.holes.push(arco);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: CAR.larghezza - 10, bevelEnabled: true,
    bevelThickness: 5, bevelSize: 5, bevelSegments: 2,
  });
  geo.rotateY(-Math.PI / 2);
  geo.translate(xDx - 5, 0, 0);

  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: COL.carrozzeria, transparent: true, opacity: 0.1,
    roughness: 0.5, side: THREE.DoubleSide, depthWrite: false,
  })));
  g.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 26),
    new THREE.LineBasicMaterial({ color: COL.carrozzeria, transparent: true, opacity: 0.5 })
  ));

  // vetratura sopra la linea di cintura
  const vetro = new THREE.Shape();
  const pv = [[4, 152], [4, 180], [234, 179], [250, 177], [290, 155], [238, 152]]
    .map(([z, y]) => [Z(z), YY(y)]);
  vetro.moveTo(pv[0][0], pv[0][1]);
  pv.slice(1).forEach(([z, y]) => vetro.lineTo(z, y));
  vetro.closePath();
  const geoV = new THREE.ExtrudeGeometry(vetro, { depth: CAR.larghezza - 16, bevelEnabled: false });
  geoV.rotateY(-Math.PI / 2);
  geoV.translate(xDx - 8, 0, 0);
  g.add(new THREE.Mesh(geoV, new THREE.MeshStandardMaterial({
    color: COL.vetro, transparent: true, opacity: 0.16,
    roughness: 0.15, side: THREE.DoubleSide, depthWrite: false,
  })));

  const matScuro = new THREE.MeshStandardMaterial({ color: 0x1b232c, roughness: 0.92 });
  const matNero = new THREE.MeshStandardMaterial({ color: 0x141a21, roughness: 0.96 });

  // parafanghi svasati: la firma di un Prado allestito
  for (const zc of [CAR.assePost, CAR.assePost + CAR.passo]) {
    for (const x of [xSx, xDx]) {
      const flare = new THREE.Mesh(
        new THREE.TorusGeometry(CAR.ruota.r + 9, 4.5, 8, 20, Math.PI),
        matNero
      );
      flare.rotation.y = Math.PI / 2;
      flare.position.set(x + (x < 0 ? -2 : 2), CAR.ruota.r + 2, zc);
      g.add(flare);
    }
  }

  // pedane laterali fra i passaruota
  for (const x of [xSx - 4, xDx + 4]) {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 190), matNero);
    ped.position.set(x, YY(56), (CAR.assePost + CAR.passo / 2) - 18);
    g.add(ped);
  }

  // paraurti
  const par = (z0, z1, y) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(CAR.larghezza + 4, 22, z1 - z0), matScuro);
    b.position.set(V.T / 2, y, (z0 + z1) / 2);
    g.add(b);
  };
  par(Z(-24), Z(-13), YY(58));
  par(Z(470), Z(484), YY(62));

  // snorkel sul montante anteriore destro
  const snorkel = new THREE.Group();
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 96, 12), matNero);
  tubo.position.set(0, 48, 0);
  const presa = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 16, 12), matNero);
  presa.position.set(0, 100, 0);
  snorkel.add(tubo, presa);
  snorkel.position.set(xDx + 3, YY(122), Z(292));
  g.add(snorkel);

  // rack a piattaforma sopra la cabina (dove nelle foto stanno tenda e faretti)
  const rack = new THREE.Mesh(new THREE.BoxGeometry(CAR.larghezza - 26, 5, 96), matScuro);
  rack.position.set(V.T / 2, CAR.altezza + 3, Z(205));
  g.add(rack);
  for (const z of [162, 205, 248]) {
    const trav = new THREE.Mesh(new THREE.BoxGeometry(CAR.larghezza - 20, 4, 5), matNero);
    trav.position.set(V.T / 2, CAR.altezza + 6, Z(z));
    g.add(trav);
  }

  // specchietti
  for (const x of [xSx - 10, xDx + 10]) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(12, 9, 5), matScuro);
    sp.position.set(x, YY(150), Z(300));
    g.add(sp);
  }

  // ruote: pneumatico all-terrain alto di spalla + cerchio
  const gomma = new THREE.CylinderGeometry(CAR.ruota.r, CAR.ruota.r, CAR.ruota.w, 28);
  gomma.rotateZ(Math.PI / 2);
  for (const z of [CAR.assePost, CAR.assePost + CAR.passo]) {
    for (const x of [xSx + 9, xDx - 9]) {
      const m = new THREE.Mesh(gomma, matNero);
      m.position.set(x, CAR.ruota.r, z);
      g.add(m);
      const cerchio = new THREE.Mesh(
        new THREE.CylinderGeometry(CAR.ruota.r * 0.58, CAR.ruota.r * 0.58, 2.5, 22),
        new THREE.MeshStandardMaterial({ color: 0x66788c, roughness: 0.55 })
      );
      cerchio.rotation.z = Math.PI / 2;
      cerchio.position.set(x + (x < V.T / 2 ? -1 : 1) * (CAR.ruota.w / 2 + 0.5), CAR.ruota.r, z);
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

  // Serbatoio gasolio originale: non è un componente del camper, è un vincolo.
  // Sta fra gli assi sotto il pavimento e da lì non si sposta.
  const sm = V.serbatoioMezzo;
  root.add(box({ x0: sm.t0, x1: sm.t1, y0: Y(sm.y0), y1: Y(sm.y1), z0: sm.l0, z1: sm.l1 },
    0x2a2418, { spigolo: 0xb08040, opacitaSpigoli: 0.85, opacity: 0.75 }));

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

  // --- letto matrimoniale nel soffietto ------------------------------------
  // Sta tutto sul guscio: sale con lui e usa la larghezza piena del tetto,
  // non quella del vano. Metà fissa + metà che si ribalta di giorno.
  const lt = V.letto;
  const ltX0 = (V.T - lt.t) / 2;
  parti.letto = new THREE.Group();

  const doga = (z0, z1) => box(
    { x0: ltX0, x1: ltX0 + lt.t, y0: Y(V.H), y1: Y(V.H + 4), z0, z1 },
    0x1b232c, { spigolo: COL.spigolo, opacitaSpigoli: 0.5, opacity: 0.85 }
  );
  const materasso = (z0, z1) => box(
    { x0: ltX0 + 2, x1: ltX0 + lt.t - 2, y0: Y(V.H + 4), y1: Y(V.H + 4 + lt.materasso), z0, z1 },
    0x123033, { spigolo: COL.teal, opacitaSpigoli: 0.9, opacity: 0.8 }
  );

  const mezzeria = lt.off + lt.l / 2;
  parti.lettoFisso = new THREE.Group();
  parti.lettoFisso.add(doga(lt.off, mezzeria), materasso(lt.off, mezzeria));
  // La metà ribaltabile ha l'origine sulla cerniera: così basta ruotarla di
  // 180° attorno a X per vederla ripiegata sopra la metà fissa.
  parti.lettoMobile = new THREE.Group();
  const meta = lt.l / 2;
  parti.lettoMobile.add(
    box({ x0: ltX0, x1: ltX0 + lt.t, y0: 0, y1: 4, z0: 0, z1: meta },
      0x1b232c, { spigolo: COL.spigolo, opacitaSpigoli: 0.5, opacity: 0.85 }),
    box({ x0: ltX0 + 2, x1: ltX0 + lt.t - 2, y0: 4, y1: 4 + lt.materasso, z0: 2, z1: meta - 2 },
      0x123033, { spigolo: COL.teal, opacitaSpigoli: 0.9, opacity: 0.8 })
  );
  parti.lettoMobile.position.set(0, Y(V.H), mezzeria);

  // due cuscini, per capire da che parte si dorme
  for (const dx of [0.28, 0.72]) {
    parti.lettoFisso.add(box({
      x0: ltX0 + lt.t * dx - 22, x1: ltX0 + lt.t * dx + 22,
      y0: Y(V.H + 14), y1: Y(V.H + 24), z0: lt.off + 6, z1: lt.off + 36,
    }, 0x9fb3c4, { opacity: 0.5, spigolo: COL.tessuto, opacitaSpigoli: 0.6 }));
  }

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
  const yBasso = 62, yAlto = Math.min(Y(V.H) + 10, CAR.altezza - 4);

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

  // --- il portellone è attrezzato ------------------------------------------
  // Aperto è una parete verticale a portata di mano: sprecarla sarebbe stupido.
  // Tutto ciò che segue ruota col battente, quindi è sempre "dietro" a te.
  const dentro = 5;      // faccia interna del pannello

  // tavolino ribaltabile: chiuso è piatto, aperto sporge di 45 cm
  const tv = PORT.tavolino;
  g.tavolino = new THREE.Group();
  g.tavolino.add(box({
    x0: tv.t0, x1: tv.t1, y0: 0, y1: tv.sp, z0: 0, z1: tv.sporgenza,
  }, 0x3a2e12, { spigolo: COL.ambra, opacitaSpigoli: 0.95 }));
  g.tavolino.position.set(0, tv.y0, dentro);
  g.add(g.tavolino);

  const org = PORT.organizer;
  g.add(box({ x0: org.t0, x1: org.t1, y0: org.y0, y1: org.y1, z0: dentro, z1: dentro + org.sp },
    COL.modulo, { spigolo: COL.spigolo, opacitaSpigoli: 0.6, opacity: 0.65 }));

  const rt = PORT.rete;
  g.add(box({ x0: rt.t0, x1: rt.t1, y0: rt.y0, y1: rt.y1, z0: dentro, z1: dentro + 4 },
    COL.tessuto, { soloSpigoli: true, opacitaSpigoli: 0.7 }));

  const tn = PORT.tanica;
  g.add(box({ x0: tn.t0, x1: tn.t1, y0: tn.y0, y1: tn.y1, z0: dentro, z1: dentro + 18 },
    0x10222e, { spigolo: COL.acqua, opacitaSpigoli: 0.9 }));

  const led = PORT.led;
  const barra = new THREE.Mesh(
    new THREE.BoxGeometry(led.t1 - led.t0, 2, 2),
    new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0x554422 })
  );
  barra.position.set((led.t0 + led.t1) / 2, led.y, dentro + 2);
  g.add(barra);

  const gc = PORT.gancio;
  g.add(box({ x0: gc.t0, x1: gc.t1, y0: gc.y0, y1: gc.y1, z0: dentro, z1: dentro + 6 },
    0x2b3541, { spigolo: COL.spigolo, opacitaSpigoli: 0.8 }));

  g.position.set(cerniera.x, 0, cerniera.z);
  return g;
}

function gruppoEtichette() {
  const g = new THREE.Group();
  const add = (m, colore) => { if (m && m.et) g.add(etichetta(m.et, centro(m), colore)); };

  ['batteria', 'mppt', 'inverter', 'dcdc', 'shunt', 'fusibiliera'].forEach((k) => add(IMP[k], '#e08a3c'));
  ['serbGrigie', 'boiler', 'pompa'].forEach((k) => add(IMP[k], '#3aa0e0'));
  add(IMP.riscald, '#e0553a');

  // serbatoio gasolio originale: il vincolo sotto il pavimento
  const sm = V.serbatoioMezzo;
  g.add(etichetta(sm.et,
    [(sm.t0 + sm.t1) / 2, Y(sm.y1) + 4, (sm.l0 + sm.l1) / 2], '#b08040'));

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

/**
 * Porte: disegnate **a filo** della fiancata, non come scatole che sporgono.
 * Servono a sapere dove si apre un battente: lì dentro non va niente di fisso.
 * Ogni porta è il contorno del pannello + la linea del vetro + il montante
 * della cerniera, tutto sul piano della lamiera.
 */
function gruppoPorte() {
  const g = new THREE.Group();
  const sporg = (CAR.larghezza - V.T) / 2;
  const lati = [-sporg - 0.6, V.T + sporg + 0.6];   // 6 mm fuori, per non compenetrare
  const matP = new THREE.LineBasicMaterial({ color: COL.ambra, transparent: true, opacity: 0.55 });
  const matC = new THREE.LineBasicMaterial({ color: COL.ambra, transparent: true, opacity: 0.9 });

  const rettangolo = (x, z0, z1, y0, y1, mat) => {
    const pts = [
      new THREE.Vector3(x, y0, z0), new THREE.Vector3(x, y1, z0),
      new THREE.Vector3(x, y1, z1), new THREE.Vector3(x, y0, z1),
      new THREE.Vector3(x, y0, z0),
    ];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  };

  for (const p of [PORTE.ant, PORTE.post]) {
    for (const x of lati) {
      rettangolo(x, p.l0, p.l1, p.y0, p.y1, matP);            // pannello
      rettangolo(x, p.l0 + 4, p.l1 - 4, p.cintura, p.y1 - 6, matP);  // luce del vetro
      // montante della cerniera: sul 120 le porte sono incernierate in avanti
      rettangolo(x, p.l1 - 2.5, p.l1, p.y0, p.y1, matC);
    }
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
    g.add(etichetta(p.et, [V.T + sporg + 26, p.y1 + 10, (p.l0 + p.l1) / 2], '#ffb020'));
  }
  return g;
}


/**
 * Tenda a ventaglio da 270° montata sulle barre del tetto, come le batwing.
 *
 * Com'è fatta davvero: un cassonetto rigido lungo il fianco, il perno
 * sull'angolo posteriore, N stecche che ruotano sullo stesso perno e la tela
 * tesa fra una stecca e l'altra. Da chiusa sta tutta dentro il cassonetto;
 * da aperta copre fiancata e retro, con due piedi telescopici agli angoli.
 */
function gruppoTenda() {
  const g = new THREE.Group();
  const td = EST.tenda;
  const sporg = (CAR.larghezza - V.T) / 2;
  const quotaTetto = CAR.altezza;             // filo superiore delle barre
  const xCasson = -sporg - 9;

  // --- cassonetto: c'è sempre, aperta o chiusa ----------------------------
  const casson = new THREE.Group();
  const matCass = new THREE.MeshStandardMaterial({ color: 0x232c36, roughness: 0.85 });
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(15, 15, td.raggio), matCass);
  corpo.position.set(xCasson, quotaTetto + 7, td.perno + td.raggio / 2);
  casson.add(corpo);
  // staffe sulle barre del tetto
  for (const z of [td.perno + 40, td.perno + td.raggio - 40]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(22, 6, 8), matCass);
    st.position.set(xCasson + 9, quotaTetto + 2, z);
    casson.add(st);
  }
  g.add(casson);

  // --- ventaglio ----------------------------------------------------------
  const ventaglio = new THREE.Group();
  const passo = (td.angolo / td.settori) * (Math.PI / 180);
  const matTela = new THREE.MeshStandardMaterial({
    color: 0xc9a276, roughness: 0.98, side: THREE.DoubleSide,
    transparent: true, opacity: 0.62,
  });
  const matStecca = new THREE.MeshStandardMaterial({ color: 0x2b3541, roughness: 0.8 });

  ventaglio.settori = [];
  for (let i = 0; i < td.settori; i++) {
    const s = new THREE.Group();
    const p0 = new THREE.Vector3(0, 0, 0);
    const p1 = new THREE.Vector3(td.raggio, -td.caduta, 0);
    const p2 = new THREE.Vector3(td.raggio * Math.cos(passo), -td.caduta, -td.raggio * Math.sin(passo));
    const geo = new THREE.BufferGeometry().setFromPoints([p0, p1, p2]);
    geo.computeVertexNormals();
    s.add(new THREE.Mesh(geo, matTela));

    // stecca: tubo vero, non una linea — è quella che tiene su la tela
    const stecca = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, td.raggio, 8), matStecca);
    stecca.rotation.z = Math.PI / 2;
    stecca.position.set(td.raggio / 2, -td.caduta / 2, 0);
    stecca.rotation.y = 0;
    s.add(stecca);

    ventaglio.add(s);
    ventaglio.settori.push(s);
  }

  // orlo esterno: unisce le punte delle stecche quando è aperta
  const orlo = new THREE.Mesh(
    new THREE.TorusGeometry(td.raggio, 1, 6, 40, (td.angolo * Math.PI) / 180),
    matStecca
  );
  orlo.rotation.x = Math.PI / 2;
  orlo.position.y = -td.caduta;
  ventaglio.add(orlo);
  ventaglio.orlo = orlo;

  // piedi telescopici agli angoli, con piastra a terra
  const lungPiede = quotaTetto + 7 - td.caduta;
  ventaglio.piedi = [];
  for (const a of [4, td.angolo - 4]) {
    const rad = (a * Math.PI) / 180;
    const piede = new THREE.Group();
    const asta = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, lungPiede, 10), matStecca);
    asta.position.y = -lungPiede / 2;
    const piastra = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 1.5, 12), matStecca);
    piastra.position.y = -lungPiede;
    piede.add(asta, piastra);
    piede.position.set(
      td.raggio * 0.985 * Math.cos(rad), -td.caduta, -td.raggio * 0.985 * Math.sin(rad)
    );
    ventaglio.add(piede);
    ventaglio.piedi.push(piede);
  }

  ventaglio.position.set(xCasson, quotaTetto + 7, td.perno);
  ventaglio.rotation.y = (td.ang0 * Math.PI) / 180;
  g.add(ventaglio);
  g.ventaglio = ventaglio;
  g.settori = ventaglio.settori;
  g.piedi = ventaglio.piedi;
  return g;
}

