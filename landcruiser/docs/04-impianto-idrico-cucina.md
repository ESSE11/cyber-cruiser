# 04 — Acqua, cucina, riscaldamento

## Acqua

**Schema a due serbatoi + doccia esterna.**

| Elemento | Scelta | Note |
|---|---|---|
| Serbatoio pulita | 60 L in polietilene alimentare, ribassato, sotto il piano | Baricentro basso, in asse col veicolo. 60 L = ~4 giorni in due con doccia parsimoniosa |
| Bocchettone di carico | esterno, sul fianco sinistro, con filtro a rete | Poter caricare senza aprire il portellone è comodità pura |
| Pompa | autoclave 12 V 10 L/min con pressostato + vaso d'espansione | Il vaso evita che la pompa parta a singhiozzo, e fa meno rumore la notte |
| Filtro | a carboni attivi in linea + (opzionale) UV per viaggi lunghi | Il filtro non fa miracoli: acqua dubbia = pastiglie o bollitura |
| Grigie | tanica 20 L estraibile sotto il lavello | Estraibile perché va svuotata in modo civile, non a terra |
| Doccia | miscelatore con doccetta estraibile dal portellone + tendino | Con boiler o, versione semplice, sacca solare da 20 L sul tetto |
| Acqua calda | opzione A: boiler elettrico 10 L (assorbe tanto) — opzione B: scambiatore sul riscaldatore diesel | La B è più elegante e non pesa sulla batteria |

**Antigelo**: se viaggi d'inverno servono rubinetti di scarico ai punti bassi e
tubi in PEX; svuotare l'impianto è la vera protezione, non il coibentante.

## Cucina

Blocco estraibile su guide da 120 cm che esce dal portellone:

- **Fornello 2 fuochi a gas** con coperchio in vetro (Dometic/Smev).
- **Bombola**: 5 kg in vano stagno **aerato verso l'esterno con foro sul pavimento**
  — questa è la parte da non improvvisare: vano dedicato, chiuso verso
  l'abitacolo, con regolatore certificato e tubo entro data di scadenza.
  In alternativa, se vuoi togliere il gas dall'equazione: **fornello a induzione
  1.800 W + inverter e batteria grande** (funziona, ma ti mangia 300 Wh a cena).
- **Lavello** rettangolare in acciaio con coperchio a filo, che diventa piano.
- Sopra il piano: portarotolo, portaspezie a barra magnetica, presa 12 V + USB-C.
- **Tendalino laterale** 2×2,5 m sul lato guida: è ciò che rende la cucina esterna
  usabile anche con pioggia, ed è il singolo accessorio che cambia di più la vita
  di bordo.

## Riscaldamento e ventilazione

- **Riscaldatore diesel 2 kW** (Webasto/Eberspächer, o cinese se accetti il rischio)
  con presa dal serbatoio principale tramite pescante dedicato: 0,15-0,25 L/h,
  la ventola sola consuma ~25 W. Trasforma il mezzo in tre stagioni piene.
- **Ventilazione**: due prese d'aria a scafo (una bassa in ingresso, una alta in
  uscita) + zanzariere magnetiche sui finestrini posteriori. La condensa è il
  nemico numero uno di ogni camperizzazione: due persone che dormono producono
  ~1 L di acqua a notte.
- Con il soffietto aperto, le finestre in tessuto danno già ottimo ricambio d'aria
  estivo.

## Sensori collegati alla dashboard

| Grandezza | Sensore | Interfaccia |
|---|---|---|
| Livello acqua pulita | sonda a ultrasuoni sul tappo o galleggiante resistivo | ADC (ADS1115) o GPIO |
| Livello grigie | galleggiante on/off "pieno all'80%" | GPIO |
| Temperatura frigo | DS18B20 nel vano | 1-Wire |
| Temperatura interna / esterna | BME280 + DS18B20 esterno | I²C / 1-Wire |
| Gas: livello bombola | bilancia a celle di carico sotto la bombola (HX711) | opzionale, molto utile |
| Riscaldatore acceso | ingresso su relè / lettura tensione ventola | GPIO |
