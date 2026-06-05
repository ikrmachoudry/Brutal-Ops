'use strict';
// ── BRUTAL OPS — Characters.js ───────────────────────────────
// HL1-style characters. Crouch = hunter one-knee pose (image ref).
// ------------------------------------------------------------

var CHAR_DEFS = [
  {id:'doctor',   name:'DR. VOSS',   role:'FIELD MEDIC',     color:'#44ffaa'},
  {id:'guard',    name:'SGT. HAYES', role:'SECURITY GUARD',  color:'#ffaa44'},
  {id:'civilian', name:'RILEY',      role:'CIVILIAN',        color:'#44aaff'},
  {id:'military', name:'CPL. STARK', role:'MILITARY POLICE', color:'#ff4444'},
];

function _mat(col,rough,metal){
  return new THREE.MeshStandardMaterial({color:col,roughness:rough!==undefined?rough:.75,metalness:metal||0});
}
function _box(grp,x,y,z,w,h,d,mat){
  var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);grp.add(m);return m;
}
function _cyl(grp,x,y,z,rt,rb,h,mat,rx,rz){
  var m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,8),mat);
  m.position.set(x,y,z);if(rx)m.rotation.x=rx;if(rz)m.rotation.z=rz;
  grp.add(m);return m;
}
function _sph(grp,x,y,z,r,mat,sx,sy,sz){
  var m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),mat);
  m.position.set(x,y,z);if(sx)m.scale.set(sx,sy||sx,sz||sx);
  grp.add(m);return m;
}

