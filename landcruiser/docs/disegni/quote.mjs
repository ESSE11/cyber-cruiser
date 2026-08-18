// Quote dell'allestimento — unica fonte di verità.
// Le usano sia i disegni 2D (genera-disegni.mjs) sia il modello 3D (../../3d/).
//
//   L = longitudinale, 0 = filo portellone, 165 = schienale sedili anteriori
//   T = trasversale,   0 = fiancata sinistra, 130 = fiancata destra
//   H = verticale,     0 = pavimento del vano (a 78 cm da terra)

export const V = {
  L: 165, T: 130, H: 90,               // vano utile
  pavTerra: 78,                        // altezza del pavimento da terra
  arco: { l0: 55, l1: 115, w: 13, h: 28 },
  falsoPav: 12,
  piano: 50,                           // piano continuo
  pianoSp: 3,
  popUp: 95,                           // sollevamento del guscio
  letto: { l: 190, t: 130, off: -25 },

  // moduli  [L0,L1] × [T0,T1]
  frigo:     { l0: 0,   l1: 75,  t0: 0,  t1: 45,  h: 46 },
  cucina:    { l0: 0,   l1: 60,  t0: 45, t1: 130, corsa: 60, h: 20 },
  cassetti:  { l0: 60,  l1: 95,  t0: 45, t1: 117 },
  attrezzi:  { l0: 75,  l1: 125, t0: 13, t1: 45 },
  pozzetto:  { l0: 95,  l1: 125, t0: 45, t1: 115 },   // vano piedi (cassa amovibile)
  seduta:    { l0: 125, l1: 165, t0: 0,  t1: 130 },
  tecnico:   { l0: 125, l1: 165, t0: 0,  t1: 60 },    // sotto la seduta
  stiva:     { l0: 125, l1: 165, t0: 60, t1: 130 },   // sotto la seduta
  scrivania: { l0: 92,  l1: 137, t0: 45, t1: 115, h: 76 },
  serbatoio: { l0: 62,  l1: 112, t0: 13, t1: 113, h: 12 },   // 100×50×12 = 60 L
};

// Quote della carrozzeria, servono solo al modello 3D.
export const CARROZZERIA = {
  larghezza: 179, lunghezza: 478, altezza: 189,
  passo: 279, sbalzoPost: 90, ruota: { r: 38, w: 26 },
  assePost: 85,                 // coincide col centro del passaruota nei disegni
};
