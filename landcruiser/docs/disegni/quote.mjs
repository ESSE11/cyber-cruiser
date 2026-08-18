// Quote dell'allestimento — unica fonte di verità.
// Le usano sia i disegni 2D (genera-disegni.mjs) sia il modello 3D (../../3d/).
//
//   L = longitudinale, 0 = filo portellone, 158 = schienale sedili anteriori
//   T = trasversale,   0 = fiancata sinistra, 128 = fiancata destra
//   H = verticale,     0 = pavimento del vano (a 76 cm da terra)
//
// Mezzo: Toyota Land Cruiser Prado 90/95, 5 porte passo lungo (1996-2002).

export const V = {
  L: 158, T: 128, H: 88,               // vano utile, seconda e terza fila rimosse
  pavTerra: 76,                        // altezza del pavimento da terra
  arco: { l0: 52, l1: 110, w: 13, h: 28 },
  falsoPav: 12,
  piano: 50,                           // piano continuo
  pianoSp: 3,
  popUp: 95,                           // sollevamento del guscio
  letto: { l: 190, t: 148, off: -26, materasso: 10 },   // matrimoniale: sfrutta tutta la larghezza del guscio

  // moduli  [L0,L1] × [T0,T1]
  frigo:     { l0: 0,   l1: 72,  t0: 0,  t1: 44,  h: 46 },
  cucina:    { l0: 0,   l1: 58,  t0: 44, t1: 128, corsa: 58, h: 20 },
  cassetti:  { l0: 58,  l1: 92,  t0: 44, t1: 115 },
  attrezzi:  { l0: 72,  l1: 120, t0: 13, t1: 44 },
  pozzetto:  { l0: 92,  l1: 120, t0: 44, t1: 113 },   // vano piedi (cassa amovibile)
  seduta:    { l0: 120, l1: 158, t0: 0,  t1: 128 },
  tecnico:   { l0: 120, l1: 158, t0: 0,  t1: 60 },    // sotto la seduta
  stiva:     { l0: 120, l1: 158, t0: 60, t1: 128 },   // sotto la seduta
  scrivania: { l0: 88,  l1: 133, t0: 44, t1: 113, h: 76 },
  serbatoio: { l0: 60,  l1: 108, t0: 13, t1: 111, h: 12 },   // 98×48×12 = 56 L

  // Serbatoio gasolio ORIGINALE del mezzo (90 L sul Prado 90/95 5 porte):
  // sta fra gli assi sotto il pavimento ed è intoccabile. Tutto ciò che va
  // sotto scocca — grigie, riscaldatore, tubi — deve girarci intorno.
  serbatoioMezzo: { l0: 54, l1: 144, t0: 14, t1: 104, y0: -32, y1: -8, sotto: true, et: 'gasolio 90 L (originale)' },
};

