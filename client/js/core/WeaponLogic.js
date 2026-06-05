'use strict';
// ── BRUTAL OPS — WeaponLogic.js ──────────────────────────────
// ZERO requestAnimationFrame in any effect/damage function
// Only the ghost fade uses ONE RAF loop (single mesh, unavoidable)
// ------------------------------------------------------------

// XZ-only distance — ignores Y height difference
function _xzDist(a,b){var dx=a.x-b.x,dz=a.z-b.z;return Math.sqrt(dx*dx+dz*dz);}

var crowbarSwing=0, reloadAnim={active:false,phase:'',t:0}, bulletMarks=[];
var activeGhosts=[], activePoops=[], fartClouds=[];

// ════════════════════════════════════════════════════════════
// GHOST
// ════════════════════════════════════════════════════════════
function buildGhostMesh(shooterName){
  var g=new THREE.Group();
  var sM=new THREE.MeshStandardMaterial({color:0x0a0a0a,roughness:.8,transparent:true,opacity:.92});
  var fM=new THREE.MeshStandardMaterial({color:0xddd8cc,roughness:.7,transparent:true,opacity:.95});
  var dM=new THREE.MeshStandardMaterial({color:0x050508,roughness:.9});
  var eM=new THREE.MeshBasicMaterial({color:0x111118});
  var gE=new THREE.MeshBasicMaterial({color:0x2222aa});
  var bM=new THREE.MeshStandardMaterial({color:0xddd0bb,roughness:.7,transparent:true,opacity:.9});
  function gs(x,y,z,r,mat,sx,sy,sz){var o=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),mat);o.position.set(x,y,z);if(sx)o.scale.set(sx,sy||sx,sz||sx);g.add(o);return o;}
  function gc(x,y,z,rt,rb,h,mat){var o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,8),mat);o.position.set(x,y,z);g.add(o);return o;}
  gc(0,.88,0,.32,.36,.72,sM);
  gc(-.36,1.18,0,.16,.16,.08,sM);gc(.36,1.18,0,.16,.16,.08,sM);
  gc(-.36,.88,0,.09,.07,.55,sM);gc(.36,.88,0,.09,.07,.55,sM);
  gs(-.52,.64,.42,.07,bM,.7,.9,1.1);gs(.52,.64,.42,.07,bM,.7,.9,1.1);
  var tM=new THREE.MeshStandardMaterial({color:0x070710,roughness:.95,transparent:true,opacity:.75});
  gc(-.12,.18,0,.10,.06,.8,tM);gc(.12,.18,0,.10,.06,.8,tM);
  gc(0,1.36,0,.12,.14,.18,fM);
  gs(0,1.68,0,.28,fM,.9,1.08,.88);
  gs(-.1,1.68,-.26,.09,eM,1.1,.85,.7);gs(.1,1.68,-.26,.09,eM,1.1,.85,.7);
  gs(-.1,1.68,-.33,.036,gE);gs(.1,1.68,-.33,.036,gE);
  
  gs(0,1.54,-.28,.11,dM,1.5,.6,.5);
  var nc=document.createElement('canvas');nc.width=256;nc.height=72;
  var ctx=nc.getContext('2d');
  function drawHUD(c2,nm,pct){
    c2.clearRect(0,0,256,72);
    c2.fillStyle='rgba(10,0,30,0.88)';c2.fillRect(4,4,248,36);
    c2.fillStyle='#8888ff';c2.font='bold 17px monospace';c2.textAlign='center';
    c2.fillText((nm||'GHOST').toUpperCase()+' [GHOST]',128,26);
    c2.fillStyle='rgba(0,0,0,0.7)';c2.fillRect(4,44,248,18);
    c2.fillStyle=pct>.5?'#4444ff':pct>.25?'#8800ff':'#ff00aa';
    c2.fillRect(4,44,Math.max(0,248*pct),18);
  }
  drawHUD(ctx,shooterName,1.0);
  var ns=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(nc),transparent:true,depthTest:false}));
  ns.scale.set(1.7,.46,1);ns.position.y=.62;g.add(ns);
  g.userData.hudCtx=ctx;g.userData.hudSprite=ns;g.userData.drawHUD=drawHUD;g.userData.shooterName=shooterName;
  return g;
}

