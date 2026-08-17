# 03 — Impianto elettrico 12 V

## Dimensionamento: quanto consumi davvero

| Utenza | Assorbimento | Ore/giorno | Wh/giorno |
|---|---|---|---|
| Frigo a compressore 50 L (estate, 30 °C) | 45 W acceso, ~35% duty | 8,4 eq. | 380 |
| Luci LED interne + esterne | 12 W | 4 | 48 |
| Pompa acqua | 50 W | 0,3 | 15 |
| Ricarica telefoni / laptop / droni | — | — | 120 |
| **Schermo + Raspberry Pi (dashboard)** | 14 W | 5 | 70 |
| Ventola / riscaldatore diesel (ventola sola) | 25 W | 3 | 75 |
| Starlink / router (opzionale) | 40 W | 3 | 120 |
| **Totale realistico estivo** | | | **~830 Wh/giorno** |

## Batteria di servizio

**LiFePO4 12 V 200 Ah = 2.560 Wh utili (~2.300 Wh usabili all'90% DoD).**

- Autonomia senza sole e senza motore: **~2,7 giorni** pieni. Con 100 Ah scendi a
  ~1,3 giorni: troppo poco se ti fermi due notti in un posto bello.
- Prendila con **BMS con Bluetooth** e, se viaggi d'inverno, con **riscaldamento
  integrato**: sotto 0 °C una LiFePO4 non va caricata, e il BMS ti stacca la
  ricarica proprio quando ti serve.
- Posizione: vano tecnico laterale sinistro, sopra il pianale, fissata con staffe
  metalliche (non fascette). Le LiFePO4 possono stare in abitacolo — a differenza
  delle piombo-acido che gassano.

## Ricarica: tre fonti

1. **DC-DC dall'alternatore** — `Victron Orion XS 12/12-50A` (o Orion-Tr Smart
   12/12-30). Obbligatorio: l'alternatore del Land Cruiser non porta mai a piena
   carica una litio, e sui modelli con alternatore "smart" collegare in parallelo
   è dannoso. 50 A = ~600 W: **un'ora di guida ≈ 600 Wh**, cioè quasi la giornata.
2. **Solare** — 2 × 200 W rigidi sul rack (o flessibili incollati sul soffietto,
   più leggeri ma vita più breve) con **MPPT Victron 100/30**. Resa reale estiva
   ~900-1.100 Wh/giorno, invernale ~250-350.
3. **Rete 230 V** — caricabatterie 20-30 A per quando sei in campeggio/garage.
   Opzionale ma comodo; usa un **Victron IP22 30A**.

Con DC-DC + solare praticamente non scarichi mai la batteria in viaggio: il caso
critico è "fermo tre giorni all'ombra a novembre", ed è lì che serve il 230 V.

## Distribuzione

```
 ALTERNATORE ──╗
               ║ (cavo 25 mm² + fusibile MEGA 80 A vicino alla batteria motore)
               ╚═► DC-DC 50 A ──╗
                                ║
 SOLARE 400 W ──► MPPT 100/30 ──╬═► [+] BATTERIA LiFePO4 200 Ah
                                ║        │
 230 V ──► CARICABATTERIE ──────╝        ├─► SmartShunt 500 A ──► NEGATIVO comune
                                         │
                                         ├─► FUSIBILIERA 12 V (8 vie)
                                         │     ├ 15 A  frigo
                                         │     ├ 10 A  pompa acqua
                                         │     ├  5 A  luci interne
                                         │     ├  5 A  luci esterne / tendalino
                                         │     ├  5 A  prese USB-C PD
                                         │     ├  5 A  Raspberry + schermo
                                         │     ├ 10 A  riscaldatore diesel
                                         │     └ 15 A  presa 12 V accessori
                                         │
                                         └─► INVERTER 1000 W (fus. 125 A) ──► 2 prese 230 V
```

### Sezioni cavi (regola: caduta max 3%)

| Tratta | Corrente | Lunghezza | Sezione |
|---|---|---|---|
| Batteria motore → DC-DC | 50 A | 4 m | **25 mm²** |
| DC-DC → batteria servizio | 50 A | 1 m | 16 mm² |
| MPPT → batteria | 30 A | 1 m | 10 mm² |
| Pannelli → MPPT | 12 A | 5 m | 6 mm² |
| Batteria → inverter 1000 W | 100 A | 0,8 m | **35 mm²** |
| Batteria → fusibiliera | 40 A | 1 m | 10 mm² |
| Rami luci / USB | 5 A | 4 m | 1,5 mm² |
| Ramo frigo | 8 A | 3 m | 2,5 mm² |

### Regole non negoziabili

- **Un fusibile entro 30 cm da ogni sorgente** (batteria motore, batteria
  servizio, uscita inverter). Il fusibile protegge il cavo, non l'utenza.
- **Negativo comune unico**, barra bus dedicata; il telaio come massa solo per il
  ramo motore originale.
- Passaggi lamiera sempre con **passacavi in gomma**; niente cavi che sfregano.
- **Stacca-batteria** manuale sul positivo servizio, raggiungibile dal portellone.
- Etichetta ogni cavo alle due estremità: fra sei mesi non ricordi niente.

## Monitoraggio → questo alimenta la dashboard

- **Victron SmartShunt 500 A**: dà tensione, corrente, SoC, Ah consumati.
  Si legge via **VE.Direct → USB** dal Raspberry (protocollo testuale semplice,
  1 riga/secondo). È il pezzo che rende "vera" la schermata CAMPER del software.
- **MPPT Victron**: seconda porta VE.Direct → resa solare istantanea e giornaliera.
- Sonde **DS18B20** (1-Wire): frigo, interno cabina, vano batteria.
- Sensori livello acqua: galleggianti resistivi o sensore a ultrasuoni sul tappo.

Dettagli di collegamento e formato dati: vedi [doc 05](05-elettronica-schermo.md).
