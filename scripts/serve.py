from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
ROOT = Path(__file__).resolve().parents[1] / "prototype"
os.chdir(ROOT)
print("AZWO baseline demo: http://localhost:4173")
ThreadingHTTPServer(("127.0.0.1", 4173), SimpleHTTPRequestHandler).serve_forever()