function spawnGhost(shooterPos,direction,shooterId,shooterName,dontBroadcast){
  // MAX 1 ghost per shooter
  for(var gi=activeGhosts.length-1;gi>=0;gi--){
    if(activeGhosts[gi].shooterId===shooterId){
      scene.remove(activeGhosts[gi].mesh);
      activeGhosts.splice(gi,1);
    }
  }
  var mesh=buildGhostMesh(shooterName);
  mesh.position.copy(shooterPos).addScaledVector(direction,1.8);
  mesh.position.y=1.0;
  scene.add(mesh);
  if(!dontBroadcast)playFX('ghost_fire');
  activeGhosts.push({
    mesh:mesh,vel:direction.clone().multiplyScalar(4),
    timer:18.0,shooterId:shooterId,launchGrace:2.5,
    active:true,hp:40,floatT:0,
    damageTimer:0,hitFlash:0,
    canClip:Math.random()<0.20,chaseTimer:0
  });
  if(!dontBroadcast&&ws&&ws.readyState===1)ws.send(JSON.stringify({
    type:'GHOST_SPAWN',x:shooterPos.x,y:shooterPos.y,z:shooterPos.z,dx:direction.x,dz:direction.z
  }));
}


function hurtGhost(idx,dmg){
  var gh=activeGhosts[idx];if(!gh||!gh.active)return;
  gh.hp=Math.max(0,gh.hp-dmg);gh.hitFlash=0.18;
  // Only play hurt sound if ghost survives — avoid merging with die sound
  if(gh.hp>12){  // silent below 30% HP
    playFX(Math.random()<.5?'ghost_hurt1':'ghost_hurt2');
  }
  var ud=gh.mesh.userData;
  ud.drawHUD(ud.hudCtx,ud.shooterName,gh.hp/100);
  ud.hudSprite.material.map.needsUpdate=true;
  if(gh.hp<=0){
    playFX('ghost_die');gh.active=false;
    // setInterval fade — no RAF, no crash
    var fadeMesh=gh.mesh;
    var fadeInt=setInterval(function(){
      var allFaded=true;
      fadeMesh.traverse(function(c){
        if(c.material&&c.material.transparent){
          c.material.opacity=Math.max(0,c.material.opacity-.08);
          if(c.material.opacity>0)allFaded=false;
        }
      });
      if(allFaded){clearInterval(fadeInt);scene.remove(fadeMesh);}
    },60);
    activeGhosts.splice(idx,1);
  }
}

