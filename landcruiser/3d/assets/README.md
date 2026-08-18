# Scocca reale (opzionale)

Il modello del vano è nostro e sta nel repo. La **carrozzeria vera** no: è un file
di terzi con la sua licenza, quindi si scarica a parte e si mette qui.

Senza il file, il 3D funziona lo stesso con la scocca schematica trasparente
(quella costruita dalle quote di catalogo). Con il file, compare il pulsante
**SCOCCA REALE** e si può passare dall'una all'altra.

```
assets/
  scocca.glb     ← il modello scaricato, convertito in glTF binario
  scocca.json    ← come allinearlo alle nostre quote (scala, offset, rotazione)
```

## Modelli candidati

| Modello | Fonte | Licenza | Triangoli | Note |
|---|---|---|---|---|
| Land Cruiser Prado 3 e 5 porte 2009 | [Sketchfab — Nieve5677](https://sketchfab.com/3d-models/toyota-land-cruiser-prado-3-and-5-door-2009-6c2afc7a52164f19ba910af17cd57fa1) | CC-BY | 2,3 M | è il 120: la nostra generazione |
| Land Cruiser Prado 3 e 5 porte (v2) | [Sketchfab — Nieve5677](https://sketchfab.com/3d-models/toyota-land-cruiser-prado-3-and-5-door-cb723cf40aed491f88806e1de8a3744d) | CC-BY | 2,6 M | variante dello stesso autore |
| Land Cruiser 100 series | [Sketchfab — mavogen1](https://sketchfab.com/3d-models/toyota-land-cruiser-100-series-8c6e399714754b31b2bc5208c926204a) | CC-BY | 81,7 k | leggerissimo, ma è il 100 |
| Prado 120 5 porte 2009 | [3DModels.org](https://3dmodels.org/3d-models/toyota-land-cruiser-prado-120-5-door-2009/) | da verificare | — | FBX/OBJ/3DS/C4D |

**CC-BY vuol dire attribuzione obbligatoria**: autore e link vanno citati qui sotto
e nei PDF che escono dal progetto. Sketchfab richiede l'accesso con un account per
scaricare: il download lo fai tu, il resto è automatico.

## Da 2 milioni di triangoli a qualcosa che gira sul Raspberry

Un modello da 2,3 M triangoli fa arrancare qualsiasi tablet e non serve a niente:
qui la scocca è un contenitore, non il soggetto. Si decima a ~120 k.

```bash
npx @gltf-transform/cli dedup      scocca-originale.glb  a.glb
npx @gltf-transform/cli weld       a.glb                 b.glb
npx @gltf-transform/cli simplify   b.glb                 c.glb --ratio 0.06 --error 0.002
npx @gltf-transform/cli resize     c.glb                 d.glb --width 1024 --height 1024
npx @gltf-transform/cli draco      d.glb                 scocca.glb
```

Se parti da FBX/OBJ, prima passa da Blender: importa, **applica scala**, esporta glTF 2.0 binario.

## Allineamento alle nostre quote

Tutto il modello lavora in **centimetri**, con l'origine sul filo del portellone
(z = 0), fiancata sinistra (x = 0) e piano stradale (y = 0). I GLB in genere sono
in metri e centrati sul baricentro: l'adattamento sta in `scocca.json`, così non
si tocca il codice.

```json
{
  "scala": 100,
  "rotY": 180,
  "dx": 65,
  "dy": 0,
  "dz": 210,
  "opacita": 0.35
}
```

| Campo | Cosa fa |
|---|---|
| `scala` | moltiplicatore (100 = il GLB è in metri) |
| `rotY` | rotazione in gradi attorno alla verticale: serve se il muso guarda dalla parte sbagliata |
| `dx dy dz` | traslazione in cm per far coincidere assi ruota e filo portellone |
| `opacita` | 1 = pieno, 0.35 = si vede l'allestimento dentro |

Riferimenti per la verifica: passo **279 cm**, lunghezza **484 cm**, larghezza
**185,5 cm**, raggio ruota **38 cm**, asse posteriore a **85 cm** dal filo portellone.
Attiva **ETICHETTE** e la vista **LATERALE**: se le ruote del GLB coincidono con
quelle schematiche, l'allineamento è giusto.

## Attribuzioni

Da compilare quando il file entra nella cartella:

```
scocca.glb — <titolo> di <autore> (<url>), CC-BY 4.0, decimato e ricompresso.
```
