'use strict';

const WebSocket = require('ws');
const http      = require('http');
const path      = require('path');
const fs        = require('fs');

const GameState     = require('./core/GameState');
const MessageRouter = require('./core/MessageRouter');

/* =========================
   PORT (LOCAL + RAILWAY SAFE)
========================= */
const PORT = process.env.PORT || 8181;

/* =========================
   CLIENT PATH
========================= */
const CLIENT_DIR = path.join(__dirname, '..', 'client');

/* =========================
   MIME TYPES
========================= */
const MIME = {
  '.html':'text/html',
  '.js':'application/javascript',
  '.css':'text/css',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.mp3':'audio/mpeg',
  '.wav':'audio/wav',
  '.json':'application/json',
  '.ico':'image/x-icon',
  '.svg':'image/svg+xml',
};

/* =========================
   HTTP SERVER
========================= */
const httpServer = http.createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');

  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch (e) {
    decoded = urlPath;
  }

  const filePath = path.join(CLIENT_DIR, decoded);

  // security
  if (!filePath.startsWith(CLIENT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream'
    });

    res.end(data);
  });
});

/* =========================
   START SERVER
========================= */
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 BRUTAL OPS SERVER RUNNING');
  console.log('PORT:', PORT);
});

/* =========================
   GAME STATE
========================= */
const gs = new GameState();

/* =========================
   WEBSOCKET SERVER (IMPORTANT FIX)
========================= */
const wss = new WebSocket.Server({ server: httpServer });
const router = new MessageRouter(gs, wss);

/* =========================
   CONNECTIONS
========================= */
wss.on('connection', (ws) => {

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

          router.handle(playerId, msg);
        }
        return;
      }

      router.handle(playerId, msg);

    } catch (e) {}
  });

  ws.on('close', () => {
    if (playerId) {
      console.log('Player left:', playerId);
    }
  });
});

/* =========================
   WORLD STATE LOOP
========================= */
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