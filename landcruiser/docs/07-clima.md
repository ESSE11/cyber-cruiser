# 07 — Clima: scaldare e raffrescare

Due problemi diversi. Scaldare un vano da 1,9 m³ è facile e costa poco.
Raffrescarlo davvero, con l'energia che ci sta a bordo, **non si può**: si può
solo evitare che diventi un forno. Questo documento dice come, con i numeri.

## Riscaldamento — stufa a gasolio, non a gas

| | **Autoterm Air 2D** (scelta) | Webasto Air Top 2000 STC |
|---|---|---|
| Potenza | 0,8 – 2 kW | 0,9 – 2 kW |
| Consumo gasolio | 0,10 – 0,24 l/h | 0,12 – 0,24 l/h |
| Assorbimento elettrico | 10 – 29 W | 14 – 29 W |
| Peso | 2,9 kg | ~2,7 kg |
| Prezzo installato | ~900 € | sensibilmente di più |

Perché a gasolio e non a gas:

- **pesca dal serbatoio del veicolo** (presa dedicata sul pescante): niente
  seconda bombola da riempire in giro per l'Europa;
- una notte a −5 °C consuma circa **1,5 l di gasolio e 250 Wh** — dentro il
  bilancio energetico del doc 03 senza toccare nulla;
- il gas resta solo per il fornello, e se si passa all'induzione (doc 04) la
  pratica gas sparisce del tutto.

**Montaggio** (quote in `disegni/quote.mjs`, gruppo IMP): stufa sotto scocca a
sinistra del serbatoio grigie, presa aria e scarico verso il basso lontani dalle
prese d'aria dell'abitacolo, condotto Ø 60 lungo il fianco destro sotto il piano,
due bocchette — una in zona cucina, una sotto la seduta. La ripresa dell'aria va
**dentro** il vano, altrimenti si scalda la strada.

> ⚠️ **Rilevatore di CO obbligatorio nella pratica**, non per legge ma per
> buonsenso: una stufa a combustione in un vano da 1,9 m³ con la gente che ci
> dorme. Sensore CO a batteria vicino al letto + soglia sulla dashboard.

## Raffrescamento — quello che si può e quello che no

### Il climatizzatore 12 V: i numeri che chiudono il discorso

Un Dometic RTX2000 (6.824 BTU) assorbe **19 A in eco** e arriva a 58 A di picco:
una notte di 8 ore sono **oltre 300 Ah**. Il nostro banco è da 200 Ah, di cui
utilizzabili ~180. Per farlo funzionare servirebbero 400+ Ah di batteria e 400+ W
di solare: due volte l'impianto, 1.500 € in più, 60 kg in più su un mezzo che ha
600 kg di portata. **Fuori scala.** Se un giorno servirà, la strada è quella —
non c'è una scorciatoia.

### Quello che si fa davvero, in ordine di efficacia

1. **Isolamento** — Armaflex 19 mm su pareti e tetto, antirombo sul pavimento.
   È già in distinta (400 €) e lavora anche d'inverno: la stessa spesa serve due volte.
2. **Ventilazione forzata** — ventola di estrazione a tetto (tipo MaxxFan) nell'oblò
   40 × 40 del guscio: **0,2 A al minimo, ~2,7 A al massimo**, cioè da 2 a 33 Wh
   per notte. È il raffrescamento vero di un mezzo così: estrae l'aria calda dall'alto
   e richiama aria fresca dalle finestre. Funziona anche sotto la pioggia (coperchio
   apribile con tettuccio).
3. **Ombra** — la tenda a ventaglio 270°: parcheggiare all'ombra della propria
   tenda abbassa la temperatura interna più di qualsiasi ventola.
4. **Oscuranti termici** su parabrezza e finestrini: il vetro è il buco vero.
5. **Frigo ventilato bene** — 45 W che scaricano calore dentro il vano sono un
   termosifone acceso: presa d'aria bassa e sfogo alto sul fianco.

### Condensa

Quattro persone-notte in un vano piccolo producono più di un litro d'acqua.
La stufa a gasolio asciuga (l'aria di combustione è separata), l'induzione e
l'acqua che bolle bagnano. Regola pratica: **si cucina con l'estrattore acceso**,
e la mattina si aprono oblò e finestrini per cinque minuti, anche d'inverno.

## Cosa vede la dashboard

Sulla schermata IMPIANTI e su quella CAMPER:

| Grandezza | Da dove |
|---|---|
| Temperatura interna / esterna / frigo | DS18B20 (3 sonde) |
| Umidità e pressione | BME280 |
| Stato stufa + livello impostato | relè + stato di ritorno dal daemon |
| Velocità ventola di estrazione | uscita PWM / relè multivelocità |
| CO | sensore digitale, allarme a schermo pieno sopra 50 ppm |

La logica di comfort resta semplice apposta: **se dentro fa più caldo che fuori,
la ventola parte**; se fa più freddo del target e c'è gasolio, parte la stufa.
Niente termostati intelligenti che nessuno capisce alle tre di notte.

## Costi

| Voce | € |
|---|---|
| Riscaldatore diesel 2 kW installato | 900 |
| Ventola di estrazione a tetto | 320 – 380 |
| Isolamento (già in distinta A) | 400 |
| Rilevatore CO + sonda temperatura extra | 60 |
| **Totale clima** | **1.680 – 1.740** |
