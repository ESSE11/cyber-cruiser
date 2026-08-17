# 06 — Distinta base, costi, fasi, omologazione

## Distinta base e costi (prezzi indicativi 2026, IVA inclusa)

### A. Abitativo

| Voce | € |
|---|---|
| Tetto a soffietto installato (kit + montaggio) | 7.500 - 11.000 |
| Isolamento Armaflex 19 mm + antirombo | 400 |
| Mobilio: profili alluminio, multistrato, guide, ferramenta | 1.100 |
| Piano lavoro + rivestimenti + verniciatura | 350 |
| Frigo a compressore 50 L + slitta | 750 |
| Fornello 2 fuochi + lavello + rubinetteria | 450 |
| Serbatoi (60 L pulita, 20 L grigie) + pompa + tubi + filtri | 480 |
| Vano gas + bombola + regolatore certificato | 250 |
| Riscaldatore diesel 2 kW installato | 900 |
| Tendalino laterale 2×2,5 m | 550 |
| Zanzariere, tendine oscuranti, materasso 190×130 | 550 |
| Braccio orientabile tipo Lagun + piano scrivania 70×45 | 260 |
| Cuscini dinette (seduta + schienale, sfoderabili) | 320 |
| Cassa amovibile del pozzetto piedi | 90 |
| **Subtotale A** | **13.970 - 17.470** |

### B. Energia

| Voce | € |
|---|---|
| Batteria LiFePO4 200 Ah con BMS Bluetooth | 750 |
| DC-DC Victron Orion XS 50 A | 320 |
| MPPT Victron 100/30 | 190 |
| Pannelli 2×200 W + staffe | 340 |
| Inverter 1000 W puro sinusoidale | 260 |
| SmartShunt 500 A | 130 |
| Caricabatterie 230 V 30 A | 200 |
| Cavi, fusibili, portafusibili, bus bar, staccabatteria, minuteria | 380 |
| **Subtotale B** | **2.570** |

### C. Elettronica di bordo (lo schermo)

| Voce | € |
|---|---|
| Raspberry Pi 5 4 GB + dissipatore + NVMe HAT + SSD 256 GB | 190 |
| Schermo 10,1" 1280×800 touch | 130 |
| Alimentatore 12→5 V con shutdown pulito (UPS HAT) | 70 |
| CAN HAT MCP2515 + cavo OBD-II (o ELM327 USB) | 35 |
| GPS u-blox NEO-M8N | 30 |
| IMU BNO055 + BME280 + 3× DS18B20 + ADS1115 | 60 |
| 2× cavo VE.Direct → USB | 60 |
| Cornice plancia stampata 3D + cablaggi | 60 |
| **Subtotale C** | **635** |

### D. Assetto e fuoristrada (opzionale ma consigliato)

| Voce | € |
|---|---|
| Molle e ammortizzatori rinforzati (+40 mm, taratura carico) | 1.300 |
| Gomme all-terrain 5 pz | 1.100 |
| Piastre paramotore | 600 |
| Snorkel | 300 |
| Verricello 9.500 lb + paraurti (solo se serve davvero) | 2.200 |
| **Subtotale D** | **1.900 - 5.500** |

### Totale progetto

| Scenario | Veicolo | Allestimento | **Totale** |
|---|---|---|---|
| **Piano A** — soffietto, tutto nuovo | 19.000 | 19.700 | **38.700 €** |
| **Piano B** — tenda da tetto a guscio, mobilio fai da te | 17.000 | 11.500 | **28.500 €** |
| **Piano C** — minimo sindacale (tenda, frigo, elettrico base) | 15.000 | 5.500 | **20.500 €** |

---

## Roadmap: in che ordine si fa

**Fase 0 — Ricerca veicolo (1-3 mesi)**
Checklist doc 01. Non comprare il primo che vedi: il mercato Land Cruiser è
pieno di mezzi rimessi a nuovo esteticamente e marci sotto.

**Fase 1 — Messa in sicurezza (subito dopo l'acquisto)**
Tagliando completo, gomme, freni, trattamento antiruggine del sottoscocca.
Nessuna camperizzazione prima di questo: sarebbe costruire su un mezzo ignoto.

**Fase 2 — Elettronica su banco (in parallelo, mentre cerchi la macchina 👈)**
Questa è la parte che puoi iniziare **oggi**: Raspberry + schermo + sensori sul
tavolo, dashboard in modalità SIM, daemon che legge già IMU e BME280.
Quando arriva la macchina resta solo da collegare l'OBD.

**Fase 3 — Svuotamento e isolamento**
Rimozione sedili posteriori e moquette, antirombo + Armaflex, passaggio dei
cablaggi *prima* di chiudere i pannelli. Errore classico: montare i mobili e poi
accorgersi che manca un cavo dentro il montante.

**Fase 4 — Impianto elettrico**
Batteria, DC-DC, MPPT, fusibiliera, tutte le derivazioni con cavo abbondante e
etichettato. Collaudo con carichi finti prima di montare i mobili sopra.

**Fase 5 — Tetto**
Soffietto dall'installatore (2-5 giorni di officina) oppure rack + tenda.
Prima del mobilio, perché il taglio del tetto sporca e vibra tutto.

**Fase 6 — Mobilio e idrico**
Costruzione a moduli, montaggio a secco, poi verniciatura, poi installazione.

**Fase 7 — Integrazione dashboard nel mezzo**
Cornice in plancia, OBD, VE.Direct sui Victron, calibrazione consumi su tre pieni.

**Fase 8 — Shakedown**
Un weekend a 100 km da casa con tutto acceso, per scoprire cosa vibra, cosa
perde e cosa manca. Poi il viaggio vero.

---

## Note su omologazione e assicurazione (Italia)

Non sono formalità: incidono su cosa puoi fare legalmente.

- **Rimozione sedili posteriori**: va aggiornata la carta di circolazione
  (riduzione posti). Pratica in Motorizzazione, costo modesto, ma richiede la
  rimozione documentata degli attacchi/cinture o la loro conservazione a norma.
- **Trasformazione in "autocaravan"**: richiede requisiti minimi (posti letto,
  cucina, tavolo, stivaggio, altezza interna) e una vera pratica di
  trasformazione con collaudo. Vantaggi: bollo ridotto, assicurazione spesso più
  economica, sosta con regole da camper. Svantaggi: limiti di velocità da
  autocaravan e vincoli sull'allestimento (che deve restare fisso).
  **Il tetto a soffietto rende questa strada realistica** (altezza interna);
  con la tenda da tetto no.
- **Modifiche a molle/gomme/paraurti**: ogni scostamento dalla carta va
  omologato o annotato. I paraurti in acciaio non omologati CE sono il punto su
  cui si contesta di più in caso di sinistro.
- **Impianto gas**: certificazione dell'installatore. Se vuoi evitare del tutto
  la pratica gas → cucina a induzione (vedi doc 04).
- **Assicurazione**: dichiara l'allestimento e assicura il contenuto. Una
  polizza auto standard non copre 15.000 € di mobilio e batterie.

> Prima di iniziare la Fase 5, un'ora dallo studio di consulenza automobilistica
> con il piano in mano ti fa risparmiare mesi. Decidi **prima** se vuoi arrivare
> all'omologazione autocaravan, perché cambia come costruisci i mobili.