function mkRemote(name,charType){
  charType=charType||'doctor';
  if(['doctor','guard','civilian','military'].indexOf(charType)===-1)charType='doctor';
  var g=new THREE.Group();

  // Palettes
  var skinCol,shirtCol,pantsCol,bootCol,hairCol;
  var hasGlasses=false,hasTie=false,hasVest=false,hasCap=false,hasCamo=false;
  if(charType==='doctor'){
    skinCol=0xdeb887;shirtCol=0xeeeeee;pantsCol=0x334466;bootCol=0x1a1008;hairCol=0xf0f0e0;
    hasGlasses=true;hasTie=true;
  }else if(charType==='guard'){
    skinCol=0xc8a060;shirtCol=0x224488;pantsCol=0x1a2244;bootCol=0x080808;hairCol=0x111108;
    hasVest=true;hasCap=true;
  }else if(charType==='civilian'){
    skinCol=0xd4956a;shirtCol=0x2a2a40;pantsCol=0x223355;bootCol=0x3a2208;hairCol=0x5c2e00;
  }else{
    skinCol=0xbb8855;shirtCol=0x4a5a2a;pantsCol=0x3a4a1a;bootCol=0x1a1a08;hairCol=0x080804;
    hasCamo=true;hasCap=true;
  }
  var SK=_mat(skinCol,.7),SH=_mat(shirtCol,.75),PT=_mat(pantsCol,.8);
  var BT=_mat(bootCol,.5,.1),HR=_mat(hairCol,.9),EX=_mat(hasVest?0x1a2244:shirtCol,.75);
  var WHT=_mat(0xffffff,.6),DRK=_mat(0x111111,.4),EYE=_mat(0x111122,.3),RED=_mat(0x880000,.9);

  // ── LEGS — separate groups for animation ──────────────────
  // legL = right leg in world (player's left), legR = kneeling leg
  var legL=new THREE.Group(); legL.position.set(-0.13,0.78,0); g.add(legL);
  var legR=new THREE.Group(); legR.position.set( 0.13,0.78,0); g.add(legR);

  function buildLeg(lg){
    _cyl(lg,0,-.20,0,.095,.085,.40,PT);
    _sph(lg,0,-.42,.02,.090,PT,1,.85,1);
    _cyl(lg,0,-.64,0,.080,.072,.40,PT);
    _sph(lg,0,-.86,0,.072,PT);
    _box(lg,0,-.94,.05,.19,.10,.32,BT);
    _box(lg,0,-.94,.20,.17,.08,.08,_mat(Math.round(bootCol*.7),.4,.2));
  }
  buildLeg(legL); buildLeg(legR);

  // ── TORSO ─────────────────────────────────────────────────
  _box(g,0,.82,0,.44,.12,.28,PT);
  _box(g,0,.82,-.145,.06,.06,.02,_mat(0x888855,.3,.7));
  _cyl(g,0,1.12,0,.24,.22,.58,SH);
  if(hasCamo){
    _box(g,.10,1.0,-.23,.08,.18,.02,_mat(0x2a3a1a,.9));
    _box(g,-.08,1.22,-.23,.06,.12,.02,_mat(0x2a3a1a,.9));
  }
  if(hasVest){
    _cyl(g,0,1.12,0,.27,.25,.56,EX);
    _box(g,-.20,1.1,-.27,.10,.10,.02,_mat(0x1a2244,.7));
    _box(g, .20,1.1,-.27,.10,.10,.02,_mat(0x1a2244,.7));
    _box(g,-.19,1.32,-.27,.07,.085,.02,_mat(0xddaa44,.2,.8));
  }
  if(hasTie){
    _box(g,0,1.06,-.23,.10,.45,.02,WHT);
    _box(g,0,1.10,-.245,.055,.38,.015,RED);
    _box(g,0,1.06,-.235,.22,.035,.02,_mat(0x666666,.3,.7));
    _sph(g,0,.89,-.24,.038,_mat(0x888888,.2,.8));
    _box(g,-.17,.92,-.235,.075,.11,.02,RED);
  }
  _cyl(g,0,1.44,0,.115,.11,.14,SK);

  // ── ARMS ──────────────────────────────────────────────────
  var armLG=new THREE.Group(); armLG.position.set(-.31,1.22,0); armLG.rotation.z=.08; g.add(armLG);
  var armRG=new THREE.Group(); armRG.position.set( .31,1.22,0); armRG.rotation.z=-.08; g.add(armRG);

  function buildArm(ag,sleeveM,skinM,isRight){
    var s=isRight?1:-1;
    _sph(ag,0,.06,0,.12,sleeveM,1.05,.85,1);
    _cyl(ag,0,-.10,0,.10,.088,.42,sleeveM);
    _sph(ag,0,-.32,0,.085,sleeveM);
    _cyl(ag,0,-.52,0,.082,.072,.38,sleeveM);
    _sph(ag,0,-.72,0,.072,skinM);
    var hG=new THREE.Group(); hG.position.set(0,-.86,0); ag.add(hG);
    _box(hG,0,0,0,.14,.13,.065,skinM);
    for(var fi=0;fi<4;fi++){
      var fx=(fi-1.5)*.034;
      _box(hG,fx,-.075,0,.028,.04,.055,skinM);
      _box(hG,fx,-.115,0,.024,.055,.048,skinM);
      _box(hG,fx,-.155,-.004,.022,.04,.042,skinM);
    }
    _box(hG,s*.08,-.04,0,.024,.075,.048,skinM);
  }
  buildArm(armLG,SH,SK,false);
  buildArm(armRG,SH,SK,true);

  // ── HEAD ──────────────────────────────────────────────────
  var headG=new THREE.Group(); headG.position.set(0,1.66,0); g.add(headG);
  _box(headG,0, .08,0,.32,.36,.30,SK);
  _box(headG,0,-.06,0,.28,.12,.28,SK);
  _box(headG,0, .18,0,.30,.15,.28,SK);
  _box(headG,0,-.12,-.02,.22,.06,.22,SK);
  _box(headG,-.17,.06,0,.04,.10,.08,SK); _box(headG,.17,.06,0,.04,.10,.08,SK);
  _box(headG,0,.14,-.148,.26,.03,.02,_mat(Math.round(skinCol*.9),.8));
  // Eyes
  _box(headG,-.08,.09,-.152,.09,.055,.012,WHT); _box(headG,.08,.09,-.152,.09,.055,.012,WHT);
  var eyeLM=_box(headG,-.08,.09,-.158,.038,.038,.01,EYE);
  var eyeRM=_box(headG, .08,.09,-.158,.038,.038,.01,EYE);
  _box(headG,-.072,.096,-.162,.014,.014,.008,WHT); _box(headG,.088,.096,-.162,.014,.014,.008,WHT);
  // Eyebrows
  _box(headG,-.082,.138,-.153,.095,.018,.015,HR); _box(headG,.082,.138,-.153,.095,.018,.015,HR);
  // Nose
  _box(headG,0,.0,-.162,.042,.085,.045,SK); _box(headG,0,-.04,-.168,.065,.04,.04,SK);
  // Mouth
  var mouthM=_box(headG,0,-.07,-.155,.085,.018,.014,_mat(0xcc7744,.9));
  _box(headG,0,-.062,-.158,.075,.014,.01,_mat(0xddaa88,.7));

  // Hair/hat per character
  if(charType==='doctor'){
    _box(headG,-.15,.18,.04,.06,.2,.26,HR); _box(headG,.15,.18,.04,.06,.2,.26,HR);
    _box(headG,0,.25,-.08,.26,.05,.18,HR); _box(headG,0,.28,.06,.28,.06,.12,HR);
    // Glasses
    _box(headG,-.08,.09,-.163,.10,.005,.005,DRK); _box(headG,.08,.09,-.163,.10,.005,.005,DRK);
    _box(headG,0,.09,-.163,.006,.005,.005,DRK);
    _box(headG,-.145,.09,-.14,.005,.005,.04,DRK); _box(headG,.145,.09,-.14,.005,.005,.04,DRK);
  }else if(charType==='guard'){
    _box(headG,0,.2,.02,.34,.14,.32,_mat(0x1a1a2a,.5,.3));
    _box(headG,0,.14,-.18,.3,.06,.04,_mat(0x1a1a2a,.5,.3));
    _box(headG,0,.24,-.13,.08,.04,.02,WHT);
  }else if(charType==='civilian'){
    _box(headG,0,.28,.06,.32,.10,.28,HR); _box(headG,0,.26,-.1,.3,.08,.12,HR);
    _box(headG,-.16,.2,.02,.06,.2,.28,HR); _box(headG,.16,.2,.02,.06,.2,.28,HR);
    _box(headG,0,-.09,-.145,.14,.04,.02,_mat(0x7a3500,.9));
    _box(headG,0,-.12,-.13,.12,.04,.03,_mat(0x7a3500,.9));
  }else{
    _box(headG,0,.24,.02,.36,.16,.34,_mat(0x3a4a2a,.5,.2));
    _box(headG,0,.15,-.19,.32,.05,.04,_mat(0x3a4a2a,.5,.2));
    _box(headG,.08,.26,-.17,.06,.04,.02,_mat(0x2a3a1a,.8));
  }

  // Name tag
  var nc=document.createElement('canvas'); nc.width=256; nc.height=52;
  var ctx=nc.getContext('2d');
  ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(4,4,248,44);
  var colors={doctor:'#44ffaa',guard:'#ffaa44',civilian:'#44aaff',military:'#ff4444'};
  ctx.strokeStyle=colors[charType]||'#ffee44'; ctx.lineWidth=2.5; ctx.strokeRect(4,4,248,44);
  ctx.fillStyle='#ffee44'; ctx.font='bold 21px monospace'; ctx.textAlign='center';
  ctx.fillText((name||'PLAYER').toUpperCase(),128,31);
  var ns=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(nc),transparent:true,depthTest:true,depthWrite:false}));
  ns.scale.set(1.4,.32,1); ns.position.y=2.22; g.add(ns);

  // Animation state
  g.userData.legL=legL; g.userData.legR=legR;
  g.userData.headG=headG; g.userData.eyeLRef=eyeLM; g.userData.eyeRRef=eyeRM;
  g.userData.mouthRef=mouthM; g.userData.armRG=armRG; g.userData.armLG=armLG;
  g.userData.walkTime=0; g.userData.blinkTimer=2+Math.random()*3;
  g.userData.breathT=Math.random()*Math.PI*2; g.userData.hit=0;
  g.userData.crouching=false; g.userData.weaponMesh=null;
  // Store original leg positions for un-crouching
  g.userData.legL_origPos=legL.position.clone();
  g.userData.legR_origPos=legR.position.clone();

  return g;
}

