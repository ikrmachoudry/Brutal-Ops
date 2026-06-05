'use strict';
// ── BRUTAL OPS — Network.js ──────────────────────────────────

var ws=null,footstepTimer=0,wsReconnectTimer=null;

var REMOTE_WEAPON_COLORS={
  pistol:0x888888,shotgun:0x554422,smg:0x333333,revolver:0x666644,
  rpg:0x445522,sniper:0x334455,lasergun:0x224422,fartgun:0x885500,
  ghostgun:0x222244,crowbar:0x443322
};

function buildRemoteWeapon(weaponId){
  var grp=new THREE.Group();
  var col=REMOTE_WEAPON_COLORS[weaponId]||0x444444;
  var mat=new THREE.MeshStandardMaterial({color:col,roughness:.7,metalness:.3});
  if(weaponId==='crowbar'){
    var bar=new THREE.Mesh(new THREE.CylinderGeometry(.015,.012,.55,6),mat);
    bar.rotation.x=Math.PI/2;grp.add(bar);
  }else if(weaponId==='rpg'){
    var tube=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.55,8),mat);
    tube.rotation.x=Math.PI/2;grp.add(tube);
  }else{
    var body=new THREE.Mesh(new THREE.BoxGeometry(.08,.07,.38),mat);grp.add(body);
    var barrel=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.22,6),
      new THREE.MeshStandardMaterial({color:0x222222,roughness:.5,metalness:.6}));
    barrel.rotation.x=Math.PI/2;barrel.position.set(0,.015,.28);grp.add(barrel);
  }
  grp.position.set(0.22,-0.72,0.12);grp.rotation.y=-0.15;
  return grp;
}

function connectWS(){
  if(wsReconnectTimer){clearTimeout(wsReconnectTimer);wsReconnectTimer=null;}
  try{
    ws=new WebSocket('ws://'+HOST_IP+':'+HOST_PORT);
    ws.onopen=function(){ ws.send(JSON.stringify({type:'JOIN',name:PLAYER_NAME,char:PLAYER_CHAR})); };
    ws.onmessage=function(e){ try{handleMsg(JSON.parse(e.data));}catch(err){} };
    ws.onerror=function(){};
    ws.onclose=function(){ wsReconnectTimer=setTimeout(connectWS,3000); };
  }catch(e){ wsReconnectTimer=setTimeout(connectWS,3000); }
}

