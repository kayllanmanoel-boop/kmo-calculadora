#!/usr/bin/env python3
import os, sys, zipfile, base64
from pathlib import Path

root = Path(__file__).resolve().parent
parts = sorted(root.glob('package.b64.*'))
if not parts:
    raise SystemExit('Pacote do KMO Driver não encontrado.')
raw = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
archive = root / 'package.zip'
archive.write_bytes(base64.b64decode(raw))
with zipfile.ZipFile(archive) as z:
    z.extractall(root)
os.execv(sys.executable, [sys.executable, str(root / 'server.py')])
