# CYBER CRUISER — progetto overland su Toyota Land Cruiser (anni 2000)

Progetto completo in due metà, come il Cyber Pandino:

1. **Il mezzo** — camperizzazione integrale del retro di un Land Cruiser anni 2000,
   con tetto a soffietto (pop-top) come soluzione principale e tenda da tetto come
   alternativa budget.
2. **Il software** — `dash/`, il cruscotto digitale che gira sullo schermo a bordo:
   telemetria motore, quote camper (batteria, acqua, gas, frigo), inclinometro,
   log di viaggio. Gira offline su Raspberry Pi in kiosk mode, con simulatore
   integrato per svilupparlo senza la macchina.

## Indice documentazione

| Doc | Contenuto |
|---|---|
| [docs/01-scelta-veicolo.md](docs/01-scelta-veicolo.md) | Quale Land Cruiser comprare, motori, checklist d'acquisto, budget |
| [docs/02-layout-camper.md](docs/02-layout-camper.md) | Tetto a soffietto vs tenda da tetto, layout interno, mobilio, pesi |
| [docs/03-impianto-elettrico.md](docs/03-impianto-elettrico.md) | Schema 12 V, dimensionamento batteria/solare, sezioni cavi, fusibili |
| [docs/04-impianto-idrico-cucina.md](docs/04-impianto-idrico-cucina.md) | Acqua, scarichi, cucina estraibile, doccia esterna |
| [docs/05-elettronica-schermo.md](docs/05-elettronica-schermo.md) | Hardware dello schermo, sensori, cablaggi, protocollo dati |
| [docs/06-bom-costi-roadmap.md](docs/06-bom-costi-roadmap.md) | Distinta base, costi, fasi di realizzazione, note omologazione |
| [docs/disegni/](docs/disegni/) | **Tavole tecniche quotate** — pianta, sezioni, cucina, vista posteriore ([PDF](docs/disegni/cyber-cruiser-tavole.pdf)) |

## Il software in 30 secondi

```bash
cd landcruiser/dash
python3 -m http.server 8080      # poi apri http://localhost:8080
```

Parte in **modalità simulatore**: dati finti ma plausibili, così vedi tutte le
schermate senza hardware. Quando c'è il Raspberry a bordo, il daemon
`dash/pi/telemetry.py` pubblica i dati reali su WebSocket e la dashboard si
aggancia da sola.

Build single-file (utile per copiarla su una chiavetta o aprirla da telefono):

```bash
node dash/tools/build-single.mjs   # genera dash/dist/cyber-cruiser.html
```

## Disegni tecnici

Le cinque tavole sono **generate da codice**: le quote stanno tutte in cima a
`docs/disegni/genera-disegni.mjs`, quindi se cambi una misura i disegni si
riallineano da soli.

```bash
cd landcruiser/docs/disegni
node genera-disegni.mjs   # → tav-1 … tav-5 (.svg) + index.html
node crea-pdf.mjs         # → cyber-cruiser-tavole.pdf (A3 orizzontale)
```

## Stato del progetto

- [x] Dossier tecnico veicolo + camperizzazione
- [x] Software dashboard v1 (simulatore + 5 schermate + bridge WebSocket)
- [x] Tavole tecniche degli interni (rev. B) + PDF
- [ ] Render 3D dell'allestimento
- [ ] Acquisto veicolo (in cerca — vedi checklist doc 01)
- [ ] Prototipo elettronica su banco
- [ ] Mobilio e pop-top
