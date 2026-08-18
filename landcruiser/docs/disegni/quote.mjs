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

// Quote della carrozzeria (KDJ120 5 porte, dati di catalogo verificati:
// 4840 × 1855 × 1845 mm, passo 2790 mm — fonte wheel-size.com / autoevolution).
export const CARROZZERIA = {
  larghezza: 185.5, lunghezza: 484, altezza: 184.5,
  passo: 279, sbalzoPost: 90, ruota: { r: 38, w: 26 },
  assePost: 85,                 // coincide col centro del passaruota nei disegni
};

// Stato di ciascuna quota interna: 'catalogo' = da dati ufficiali,
// 'stima' = valore di progetto da confermare col metro sul mezzo reale.
// Vedi la scheda di rilievo in docs/02-layout-camper.md.
export const ORIGINE = {
  L: 'stima', T: 'stima', H: 'stima', pavTerra: 'stima',
  arco: 'stima', larghezza: 'catalogo', lunghezza: 'catalogo',
  altezza: 'catalogo', passo: 'catalogo',
};

// ---------------------------------------------------------------------------
// Impianti di bordo — ingombri reali dei componenti, nelle stesse coordinate.
// Sono le misure che serve dare all'allestitore: dove passa cosa, quanto è
// grande, quanta aria gli resta intorno. `sotto: true` = fuori scocca, appeso
// al telaio (quote y negative rispetto al pavimento del vano).
// ---------------------------------------------------------------------------

export const IMP = {
  // energia
  batteria:   { l0: 128, l1: 152, t0: 4,   t1: 56,  y0: 12, y1: 34, et: 'LiFePO4 200 Ah' },
  mppt:       { l0: 155, l1: 162, t0: 6,   t1: 25,  y0: 26, y1: 39, et: 'MPPT 100/30' },
  inverter:   { l0: 155, l1: 163, t0: 28,  t1: 53,  y0: 26, y1: 38, et: 'inverter 500 W' },
  shunt:      { l0: 154, l1: 158, t0: 4,   t1: 14,  y0: 14, y1: 18, et: 'SmartShunt' },
  fusibiliera:{ l0: 153, l1: 158, t0: 16,  t1: 36,  y0: 14, y1: 19, et: 'fusibiliera' },
  dcdc:       { l0: 155, l1: 162, t0: 38,  t1: 56,  y0: 14, y1: 24, et: 'DC-DC 12/12-30' },

  // acqua
  serbGrigie: { l0: 58,  l1: 118, t0: 32,  t1: 62,  y0: -26, y1: -13, sotto: true, et: 'grigie 20 L' },
  boiler:     { l0: 128, l1: 158, t0: 95,  t1: 125, y0: 12,  y1: 48,  et: 'boiler 10 L' },
  pompa:      { l0: 128, l1: 152, t0: 62,  t1: 75,  y0: 12,  y1: 23,  et: 'pompa + vaso' },
  filtro:     { l0: 128, l1: 138, t0: 78,  t1: 86,  y0: 12,  y1: 22,  et: 'filtro' },

  // clima
  riscald:    { l0: 26,  l1: 57,  t0: 92,  t1: 104, y0: -24, y1: -12, sotto: true, et: 'riscaldatore 2 kW' },
  condotto:   { l0: 30,  l1: 150, t0: 104, t1: 112, y0: 2,   y1: 10,  et: 'condotto aria calda' },
  bocchetta1: { l0: 34,  l1: 46,  t0: 112, t1: 118, y0: 2,   y1: 10,  et: 'bocchetta cucina' },
  bocchetta2: { l0: 132, l1: 144, t0: 112, t1: 118, y0: 2,   y1: 10,  et: 'bocchetta seduta' },
  presaAria:  { l0: 60,  l1: 70,  t0: 96,  t1: 104, y0: -30, y1: -24, sotto: true, et: 'presa aria + scarico' },

  // schermi (nel vano: quello secondario è ripetuto in cabina)
  schermo2:   { l0: 122, l1: 124, t0: 82,  t1: 99,  y0: 52,  y1: 63,  et: 'schermo impianti 7"' },
};

