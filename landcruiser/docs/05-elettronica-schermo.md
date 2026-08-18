# 05 — Lo schermo di bordo: hardware, sensori, protocollo

L'obiettivo è lo stesso del Cyber Pandino: **un solo schermo che sa tutto del
mezzo**, telemetria motore e stato camper insieme, senza dipendere dal telefono
e senza rete.

## Hardware

| Pezzo | Scelta | Perché |
|---|---|---|
| Calcolatore | **Raspberry Pi 5 4 GB** (o CM4 su carrier industriale) | Chromium in kiosk mode ci gira liscio; il 5 ha l'RTC integrato con batteria |
| Storage | SSD NVMe via HAT, **non microSD** | Le microSD muoiono per i tagli di alimentazione: è il guasto n.1 nei progetti car-PC |
| Schermo | **10,1" IPS 1280×800 touch capacitivo**, luminosità ≥ 450 cd/m² | 7" è troppo piccolo per la doppia funzione, 12" non entra nella plancia del 120 |
| Alimentazione | convertitore 12→5 V 5 A **con spegnimento ritardato** (LiFePO4 buffer o UPS HAT tipo PiJuice / Witty Pi 4) | Deve fare shutdown pulito quando giri la chiave, altrimenti corrompi il filesystem |
| Motore | **sensori nostri**, non OBD (vedi riquadro sotto) | Sul Prado 90/95 col 1KZ-TE non c'è una diagnosi standard da cui leggere |
| GPS | modulo u-blox NEO-M8N USB/UART | Velocità e quota affidabili anche dove l'OBD non dà velocità |
| IMU | **MPU-6050 / BNO055** | Inclinometro pitch/roll — la schermata che userai davvero in fuoristrada |
| Ambiente | BME280 (temp/umidità/pressione), DS18B20 ×3 | Temperature interne, esterna, frigo |
| Energia | **Victron SmartShunt + MPPT** via 2 cavi **VE.Direct → USB** | Fornisce SoC batteria e resa solare senza costruirsi nulla |
| Livelli | ADS1115 (ADC I²C) per sonde resistive | Acqua pulita, grigie, eventuale bilancia bombola (HX711) |
| Pressione acqua | trasduttore ceramico 0-6 bar, uscita 0,5-4,5 V, su ADS1115 canale 0 | È la diagnosi dell'impianto: pompa che cicla a rubinetti chiusi = perdita |
| Portata | flussimetro a turbina YF-S201 (450 impulsi/L) su GPIO | Litri della doccia, riempimento serbatoio |
| Boiler | quarta sonda DS18B20 sulla serpentina | Sai se l'acqua calda c'è prima di spogliarti |
| Secondo schermo | 7" 1024×600 sul secondo micro-HDMI del Pi 5 | Schermata IMPIANTI sempre accesa in sosta |

**Consumo totale stimato**: 12-16 W acceso. Vedi budget energetico nel doc 03.

### Montaggio in plancia

