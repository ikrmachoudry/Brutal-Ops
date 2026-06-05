'use strict';
// ── BRUTAL OPS — HUD.js ──────────────────────────────────────

function updateHPBar(){
  var pct=Math.max(0,hp);
  document.getElementById('hp-num').textContent=pct;
  document.getElementById('hp-fill').style.width=pct+'%';
  var bg;
  if(pct>60)       bg='linear-gradient(90deg,#22cc44,#44ff66)';
  else if(pct>30)  bg='linear-gradient(90deg,#ddaa00,#ffcc00)';
  else             bg='linear-gradient(90deg,#cc1100,#ff2200)';
  document.getElementById('hp-fill').style.background=bg;
  var bar=document.getElementById('hp-bg');
  if(bar) bar.style.boxShadow=pct<=20?'0 0 8px rgba(255,0,0,0.8)':'none';
}

function updateWpnHUD(){
  var w=curW();
  document.getElementById('wpn-name').textContent=w.name;
  var a=ammoStore[w.id];
  var ammoTxt=w.melee?'MELEE':(a?a.mag+' / '+a.reserve:'--');
  document.getElementById('wpn-ammo').textContent=ammoTxt;

  // Bullet count near crosshair (PC) — bottom center of screen
  var bc=document.getElementById('bullet-count');
  if(bc){
    if(w.melee||!a){ bc.textContent=''; }
    else{ bc.textContent=a.mag+' | '+a.reserve; }
  }

  WEAPONS.forEach(function(_,i){
    var sl=document.getElementById('ws'+i);
    if(sl)sl.classList.toggle('on',i===curWIdx);
  });
}

function showHF(){
  var el=document.getElementById('hf');
  el.classList.add('on');
  if(typeof hp!=='undefined'&&hp<=30){
    el.style.background='rgba(180,0,0,0.18)';
  }else{
    el.style.background='rgba(180,0,0,0.05)';
  }
  setTimeout(function(){el.classList.remove('on');el.style.background='';},200);
}

function addKF(txt, isKill, isPickup) {
  var kf = document.getElementById('kf');
  var el = document.createElement('div');
  el.className = 'kfe';
  if (isKill) {
    var parts = txt.split(' killed ');
    if (parts.length === 2) {
      el.innerHTML =
        '<span style="color:#ffee44;font-weight:700">'+parts[0]+'</span>'+
        '<span style="color:#ff4444"> ✖ </span>'+
        '<span style="color:#ffee44;font-weight:700">'+parts[1]+'</span>';
    } else { el.textContent = txt; }
    el.style.borderColor = '#ff2200';
  } else if (isPickup) {
    var pparts = txt.split(' picked up ');
    if (pparts.length === 2) {
      el.innerHTML =
        '<span style="color:#ffee44;font-weight:700">'+pparts[0]+'</span>'+
        '<span style="color:#aaaaaa"> picked up </span>'+
        '<span style="color:#44aaff;font-weight:700">'+pparts[1]+'</span>';
    } else { el.textContent = txt; }
    el.style.borderColor = '#44aaff';
  } else { el.textContent = txt; }
  kf.prepend(el);
  setTimeout(function() { el.remove(); }, 3000);
}

function updateScoreboard(players){
  document.getElementById('sbBody').innerHTML=players.map(function(p){
    return '<div class="sbr">'+
      '<span>'+p.name+(p.id===myId?' ◀':'')+'</span>'+
      '<span>'+(p.kills||0)+'</span>'+
      '<span>'+(p.deaths||0)+'</span>'+
      '<span>'+(p.rank||1)+'</span>'+
      '</div>';
  }).join('');
}

var streakMsgs=['DOUBLE KILL!','TRIPLE KILL!','QUAD KILL!','UNSTOPPABLE!'];
var streakTimer=null;
function checkStreak(){
  clearTimeout(streakTimer);
  if(kills>=2){
    var el=document.getElementById('sk');
    el.textContent=streakMsgs[Math.min(kills-2,3)];
    el.style.opacity='1';
    streakTimer=setTimeout(function(){el.style.opacity='0';},2200);
  }
}

var mmC=document.getElementById('mm');
var mmX=mmC?mmC.getContext('2d'):null;
function drawMinimap(){
  if(!mmX)return;
  mmX.clearRect(0,0,120,120);
  mmX.fillStyle='rgba(0,0,0,0.75)';mmX.fillRect(0,0,120,120);
  var sc=120/90,ox=45,oz=35;
  mmX.fillStyle='rgba(80,70,55,0.7)';mmX.fillRect(0,0,80*sc,60*sc);
  var mx=(playerPos.x+ox)*sc,mz=(playerPos.z+oz)*sc;
  mmX.save();mmX.translate(mx,mz);mmX.rotate(yaw+Math.PI);
  mmX.fillStyle='#ff2200';mmX.beginPath();mmX.moveTo(0,-5);mmX.lineTo(-3,4);mmX.lineTo(3,4);mmX.closePath();mmX.fill();
  mmX.restore();
  Object.values(remotePlayers).forEach(function(rp){
    if(!rp.data||rp.data.alive===false)return;
    mmX.fillStyle='#44aaff';
    mmX.beginPath();mmX.arc((rp.data.x+ox)*sc,(rp.data.z+oz)*sc,3,0,Math.PI*2);mmX.fill();
  });
  mmX.fillStyle='rgba(255,255,255,0.35)';mmX.font='8px monospace';mmX.fillText('N',57,9);
}

function updateHint(){
  var ds=typeof MapLoader!=='undefined'?MapLoader.getDoorStates():{};
  var show=false;
  Object.keys(ds).forEach(function(id){
    var s=ds[id],dx=playerPos.x-s.px,dz=playerPos.z-s.pz;
    if(Math.sqrt(dx*dx+dz*dz)<2.5)show=true;
  });
  document.getElementById('hint').style.display=show?'block':'none';
}