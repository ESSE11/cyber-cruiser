#!/usr/bin/env python3
"""
CYBER CRUISER — daemon di telemetria per Raspberry Pi.

Legge le sorgenti di bordo e pubblica lo stato su WebSocket (ws://0.0.0.0:8765)
nel formato descritto in docs/05-elettronica-schermo.md.

Ogni sorgente è opzionale e degrada da sola: se manca la libreria o l'hardware
non risponde, quella sezione semplicemente non viene pubblicata e la dashboard
mostra gli ultimi valori noti. Così puoi montare i pezzi uno alla volta.

    pip install websockets python-obd pyserial smbus2 gps3
    python3 telemetry.py --obd /dev/ttyUSB0 --vedirect /dev/ttyUSB1
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import time

try:
    import websockets
except ImportError:  # pragma: no cover
    raise SystemExit("Manca il pacchetto 'websockets': pip install websockets")

LOG = logging.getLogger("cybercruiser")

HZ = 5.0
STATE: dict = {}
CLIENTS: set = set()


# --------------------------------------------------------------------------
# utilità
# --------------------------------------------------------------------------

def merge(dst: dict, patch: dict) -> dict:
    """Merge ricorsivo di una patch nello stato."""
    for k, v in patch.items():
        if isinstance(v, dict):
            merge(dst.setdefault(k, {}), v)
        else:
            dst[k] = v
    return dst


async def broadcast_loop() -> None:
    """Invia lo stato completo a tutti i client a 5 Hz."""
    while True:
        await asyncio.sleep(1 / HZ)
        if not CLIENTS or not STATE:
            continue
        msg = json.dumps({"type": "telemetry", "ts": time.time(), **STATE})
        dead = []
        for ws in CLIENTS:
            try:
                await ws.send(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            CLIENTS.discard(ws)


# --------------------------------------------------------------------------
# sorgenti
# --------------------------------------------------------------------------

async def obd_source(port: str | None) -> None:
    """Motore via OBD-II. Sul KDJ120 2006+ è CAN ISO 15765-4."""
    try:
        import obd
    except ImportError:
        LOG.warning("python-obd non installato: sorgente motore disattivata")
        return

    conn = None
    pids = {
        "rpm": obd.commands.RPM,
        "speed": obd.commands.SPEED,
        "coolant": obd.commands.COOLANT_TEMP,
        "load": obd.commands.ENGINE_LOAD,
        "intakeP": obd.commands.INTAKE_PRESSURE,
        "fuelLevel": obd.commands.FUEL_LEVEL,
    }

    while True:
        if conn is None or not conn.is_connected():
            LOG.info("connessione OBD...")
            conn = obd.OBD(port, fast=False, timeout=1.0)
            if not conn.is_connected():
                await asyncio.sleep(5)
                continue
            LOG.info("OBD connesso su %s", conn.port_name())

        out: dict = {}
        for key, cmd in pids.items():
            try:
                r = conn.query(cmd)
            except Exception:
                continue
            if r is None or r.is_null():
                continue
            out[key] = float(r.value.magnitude)

        patch = {}
        if "rpm" in out:
            patch["rpm"] = out["rpm"]
        if "speed" in out:
            patch["speed"] = out["speed"]
        if "coolant" in out:
            patch["coolant"] = out["coolant"]
        if "fuelLevel" in out:
            patch["fuelLevel"] = out["fuelLevel"] / 100.0
        if "intakeP" in out:
            # pressione assoluta collettore -> sovralimentazione relativa (bar)
            patch["boost"] = max(0.0, (out["intakeP"] - 101.3) / 100.0)
        if "load" in out and out.get("speed", 0) > 3:
            # stima consumo: da calibrare su tre pieni reali (vedi doc 05)
            l_per_h = 1.1 + (out["load"] / 100.0) * 9.5
            patch["consumption"] = l_per_h / out["speed"] * 100

        if patch:
            merge(STATE, {"vehicle": patch})
        await asyncio.sleep(0.2)


async def vedirect_source(port: str | None, field_map: dict) -> None:
    """Victron SmartShunt / MPPT via VE.Direct (testo ASCII, 1 blocco/secondo)."""
    if not port:
        return
    try:
        import serial
    except ImportError:
        LOG.warning("pyserial non installato: sorgente Victron disattivata")
        return

    while True:
        try:
            with serial.Serial(port, 19200, timeout=2) as ser:
                LOG.info("VE.Direct aperto su %s", port)
                block: dict = {}
                while True:
                    raw = ser.readline().decode("ascii", "ignore").strip()
                    if not raw:
                        continue
                    if "\t" not in raw:
                        continue
                    key, _, val = raw.partition("\t")
                    if key == "Checksum":
                        patch = field_map(block)
                        if patch:
                            merge(STATE, patch)
                        block = {}
                    else:
                        block[key] = val
                    await asyncio.sleep(0)
        except Exception as exc:
            LOG.warning("VE.Direct %s: %s", port, exc)
            await asyncio.sleep(5)


def shunt_fields(block: dict) -> dict:
    """Campi del SmartShunt: V in mV, I in mA, SOC in per-mille, TTG in minuti."""
    out: dict = {}
    if "V" in block:
        out["battV"] = int(block["V"]) / 1000.0
    if "I" in block:
        out["battA"] = int(block["I"]) / 1000.0
    if "SOC" in block:
        out["soc"] = int(block["SOC"]) / 1000.0
    if "TTG" in block:
        ttg = int(block["TTG"])
        out["toEmptyH"] = 99.0 if ttg < 0 else ttg / 60.0
    return {"power": out} if out else {}


def mppt_fields(block: dict) -> dict:
    """Campi dell'MPPT: PPV è la potenza fotovoltaica istantanea in W."""
    if "PPV" not in block:
        return {}
    return {"power": {"solarW": int(block["PPV"])}}


