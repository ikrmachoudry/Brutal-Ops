'use strict';
// ── BRUTAL OPS — Game.js ─────────────────────────────────────
// Death = mesh hide + sounds only. Zero loops. Zero crash.
// ------------------------------------------------------------
var grnM=new THREE.MeshStandardMaterial({color:0x445522,roughness:.6,metalness:.5});

function throwGren(){
  if(grenades<=0)return;
  grenades--;
  document.getElementById('grc').textContent='GRENADES: '+grenades;
  var dir=new THREE.Vector3();camera.getWorldDirection(dir);
  var vel=dir.clone().multiplyScalar(12);vel.y+=5;
  var mesh=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),grnM);
  mesh.position.copy(playerPos).addScaledVector(dir,.6);
  scene.add(mesh);
  activeGrenades.push({mesh:mesh,vx:vel.x,vy:vel.y,vz:vel.z,t:0});
  if(ws&&ws.readyState===1)ws.send(JSON.stringify({
    type:'GRENADE',x:mesh.position.x,y:mesh.position.y,z:mesh.position.z,
    vx:vel.x,vy:vel.y,vz:vel.z
  }));
}

function updateGrenades(dt){
  for(var i=activeGrenades.length-1;i>=0;i--){
    var gr=activeGrenades[i];
    gr.t+=dt;gr.vy+=GRAV*dt;
    gr.mesh.position.x+=gr.vx*dt;
    gr.mesh.position.y+=gr.vy*dt;
    gr.mesh.position.z+=gr.vz*dt;
    gr.mesh.rotation.x+=4*dt;
    if(gr.mesh.position.y<=.12||gr.t>4){
      doExplode(gr.mesh.position.clone());
      scene.remove(gr.mesh);activeGrenades.splice(i,1);
      if(ws&&ws.readyState===1)ws.send(JSON.stringify({
        type:'GRENADE_EXPLODE',x:gr.mesh.position.x,y:0,z:gr.mesh.position.z,radius:6
      }));
    }
  }
}

// ── DEATH — just sounds + scorch, NO mesh pieces, NO loops ────
function spawnDeathExplosion(pos){
  playFX('splash');
  playFX('death_voice');
  // Tiny scorch on floor — static, removed after 4s
  var sM=new THREE.MeshBasicMaterial({color:0x220000,transparent:true,opacity:.55,depthWrite:false});
  var sc=new THREE.Mesh(new THREE.CircleGeometry(.4,8),sM);
  sc.rotation.x=-Math.PI/2;
  sc.position.set(pos.x,.01,pos.z);
  scene.add(sc);
  setTimeout(function(){scene.remove(sc);},4000);
  // DO NOT broadcast DEATH_EXPLOSION — handled by PLAYER_DIED on all clients
}

// ── GRENADE EXPLOSION — static only, zero loops ───────────────
function doExplode(pos){
  playFX('explosion');
  // Flash sphere — static, removed after 180ms
  var mat=new THREE.MeshBasicMaterial({color:0xff6600,transparent:true,opacity:.75,depthWrite:false});
  var sp=new THREE.Mesh(new THREE.SphereGeometry(.45,6,4),mat);
  sp.position.copy(pos);scene.add(sp);
  setTimeout(function(){scene.remove(sp);},180);
  // Scorch — static, removed after 6s
  var sM=new THREE.MeshBasicMaterial({color:0x050505,transparent:true,opacity:.7,depthWrite:false});
  var sc=new THREE.Mesh(new THREE.CircleGeometry(.55,8),sM);
  sc.rotation.x=-Math.PI/2;sc.position.set(pos.x,.01,pos.z);scene.add(sc);
  setTimeout(function(){scene.remove(sc);},6000);
  // Self-damage
  var dist=playerPos.distanceTo(pos);
  if(dist<6&&alive){
    var dmg=Math.round(75*(1-dist/6));
    if(dmg>0&&ws&&ws.readyState===1)
      ws.send(JSON.stringify({type:'HIT',targetId:myId,damage:dmg}));
  }
}

function tryInteract(){
  try{
    var ds=MapLoader.getDoorStates();
    Object.keys(ds).forEach(function(id){
      var s=ds[id],dx=playerPos.x-s.px,dz=playerPos.z-s.pz;
      if(Math.sqrt(dx*dx+dz*dz)<2.5){
        MapLoader.openDoor(id,!s.open);playFX('door');
        if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'DOOR_TOGGLE',doorId:id}));
      }
    });
  }catch(e){}
}

function tryPickup(){
  if(typeof MapLoader!=='undefined'){
    var aids=MapLoader.getAidBoxes();
    if(aids)aids.forEach(function(ab){
      if(!ab.available)return;
      var dx=playerPos.x-ab.x,dz=playerPos.z-ab.z;
      if(Math.sqrt(dx*dx+dz*dz)<1.4&&hp<100){
        var heal=Math.min(50,100-hp);hp=Math.min(100,hp+heal);updateHPBar();
        ab.available=false;ab.group.visible=false;
        ab.respawnTimer=setTimeout(function(){ab.available=true;ab.group.visible=true;},60000);
        playPickupSound();addKF(PLAYER_NAME+' used FIRST AID (+'+heal+'HP)',false,true);
      }
    });
  }
  Object.keys(pickupObjs).forEach(function(id){
    var po=pickupObjs[id];if(!po.available)return;
    var dx=playerPos.x-po.data.x,dz=playerPos.z-po.data.z;
    if(Math.sqrt(dx*dx+dz*dz)<1.5){
      var wid=po.data.weapon;
      po.available=false;po.group.visible=false;playPickupSound();
      po.respawnTimer=setTimeout(function(){po.available=true;po.group.visible=true;},10000);
      if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'PICKUP',pickupId:id}));
      if(wid==='grenade'){
        grenades=Math.min(grenades+2,8);
        document.getElementById('grc').textContent='GRENADES: '+grenades;
        addKF(PLAYER_NAME+' picked up GRENADES x2',false,true);return;
      }
      var w=WEAPONS.find(function(ww){return ww.id===wid;});
      if(!w)return;
      inventory.add(w.id);
      ammoStore[w.id]={mag:w.defAmmo.mag,reserve:w.defAmmo.reserve};
      var wi=WEAPONS.findIndex(function(ww){return ww.id===w.id;});
      var sl=document.getElementById('ws'+wi);if(sl)sl.classList.add('have');
      addKF(PLAYER_NAME+' picked up '+w.name,false,true);switchTo(wi);
    }
  });
}

function updateHint(){
  var hintEl=document.getElementById('hint');if(!hintEl)return;
  var show=false;
  try{
    var ds=MapLoader.getDoorStates();
    Object.keys(ds).forEach(function(id){
      var s=ds[id],dx=playerPos.x-s.px,dz=playerPos.z-s.pz;
      if(Math.sqrt(dx*dx+dz*dz)<2.5)show=true;
    });
  }catch(e){}
  hintEl.style.display=show?'block':'none';
}