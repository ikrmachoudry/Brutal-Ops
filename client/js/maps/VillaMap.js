'use strict';
// ── BRUTAL OPS — VillaMap.js ─────────────────────────────────
// 120×80 single-floor facility. No doors. Proportional maze.
// All passages 5 units wide. Random weapon safe spawn zones.
// ------------------------------------------------------------
var VillaMap = (function(){
  var _scene, _col;
  var WH=4.2, TK=0.28;

  // Safe corridor center positions for weapon spawning (away from walls)
  var SAFE_ZONES = [
    {x:-45,z:0},{x:-45,z:24},{x:-45,z:-24},
    {x:-15,z:0},{x:-15,z:20},{x:-15,z:-20},
    {x: 15,z:0},{x: 15,z:20},{x: 15,z:-20},
    {x: 45,z:0},{x: 45,z:24},{x: 45,z:-24},
    {x:0,z:30},{x:0,z:-30},{x:0,z:0},
  ];

  function getRandomSafeZone() {
    return SAFE_ZONES[Math.floor(Math.random() * SAFE_ZONES.length)];
  }

  function mkTex(r,g,b,ts){
    var cv=document.createElement('canvas'); cv.width=cv.height=256;
    var cx=cv.getContext('2d');
    cx.fillStyle='rgb('+r+','+g+','+b+')'; cx.fillRect(0,0,256,256);
    cx.globalAlpha=.08;
    for(var i=0;i<500;i++){cx.fillStyle=Math.random()>.5?'#fff':'#000';cx.fillRect(Math.random()*256,Math.random()*256,Math.random()*3+1,2);}
    cx.globalAlpha=.1; cx.fillStyle='#000';
    for(var x=0;x<256;x+=ts||48) cx.fillRect(x,0,1.5,256);
    for(var y=0;y<256;y+=ts||48) cx.fillRect(0,y,256,1.5);
    cx.globalAlpha=1;
    var t=new THREE.CanvasTexture(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(5,5);
    return t;
  }

  var MC,MF,MW,MD;
  function initM(){
    MC=new THREE.MeshStandardMaterial({map:mkTex(88,86,80,48),roughness:.92});
    MF=new THREE.MeshStandardMaterial({map:mkTex(158,153,143,32),roughness:.7,metalness:.04});
    MW=new THREE.MeshStandardMaterial({map:mkTex(72,70,66,48),roughness:.9});
    MD=new THREE.MeshStandardMaterial({map:mkTex(48,46,42,48),roughness:.95});
  }

  function box(x,y,z,w,h,d,mat,noCol){
    var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat||MC);
    m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; _scene.add(m);
    if(!noCol) _col.push({cx:x,cz:z,hw:w/2+.04,hd:d/2+.04});
    return m;
  }

  // Wall segment with guaranteed clear gap — lintel has NO collision
  function wallXgap(cx,y,z,len,h,mat,gapCenter,gapW){
    gapW=gapW||5.0;
    var x1=cx-len/2, x2=cx+len/2;
    var g1=Math.max(x1, gapCenter-gapW/2);
    var g2=Math.min(x2, gapCenter+gapW/2);
    if(g1>x1+.1) box(x1+(g1-x1)/2, y+h/2, z, g1-x1, h, TK, mat);
    if(g2<x2-.1) box(g2+(x2-g2)/2, y+h/2, z, x2-g2, h, TK, mat);
    // Lintel — visual only, NO collision
    if(h>3.2) box(gapCenter, y+3.2+(h-3.2)/2, z, gapW, h-3.2, TK, mat, true);
  }

  function wallZgap(x,y,cz,len,h,mat,gapCenter,gapW){
    gapW=gapW||5.0;
    var z1=cz-len/2, z2=cz+len/2;
    var g1=Math.max(z1, gapCenter-gapW/2);
    var g2=Math.min(z2, gapCenter+gapW/2);
    if(g1>z1+.1) box(x, y+h/2, z1+(g1-z1)/2, TK, h, g1-z1, mat);
    if(g2<z2-.1) box(x, y+h/2, g2+(z2-g2)/2, TK, h, z2-g2, mat);
    // Lintel — visual only, NO collision
    if(h>3.2) box(x, y+3.2+(h-3.2)/2, gapCenter, TK, h-3.2, gapW, mat, true);
  }

  var aidBoxes=[];
  function mkAid(x,y,z){
    var grp=new THREE.Group();
    var aidM=new THREE.MeshStandardMaterial({color:0x22cc44,roughness:.4,emissive:0x004400,emissiveIntensity:.5});
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.1),aidM));
    var ch=new THREE.Mesh(new THREE.BoxGeometry(.06,.28,.02),new THREE.MeshBasicMaterial({color:0xffffff}));ch.position.z=.06;grp.add(ch);
    var cv2=new THREE.Mesh(new THREE.BoxGeometry(.28,.06,.02),new THREE.MeshBasicMaterial({color:0xffffff}));cv2.position.z=.06;grp.add(cv2);
    var l=new THREE.PointLight(0x22ff44,.8,3);l.position.z=.3;grp.add(l);
    grp.position.set(x,y,z);_scene.add(grp);
    aidBoxes.push({group:grp,x:x,y:y,z:z,available:true});
  }

  function build(){
    initM();

    // FLOOR 120×80
    box(0,-.15,0,120,.28,80,MF,true);

    // OUTER WALLS
    box( 0,WH/2,-40,120,WH,TK,MD);
    box( 0,WH/2, 40,120,WH,TK,MD);
    box(-60,WH/2, 0,TK,WH,80,MD);
    box( 60,WH/2, 0,TK,WH,80,MD);

    // CEILING
    box(0,WH+.14,0,120,.26,80,MC,true);

    // MAZE WALLS — all gaps 5 units, lintel no collision
    wallZgap(-40,0,  0,  56,WH,MC,  8, 5.0);
    wallZgap(-20,0, -4,  48,WH,MC, -6, 5.0);
    wallZgap(  0,0,  0,  56,WH,MW,  5, 5.0);
    wallZgap( 20,0,  4,  48,WH,MC,  6, 5.0);
    wallZgap( 40,0,  0,  56,WH,MC, -8, 5.0);

    wallXgap(  0,0,-18,  80,WH,MC,-15, 5.0);
    wallXgap(  0,0,  0,  60,WH,MC, 12, 5.0);
    wallXgap(  0,0, 18,  80,WH,MC,-12, 5.0);

    // LIGHTING
    _scene.add(new THREE.AmbientLight(0x334455,.75));
    _scene.add(new THREE.HemisphereLight(0x445566,0x221133,.4));
    [[-45,WH-.3,-24],[-45,WH-.3,0],[-45,WH-.3,24],
     [-15,WH-.3,-24],[-15,WH-.3,0],[-15,WH-.3,24],
     [ 15,WH-.3,-24],[ 15,WH-.3,0],[ 15,WH-.3,24],
     [ 45,WH-.3,-24],[ 45,WH-.3,0],[ 45,WH-.3,24],
    ].forEach(function(p){
      var l=new THREE.PointLight(0xfff4cc,1.4,22);l.position.set(p[0],p[1],p[2]);_scene.add(l);
      box(p[0],WH-.1,p[2],.55,.05,.55,new THREE.MeshBasicMaterial({color:0xffffcc}),true);
    });

    // AID BOXES
    mkAid(-20,1.5,-18); mkAid(20,1.5,18);
    mkAid(0,1.5,-30);   mkAid(0,1.5,30);

    console.log('[VillaMap] 120x80 built. Colliders:',_col.length);
  }

  return{
    init:function(scene,col,dyn,dm,ds,dt){_scene=scene;_col=col;build();},
    getDoorStates:function(){return{};},
    openDoor:function(){},
    getFloorY:function(x,z){return null;},
    getAidBoxes:function(){return aidBoxes;},
    getRandomSafeZone:function(){return getRandomSafeZone();},
    BOUNDS:{minX:-59,maxX:59,minZ:-39,maxZ:39},
    SAFE_ZONES:SAFE_ZONES,
    F1:0,F2:0,
  };
})();
if(typeof MapLoader!=='undefined') MapLoader.register('villa',VillaMap);