Sul Prado 90/95 il vano centrale della radio (doppio DIN) e il vano portaoggetti
sopra permettono un adattamento pulito con cornice stampata in 3D
(PETG, non PLA: d'estate dietro il parabrezza si superano i 60 °C).
Il Raspberry va nel vano sotto il sedile passeggero, con ventilazione, collegato
allo schermo con cavo HDMI piatto + USB touch.

### Il 90/95 non ha OBD-II: la telemetria motore la costruiamo

Questa è la conseguenza pratica di aver scelto il Prado 90/95 al posto di un
120. L'OBD-II è obbligatorio sui diesel immatricolati in Europa **dal 2004**:
un 1KZ-TE del 1996-2002 espone al massimo il connettore diagnostico Toyota
(DLC1, protocollo proprietario, quasi solo codici guasto). Niente giri, niente
temperature, niente carico motore da leggere in chiaro.

Non è un problema, è un cambio di sorgente: sul 1KZ-TE tutto ciò che serve è
già un segnale elettrico da qualche parte.

| Grandezza | Da dove la prendiamo |
|---|---|
| Giri motore | morsetto **W dell'alternatore** (onda quadra proporzionale ai giri) su GPIO, con partitore e ottoaccoppiatore |
| Velocità | **GPS**, che sulle gomme maggiorate è pure più onesto del tachimetro |
| Temperatura refrigerante | sonda **DS18B20 sul manicotto** o secondo sensore NTC in derivazione |
| Temperatura gas di scarico | **termocoppia K + MAX31855** sul collettore: sul turbodiesel è il dato che protegge il motore |
| Pressione olio | trasduttore 0-10 bar al posto (o in parallelo) del bulbo di serie |
| Sovralimentazione | sensore MAP 0-3 bar sul collettore |
| Livello gasolio | il galleggiante di serie, letto sull'ADS1115 |
| Spie originali | ottoaccoppiatori sui fili delle spie, come fa il Cyber Pandino |

Costo di questa scelta: ~150 € di sensori in più e qualche ora di cablaggio.
In cambio i valori sono **misurati**, non stimati da una centralina che sul
diesel dà comunque numeri approssimativi.

## Un solo computer, due schermi

Il Pi 5 ha due uscite micro-HDMI: **schermo principale 10,1" in plancia**
(guida, offroad, viaggio) e **schermo impianti 7"** sul montante centrale
(energia, serbatoi, acqua). Stessa applicazione, due finestre Chromium:

```bash
# schermo 1 — plancia
chromium --kiosk --window-position=0,0 \
  "http://localhost:8080/?ws=ws://localhost:8765"

# schermo 2 — impianti, senza barra di navigazione
chromium --kiosk --window-position=1280,0 \
  "http://localhost:8080/?ws=ws://localhost:8765&view=impianti&kiosk=1"
```

### Perché non Venus OS di Victron

Venus OS darebbe gratis la parte energia (batteria, solare, serbatoi, allarmi,
VRM) e si pilota via MQTT. Non lo usiamo per due motivi concreti:

1. **non ha immagine ufficiale per il Pi 5** (supportati Zero 2W, 3B/3B+, 4):
   servirebbe una seconda macchina dedicata;
2. il progetto vuole **controllo su tutto lo stack** — se la logica sta dentro
   un sistema chiuso, la si può solo configurare, non cambiare.

L'hardware Victron però resta: SmartShunt, MPPT e Orion XS sono ottimi sensori e
caricatori, e parlano **VE.Direct in chiaro** (testo ASCII su seriale). Li
leggiamo direttamente noi, come fa `pi/telemetry.py`. Nessun vincolo, nessuna
scatola nera: se il Raspberry muore, i Victron continuano a caricare e restano
leggibili dall'app Bluetooth.

## Architettura software

```
  ┌────────── Raspberry Pi 5 ─────────────────────────────────┐
  │                                                            │
  │  telemetry.py (daemon Python)                              │
  │   ├─ obd_source     → CAN / ELM327   (rpm, temp, carico…)  │
  │   ├─ victron_source → VE.Direct      (SoC, W solare)       │
  │   ├─ i2c_source     → IMU, BME280, ADS1115                 │
  │   ├─ gps_source     → gpsd                                 │
  │   └─ WebSocket server  ws://localhost:8765                 │
  │            │                                               │
  │            ▼  JSON patch 5 Hz                              │
  │  Chromium --kiosk http://localhost:8080                    │
  │   └─ dash/  (l'app in questo repo)                         │
  └────────────────────────────────────────────────────────────┘
```

Il browser non parla mai direttamente con l'hardware: tutto passa dal daemon.
Vantaggio pratico → **puoi sviluppare l'interfaccia sul divano**: se il WebSocket
non risponde, l'app entra da sola in modalità **SIM** con dati generati.

## Protocollo dati

Messaggi JSON, uno per pacchetto, `type: "telemetry"`, campi tutti opzionali
(patch parziali: mandi solo ciò che è cambiato).

```json
{
  "type": "telemetry",
  "ts": 1737054000.123,
  "vehicle": {
    "speed": 62.4, "rpm": 1980, "gear": "D4", "coolant": 88,
    "oilTemp": 96, "boost": 0.9, "fuelLevel": 0.62, "egt": 410,
    "consumption": 11.8, "odo": 248113
  },
  "attitude": { "pitch": -4.2, "roll": 7.8, "heading": 214, "altitude": 1287 },
  "power": {
    "soc": 0.87, "battV": 13.28, "battA": -4.1,
    "solarW": 214, "alternatorW": 0, "consumptionW": 54, "toEmptyH": 38.5
  },
  "camper": {
    "waterFresh": 0.55, "waterGrey": 0.3, "gasKg": 3.1,
    "fridgeTemp": 4.2, "insideTemp": 22.4, "outsideTemp": 9.1,
    "heater": false, "pump": true, "lights": { "interior": true, "awning": false }
  },
  "water": {
    "pressureBar": 2.4, "flowLpm": 4.8, "litersOut": 12.6,
    "boilerTemp": 58.0, "boilerOn": true, "showerExt": false,
    "pumpDuty": 0.04, "leak": false
  },
  "gps": { "lat": 45.0703, "lon": 7.6869, "fix": 3, "sats": 11 }
}
```

Comandi dalla UI verso il daemon (accensione luci, pompa, riscaldatore):

```json
{ "type": "command", "target": "camper.lights.awning", "value": true }
```

Il daemon risponde con un `telemetry` aggiornato: la UI non assume mai che un
comando sia andato a buon fine finché non torna lo stato reale.

## PID OBD-II utili (modo 01)

| PID | Grandezza | Note |
|---|---|---|
| `0C` | RPM | standard |
| `0D` | Velocità | può differire dal GPS con gomme maggiorate → fattore di correzione in impostazioni |
| `05` | Temperatura refrigerante | |
| `0B` / `0F` | Pressione collettore / temp. aria aspirata | da cui la sovralimentazione |
| `2F` | Livello carburante | non tutti i Land Cruiser lo espongono |
| `04` | Carico motore calcolato | usato per stimare il consumo |
| `5C` | Temperatura olio | disponibile sul 1KD tardo |

Consumo istantaneo: sul diesel non c'è un PID diretto affidabile; si stima da
carico motore + rpm calibrando su due-tre pieni reali. La schermata TRIP
dell'app ha proprio il campo di calibrazione.