async def imu_source() -> None:
    """Inclinometro MPU-6050 su I²C (indirizzo 0x68)."""
    try:
        from smbus2 import SMBus
    except ImportError:
        LOG.warning("smbus2 non installato: inclinometro disattivato")
        return

    import math
    ADDR = 0x68
    try:
        bus = SMBus(1)
        bus.write_byte_data(ADDR, 0x6B, 0)  # sveglia il sensore
    except Exception as exc:
        LOG.warning("IMU non raggiungibile: %s", exc)
        return

    pitch_f = roll_f = 0.0
    while True:
        try:
            data = bus.read_i2c_block_data(ADDR, 0x3B, 6)
            def word(hi, lo):
                v = (data[hi] << 8) | data[lo]
                return v - 65536 if v > 32767 else v
            ax, ay, az = word(0, 1), word(2, 3), word(4, 5)
            pitch = math.degrees(math.atan2(ax, math.hypot(ay, az)))
            roll = math.degrees(math.atan2(ay, math.hypot(ax, az)))
            # filtro passa-basso: sullo sterrato il segnale grezzo è inutilizzabile
            pitch_f += (pitch - pitch_f) * 0.15
            roll_f += (roll - roll_f) * 0.15
            merge(STATE, {"attitude": {"pitch": round(pitch_f, 2), "roll": round(roll_f, 2)}})
        except Exception as exc:
            LOG.debug("lettura IMU fallita: %s", exc)
        await asyncio.sleep(0.1)


async def gps_source() -> None:
    """Posizione, quota e rotta da gpsd."""
    try:
        from gps3 import gps3 as g3
    except ImportError:
        LOG.warning("gps3 non installato: GPS disattivato")
        return

    socket = g3.GPSDSocket()
    stream = g3.DataStream()
    try:
        socket.connect()
        socket.watch()
    except Exception as exc:
        LOG.warning("gpsd non raggiungibile: %s", exc)
        return

    for new_data in socket:
        if new_data:
            stream.unpack(new_data)
            tpv = stream.TPV
            patch: dict = {}
            if tpv.get("lat") not in (None, "n/a"):
                patch["lat"] = float(tpv["lat"])
                patch["lon"] = float(tpv["lon"])
                patch["fix"] = int(tpv.get("mode", 0))
            if patch:
                merge(STATE, {"gps": patch})
            if tpv.get("alt") not in (None, "n/a"):
                merge(STATE, {"attitude": {"altitude": float(tpv["alt"])}})
            if tpv.get("track") not in (None, "n/a"):
                merge(STATE, {"attitude": {"heading": float(tpv["track"])}})
        await asyncio.sleep(0.2)


