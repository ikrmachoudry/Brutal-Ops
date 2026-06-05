'use strict';
const WebSocket = require('ws');
const http      = require('http');
const path      = require('path');
const fs        = require('fs');
const GameState     = require('./core/GameState');
const MessageRouter = require('./core/MessageRouter');

const CLIENT_DIR = path.join(__dirname, '..', 'client');
const HTTP_PORT  = process.env.HTTP_PORT  || 8181;
const WS_PORT    = process.env.WS_PORT    || 3000;

const MIME = {
  '.html':'text/html','.js':'application/javascript',
  '.css':'text/css','.png':'image/png','.jpg':'image/jpeg',
  '.mp3':'audio/mpeg','.mpeg':'audio/mpeg','.mp4':'audio/mpeg',
  '.wav':'audio/wav','.ogg':'audio/ogg','.json':'application/json',
  '.ico':'image/x-icon','.svg':'image/svg+xml',
};

const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  let urlPath=req.url.split('?')[0];
  if(urlPath==='/'||urlPath==='')urlPath='/index.html';
  let decoded;
  try{decoded=decodeURIComponent(urlPath);}catch(e){decoded=urlPath;}
  const filePath=path.join(CLIENT_DIR,decoded);
  if(!filePath.startsWith(CLIENT_DIR)){res.writeHead(403);res.end();return;}
  const ext=path.extname(filePath).toLowerCase();
  fs.readFile(filePath,(err,data)=>{
    if(err){
      fs.readFile(filePath+'.html',(err2,data2)=>{
        if(err2){res.writeHead(404);res.end('Not found');return;}
        res.writeHead(200,{'Content-Type':'text/html'});res.end(data2);
      });return;
    }
    res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream'});res.end(data);
  });
});
httpServer.listen(HTTP_PORT,'0.0.0.0',()=>{
  const os=require('os');
  const nets=os.networkInterfaces();
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        BRUTAL OPS SERVER READY       ║');
  console.log('╠══════════════════════════════════════╣');
  console.log('║  Local:  http://localhost:'+HTTP_PORT+'        ║');
  Object.values(nets).forEach(list=>list.forEach(iface=>{
    if(iface.family==='IPv4'&&!iface.internal)
      console.log('║  LAN:    http://'+iface.address+':'+HTTP_PORT+'  ║');
  }));
  console.log('╚══════════════════════════════════════╝\n');
});

const gs     = new GameState();
const wss    = new WebSocket.Server({port:WS_PORT});
const router = new MessageRouter(gs,wss);

wss.on('connection',(ws,req)=>{
  // KEY FIX: Don't add to GameState yet — wait for JOIN message
  // This prevents dummy players appearing in WORLD_STATE before name is set
  let playerId = null;

  ws.on('message',(raw)=>{
    try{
      const msg=JSON.parse(raw);
      // Only add player to state when they send JOIN with their real name
      if(!playerId){
        if(msg.type==='JOIN'){
          playerId=gs.addPlayer(ws);
          if(!playerId){ws.close();return;}
          console.log('[JOIN] '+playerId+' name='+msg.name);
          router.handle(playerId,msg);
        }
        // Ignore all other messages until player has joined
        return;
      }
      router.handle(playerId,msg);
    }catch(e){}
  });

  ws.on('close',()=>{
    if(playerId) console.log('[STAY] '+playerId+' disconnected — stays in game forever');
    // Player stays in game forever — no removal on disconnect
  });
  ws.on('error',()=>{});
});

// WORLD_STATE broadcast every 50ms — only includes players who sent JOIN
setInterval(()=>{
  if(gs.getPlayerCount()===0)return;
  const msg=JSON.stringify({type:'WORLD_STATE',state:gs.getSnapshot()});
  wss.clients.forEach(c=>{if(c.readyState===WebSocket.OPEN)c.send(msg);});
},50);