function handleMsg(msg){

  if(msg.type==='JOINED'){
    myId=msg.id;

  }else if(msg.type==='WORLD_STATE'){
    if(!myId)return; // NEVER process before we know our own ID

    msg.state.players.forEach(function(p){
      if(p.id===myId)return; // NEVER create mesh for self

      if(!remotePlayers[p.id]){
        var ct=(['doctor','guard','civilian','military'].indexOf(p.char)>-1)?p.char:'doctor';
        var m=mkRemote(p.name||'PLAYER',ct);
        // Name tags never show through walls
        m.traverse(function(c){
          if(c.isSprite&&c.material){c.material.depthTest=true;c.material.depthWrite=false;}
        });
        scene.add(m);
        remotePlayers[p.id]={mesh:m,data:p,currentWeapon:null};
      }
      var rp=remotePlayers[p.id];
      rp.data=p;
      var footY=(typeof p.y==='number')?Math.max(0,p.y-1.7):0;
      rp.mesh.position.set(p.x,footY,p.z);
      rp.mesh.rotation.y=p.rotY||0;
      rp.mesh.visible=(p.alive!==false);

      var wid=p.weapon||'crowbar';
      if(rp.currentWeapon!==wid){
        rp.currentWeapon=wid;
        var armRG=rp.mesh.userData.armRG;
        if(armRG){
          for(var ci=armRG.children.length-1;ci>=0;ci--){
            if(armRG.children[ci].userData.isWeapon)armRG.remove(armRG.children[ci]);
          }
          var wm=buildRemoteWeapon(wid);wm.userData.isWeapon=true;armRG.add(wm);
        }
      }
    });

    var ids=msg.state.players.map(function(p){return p.id;});
    Object.keys(remotePlayers).forEach(function(id){
      if(ids.indexOf(id)===-1){scene.remove(remotePlayers[id].mesh);delete remotePlayers[id];}
    });
    if(typeof updateScoreboard==='function')updateScoreboard(msg.state.players);

  }else if(msg.type==='PLAYER_DIED'){
    if(typeof addKF==='function')
      addKF((msg.killerName||'?')+' killed '+(msg.victimName||'?'),true,false);

    if(msg.id===myId){
      alive=false;
      playHurt(true);
      playFX('splash');
      document.getElementById('ds').classList.add('on');
      document.getElementById('dmsg').textContent='KILLED BY '+(msg.killerName||'ENEMY').toUpperCase();
      if(typeof velX!=='undefined'){velX=0;velZ=0;}
    }

    // On opponent death: REMOVE mesh entirely — WORLD_STATE will re-create at respawn pos
    // This prevents the "dummy standing at spawn" glitch
    if(msg.id!==myId&&remotePlayers[msg.id]){
      scene.remove(remotePlayers[msg.id].mesh);
      delete remotePlayers[msg.id];
      playFX('splash');
    }
    if(msg.killerId===myId){kills++;if(typeof checkStreak==='function')checkStreak();}

  }else if(msg.type==='PLAYER_RESPAWNED'){
    if(msg.id===myId){
      hp=100;alive=true;updateHPBar();
      document.getElementById('ds').classList.remove('on');
      if(typeof velX!=='undefined'){velX=0;velZ=0;}
      footstepTimer=0;
    }
    // Don't try to show remotePlayers[msg.id] — it was deleted on death
    // WORLD_STATE will automatically re-create the mesh at new spawn position

  }else if(msg.type==='YOU_HIT'){
    hp=msg.hp;updateHPBar();showHF();
    // Play hurt sound only — no death sound here
    try{if(typeof SFX!=='undefined'&&SFX.hurt)SFX.hurt.play();}catch(e){}
    if(msg.by&&remotePlayers[msg.by]&&typeof triggerHitShake==='function')
      triggerHitShake(remotePlayers[msg.by]);

  }else if(msg.type==='PLAYER_LEFT'){
    if(remotePlayers[msg.id]){scene.remove(remotePlayers[msg.id].mesh);delete remotePlayers[msg.id];}

  }else if(msg.type==='DOOR_STATE'){
    if(typeof MapLoader!=='undefined')MapLoader.openDoor(msg.doorId,msg.open);

  }else if(msg.type==='GRENADE_EXPLODE'){
    if(typeof doExplode==='function')doExplode(new THREE.Vector3(msg.x,msg.y||0,msg.z));

  }else if(msg.type==='BULLET_MARK'){
    if(typeof addBulletMark==='function')
      addBulletMark(new THREE.Vector3(msg.x,msg.y,msg.z),new THREE.Vector3(msg.nx,msg.ny,msg.nz));

  }else if(msg.type==='RPG_IMPACT'){
    if(typeof spawnRPGImpact==='function')spawnRPGImpact(new THREE.Vector3(msg.x,msg.y,msg.z));

  }else if(msg.type==='LASER_BEAM'){
    if(msg.from===myId)return;
    var bMat=new THREE.MeshBasicMaterial({color:0x00ff88,transparent:true,opacity:.9});
    var frm=new THREE.Vector3(msg.fx,msg.fy,msg.fz),to=new THREE.Vector3(msg.tx,msg.ty,msg.tz);
    var bDir=to.clone().sub(frm).normalize(),bLen=frm.distanceTo(to);
    var bm=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,bLen,6),bMat);
    bm.position.copy(frm.clone().add(to).multiplyScalar(.5));
    bm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bDir);
    scene.add(bm);
    var lFadeT=0;
    var lInt=setInterval(function(){
      lFadeT+=0.1;bMat.opacity=Math.max(0,.9-lFadeT);
      if(lFadeT>=1){clearInterval(lInt);scene.remove(bm);}
    },40);

  }else if(msg.type==='FART_CLOUD'){
    if(msg.from===myId)return;
    if(typeof spawnFartCloud==='function')
      spawnFartCloud(new THREE.Vector3(msg.x,msg.y,msg.z), true); // true = don't re-broadcast

  }else if(msg.type==='GHOST_SPAWN'){
    if(msg.from===myId)return;
    if(typeof spawnGhost==='function'){
      var gd=new THREE.Vector3(msg.dx,0,msg.dz).normalize();
      spawnGhost(new THREE.Vector3(msg.x,msg.y,msg.z),gd,msg.from,msg.name||'GHOST', true); // true = don't re-broadcast
      // Play ghost sound at distance-based volume for receiver
      try{
        if(typeof SFX!=='undefined'&&SFX.ghost_fire){
          var gx=msg.x-playerPos.x, gz=msg.z-playerPos.z;
          var gvol=Math.max(0.1,Math.min(0.45,1-Math.sqrt(gx*gx+gz*gz)/30));
          SFX.ghost_fire.volume(gvol); SFX.ghost_fire.play();
        }
      }catch(e){}
    }

  }else if(msg.type==='POOP_SPAWN'){
    if(msg.from===myId)return;
    if(typeof spawnPoop==='function')
      spawnPoop(new THREE.Vector3(msg.x,msg.y||0,msg.z), true); // true = don't re-broadcast

  }else if(msg.type==='PLAYER_FOOTSTEP'){
    var fdx=msg.x-playerPos.x,fdz=msg.z-playerPos.z;
    var fdist=Math.sqrt(fdx*fdx+fdz*fdz);
    if(fdist<22){
      var fvol=Math.max(0,(1-fdist/22)*.55);
      try{if(typeof SFX!=='undefined'&&SFX.footstep){SFX.footstep.volume(fvol);SFX.footstep.play('step');}}catch(e){}
    }
  }
}

function sendMove(){
  if(!ws||ws.readyState!==1||!myId)return;
  var vx=typeof velX!=='undefined'?velX:0;
  var vz=typeof velZ!=='undefined'?velZ:0;
  var spd=Math.sqrt(vx*vx+vz*vz);
  ws.send(JSON.stringify({
    type:'MOVE',
    x:playerPos.x,y:playerPos.y,z:playerPos.z,rotY:yaw,
    crouching:crouching||false,moving:spd>0.5,sprinting:spd>8,
    char:PLAYER_CHAR,
    weapon:(typeof WEAPONS!=='undefined'&&WEAPONS[curWIdx])?WEAPONS[curWIdx].id:'crowbar',
  }));
  if(spd>0.5){
    footstepTimer+=0.05;
    var interval=spd>8?.28:.42;
    if(footstepTimer>=interval){
      footstepTimer=0;
      ws.send(JSON.stringify({type:'FOOTSTEP',x:playerPos.x,y:playerPos.y,z:playerPos.z,sprinting:spd>8}));
    }
  }else footstepTimer=0;
}

function updateRemotePlayers(dt){
  Object.values(remotePlayers).forEach(function(rp){
    if(typeof animateRemoteLegs==='function')
      animateRemoteLegs(rp,dt,rp.data.moving,rp.data.sprinting,rp.data.crouching,rp.data.y);
  });
}