// Carrozzeria del Prado J90/J95 5 porte, dati di catalogo:
// 4675 × 1820 × 1880 mm fuori tutto (la lunghezza comprende la ruota di scorta
// sul portellone), passo 2675 mm, serbatoio 90 L, massa a vuoto 1750-1885 kg,
// massa complessiva 2680-2710 kg → portata fino a ~795 kg sul 3.0 TD 125 cv.
// Fonte: automoli / encyCARpedia, scheda J90 5-door.
export const CARROZZERIA = {
  larghezza: 182, lunghezza: 445, altezza: 188,   // lunghezza della sola scocca
  fuoriTutto: 467.5,                              // con la ruota di scorta
  passo: 267.5, sbalzoPost: 90, ruota: { r: 38.5, w: 27 },
  assePost: 90,                 // centro del passaruota posteriore dal portellone
  serbatoioL: 90, massaVuoto: 1885, massaTotale: 2710,
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
  batteria:   { l0: 122, l1: 146, t0: 4,   t1: 56,  y0: 12, y1: 34, et: 'LiFePO4 200 Ah' },
  mppt:       { l0: 148, l1: 155, t0: 6,   t1: 25,  y0: 26, y1: 39, et: 'MPPT 100/30' },
  inverter:   { l0: 148, l1: 156, t0: 28,  t1: 53,  y0: 26, y1: 38, et: 'inverter 500 W' },
  shunt:      { l0: 147, l1: 151, t0: 4,   t1: 14,  y0: 14, y1: 18, et: 'SmartShunt' },
  fusibiliera:{ l0: 146, l1: 151, t0: 16,  t1: 36,  y0: 14, y1: 19, et: 'fusibiliera' },
  dcdc:       { l0: 148, l1: 155, t0: 38,  t1: 56,  y0: 14, y1: 24, et: 'DC-DC 12/12-30' },

  // acqua
  serbGrigie: { l0: 6,   l1: 54,  t0: 24,  t1: 70,  y0: -26, y1: -12, sotto: true, et: 'grigie 20 L' },
  boiler:     { l0: 122, l1: 152, t0: 94,  t1: 124, y0: 12,  y1: 48,  et: 'boiler 10 L' },
  pompa:      { l0: 122, l1: 146, t0: 62,  t1: 75,  y0: 12,  y1: 23,  et: 'pompa + vaso' },
  filtro:     { l0: 122, l1: 132, t0: 78,  t1: 86,  y0: 12,  y1: 22,  et: 'filtro' },

  // clima
  riscald:    { l0: 8,   l1: 39,  t0: 88,  t1: 100, y0: -24, y1: -12, sotto: true, et: 'riscaldatore 2 kW' },
  condotto:   { l0: 28,  l1: 144, t0: 102, t1: 110, y0: 2,   y1: 10,  et: 'condotto aria calda' },
  bocchetta1: { l0: 32,  l1: 44,  t0: 110, t1: 116, y0: 2,   y1: 10,  et: 'bocchetta cucina' },
  bocchetta2: { l0: 126, l1: 138, t0: 110, t1: 116, y0: 2,   y1: 10,  et: 'bocchetta seduta' },
  presaAria:  { l0: 14,  l1: 24,  t0: 102, t1: 110, y0: -30, y1: -24, sotto: true, et: 'presa aria + scarico' },

  // schermi (nel vano: quello secondario è ripetuto in cabina)
  schermo2:   { l0: 116, l1: 118, t0: 80,  t1: 97,  y0: 52,  y1: 63,  et: 'schermo impianti 7"' },
};

// Cabina: quote assolute da terra (qui non vale l'origine del pavimento vano).
export const CABINA = {
  sedile:   { l0: 160, l1: 208, t0: 8,   t1: 58,  y0: 52, y1: 92 },   // guida (sx)
  sedileDx: { l0: 160, l1: 208, t0: 72,  t1: 122, y0: 52, y1: 92 },
  schienale:{ sp: 8, h: 62 },
  plancia:  { l0: 276, l1: 312, t0: -8,  t1: 138, y0: 96, y1: 134 },
  volante:  { r: 18, t: 33, y: 118, l: 276 },
  schermo:  { w: 23, h: 15, t0: 76, y0: 104, l: 282, et: 'schermo principale 10,1"' },
  schermoSec: { w: 17, h: 11, t0: 104, y0: 103, l: 282, et: 'schermo impianti 7"' },
  pi:       { l0: 234, l1: 256, t0: 84,  t1: 100, y0: 34, y1: 42, et: 'Raspberry Pi 5' },
};

// Allestimento esterno.
export const EST = {
  solare:   { n: 2, w: 54, l: 105, sp: 3, l0: 20, t0: 10, gap: 8, et: '2 × 110 W' },
  oblo:     { l0: 142, l1: 182, t0: 44, t1: 84, et: 'oblò 40 × 40' },
  rack:     { l0: 216, l1: 312, w: 148, h: 9 },
  tendalino:{ l0: 36, l1: 280, d: 12, lato: 'sx' },
  // tenda a ventaglio (tipo batwing 270°): perno sull'angolo posteriore
  // sinistro del rack, apertura verso dietro-fianco-avanti.
  tenda:    { raggio: 250, settori: 8, angolo: 200, ang0: 80, perno: 34, caduta: 14, alt: 16, et: 'tenda 270°' },
  doccia:   { l0: 8, l1: 33, y0: 118, y1: 143, sp: 12, lato: 'dx', et: 'doccia esterna' },
  scorta:   { r: 38.5, w: 27, l: -26, t: 76, y: 112, et: 'ruota di scorta sul portellone' },
  presa:    { l0: 46, l1: 58, y0: 96, y1: 108, lato: 'dx', et: 'presa 230 V + carico acqua' },
};