function updateGhosts(dt){
  for(var i=activeGhosts.length-1;i>=0;i--){
    var gh=activeGhosts[i];
    if(!gh.active){scene.remove(gh.mesh);activeGhosts.splice(i,1);continue;}
    gh.timer-=dt;gh.floatT+=dt;
    gh.damageTimer=Math.max(0,gh.damageTimer-dt);
    gh.hitFlash=Math.max(0,gh.hitFlash-dt);
    gh.chaseTimer-=dt;
    if(gh.launchGrace>0)gh.launchGrace-=dt;
    if(gh.hitFlash>0.1){
      gh.mesh.traverse(function(c){if(c.material&&c.material.emissive)c.material.emissiveIntensity=1.5;});
    }else{
      gh.mesh.traverse(function(c){if(c.material&&c.material.emissive)c.material.emissiveIntensity=.15;});
    }
    if(gh.timer<3.0){
      gh.mesh.traverse(function(c){if(c.material&&c.material.transparent)c.material.opacity=Math.max(0,c.material.opacity-dt*.25);});
    }
    if(gh.timer<=0){gh.active=false;continue;}
    // Chase nearest
    if(gh.chaseTimer<=0){
      gh.chaseTimer=0.4;
      var bestDist=Infinity,bestPos=null;
      if(gh.launchGrace<=0||gh.shooterId!==myId){
        var ld=_xzDist(gh.mesh.position,playerPos);
        if(ld<bestDist){bestDist=ld;bestPos=playerPos.clone();}
      }
      Object.values(remotePlayers).forEach(function(rp){
        if(!rp.data.alive)return;
        var rd=_xzDist(gh.mesh.position,rp.mesh.position);
        if(rd<bestDist){bestDist=rd;bestPos=rp.mesh.position.clone();}
      });
      if(bestPos){
        var cd=bestPos.clone().sub(gh.mesh.position);cd.y=0;
        var cl=cd.length();
        if(cl>0.1){cd.divideScalar(cl);gh.vel.x=cd.x*4.5;gh.vel.z=cd.z*4.5;}
      }
    }
    var newPos=gh.mesh.position.clone().addScaledVector(gh.vel,dt);
    if(!gh.canClip){
      var b=MapLoader.getBounds();
      if(newPos.x<b.minX+0.5||newPos.x>b.maxX-0.5){gh.vel.x*=-1;newPos.x=gh.mesh.position.x;}
      if(newPos.z<b.minZ+0.5||newPos.z>b.maxZ-0.5){gh.vel.z*=-1;newPos.z=gh.mesh.position.z;}
      if(typeof colliders!=='undefined'){
        for(var ci=0;ci<colliders.length;ci++){
          var col=colliders[ci];
          if(newPos.x>col.cx-col.hw-0.45&&newPos.x<col.cx+col.hw+0.45&&
             newPos.z>col.cz-col.hd-0.45&&newPos.z<col.cz+col.hd+0.45){
            var ang=Math.random()*Math.PI*2,sp3=Math.sqrt(gh.vel.x*gh.vel.x+gh.vel.z*gh.vel.z);
            gh.vel.x=Math.cos(ang)*sp3;gh.vel.z=Math.sin(ang)*sp3;
            newPos.x=gh.mesh.position.x;newPos.z=gh.mesh.position.z;break;
          }
        }
      }
    }else{
      var b2=MapLoader.getBounds();
      if(newPos.x<b2.minX+0.2||newPos.x>b2.maxX-0.2)gh.vel.x*=-1;
      if(newPos.z<b2.minZ+0.2||newPos.z>b2.maxZ-0.2)gh.vel.z*=-1;
    }
    newPos.y=1.7+Math.sin(gh.floatT*1.8)*.18;
    gh.mesh.position.copy(newPos);
    if(Math.abs(gh.vel.x)+Math.abs(gh.vel.z)>.1)
      gh.mesh.rotation.y=Math.atan2(gh.vel.x,gh.vel.z);
    // Damage 10%/sec = 5 per 0.5s
    if(gh.damageTimer<=0){
      var safe=(gh.shooterId===myId&&gh.launchGrace>0);
      if(!safe&&_xzDist(gh.mesh.position,playerPos)<1.5){
        gh.damageTimer=0.5;
        if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:"HIT",targetId:myId,damage:2}));
      }
      Object.values(remotePlayers).forEach(function(rp){
        if(!rp.data.alive)return;
        var rSafe=(gh.shooterId===rp.data.id&&gh.launchGrace>0);
        if(!rSafe&&_xzDist(gh.mesh.position,rp.mesh.position)<1.5&&gh.damageTimer<=0){
          gh.damageTimer=0.5;
          if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:"HIT",targetId:rp.data.id,damage:2}));
        }
      });
    }
  }
}

function checkGhostRayHit(){
  if(!rc)return false;
  var gms=activeGhosts.map(function(gh){return gh.mesh;});
  if(!gms.length)return false;
  var hits=rc.intersectObjects(gms,true);
  if(hits.length&&hits[0].distance<80){
    for(var i=0;i<activeGhosts.length;i++){
      if(activeGhosts[i].mesh===hits[0].object||activeGhosts[i].mesh===hits[0].object.parent){
        hurtGhost(i,10);return true;
      }
    }
  }
  return false;
}
function checkGhostBulletHit(hitPoint){
  for(var i=0;i<activeGhosts.length;i++){
    var bc=activeGhosts[i].mesh.position.clone();bc.y=1.4;
    if(bc.distanceTo(hitPoint)<0.8){hurtGhost(i,10);return true;}
  }
  return false;
}

// ════════════════════════════════════════════════════════════
// FART CLOUD — 20%/sec, 15s, grace 1.5s
// ════════════════════════════════════════════════════════════
function spawnFartCloud(pos, dontBroadcast){
  var grp=new THREE.Group();
  for(var fi=0;fi<14;fi++){
    var fm=new THREE.MeshStandardMaterial({color:0x8b4513,transparent:true,opacity:.65,roughness:.9});
    var fs=new THREE.Mesh(new THREE.SphereGeometry(.45+Math.random()*.18,7,5),fm);
    fs.position.set((Math.random()-.5)*1.8,(Math.random()-.5)*1.2,(Math.random()-.5)*1.8);
    grp.add(fs);
  }
  var fwd=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  var center=pos.clone().addScaledVector(fwd,2.5);center.y+=.4;
  grp.position.copy(center);scene.add(grp);playFX('fartgun');
  fartClouds.push({group:grp,timer:15.0,maxTimer:15.0,center:center.clone(),damageTimer:0,graceTimer:1.5});
  // Only broadcast if called by shooter — NOT when called by receiver (prevents loop)
  if(!dontBroadcast&&ws&&ws.readyState===1)
    ws.send(JSON.stringify({type:'FART_CLOUD',x:center.x,y:center.y,z:center.z,massive:true}));
}

