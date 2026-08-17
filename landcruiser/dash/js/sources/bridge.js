// Sorgente REALE: si collega al daemon Python sul Raspberry via WebSocket.
// Se il daemon non risponde entro il timeout, il chiamante passa al simulatore;
// il bridge continua però a ritentare in sottofondo, così quando accendi il
// quadro la dashboard passa da sola a LIVE.

import { applyPatch } from '../store.js';

const DEFAULT_URL = `ws://${location.hostname || 'localhost'}:8765`;
const RETRY_MS = 3000;

export class Bridge {
  /**
   * @param {string} url  indirizzo del daemon
   * @param {(connected:boolean)=>void} onStatus  notifica di connessione
   */
  constructor(url = DEFAULT_URL, onStatus = () => {}) {
    this.url = url;
    this.onStatus = onStatus;
    this.ws = null;
    this.connected = false;
    this.stopped = false;
    this.retry = null;
  }

  start() {
    this.stopped = false;
    this.connect();
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.retry);
    if (this.ws) { this.ws.onclose = null; this.ws.close(); this.ws = null; }
    this.connected = false;
  }

  connect() {
    if (this.stopped) return;
    let ws;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.scheduleRetry();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.connected = true;
      this.onStatus(true);
    };

    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.type === 'telemetry') {
        const { type, ts, ...patch } = msg;
        applyPatch(patch);
      }
    };

    ws.onclose = () => {
      if (this.connected) this.onStatus(false);
      this.connected = false;
      this.ws = null;
      this.scheduleRetry();
    };

    ws.onerror = () => { try { ws.close(); } catch { /* già chiuso */ } };
  }

  scheduleRetry() {
    if (this.stopped) return;
    clearTimeout(this.retry);
    this.retry = setTimeout(() => this.connect(), RETRY_MS);
  }

  /** Invia un comando al daemon (luci, pompa, riscaldatore...). */
  command(target, value) {
    if (!this.connected) return false;
    this.ws.send(JSON.stringify({ type: 'command', target, value }));
    return true;
  }
}