// ---------------------------------------------------------------------------
// Aperture della carrozzeria (Prado 90/95 5 porte, 7 posti con terza fila rimossa).
// Servono a sapere dove NON si può addossare un mobile: dove si apre una porta,
// lì dentro non ci va niente di fisso.
// Quote longitudinali dal filo portellone; y assolute da terra. Da confermare
// col metro sul mezzo (scheda di rilievo, doc 02).
// ---------------------------------------------------------------------------

export const PORTE = {
  //  y0 = soglia, cintura = linea sotto il finestrino, y1 = gocciolatoio
  post:  { l0: 172, l1: 248, y0: 62, y1: 176, cintura: 146, cerniera: 'avanti', et: 'porta posteriore' },
  ant:   { l0: 252, l1: 330, y0: 62, y1: 178, cintura: 148, cerniera: 'avanti', et: 'porta anteriore' },
  portellone: { cerniera: 'sx', apertura: 100, et: 'portellone (cerniera da verificare)' },
  vetroLat: { l0: 52, l1: 168, y0: 110, y1: 150, et: 'finestrino laterale del vano' },
};

// ---------------------------------------------------------------------------
// Allestimento del portellone: quote nel sistema del battente (origine sulla
// cerniera), perché si muovono con lui. y assolute da terra.
// ---------------------------------------------------------------------------

export const PORT = {
  tavolino:  { t0: 24,  t1: 94,  y0: 96,  sp: 3, sporgenza: 45, et: 'tavolino ribaltabile 70 × 45' },
  organizer: { t0: 100, t1: 172, y0: 100, y1: 140, sp: 7, et: 'organizer attrezzi' },
  rete:      { t0: 24,  t1: 94,  y0: 108, y1: 138, et: 'rete portaoggetti' },
  led:       { t0: 20,  t1: 176, y: 176, et: 'barra LED del portellone' },
  tanica:    { t0: 110, t1: 145, y0: 62,  y1: 96,  et: 'tanica acqua di riserva 20 L' },
  gancio:    { t0: 30,  t1: 44,  y0: 150, y1: 156, et: 'gancio doccia / asciugatura' },
};

// ---------------------------------------------------------------------------
// Stivaggio: mensole, pensili e tasche. Il volume in litri è calcolato dalle
// quote stesse (vedi gruppoStivaggio nel modello 3D), non scritto a mano.
// ---------------------------------------------------------------------------

export const STIV = {
  mensolaSx:  { l0: 16,  l1: 116, t0: 0,   t1: 22,  y0: 64, y1: 67,  bordo: 6,  et: 'mensola sx' },
  mensolaDx:  { l0: 60,  l1: 120, t0: 106, t1: 128, y0: 64, y1: 67,  bordo: 6,  et: 'mensola dx' },
  pensile:    { l0: 124, l1: 158, t0: 0,   t1: 128, y0: 62, y1: 86,  et: 'pensile sopra la seduta' },
  tascaPort:  { l0: -14, l1: -8,  t0: 15,  t1: 145, y0: 92, y1: 122, et: 'tasche del portellone' },
  gavoneArcoSx: { l0: 52, l1: 110, t0: 0,  t1: 13,  y0: 28, y1: 46,  et: 'gavone sopra il passaruota sx' },
  gavoneArcoDx: { l0: 52, l1: 110, t0: 115, t1: 128, y0: 28, y1: 46, et: 'gavone sopra il passaruota dx' },
  reteSoffietto: { l0: 18, l1: 142, t0: 0, t1: 16,  y0: 102, y1: 126, et: 'rete nel soffietto' },
};