function updateFartClouds(dt){
  for(var fi=fartClouds.length-1;fi>=0;fi--){
    var fc=fartClouds[fi];
    fc.timer-=dt;fc.damageTimer=Math.max(0,fc.damageTimer-dt);fc.graceTimer=Math.max(0,fc.graceTimer-dt);
    var alpha=Math.max(0,(fc.timer/fc.maxTimer)*.65);
    fc.group.children.forEach(function(c){c.material.opacity=alpha;});
    if(fc.timer>0&&fc.damageTimer<=0&&fc.graceTimer<=0){
      if(_xzDist(playerPos,fc.center)<1.6){
        fc.damageTimer=0.1;
        if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'HIT',targetId:myId,damage:2}));
      }
      Object.values(remotePlayers).forEach(function(rp){
        if(!rp.data.alive)return;
        if(_xzDist(rp.mesh.position,fc.center)<1.6&&fc.damageTimer<=0){
          fc.damageTimer=0.1;
          if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'HIT',targetId:rp.data.id,damage:2}));
        }
      });
      // Fart damages ghosts too
      for(var gi=activeGhosts.length-1;gi>=0;gi--){
        if(activeGhosts[gi].active&&_xzDist(activeGhosts[gi].mesh.position,fc.center)<1.6){
          hurtGhost(gi,1); // 1 dmg per 0.1s = 10/sec on ghost
        }
      }
    }
    if(fc.timer<=0){scene.remove(fc.group);fartClouds.splice(fi,1);}
  }
}

// ════════════════════════════════════════════════════════════
// POOP — 3 small dumps, stay forever, bullet = one splatter
// Walk over = splash + shithurt + 15dmg
// NO RAF loops anywhere — all setTimeout based
// ════════════════════════════════════════════════════════════
function spawnPoop(pos, dontBroadcast){
  playFX('fartgun');
  var fwd=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  var floorY=0;
  try{if(typeof MapLoader!=='undefined'&&MapLoader.getFloorY)floorY=MapLoader.getFloorY(pos.x,pos.z)||0;}catch(e){}

  for(var pi=0;pi<3;pi++){
    (function(idx){
      var ox=(Math.random()-.5)*2.0, oz=(Math.random()-.5)*2.0;
      var pPos=new THREE.Vector3(
        pos.x+fwd.x*(1.0+idx*0.9)+ox,
        floorY+0.07,
        pos.z+fwd.z*(1.0+idx*0.9)+oz
      );
      var grp=new THREE.Group();
      var bM=new THREE.MeshStandardMaterial({color:0x5c2e00,roughness:.95,metalness:0});
      var s1=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),bM);s1.scale.set(1,.5,1);grp.add(s1);
      var s2=new THREE.Mesh(new THREE.SphereGeometry(.10,7,5),bM);s2.position.set(0,.10,0);s2.scale.set(1,.55,1);grp.add(s2);
      var s3=new THREE.Mesh(new THREE.SphereGeometry(.065,6,4),bM);s3.position.set(0,.19,0);grp.add(s3);
      var eM=new THREE.MeshBasicMaterial({color:0x111111});
      var el=new THREE.Mesh(new THREE.SphereGeometry(.022,5,4),eM);el.position.set(-.055,.12,-.12);grp.add(el);
      var er=new THREE.Mesh(new THREE.SphereGeometry(.022,5,4),eM);er.position.set( .055,.12,-.12);grp.add(er);
      for(var fli=0;fli<3;fli++){
        var fly=new THREE.Mesh(new THREE.SphereGeometry(.014,4,3),new THREE.MeshBasicMaterial({color:0x050505}));
        fly.userData.fA=fli*(Math.PI*2/3);fly.userData.fR=.20;fly.userData.fY=.12;
        grp.add(fly);
      }
      grp.position.set(pPos.x,pPos.y,pPos.z);
      scene.add(grp);
      activePoops.push({group:grp,pos:pPos.clone(),damageTimer:0,alive:true,lifeTimer:10.0});
    })(pi);
  }
  if(!dontBroadcast&&ws&&ws.readyState===1)
    ws.send(JSON.stringify({type:'POOP_SPAWN',x:pos.x,y:floorY,z:pos.z}));
}

