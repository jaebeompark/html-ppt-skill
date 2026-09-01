#!/usr/bin/env python3
"""html-ppt :: edit-server.py — serve a deck with in-place editing.

Started by scripts/edit.sh. Three things beyond a static file server:

  GET  /__edit/source?path=<rel>   the deck's own bytes, plus its mtime
  POST /__edit/save                write the deck back, if mtime still matches
  POST /__edit/image?path=<rel>    write a pasted image next to the deck

The editor script is INJECTED at serve time when the URL carries ?edit=1, so
no deck file on disk has to know the editor exists. Open the same file without
the server and it is the static deck it always was.

The client sends the complete new file text rather than a patch list: the
patch logic lives in assets/editor-patch.js, is unit-tested in Node, and
should not be reimplemented here in a second language.

Binds to 127.0.0.1. This writes files, so it must not be reachable off-box.
"""

import http.server
import json
import mimetypes
import os
import posixpath
import re
import socketserver
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The tags the injector adds. editor-patch.js must load first; editor.js uses it.
INJECT = (
    '<script src="/assets/editor-patch.js"></script>\n'
    '<script src="/assets/editor.js"></script>\n'
)

IMAGE_EXT = {
    'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif',
    'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/avif': '.avif',
}


def safe_path(rel):
    """Resolve a client-supplied path inside ROOT, or raise.

    The client picks these paths, so a traversal guard is not optional even on
    a loopback server — a stray '../../..' would happily write outside the repo.
    """
    rel = urllib.parse.unquote(rel or '').lstrip('/')
    p = (ROOT / rel).resolve()
    if p != ROOT and ROOT not in p.parents:
        raise ValueError('path escapes the repository: %s' % rel)
    return p


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    # keep the console readable — one line per request, no noise
    def log_message(self, fmt, *args):
        if '/__edit/' in (self.path or ''):
            sys.stderr.write('  %s\n' % (fmt % args))

    # ------------------------------------------------------------------ GET
    def do_GET(self):
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.path == '/__edit/source':
            return self.serve_source(parsed)
        if parsed.path.endswith('.html') and 'edit=1' in (parsed.query or ''):
            return self.serve_injected(parsed)
        return super().do_GET()

    def serve_source(self, parsed):
        q = urllib.parse.parse_qs(parsed.query)
        try:
            p = safe_path((q.get('path') or [''])[0])
            text = p.read_text(encoding='utf-8')
        except Exception as e:
            return self.send_json(400, {'error': str(e)})
        self.send_json(200, {'text': text, 'mtime': p.stat().st_mtime})

    def serve_injected(self, parsed):
        """Serve the deck with the editor appended before </body>."""
        try:
            p = safe_path(parsed.path)
            html = p.read_text(encoding='utf-8')
        except Exception as e:
            return self.send_json(400, {'error': str(e)})
        if '</body>' in html:
            html = html.replace('</body>', INJECT + '</body>', 1)
        else:
            html += INJECT
        body = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    # ----------------------------------------------------------------- POST
    def do_POST(self):
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.path == '/__edit/save':
            return self.do_save()
        if parsed.path == '/__edit/image':
            return self.do_image(parsed)
        return self.send_json(404, {'error': 'unknown endpoint'})

    def do_save(self):
        try:
            payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            p = safe_path(payload['path'])
            # Refuse if the file moved under us — the client's patch offsets
            # were computed against the text it loaded, not against this.
            if abs(p.stat().st_mtime - float(payload['mtime'])) > 1e-6:
                return self.send_json(409, {
                    'error': 'the file changed on disk since you started editing; '
                             'reload the page and redo this edit'})
            p.write_text(payload['text'], encoding='utf-8')
        except Exception as e:
            return self.send_json(400, {'error': str(e)})
        sys.stderr.write('  saved %s (%d bytes)\n' % (payload['path'], len(payload['text'])))
        self.send_json(200, {'ok': True, 'mtime': p.stat().st_mtime})

    def do_image(self, parsed):
        """Write a pasted image beside the deck and hand back a relative src."""
        q = urllib.parse.parse_qs(parsed.query)
        try:
            deck = safe_path((q.get('path') or [''])[0])
            ctype = (self.headers.get('Content-Type') or '').split(';')[0].strip()
            ext = IMAGE_EXT.get(ctype)
            if not ext:
                return self.send_json(415, {'error': 'unsupported image type: %s' % ctype})
            blob = self.rfile.read(int(self.headers['Content-Length']))
            img_dir = deck.parent / 'img'
            img_dir.mkdir(exist_ok=True)
            # paste-001.png, paste-002.png … stable, sortable, no collisions
            n = 1
            while (img_dir / ('paste-%03d%s' % (n, ext))).exists():
                n += 1
            out = img_dir / ('paste-%03d%s' % (n, ext))
            out.write_bytes(blob)
        except Exception as e:
            return self.send_json(400, {'error': str(e)})
        sys.stderr.write('  wrote %s (%d bytes)\n' % (out.relative_to(ROOT), len(blob)))
        self.send_json(200, {'src': 'img/' + out.name})

    # ----------------------------------------------------------------- util
    def send_json(self, code, obj):
        body = json.dumps(obj).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    with Server(('127.0.0.1', port), Handler) as httpd:
        sys.stderr.write('edit server on http://127.0.0.1:%d (ctrl-c to stop)\n' % port)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            sys.stderr.write('\nstopped\n')