// Cabina: quote assolute da terra (qui non vale l'origine del pavimento vano).
export const CABINA = {
  sedile:   { l0: 168, l1: 218, t0: 8,   t1: 58,  y0: 52, y1: 92 },   // guida (sx)
  sedileDx: { l0: 168, l1: 218, t0: 72,  t1: 122, y0: 52, y1: 92 },
  schienale:{ sp: 8, h: 62 },
  plancia:  { l0: 296, l1: 330, t0: -8,  t1: 138, y0: 96, y1: 134 },
  volante:  { r: 18, t: 33, y: 118, l: 296 },
  schermo:  { w: 23, h: 15, t0: 76, y0: 104, l: 300, et: 'schermo principale 10,1"' },
  schermoSec: { w: 17, h: 11, t0: 104, y0: 103, l: 300, et: 'schermo impianti 7"' },
  pi:       { l0: 250, l1: 272, t0: 84,  t1: 100, y0: 34, y1: 42, et: 'Raspberry Pi 5' },
};

// Allestimento esterno.
export const EST = {
  solare:   { n: 2, w: 55, l: 110, sp: 3, l0: 22, t0: 12, gap: 8, et: '2 × 110 W' },
  oblo:     { l0: 150, l1: 190, t0: 45, t1: 85, et: 'oblò 40 × 40' },
  rack:     { l0: 236, l1: 330, w: 150, h: 9 },
  tendalino:{ l0: 40, l1: 300, d: 12, lato: 'sx' },
  // tenda a ventaglio (tipo batwing 270°): perno sull'angolo posteriore
  // sinistro del rack, apertura verso dietro-fianco-avanti.
  tenda:    { raggio: 250, settori: 8, angolo: 200, ang0: 80, perno: 34, caduta: 14, alt: 16, et: 'tenda 270°' },
  doccia:   { l0: 8, l1: 33, y0: 118, y1: 143, sp: 12, lato: 'dx', et: 'doccia esterna' },
  scorta:   { r: 38, w: 26, l: -26, t: 78, y: 112, et: 'ruota di scorta sul portellone' },
  presa:    { l0: 46, l1: 58, y0: 96, y1: 108, lato: 'dx', et: 'presa 230 V + carico acqua' },
};

// ---------------------------------------------------------------------------
// Aperture della carrozzeria (KDJ120 5 porte, 7 posti con terza fila rimossa).
// Servono a sapere dove NON si può addossare un mobile: dove si apre una porta,
// lì dentro non ci va niente di fisso.
// Quote longitudinali dal filo portellone; y assolute da terra. Da confermare
// col metro sul mezzo (scheda di rilievo, doc 02).
// ---------------------------------------------------------------------------

export const PORTE = {
  post:  { l0: 232, l1: 326, y0: 56, y1: 148, cerniera: 'avanti', et: 'porta posteriore' },
  ant:   { l0: 330, l1: 428, y0: 56, y1: 148, cerniera: 'avanti', et: 'porta anteriore' },
  portellone: { cerniera: 'sx', apertura: 100, et: 'portellone (cerniera da verificare)' },
  vetroLat: { l0: 60, l1: 226, y0: 112, y1: 152, et: 'finestrino laterale del vano' },
};

// ---------------------------------------------------------------------------
// Stivaggio: mensole, pensili e tasche. Il volume in litri è calcolato dalle
// quote stesse (vedi gruppoStivaggio nel modello 3D), non scritto a mano.
// ---------------------------------------------------------------------------

export const STIV = {
  mensolaSx:  { l0: 18,  l1: 120, t0: 0,   t1: 22,  y0: 66, y1: 69,  bordo: 6,  et: 'mensola sx' },
  mensolaDx:  { l0: 62,  l1: 124, t0: 108, t1: 130, y0: 66, y1: 69,  bordo: 6,  et: 'mensola dx' },
  pensile:    { l0: 130, l1: 165, t0: 0,   t1: 130, y0: 64, y1: 88,  et: 'pensile sopra la seduta' },
  tascaPort:  { l0: -14, l1: -8,  t0: 15,  t1: 145, y0: 92, y1: 122, et: 'tasche del portellone' },
  gavoneArcoSx: { l0: 55, l1: 115, t0: 0,  t1: 13,  y0: 28, y1: 47,  et: 'gavone sopra il passaruota sx' },
  gavoneArcoDx: { l0: 55, l1: 115, t0: 117, t1: 130, y0: 28, y1: 47, et: 'gavone sopra il passaruota dx' },
  reteSoffietto: { l0: 20, l1: 150, t0: 0, t1: 16,  y0: 104, y1: 128, et: 'rete nel soffietto' },
};
