#!/usr/bin/env python3
"""Server statico per lo sviluppo, con la cache disattivata.

I moduli ES restano in cache nel browser anche quando il file cambia, e si
finisce per guardare una versione vecchia credendo che la modifica non funzioni.
Qui ogni risposta dice esplicitamente di non conservare nulla.

    python3 tools/dev-server.py [porta]
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent


class SenzaCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):   # meno rumore in console
        if "GET" in (args[0] if args else ""):
            return
        super().log_message(fmt, *args)


if __name__ == "__main__":
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8098
    handler = partial(SenzaCache, directory=str(RADICE))
    print(f"Cyber Cruiser su http://localhost:{porta}  (cache disattivata)")
    ThreadingHTTPServer(("127.0.0.1", porta), handler).serve_forever()
