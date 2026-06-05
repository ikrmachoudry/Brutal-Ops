'use strict';

const WebSocket = require('ws');
const http      = require('http');
const path      = require('path');
const fs        = require('fs');

const GameState     = require('./core/GameState');
const MessageRouter = require('./core/MessageRouter');

/* ================================
   SAFE PATH (works local + Railway)
================================ */
const CLIENT_DIR = path.join(__dirname, '..', 'client');

/* ================================
   🔥 CRITICAL FIX FOR RAILWAY
   Railway ONLY uses process.env.PORT
================================ */
const PORT = process.env.PORT || 8181;

/* ================================
   MIME TYPES (UNCHANGED)
================================ */
const MIME = {
  '.html':'text/html','.js':'application/javascript',
  '.css':'text/css','.png':'image/png','.jpg':'image/jpeg',
  '.mp3':'audio/mpeg','.mpeg':'audio/mpeg','.mp4':'audio/mpeg',
  '.wav':'audio/wav','.ogg':'audio/ogg','.json':'application/json',
  '.ico':'image/x-icon','.svg':'image/svg+xml',
};

/* ================================
   HTTP SERVER (UNCHANGED LOGIC)
================================ */
const httpServer = http.createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin','*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch (e) {
    decoded = urlPath;
  }

  const filePath = path.join(CLIENT_DIR, decoded);

  if (!filePath.startsWith(CLIENT_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }

  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(filePath + '.html', (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, {'Content-Type':'text/html'});
        res.end(data2);
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream'
    });

    res.end(data);
  });
});

/* ================================
   🔥 IMPORTANT FIX: SINGLE PORT ONLY
   (HTTP + WebSocket SAME SERVER)
================================ */
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        BRUTAL OPS SERVER READY       ║');
  console.log('╠══════════════════════════════════════╣');
  console.log('║  PORT: ' + PORT + '                        ║');
  console.log('╚══════════════════════════════════════╝\n');
});

/* ================================
   GAME ENGINE (UNCHANGED LOGIC)
================================ */
const gs     = new GameState();
const wss    = new WebSocket.Server({ server: httpServer });
const router = new MessageRouter(gs, wss);

/* ================================
   CONNECTION HANDLER (UNCHANGED)
================================ */
wss.on('connection', (ws, req) => {

  let playerId = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (!playerId) {
        if (msg.type === 'JOIN') {
          playerId = gs.addPlayer(ws);
          if (!playerId) {
            ws.close();
            return;
          }
          console.log('[JOIN] ' + playerId + ' name=' + msg.name);
          router.handle(playerId, msg);
        }
        return;
      }

      router.handle(playerId, msg);

    } catch (e) {}
  });

  ws.on('close', () => {
    if (playerId)
      console.log('[STAY] ' + playerId + ' disconnected — stays in game forever');
  });

  ws.on('error', () => {});
});

/* ================================
   WORLD SYNC LOOP (UNCHANGED)
================================ */
setInterval(() => {
  if (gs.getPlayerCount() === 0) return;

  const msg = JSON.stringify({
    type: 'WORLD_STATE',
    state: gs.getSnapshot()
  });

  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(msg);
    }
  });

}, 50);