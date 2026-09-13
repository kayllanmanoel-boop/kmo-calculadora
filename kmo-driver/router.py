#!/usr/bin/env python3
import os
import http.client
import urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path

PUBLIC_PORT = int(os.getenv('PORT', '80'))
GATEWAY_PORT = int(os.getenv('KMO_GATEWAY_INTERNAL_PORT', '8002'))
APP_FILE = Path(__file__).resolve().parent.parent / 'rastreamento-psicologico' / 'index.html'

class Router(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, fmt, *args):
        print('[ROUTER]', fmt % args, flush=True)

    def send_bytes(self, status, data, content_type='text/html; charset=utf-8'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)

    def psychological_screening(self):
        try:
            data = APP_FILE.read_bytes()
            self.send_bytes(200, data)
        except Exception as exc:
            self.send_bytes(503, f'Questionário temporariamente indisponível: {exc}'.encode('utf-8'), 'text/plain; charset=utf-8')

    def proxy(self):
        length = int(self.headers.get('Content-Length', '0') or 0)
        body = self.rfile.read(length) if length else None
        headers = {k: v for k, v in self.headers.items() if k.lower() not in {'host','connection','content-length','transfer-encoding'}}
        headers['Host'] = f'127.0.0.1:{GATEWAY_PORT}'
        if body is not None:
            headers['Content-Length'] = str(len(body))
        try:
            conn = http.client.HTTPConnection('127.0.0.1', GATEWAY_PORT, timeout=30)
            conn.request(self.command, self.path, body=body, headers=headers)
            response = conn.getresponse()
            data = response.read()
            self.send_response(response.status, response.reason)
            for key, value in response.getheaders():
                if key.lower() not in {'connection','keep-alive','transfer-encoding','content-length','upgrade'}:
                    self.send_header(key, value)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(data)
        except Exception as exc:
            self.send_bytes(503, f'Serviço temporariamente indisponível: {exc}'.encode('utf-8'), 'text/plain; charset=utf-8')

    def route(self):
        path = urllib.parse.urlsplit(self.path).path.rstrip('/')
        if path == '/rastreamento-psicologico':
            return self.psychological_screening()
        return self.proxy()

    def do_GET(self): return self.route()
    def do_HEAD(self): return self.route()
    def do_POST(self): return self.proxy()
    def do_PUT(self): return self.proxy()
    def do_PATCH(self): return self.proxy()
    def do_DELETE(self): return self.proxy()
    def do_OPTIONS(self): return self.proxy()

if __name__ == '__main__':
    print(f'[ROUTER] Porta pública {PUBLIC_PORT}; gateway interno {GATEWAY_PORT}; questionário em /rastreamento-psicologico/', flush=True)
    ThreadingHTTPServer(('0.0.0.0', PUBLIC_PORT), Router).serve_forever()