async def camper_source() -> None:
    """Serbatoi e temperature: ADS1115 + DS18B20. Sostituisci con i tuoi sensori."""
    import glob
    import os

    def ds18b20(sensor_dir: str) -> float | None:
        try:
            with open(os.path.join(sensor_dir, "w1_slave")) as fh:
                txt = fh.read()
            if "YES" not in txt:
                return None
            return int(txt.split("t=")[-1]) / 1000.0
        except Exception:
            return None

    while True:
        sensors = sorted(glob.glob("/sys/bus/w1/devices/28-*"))
        patch: dict = {}
        # convenzione: primo sensore = frigo, secondo = interno, terzo = esterno
        for name, path in zip(("fridgeTemp", "insideTemp", "outsideTemp"), sensors):
            t = ds18b20(path)
            if t is not None:
                patch[name] = round(t, 1)
        if patch:
            merge(STATE, {"camper": patch})
        await asyncio.sleep(5)


# --------------------------------------------------------------------------
# comandi dalla dashboard
# --------------------------------------------------------------------------

# Mappa comando -> pin GPIO del relè. Adatta ai tuoi collegamenti.
RELAYS = {
    "camper.lights.interior": 17,
    "camper.lights.awning": 27,
    "camper.pump": 22,
    "camper.heater": 23,
}

_gpio = None


def set_relay(target: str, value: bool) -> None:
    global _gpio
    pin = RELAYS.get(target)
    if pin is None:
        LOG.warning("comando sconosciuto: %s", target)
        return
    if _gpio is None:
        try:
            from gpiozero import DigitalOutputDevice
            _gpio = {t: DigitalOutputDevice(p) for t, p in RELAYS.items()}
        except Exception as exc:
            LOG.warning("GPIO non disponibile (%s): comando solo simulato", exc)
            _gpio = {}
    dev = _gpio.get(target)
    if dev is not None:
        dev.on() if value else dev.off()

    # aggiorna lo stato: la dashboard si fida solo di ciò che torna indietro
    path = target.split(".")
    node = STATE
    for part in path[:-1]:
        node = node.setdefault(part, {})
    node[path[-1]] = bool(value)


async def handler(ws) -> None:
    CLIENTS.add(ws)
    LOG.info("client collegato (%d attivi)", len(CLIENTS))
    try:
        if STATE:
            await ws.send(json.dumps({"type": "telemetry", "ts": time.time(), **STATE}))
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if msg.get("type") == "command":
                set_relay(msg.get("target", ""), bool(msg.get("value")))
    except Exception as exc:
        LOG.debug("client terminato: %s", exc)
    finally:
        CLIENTS.discard(ws)


# --------------------------------------------------------------------------

async def main(args) -> None:
    tasks = [
        broadcast_loop(),
        obd_source(args.obd),
        vedirect_source(args.vedirect, shunt_fields),
        vedirect_source(args.mppt, mppt_fields),
        imu_source(),
        gps_source(),
        camper_source(),
    ]
    async with websockets.serve(handler, args.host, args.port):
        LOG.info("daemon in ascolto su ws://%s:%d", args.host, args.port)
        await asyncio.gather(*[asyncio.create_task(t) for t in tasks])


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Daemon di telemetria Cyber Cruiser")
    p.add_argument("--host", default="0.0.0.0")
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--obd", default=None, help="porta OBD (es. /dev/ttyUSB0); vuoto = autorilevamento")
    p.add_argument("--vedirect", default=None, help="porta VE.Direct dello SmartShunt")
    p.add_argument("--mppt", default=None, help="porta VE.Direct del regolatore MPPT")
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    try:
        asyncio.run(main(args))
    except KeyboardInterrupt:
        LOG.info("uscita")