// Poop splatter — NO RAF, just place static pieces + setTimeout remove
function splatterPoop(idx){
  var pp=activePoops[idx];if(!pp||!pp.alive)return;
  pp.alive=false;scene.remove(pp.group);activePoops.splice(idx,1);
  playFX('splash');
  // 8 static brown dots placed around splat point — removed after 5s
  for(var si=0;si<8;si++){
    var sM=new THREE.MeshBasicMaterial({color:si%2===0?0x3d1a00:0x5c2e00,transparent:true,opacity:.85});
    var sp=new THREE.Mesh(new THREE.SphereGeometry(.025+Math.random()*.04,4,3),sM);
    var angle=Math.random()*Math.PI*2, r=0.1+Math.random()*.5;
    sp.position.set(pp.pos.x+Math.cos(angle)*r, pp.pos.y+.01, pp.pos.z+Math.sin(angle)*r);
    scene.add(sp);
    setTimeout(function(m){return function(){scene.remove(m);};}(sp), 5000);
  }
}

function checkPoopBulletHit(hitPt){
  for(var i=activePoops.length-1;i>=0;i--){
    if(activePoops[i].alive&&_xzDist(activePoops[i].pos,hitPt)<0.4){
      splatterPoop(i);return true;
    }
  }
  return false;
}

function updatePoops(dt){
  var t3=performance.now()*.001;
  for(var pi=activePoops.length-1;pi>=0;pi--){
    var pp=activePoops[pi];
    if(!pp.alive){activePoops.splice(pi,1);continue;}
    pp.damageTimer=Math.max(0,pp.damageTimer-dt);
    pp.lifeTimer-=dt;

    // Auto-disappear after 10s with splash sound + effect
    if(pp.lifeTimer<=0){
      splatterPoop(pi); // plays splash sound + removes mesh
      continue; // splatterPoop already removes from array
    }

    // Animate flies
    pp.group.children.forEach(function(c){
      if(c.userData&&c.userData.fA!==undefined){
        c.userData.fA+=dt*2.5;
        c.position.set(Math.cos(c.userData.fA)*c.userData.fR,c.userData.fY+Math.sin(t3*2)*.015,Math.sin(c.userData.fA)*c.userData.fR);
      }
    });

    // Walk-over damage — 1HP/sec, only if poop is alive
    if(pp.alive&&pp.damageTimer<=0){
      if(_xzDist(playerPos,pp.pos)<0.55){
        pp.damageTimer=1.0;playFX('splash');playFX('shithurt');
        if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'HIT',targetId:myId,damage:1}));
      }
      Object.values(remotePlayers).forEach(function(rp){
        if(!rp.data.alive)return;
        if(_xzDist(rp.mesh.position,pp.pos)<0.55&&pp.damageTimer<=0){
          pp.damageTimer=1.0;
          if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'HIT',targetId:rp.data.id,damage:1}));
        }
      });
    }
  }
}

// ════════════════════════════════════════════════════════════
// RPG WALL IMPACT — NO RAF loops, static scorch only
// ════════════════════════════════════════════════════════════
function spawnRPGImpact(pos){
  // Static scorch mark — removed after 4s
  var sM=new THREE.MeshBasicMaterial({color:0x050505,transparent:true,opacity:.8,depthWrite:false});
  var sc=new THREE.Mesh(new THREE.PlaneGeometry(.7,.7),sM);
  sc.position.copy(pos).addScaledVector(new THREE.Vector3(0,0,1),.02);
  scene.add(sc);
  setTimeout(function(){scene.remove(sc);},4000);
  // Self-damage
  if(playerPos.distanceTo(pos)<3){
    var dmg=Math.round(60*(1-playerPos.distanceTo(pos)/3));
    if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'HIT',targetId:myId,damage:dmg}));
  }
}

