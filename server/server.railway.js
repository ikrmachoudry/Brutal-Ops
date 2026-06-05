'use strict';
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const GameState = require('./core/GameState');
const MessageRouter = require('./core/MessageRouter');

const CLIENT_DIR = path.join(__dirname, 'client');
const PORT = process.env.PORT || 8080;

const httpServer = http.createServer((req, res) => {
    // Basic static file server logic
    let urlPath = req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0];
    const filePath = path.join(CLIENT_DIR, urlPath);
    fs.readFile(filePath, (err, data) => {
        if (err) res.writeHead(404), res.end();
        else res.writeHead(200), res.end(data);
    });
});

// Attach WebSockets to the SAME server
const wss = new WebSocket.Server({ server: httpServer });
const gs = new GameState();
const router = new MessageRouter(gs, wss);

wss.on('connection', (ws) => {
    let playerId = null;
    ws.on('message', (raw) => {
        const msg = JSON.parse(raw);
        if (!playerId && msg.type === 'JOIN') {
            playerId = gs.addPlayer(ws);
            router.handle(playerId, msg);
        } else if (playerId) {
            router.handle(playerId, msg);
        }
    });
});

httpServer.listen(PORT, '0.0.0.0', () => console.log('Railway Server running on ' + PORT));