// ── ANIMATE REMOTE PLAYERS ────────────────────────────────────
function animateRemoteLegs(rpObj,dt,moving,sprinting,crouching,serverY){
  var ud=rpObj.mesh.userData;
  var legL=ud.legL, legR=ud.legR;
  if(!legL||!legR)return;
  var t=performance.now()*.001;

  // Jump height
  if(typeof serverY==='number'&&serverY>1.9)
    rpObj.mesh.position.y=Math.max(0,serverY-1.7);

  // ── CROUCH — hunter pose: right knee on floor, left knee up ─
  if(crouching!==ud.crouching){
    ud.crouching=crouching;
    if(crouching){
      // RIGHT leg: knee down on floor — rotate forward-down, lower
      legR.position.set(0.13, 0.35, 0.18);
      legR.rotation.set(1.3, 0, 0);          // knee forward-down
      // LEFT leg: bent up like kneeling stance
      legL.position.set(-0.13, 0.55, -0.08);
      legL.rotation.set(0.7, 0, 0);           // thigh up, shin back
      // Lower body
      rpObj.mesh.position.y=Math.max(0,(rpObj.mesh.position.y||0)-0.38);
    }else{
      // Restore standing positions
      legR.position.copy(ud.legR_origPos);
      legR.rotation.set(0,0,0);
      legL.position.copy(ud.legL_origPos);
      legL.rotation.set(0,0,0);
    }
  }

  // ── WALK ANIMATION (only when not crouching) ───────────────
  if(moving&&!crouching){
    ud.walkTime+=dt*(sprinting?10:6);
    var sw=Math.sin(ud.walkTime)*(sprinting?.65:.45);
    legL.rotation.x= sw;
    legR.rotation.x=-sw;
    if(ud.armLG) ud.armLG.rotation.x=-sw*.55;
    if(ud.armRG) ud.armRG.rotation.x= sw*.55;
  }else if(!crouching){
    ud.walkTime=0;
    var s=Math.min(1,8*dt);
    legL.rotation.x+=(0-legL.rotation.x)*s;
    legR.rotation.x+=(0-legR.rotation.x)*s;
    if(ud.armLG) ud.armLG.rotation.x+=(0-ud.armLG.rotation.x)*s;
    if(ud.armRG) ud.armRG.rotation.x+=(0-ud.armRG.rotation.x)*s;
  }

  // ── BREATHE ───────────────────────────────────────────────
  ud.breathT+=dt*1.6;
  if(!crouching) rpObj.mesh.position.y=(rpObj.mesh.position.y||0)+Math.sin(ud.breathT)*.006;

  // ── BLINK ─────────────────────────────────────────────────
  ud.blinkTimer-=dt;
  if(ud.blinkTimer<0){
    ud.blinkTimer=2.5+Math.random()*3.5;
    if(ud.eyeLRef) ud.eyeLRef.scale.y=0.05;
    if(ud.eyeRRef) ud.eyeRRef.scale.y=0.05;
    setTimeout(function(){if(ud.eyeLRef)ud.eyeLRef.scale.y=1;if(ud.eyeRRef)ud.eyeRRef.scale.y=1;},100);
  }

  // ── MOUTH ─────────────────────────────────────────────────
  if(ud.mouthRef){
    var tMY=moving?0.5+Math.abs(Math.sin(ud.walkTime*.6))*.7:1;
    ud.mouthRef.scale.y+=(tMY-ud.mouthRef.scale.y)*.1;
  }

  // ── HEAD LOOK ─────────────────────────────────────────────
  if(ud.headG&&typeof camera!=='undefined'&&camera.position){
    var wp=new THREE.Vector3(); ud.headG.getWorldPosition(wp);
    var toC=new THREE.Vector3(camera.position.x-wp.x,0,camera.position.z-wp.z);
    var ang=Math.atan2(toC.x,toC.z)-rpObj.mesh.rotation.y;
    ang=Math.max(-.65,Math.min(.65,ang));
    ud.headG.rotation.y+=(ang-ud.headG.rotation.y)*Math.min(1,4*dt);
  }

  // ── DAMAGE SHAKE ──────────────────────────────────────────
  if(ud.hit>0){
    rpObj.mesh.rotation.z=Math.sin(t*40)*.10; ud.hit-=dt;
  }else{
    rpObj.mesh.rotation.z+=(0-rpObj.mesh.rotation.z)*Math.min(1,6*dt);
  }
}

function triggerHitShake(rpObj){
  if(rpObj&&rpObj.mesh) rpObj.mesh.userData.hit=0.3;
}