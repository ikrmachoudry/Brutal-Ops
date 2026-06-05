'use strict';
// ── BRUTAL OPS — Mobile.js ───────────────────────────────────

var joy = {active:false,dx:0,dy:0,id:null,sx:0,sy:0};
var look2 = {active:false,lx:0,ly:0,id:null};
var mobileSprinting = false;
var mobileCrouching = false;

// Weapon swipe state
var swipeStartX = 0, swipeStartY = 0, swipeId = null, swipeMoved = false;

function initMobile(){
  var jz=document.getElementById('jzone');
  var lz=document.getElementById('lzone');
  if(!jz||!lz)return;

  // ── LEFT JOYSTICK ─────────────────────────────────────────
  jz.addEventListener('touchstart',function(e){
    e.preventDefault();
    var t=e.changedTouches[0];
    joy.active=true;joy.id=t.identifier;
    joy.sx=t.clientX;joy.sy=t.clientY;joy.dx=0;joy.dy=0;
  },{passive:false});
  jz.addEventListener('touchmove',function(e){
    e.preventDefault();
    for(var i=0;i<e.changedTouches.length;i++){
      var t=e.changedTouches[i];
      if(t.identifier!==joy.id)continue;
      var dx=t.clientX-joy.sx,dy=t.clientY-joy.sy;
      var len=Math.sqrt(dx*dx+dy*dy),max=55;
      joy.dx=(len>max?dx/len*max:dx)/max;
      joy.dy=(len>max?dy/len*max:dy)/max;
      var dot=document.getElementById('jdot');
      if(dot)dot.style.transform='translate(calc(-50% + '+(len>max?dx/len*max:dx)+'px),calc(-50% + '+(len>max?dy/len*max:dy)+'px))';
    }
  },{passive:false});
  ['touchend','touchcancel'].forEach(function(ev){
    jz.addEventListener(ev,function(e){
      for(var i=0;i<e.changedTouches.length;i++){
        if(e.changedTouches[i].identifier!==joy.id)continue;
        joy.active=false;joy.dx=0;joy.dy=0;
        var dot=document.getElementById('jdot');
        if(dot)dot.style.transform='translate(-50%,-50%)';
      }
    });
  });

  // ── RIGHT LOOK PAD — also handles weapon swipe ────────────
  // Swipe LEFT on look pad = previous weapon
  // Swipe RIGHT on look pad = next weapon
  lz.addEventListener('touchstart',function(e){
    e.preventDefault();
    var t=e.changedTouches[0];
    look2.active=true;look2.id=t.identifier;
    look2.lx=t.clientX;look2.ly=t.clientY;
    swipeStartX=t.clientX;swipeStartY=t.clientY;
    swipeId=t.identifier;swipeMoved=false;
  },{passive:false});
  lz.addEventListener('touchmove',function(e){
    e.preventDefault();
    for(var i=0;i<e.changedTouches.length;i++){
      var t=e.changedTouches[i];
      if(t.identifier!==look2.id)continue;
      var mdx=t.clientX-look2.lx, mdy=t.clientY-look2.ly;
      look2.lx=t.clientX;look2.ly=t.clientY;
      // Camera rotation ONLY — weapon switch via slot tap only, never swipe
      yaw  -=mdx*0.016;
      pitch-=mdy*0.016;
      pitch=Math.max(-1.3,Math.min(1.3,pitch));
    }
  },{passive:false});
  ['touchend','touchcancel'].forEach(function(ev){
    lz.addEventListener(ev,function(){look2.active=false;swipeMoved=false;});
  });

  // ── FIRE BUTTON ───────────────────────────────────────────
  var bf=document.getElementById('bfire');
  if(bf){
    bf.addEventListener('touchstart',function(e){
      e.preventDefault();
      if(typeof curW==='function'&&curW().id==='fartgun'){
        if(typeof spawnFartCloud==='function') spawnFartCloud(playerPos.clone());
        var a0=typeof ammoStore!=='undefined'&&ammoStore['fartgun'];
        if(a0&&a0.mag>0){a0.mag--;if(typeof updateWpnHUD==='function')updateWpnHUD();}
      }else{
        if(typeof doShoot==='function')doShoot();
        if(typeof curW==='function'&&curW().auto)
          autoFireInt=setInterval(function(){if(typeof doShoot==='function')doShoot();},curW().rate);
      }
    },{passive:false});
    bf.addEventListener('touchend',function(e){
      e.preventDefault();
      if(typeof curW==='function'&&curW().id!=='fartgun'){
        if(typeof stopShooting==='function')stopShooting();
      }
    },{passive:false});
  }

  // ── POOP BUTTON ───────────────────────────────────────────
  var bp=document.getElementById('bpoop');
  if(bp){
    bp.addEventListener('touchstart',function(e){
      e.preventDefault();
      if(typeof spawnPoop==='function')spawnPoop(playerPos.clone());
    },{passive:false});
  }

  // ── JUMP ──────────────────────────────────────────────────
  var bj=document.getElementById('bjump');
  if(bj)bj.addEventListener('touchstart',function(e){
    e.preventDefault();if(typeof physicsJump==='function')physicsJump();
  },{passive:false});

  // ── CROUCH ────────────────────────────────────────────────
  var bc=document.getElementById('bcrouch');
  if(bc){
    bc.addEventListener('touchstart',function(e){
      e.preventDefault();mobileCrouching=true;
      if(typeof crouching!=='undefined')crouching=true;
      bc.style.background='rgba(255,200,0,0.75)';
    },{passive:false});
    ['touchend','touchcancel'].forEach(function(ev){
      bc.addEventListener(ev,function(e){
        e.preventDefault();mobileCrouching=false;
        if(typeof crouching!=='undefined')crouching=false;
        bc.style.background='rgba(80,80,80,0.6)';
      },{passive:false});
    });
  }

  // ── RELOAD ────────────────────────────────────────────────
  var br=document.getElementById('breload');
  if(br)br.addEventListener('touchstart',function(e){
    e.preventDefault();if(typeof doReload==='function')doReload();
  },{passive:false});

  // ── GRENADE ───────────────────────────────────────────────
  var bn=document.getElementById('bnade');
  if(bn)bn.addEventListener('touchstart',function(e){
    e.preventDefault();if(typeof throwGren==='function')throwGren();
  },{passive:false});

  // ── SPRINT ────────────────────────────────────────────────
  var bs=document.getElementById('bsprint');
  if(bs){
    bs.addEventListener('touchstart',function(e){
      e.preventDefault();mobileSprinting=true;
      bs.style.background='rgba(0,200,255,0.85)';
    },{passive:false});
    ['touchend','touchcancel'].forEach(function(ev){
      bs.addEventListener(ev,function(e){
        e.preventDefault();mobileSprinting=false;
        bs.style.background='rgba(0,150,200,0.55)';
      },{passive:false});
    });
  }

  // ── SCOPE ─────────────────────────────────────────────────
  var bsc=document.getElementById('bscope');
  if(bsc){
    bsc.addEventListener('touchstart',function(e){
      e.preventDefault();
      if(typeof zoomed!=='undefined'&&typeof camera!=='undefined'){
        zoomed=!zoomed;
        camera.fov=zoomed?22:75;
        camera.updateProjectionMatrix();
        var sco=document.getElementById('sco');
        var sr=document.getElementById('scope-ring');
        var xh=document.getElementById('xh');
        if(sco)sco.classList.toggle('on',zoomed);
        if(sr)sr.classList.toggle('on',zoomed);
        if(xh)xh.style.display=zoomed?'none':'block';
      }
    },{passive:false});
  }

  // ── WEAPON SLOTS — make tappable on mobile ────────────────
  for(var wi=0;wi<10;wi++){
    (function(idx){
      var sl=document.getElementById('ws'+idx);
      if(!sl)return;
      sl.addEventListener('touchstart',function(e){
        e.preventDefault();
        if(typeof switchTo==='function')switchTo(idx);
      },{passive:false});
    })(wi);
  }
}

function getMobileSprinting(){return mobileSprinting;}
function getMobileCrouching(){return mobileCrouching;}