// ════════════════════════════════════════════════════════════
// PICKUPS
// ════════════════════════════════════════════════════════════
var glowRingM=new THREE.MeshBasicMaterial({color:0x2266ff,transparent:true,opacity:.4});
function spawnPickups(){
  PDEFS.forEach(function(pd){
    var g=new THREE.Group();
    var wMesh;
    if(pd.weapon==='grenade'){
      // Grenade: green sphere with band
      var grp2=new THREE.Group();
      var gBody=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),
        new THREE.MeshStandardMaterial({color:0x446622,roughness:.6,metalness:.3}));
      grp2.add(gBody);
      var gBand=new THREE.Mesh(new THREE.TorusGeometry(.18,.025,6,16),
        new THREE.MeshStandardMaterial({color:0x333333,roughness:.5}));
      gBand.rotation.x=Math.PI/2;grp2.add(gBand);
      var gPin=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.12,6),
        new THREE.MeshStandardMaterial({color:0xccaa00,roughness:.4,metalness:.6}));
      gPin.position.y=.2;grp2.add(gPin);
      wMesh=grp2;
    }else{
      wMesh=buildWeapon(pd.weapon);
    }
    wMesh.scale.setScalar(0.62);g.add(wMesh);
    var ring=new THREE.Mesh(new THREE.TorusGeometry(.52,.045,6,18),glowRingM);
    ring.rotation.x=Math.PI/2;ring.position.y=-.22;g.add(ring);
    var lc=document.createElement('canvas');lc.width=256;lc.height=64;
    var lx2=lc.getContext('2d');lx2.fillStyle='#44aaff';lx2.font='bold 24px monospace';lx2.textAlign='center';
    lx2.fillText(pd.weapon.toUpperCase(),128,40);
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(lc),transparent:true}));
    sp.scale.set(1.3,.32,1);sp.position.y=.88;g.add(sp);
    g.position.set(pd.x,.38,pd.z);scene.add(g);
    pickupObjs[pd.id]={group:g,data:pd,available:true};
  });
}

// ════════════════════════════════════════════════════════════
// WEAPON SWITCH / ZOOM / RELOAD
// ════════════════════════════════════════════════════════════
function curW(){return WEAPONS[curWIdx];}

function switchTo(idx){
  if(idx<0||idx>=WEAPONS.length||!inventory.has(WEAPONS[idx].id)||reloading)return;
  fpGuns[curWIdx].visible=false;
  document.getElementById('ws'+curWIdx).classList.remove('on');
  curWIdx=idx;fpGuns[curWIdx].visible=true;
  document.getElementById('ws'+curWIdx).classList.add('on');
  updateWpnHUD();if(zoomed)toggleZoom(false);
  if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'WEAPON_CHANGE',weapon:WEAPONS[idx].id}));
  var pb=document.getElementById('bpoop');
  if(pb)pb.style.display=(WEAPONS[idx].id==='fartgun')?'flex':'none';
}

function toggleZoom(force){
  if(!curW().zoom&&force===undefined)return;
  zoomed=force!==undefined?force:!zoomed;
  camera.fov=zoomed?22:75;camera.updateProjectionMatrix();
  document.getElementById('sco').classList.toggle('on',zoomed);
  document.getElementById('scope-ring').classList.toggle('on',zoomed);
  document.getElementById('xh').style.display=zoomed?'none':'block';
}

function doReload(){
  var w=curW();if(w.melee||reloading)return;
  var a=ammoStore[w.id];if(!a||a.mag>=w.ammoMax||a.reserve<=0)return;
  reloading=true;document.getElementById('rl').style.display='block';playFX('reload');
  var dropMesh=new THREE.Mesh(new THREE.BoxGeometry(.05,.14,.04),
    new THREE.MeshStandardMaterial({color:0x222222,roughness:.5,metalness:.6}));
  dropMesh.position.copy(playerPos);dropMesh.position.y-=.4;scene.add(dropMesh);
  // Simple drop: just move down via setTimeout steps, no RAF
  var dropY=dropMesh.position.y, dropStep=0;
  var dropInt=setInterval(function(){
    dropStep+=0.06; dropMesh.position.y-=0.04*dropStep;
    dropMesh.rotation.x+=0.15;
    if(dropStep>=1.5||dropMesh.position.y<-2){
      clearInterval(dropInt); setTimeout(function(){scene.remove(dropMesh);},1500);
    }
  },16);
  reloadAnim={active:true,phase:'drop',t:0};
  setTimeout(function(){
    var need=w.ammoMax-a.mag,take=Math.min(need,a.reserve);
    a.mag+=take;a.reserve-=take;reloading=false;
    document.getElementById('rl').style.display='none';updateWpnHUD();
    reloadAnim={active:true,phase:'attach',t:0};
    setTimeout(function(){reloadAnim.active=false;},400);
  },w.reloadT);
}

