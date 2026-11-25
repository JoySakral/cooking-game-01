// serve.ts — a tiny static file server for play-testing the game locally.
// Serves game/ at http://localhost:8080 (or $PORT). No build step, no
// dependencies, just the standard library.
//
//   node serve.ts
//   open http://localhost:8080

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const PORT = Number(process.env.PORT ?? 8080);
const GAME_DIR = resolve(import.meta.dirname, 'game');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const file = join(GAME_DIR, path);
    if (!file.startsWith(GAME_DIR) || !existsSync(file) || !statSync(file).isFile()) {
      console.log(`serve.ts: 404 ${path}`);
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found\n');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(`server error: ${(err as Error).message}\n`);
  }
});

server.listen(PORT, () => {
  console.log(`serve.ts: Warung Sari Rasa at http://localhost:${PORT}/`);
  console.log('serve.ts: try ?shot=start, ?shot=play, ?shot=serve, ?shot=end (add &seed=1)');
});
