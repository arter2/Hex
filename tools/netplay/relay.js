// LAN relay for the local PvP duel: serves the game folder and pairs two WebSockets per room.
// Usage: node tools/netplay/relay.js [--port 8080] [--dir game]
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { WebSocketServer } = require('ws');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2'
};
const MAX_FRAME = 8 * 1024;

function startRelay({ port = 8080, dir = 'game' } = {}) {
  const root = path.resolve(dir);
  const rooms = new Map(); // ROOM -> [ws, ws]

  const server = http.createServer((req, res) => {
    const fail = code => {
      res.writeHead(code, { 'Content-Type': 'text/plain' });
      res.end(code === 404 ? 'Not found' : 'Bad request');
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') return fail(404);
    let rel;
    try {
      rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    } catch (e) {
      return fail(400);
    }
    if (rel.includes('\0')) return fail(404);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(root, '.' + path.sep + rel);
    if (file !== root && !file.startsWith(root + path.sep)) return fail(404);
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) return fail(404);
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': st.size,
        'Cache-Control': 'no-cache'
      });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
    });
  });

  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_FRAME });
  server.on('upgrade', (req, socket, head) => {
    socket.setNoDelay(true);
    let url;
    try {
      url = new URL(req.url, 'http://x');
    } catch (e) {
      return socket.destroy();
    }
    if (url.pathname !== '/relay') return socket.destroy();
    wss.handleUpgrade(req, socket, head, ws => {
      ws.on('error', () => {}); // first: rejected or abusive sockets must never throw uncaught
      const room = (url.searchParams.get('room') || '').toUpperCase();
      if (!/^[A-Z]{4}$/.test(room)) return ws.close(4000, 'bad room');
      const members = rooms.get(room) || [];
      if (members.length >= 2) return ws.close(4001, 'room full');
      members.push(ws);
      rooms.set(room, members);
      ws.on('message', (data, isBinary) => {
        if (isBinary) return;
        const peer = members.find(m => m !== ws);
        if (peer && peer.readyState === 1) peer.send(data.toString(), { binary: false });
      });
      ws.on('close', () => {
        if (rooms.get(room) === members) rooms.delete(room);
        for (const m of members) if (m !== ws && m.readyState <= 1) m.close(1000, 'peer left');
      });
    });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      resolve({
        port: server.address().port,
        close() {
          return new Promise(res => {
            for (const c of wss.clients) c.terminate();
            server.close(() => res());
            server.closeAllConnections();
          });
        }
      });
    });
  });
}

function lanIp() {
  for (const list of Object.values(os.networkInterfaces()))
    for (const i of list || []) if (i.family === 'IPv4' && !i.internal) return i.address;
  return 'localhost';
}

module.exports = { startRelay };

if (require.main === module) {
  const args = process.argv.slice(2);
  const opt = (name, def) => {
    const i = args.indexOf('--' + name);
    return i >= 0 && args[i + 1] ? args[i + 1] : def;
  };
  const dir = path.resolve(opt('dir', path.join(__dirname, '..', '..', 'game')));
  startRelay({ port: Number(opt('port', 8080)), dir })
    .then(r => console.log(`Open http://${lanIp()}:${r.port} on both devices`))
    .catch(e => {
      console.error(e.message);
      process.exit(1);
    });
}