function updateReloadAnim(dt){
  if(!reloadAnim.active)return;reloadAnim.t+=dt;
  if(reloadAnim.phase==='drop'){gunGrp.rotation.x=Math.min(reloadAnim.t*.3,.15);gunGrp.rotation.z=Math.sin(reloadAnim.t*2)*.05;}
  else{gunGrp.rotation.x=Math.max(.15-reloadAnim.t*.4,0);gunGrp.rotation.z*=.8;}
}

// ════════════════════════════════════════════════════════════
// BULLET MARKS
// ════════════════════════════════════════════════════════════
function addBulletMark(pos,normal){
  var size=curW().id==='rpg'?.28:curW().id==='shotgun'?.08:.042;
  var mat=new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.82,depthWrite:false});
  var mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,size),mat);
  mesh.position.copy(pos).addScaledVector(normal,.012);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
  scene.add(mesh);bulletMarks.push({mesh:mesh,timer:8});
}
function updateBulletMarks(dt){
  for(var i=bulletMarks.length-1;i>=0;i--){
    bulletMarks[i].timer-=dt;
    if(bulletMarks[i].timer<2)bulletMarks[i].mesh.material.opacity=Math.max(0,bulletMarks[i].timer/2*.82);
    if(bulletMarks[i].timer<=0){scene.remove(bulletMarks[i].mesh);bulletMarks.splice(i,1);}
  }
}

// ════════════════════════════════════════════════════════════
// SHOOT
// ════════════════════════════════════════════════════════════
var rc=new THREE.Raycaster();

function doShoot(){
  var w=curW();if(!alive||reloading||Date.now()<shootCooldown)return;
  if(w.melee){
    shootCooldown=Date.now()+w.rate;playFX('rod_swing');crowbarSwing=1;
    rc.setFromCamera({x:0,y:0},camera);
    var mt=Object.values(remotePlayers).filter(function(r){return r.data.alive;}).map(function(r){return r.mesh;});
    var mh=rc.intersectObjects(mt,true);
    if(mh.length&&mh[0].distance<w.meleeRange&&ws&&ws.readyState===1){
      // Walk up parent chain to find root player mesh
      var hitObj=mh[0].object;
      var rp=null;
      for(var pi=0;pi<6&&hitObj;pi++){
        rp=Object.values(remotePlayers).find(function(r){return r.mesh===hitObj;});
        if(rp)break;
        hitObj=hitObj.parent;
      }
      if(rp)ws.send(JSON.stringify({type:'HIT',targetId:rp.data.id,damage:w.damage}));
    }
    return;
  }
  if(w.id==='fartgun'){
    var a0=ammoStore[w.id];if(!a0||a0.mag<=0){doReload();return;}
    shootCooldown=Date.now()+500;a0.mag--;updateWpnHUD();
    if(typeof fartFlashM!=='undefined'){fartFlashM.opacity=.9;setTimeout(function(){fartFlashM.opacity=0;},120);}
    spawnFartCloud(playerPos.clone());return;
  }
  if(w.id==='ghostgun'){
    var ag=ammoStore[w.id];if(!ag||ag.mag<=0){doReload();return;}
    shootCooldown=Date.now()+w.rate;ag.mag--;updateWpnHUD();
    var gDir=new THREE.Vector3();camera.getWorldDirection(gDir);gDir.y=0;gDir.normalize();
    spawnGhost(playerPos.clone(),gDir,myId,PLAYER_NAME);return;
  }
  var a=ammoStore[w.id];if(!a||a.mag<=0){doReload();return;}
  shootCooldown=Date.now()+w.rate;a.mag--;updateWpnHUD();
  if(w.id==='smg'){startSMG();}
  else if(w.id==='lasergun'){laserFlashM.opacity=.9;setTimeout(function(){laserFlashM.opacity=0;},80);playFX('lasergun');}
  else if(w.id==='sniper'){
    flashM.opacity=.9;gunGrp.position.z=-.32;
    setTimeout(function(){flashM.opacity=0;gunGrp.position.z=-.26;},80);
    playFX('sniper_fire');pitch-=.014;
  }else{
    flashM.opacity=.88;gunGrp.position.z=-.3;
    setTimeout(function(){flashM.opacity=0;gunGrp.position.z=-.26;},55);
    playFX(w.id==='pistol'?'pistol_fire':w.id==='shotgun'?'shotgun_fire':
           w.id==='revolver'?'pistol_fire':w.id==='rpg'?'explosion':'rifle_fire');
  }
  pitch-=(crouching?.002:.005)+Math.random()*.002;
  for(var p=0;p<w.pellets;p++){
    var sp2=w.spread*(zoomed?.08:1)*(crouching?.6:1);
    rc.setFromCamera({x:(Math.random()-.5)*sp2*2,y:(Math.random()-.5)*sp2*2},camera);
    var ghostHit=checkGhostRayHit();
    if(!ghostHit){
      var pt=Object.values(remotePlayers).filter(function(r){return r.data.alive;}).map(function(r){return r.mesh;});
      var ph=rc.intersectObjects(pt,true);
      var wh=rc.intersectObjects(scene.children.filter(function(o){return o.isMesh&&o.material&&!o.material.transparent;}),false);
      if(ph.length&&ws&&ws.readyState===1){
        // Walk up parent chain to find root mesh
        var bHitObj=ph[0].object, rp2=null;
        for(var bpi=0;bpi<6&&bHitObj;bpi++){
          rp2=Object.values(remotePlayers).find(function(r){return r.mesh===bHitObj;});
          if(rp2)break;
          bHitObj=bHitObj.parent;
        }
        if(rp2)ws.send(JSON.stringify({type:'HIT',targetId:rp2.data.id,damage:w.damage}));
      }else if(wh.length){
        if(!checkPoopBulletHit(wh[0].point)&&!checkGhostBulletHit(wh[0].point)&&wh[0].face){
          var wn=wh[0].face.normal.clone().transformDirection(wh[0].object.matrixWorld);
          addBulletMark(wh[0].point,wn);
          if(ws&&ws.readyState===1)ws.send(JSON.stringify({
            type:'BULLET_MARK',x:wh[0].point.x,y:wh[0].point.y,z:wh[0].point.z,
            nx:wn.x,ny:wn.y,nz:wn.z,wid:w.id
          }));
          if(w.id==='rpg'){
            spawnRPGImpact(wh[0].point.clone());
            if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'RPG_IMPACT',x:wh[0].point.x,y:wh[0].point.y,z:wh[0].point.z}));
          }
        }
        if(Date.now()>wallHitCooldown){wallHitCooldown=Date.now()+120;playFX('hitwall');}
      }
    }
    if(w.id==='lasergun'){
      var be=rc.ray.direction.clone().multiplyScalar(50).add(playerPos);
      var bMat2=new THREE.MeshBasicMaterial({color:0x00ff88,transparent:true,opacity:.9});
      var bDir=be.clone().sub(playerPos).normalize(),bLen2=playerPos.distanceTo(be);
      var bMid2=playerPos.clone().add(be).multiplyScalar(.5);
      var bm=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,bLen2,6),bMat2);
      bm.position.copy(bMid2);bm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bDir);
      scene.add(bm);var t2=0;
      var lInt2=setInterval(function(){t2+=0.1;bMat2.opacity=Math.max(0,.9-t2);if(t2>=1){clearInterval(lInt2);scene.remove(bm);}},40);
      if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'LASER_BEAM',fx:playerPos.x,fy:playerPos.y,fz:playerPos.z,tx:be.x,ty:be.y,tz:be.z}));
    }
  }
  if(ws&&ws.readyState===1){
    var d2=new THREE.Vector3();camera.getWorldDirection(d2);
    ws.send(JSON.stringify({type:'SHOOT',weapon:w.id,x:playerPos.x,y:playerPos.y,z:playerPos.z,dirX:d2.x,dirY:d2.y,dirZ:d2.z}));
  }
}

function stopShooting(){if(curW().id==='smg')stopSMG();clearInterval(autoFireInt);autoFireInt=null;}
function updateCrowbarSwing(dt){
  if(crowbarSwing>0){
    crowbarSwing-=dt*3.2;
    gunGrp.rotation.y=Math.sin(crowbarSwing*Math.PI)*1.57;
    gunGrp.rotation.x=Math.sin(crowbarSwing*Math.PI*.5)*.12;
    if(crowbarSwing<=0){crowbarSwing=0;gunGrp.rotation.y=0;gunGrp.rotation.x=0;}
  }
}
function updateMines(){}
function checkMineShotHit(){return false;}