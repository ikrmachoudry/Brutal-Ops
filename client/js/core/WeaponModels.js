'use strict';
// ── BRUTAL OPS — WeaponModels.js ─────────────────────────────
// Clean rounded-geometry weapons. No boxes on SMG/RPG body.
// Crossbow replaced by SNIPER. FARTGUN added as slot 9.
// Rod = plain straight steel rod, single clean piece.
// ------------------------------------------------------------

var gunGrp = new THREE.Group();
var fpGuns  = [];
var flashM      = new THREE.MeshBasicMaterial({color:0xffaa00,transparent:true,opacity:0});
var laserFlashM = new THREE.MeshBasicMaterial({color:0x00ffaa,transparent:true,opacity:0});
var fartFlashM  = new THREE.MeshBasicMaterial({color:0x44ff44,transparent:true,opacity:0});

function wm(col,rough,metal){
  return new THREE.MeshStandardMaterial({color:col,roughness:rough||.3,metalness:metal||.8});
}

function mk(geo,mat){return new THREE.Mesh(geo,mat);}
function cyl(g,rt,rb,h,mat,x,y,z,rx){
  var m=mk(new THREE.CylinderGeometry(rt,rb,h,12),mat);
  m.position.set(x||0,y||0,z||0);
  m.rotation.x=(rx!==undefined?rx:Math.PI/2); g.add(m); return m;
}
function sph(g,r,mat,x,y,z,sx,sy,sz){
  var m=mk(new THREE.SphereGeometry(r,12,10),mat);
  m.position.set(x||0,y||0,z||0);
  if(sx)m.scale.set(sx,sy||sx,sz||sx); g.add(m); return m;
}
function box(g,w,h,d,mat,x,y,z){
  var m=mk(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x||0,y||0,z||0); g.add(m); return m;
}
function torus(g,r,tube,mat,x,y,z,rx){
  var m=mk(new THREE.TorusGeometry(r,tube,8,16),mat);
  m.position.set(x||0,y||0,z||0); if(rx)m.rotation.x=rx; g.add(m); return m;
}

function getHandMat(){
  var c=typeof PLAYER_CHAR!=='undefined'?PLAYER_CHAR:'robot';
  var cols={robot:0x334455,doctor:0xddbb99,businessman:0xd4a882,zombie:0x5a7a4a};
  return new THREE.MeshStandardMaterial({color:cols[c]||0x334455,roughness:.5,metalness:.1});
}
function hands(g,lx,rx,y,z){
  var hm=getHandMat();
  // Left hand grip
  var lh=mk(new THREE.CylinderGeometry(.032,.030,.12,8),hm);
  lh.position.set(lx,y-.02,z); lh.rotation.z=Math.PI/2; g.add(lh);
  // Right hand grip
  var rh=mk(new THREE.CylinderGeometry(.032,.030,.12,8),hm);
  rh.position.set(rx,y-.02,z); rh.rotation.z=Math.PI/2; g.add(rh);
}

// ── BUILD WEAPON ─────────────────────────────────────────────
function buildWeapon(id){
  var g=new THREE.Group();

  if(id==='crowbar'){
    // PLAIN STRAIGHT STEEL ROD — single clean piece
    var rodM=wm(0x7799aa,.15,.95);
    var darkM=wm(0x1a1a1a,.7,.3);
    // Main shaft — single cylinder
    cyl(g,.022,.022,.82,rodM, 0,0,.04);
    // Handle grip section (slightly thicker, darker)
    cyl(g,.028,.026,.24,darkM, 0,0,.28);
    // Grip rings
    for(var ri=0;ri<3;ri++){
      torus(g,.028,.006,wm(0x333333,.5),0,0,.18+ri*.06,Math.PI/2);
    }
    // Tip cap
    sph(g,.025,rodM, 0,0,-.37);
    // Butt cap
    sph(g,.030,wm(0x555566,.2,.9), 0,0,.4);
    hands(g,-.05,.05,-.04,.24);

  }else if(id==='pistol'){
    var blk=wm(0x111111,.35,.75); var dkG=wm(0x222222,.5,.6); var brn=wm(0x5a3010,.85,.1);
    var chrM=wm(0xaaaaaa,.2,.9);
    // Slide — slim box, not a huge half-cylinder
    box(g,.065,.055,.32,blk, 0,.025,-.02);
    // Ejection port cutout hint
    box(g,.025,.018,.1,dkG, .033,.034,-.02);
    // Barrel
    cyl(g,.016,.016,.28,dkG, 0,.025,-.18);
    cyl(g,.020,.020,.022,chrM, 0,.025,-.34);  // muzzle
    // Frame
    box(g,.065,.035,.3,blk, 0,-.008,-.02);
    // Trigger guard arc
    torus(g,.028,.006,dkG, 0,-.04,.04,Math.PI/2);
    // Grip — tapered cylinder
    cyl(g,.04,.034,.18,brn, 0,-.13,.07,0);
    sph(g,.042,brn, 0,-.228,.07);  // grip base round
    // Mag base
    cyl(g,.03,.03,.025,dkG, 0,-.228,.07);
    // Sights
    box(g,.02,.015,.015,dkG, 0,.055,.07);
    box(g,.008,.018,.008,dkG, 0,.052,-.19);
    hands(g,-.055,.055,-.05,.04);

  }else if(id==='shotgun'){
    var blk2=wm(0x111111,.4,.7); var dkG2=wm(0x222222,.5,.6); var wdM=wm(0x5a3010,.85,.1);
    // Receiver — octagonal cylinder
    cyl(g,.052,.052,.52,blk2, 0,.005,-.02);
    // Barrel — smooth single tube
    cyl(g,.028,.026,.52,dkG2, 0,.018,-.3);
    cyl(g,.032,.032,.025,dkG2, 0,.018,-.565);  // muzzle
    // Pump forend
    cyl(g,.046,.04,.2,wdM, 0,-.008,-.2);
    // Stock — tapered smooth
    cyl(g,.044,.036,.26,wdM, 0,-.008,.25);
    cyl(g,.038,.03,.04,wdM, 0,-.022,.39);
    sph(g,.042,wdM, 0,-.022,.41);  // butt
    // Ejection port
    box(g,.025,.035,.12,dkG2, .05,.015,-.02);
    // Shell tube under barrel
    cyl(g,.02,.02,.32,wm(0x888888,.3,.6), 0,-.03,-.14);
    // Sight
    sph(g,.01,wm(0xffffff,.3), 0,.052,-.375);
    hands(g,-.07,.07,-.04,-.16);

  }else if(id==='smg'){
    var blk3=wm(0x111111,.4,.7); var dkG3=wm(0x222222,.5,.6);
    // Body — clean tapered cylinder (NO BOX)
    cyl(g,.038,.036,.44,blk3, 0,.005,-.02);
    // Barrel
    cyl(g,.016,.016,.24,dkG3, 0,.005,-.25);
    // Suppressor
    cyl(g,.024,.024,.1,dkG3, 0,.005,-.39);
    torus(g,.024,.004,dkG3, 0,.005,-.345);  // suppressor end ring
    // Magazine — angled cylinder (NOT a box)
    var mag=mk(new THREE.CylinderGeometry(.03,.026,.24,8),dkG3);
    mag.position.set(0,-.1,.04); mag.rotation.x=.22; g.add(mag);
    sph(g,.034,dkG3, 0,-.222,.09);  // mag base
    // Grip — cylinder
    cyl(g,.032,.028,.15,wm(0x1a1a1a,.7,.3), 0,-.09,.12,0);
    sph(g,.034,wm(0x1a1a1a,.7,.3), 0,-.168,.12);
    // Charging handle
    sph(g,.012,dkG3, .042,.005,.06);
    // Folded stock — thin rods
    cyl(g,.008,.008,.22,blk3, -.03,-.01,.2,0);
    cyl(g,.008,.008,.22,blk3,  .03,-.01,.2,0);
    cyl(g,.055,.055,.012,blk3, 0,-.04,.29);  // stock end
    // Top rail
    box(g,.038,.01,.3,dkG3, 0,.045,-.05);
    hands(g,-.058,.058,-.04,-.04);

  }else if(id==='revolver'){
    var chrR=wm(0x9aabb8,.2,.95); var dkR=wm(0x222222,.5,.6); var wdR=wm(0x5a3010,.85,.1);
    // Frame
    box(g,.072,.1,.54,chrR, 0,.022,0);
    // Long barrel
    cyl(g,.022,.022,.48,chrR, 0,.025,-.27);
    box(g,.012,.01,.46,dkR, 0,.05,-.27);  // top rib
    // Cylinder with holes
    var cylGrp=new THREE.Group();
    mk(new THREE.CylinderGeometry(.065,.065,.3,12)); // just for reference
    var mainCyl=mk(new THREE.CylinderGeometry(.065,.065,.3,12),chrR);
    cylGrp.add(mainCyl);
    for(var ci=0;ci<6;ci++){
      var ca=ci*(Math.PI/3);
      var hole=mk(new THREE.CylinderGeometry(.016,.016,.32,8),dkR);
      hole.position.set(Math.cos(ca)*.042,Math.sin(ca)*.042,0); cylGrp.add(hole);
    }
    cylGrp.position.set(0,-.008,.06); cylGrp.rotation.x=Math.PI/2; g.add(cylGrp);
    // Grip
    cyl(g,.038,.032,.26,wdR, 0,-.165,.1,0);
    sph(g,.042,wdR, 0,-.296,.1);
    // Trigger + guard
    box(g,.01,.06,.2,dkR, 0,-.04,.06);
    torus(g,.032,.007,dkR, 0,-.05,.08,Math.PI/2);
    // Hammer
    box(g,.014,.045,.03,dkR, .04,.075,.1);
    hands(g,-.062,.062,-.04,.06);

  }else if(id==='rpg'){
    var olv=wm(0x4a5a1a,.7,.2); var dkO=wm(0x1a1a1a,.5,.6);
    // Main tube — clean cylinder (NO BOX body)
    cyl(g,.068,.068,.94,olv);
    // Front bell
    var bell=mk(new THREE.CylinderGeometry(.11,.068,.14,12),olv);
    bell.rotation.x=Math.PI/2; bell.position.set(0,0,-.47); g.add(bell);
    // Rear exhaust
    var ex=mk(new THREE.CylinderGeometry(.068,.092,.12,10),dkO);
    ex.rotation.x=Math.PI/2; ex.position.set(0,0,.5); g.add(ex);
    // Grip — cylinder NOT box
    cyl(g,.04,.036,.2,dkO, 0,-.12,.18,0);
    sph(g,.044,dkO, 0,-.225,.18);
    // Trigger housing — small cylinder
    cyl(g,.038,.034,.12,wm(0x1a1a1a,.7,.3), 0,-.08,.32,0);
    // NO sight arm — removed (was causing black bar)
    // Rocket
    cyl(g,.038,.038,.44,wm(0x887766,.5,.5), 0,0,-.72);
    var rktTip=mk(new THREE.CylinderGeometry(.001,.038,.14,8),wm(0xcc4400,.4,.6));
    rktTip.rotation.x=Math.PI/2; rktTip.position.set(0,0,-.99); g.add(rktTip);
    // Fins
    [0,Math.PI/2,Math.PI,3*Math.PI/2].forEach(function(a){
      var fin=mk(new THREE.BoxGeometry(.04,.04,.12),wm(0x887766,.5,.4));
      fin.position.set(Math.cos(a)*.058,Math.sin(a)*.058,-.56); g.add(fin);
    });
    hands(g,-.078,.078,-.05,.18);

  }else if(id==='sniper'){
    // SNIPER — replaces crossbow
    var dkS=wm(0x111111,.4,.7); var blkS=wm(0x1a1a1a,.5,.6); var wdS=wm(0x5a3010,.85,.1);
    var chrS=wm(0xaaaaaa,.2,.9);
    // Main receiver body — cylinder
    cyl(g,.038,.036,.7,dkS);
    // Barrel — long and slender
    cyl(g,.016,.014,.68,blkS, 0,0,-.58);
    cyl(g,.022,.022,.035,chrS, 0,0,-.925);  // muzzle brake
    // Scope body — prominent cylinder
    cyl(g,.028,.028,.36,dkS, 0,.072,-.1);
    // Scope lenses
    var lensM=new THREE.MeshStandardMaterial({color:0x112233,roughness:.05,metalness:.3,transparent:true,opacity:.8});
    cyl(g,.026,.026,.025,lensM, 0,.072,-.285);  // front lens
    cyl(g,.024,.024,.025,lensM, 0,.072,.085);   // rear lens
    // Scope turrets
    cyl(g,.01,.01,.06,dkS, .0,.106,-.08,0);
    cyl(g,.01,.01,.06,dkS, .042,.084,-.08,Math.PI/2);
    // Stock — curved wood
    cyl(g,.036,.028,.38,wdS, 0,-.008,.44);
    cyl(g,.03,.024,.04,wdS, 0,-.022,.64);
    sph(g,.032,wdS, 0,-.022,.66);
    // Pistol grip
    cyl(g,.032,.028,.16,dkS, 0,-.095,.25,0);
    sph(g,.034,dkS, 0,-.178,.25);
    // Trigger
    box(g,.01,.055,.015,blkS, 0,-.045,.22);
    torus(g,.028,.006,blkS, 0,-.052,.22,Math.PI/2);
    // Bipod legs (folded under)
    cyl(g,.008,.006,.14,dkS, -.04,-.04,-.18,-.5);
    cyl(g,.008,.006,.14,dkS,  .04,-.04,-.18,-.5);
    // Magazine
    cyl(g,.026,.022,.12,blkS, 0,-.06,.12,0);
    // Red/dark stock color stripe
    box(g,.042,.042,.36,wm(0x880000,.5,.4), 0,-.008,.44);
    hands(g,-.065,.065,-.048,.2);  // hands at grip position, NOT at sides

  }else if(id==='ghostgun'){
    // GHOST GUN — ethereal dark launcher
    var ghBase=wm(0x1a0a2a,.4,.5); var ghGlow=new THREE.MeshBasicMaterial({color:0x8833ff});
    var ghDark=wm(0x0a0a15,.6,.3); var ghBone=wm(0xddccaa,.6,.1);
    // Main body — dark rounded cylinder
    cyl(g,.05,.05,.6,ghBase);
    // Barrel — flared end like a spirit trap
    var bell=mk(new THREE.CylinderGeometry(.075,.05,.1,10),ghBase);
    bell.rotation.x=Math.PI/2; bell.position.set(0,0,-.38); g.add(bell);
    // Glow ring at barrel
    torus(g,.072,.008,ghGlow, 0,0,-.44);
    // Purple inner glow
    var innerGlow=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.08,8),
      new THREE.MeshBasicMaterial({color:0x6600cc,transparent:true,opacity:.7}));
    innerGlow.rotation.x=Math.PI/2; innerGlow.position.set(0,0,-.44); g.add(innerGlow);
    // Body etchings (rings)
    torus(g,.05,.006,wm(0x6633aa,.3,.6), 0,0,0);
    torus(g,.05,.006,wm(0x6633aa,.3,.6), 0,0,.15);
    // Grip — bone-like
    cyl(g,.032,.028,.18,ghBone, 0,-.1,.15,0);
    sph(g,.034,ghBone, 0,-.196,.15);
    // Skeleton hand grip detail
    box(g,.052,.016,.16,ghDark, 0,-.085,.15);
    // Trigger
    box(g,.01,.055,.015,ghDark, 0,-.045,.12);
    torus(g,.026,.005,ghDark, 0,-.05,.12,Math.PI/2);
    // Back skull ornament
    sph(g,.038,ghBone, 0,0,.36);
    sph(g,.012,new THREE.MeshBasicMaterial({color:0xff2200}), -.016,.01,.4);
    sph(g,.012,new THREE.MeshBasicMaterial({color:0xff2200}),  .016,.01,.4);
    hands(g,-.055,.055,-.05,.12);

  }else if(id==='lasergun'){
    var cpM=wm(0xb87333,.3,.9); var tcM=wm(0x2a3a2a,.4,.6);
    var glwM=new THREE.MeshBasicMaterial({color:0x00ff88});
    // Copper barrel
    cyl(g,.032,.032,.72,cpM);
    // Emitter cone
    var emit=mk(new THREE.CylinderGeometry(.008,.032,.1,8),cpM);
    emit.rotation.x=Math.PI/2; emit.position.set(0,0,-.42); g.add(emit);
    // Emitter glow ring
    torus(g,.014,.005,new THREE.MeshBasicMaterial({color:0x00ffaa}), 0,0,-.475);
    // Tech housing — cylinder NOT box
    cyl(g,.065,.065,.38,tcM, 0,0,.1);
    // Copper pipe detail along side
    cyl(g,.012,.012,.32,cpM, .058,.04,-.04);
    // Power cell indicator (small spheres)
    sph(g,.018,wm(0x00cc44,.3,.5), -.04,.055,.1);
    sph(g,.018,wm(0x00cc44,.3,.5),  .04,.055,.1);
    // Display glow
    box(g,.08,.04,.06,glwM, 0,.06,.04);
    // Grip cylinder
    cyl(g,.034,.03,.16,wm(0x1a1a1a,.7,.3), 0,-.085,.14,0);
    sph(g,.036,wm(0x1a1a1a,.7,.3), 0,-.168,.14);
    hands(g,-.065,.065,-.05,.1);

  }else if(id==='fartgun'){
    // TOY FART GUN — fun colorful, like Despicable Me blaster
    var toyBlue=wm(0x1a88ee,.4,.3); var toyGrn=wm(0x22cc44,.4,.3);
    var toyRed=wm(0xee2244,.4,.3); var toyYel=wm(0xeecc00,.4,.3);
    var toyDk =wm(0x112233,.6,.2);
    // Big round body — sphere flattened
    sph(g,.1,toyBlue, 0,0,.08, 1.4,.9,1.1);
    // Horn/barrel — cone then cylinder
    var horn=mk(new THREE.CylinderGeometry(.065,.04,.22,12),toyBlue);
    horn.rotation.x=Math.PI/2; horn.position.set(0,0,-.2); g.add(horn);
    var hornFront=mk(new THREE.CylinderGeometry(.075,.065,.04,12),toyDk);
    hornFront.rotation.x=Math.PI/2; hornFront.position.set(0,0,-.33); g.add(hornFront);
    // Speaker dots on horn
    for(var di=0;di<7;di++){
      var da=di*(Math.PI/3.5);
      sph(g,.01,toyDk, Math.cos(da)*.05,Math.sin(da)*.05,-.24);
    }
    // Handle
    cyl(g,.032,.028,.18,toyGrn, 0,-.12,.1,0);
    sph(g,.034,toyGrn, 0,-.215,.1);
    // Trigger
    box(g,.01,.055,.015,toyRed, 0,-.045,.08);
    torus(g,.026,.006,toyRed, 0,-.052,.08,Math.PI/2);
    // Tank on back (green cartridge)
    cyl(g,.04,.04,.18,toyGrn, -.042,0,.22);
    sph(g,.042,toyGrn, -.042,0,.316);
    // Yellow dial on top
    cyl(g,.022,.022,.015,toyYel, 0,.12,.1,0);
    // Red button
    sph(g,.018,toyRed, .065,.055,.08);
    // Colorful detail strips
    torus(g,.095,.008,toyRed, 0,0,.04);
    torus(g,.095,.006,toyYel, 0,0,.14);
    hands(g,-.06,.06,-.04,.08);
  }

  return g;
}

// ── BUILD ALL FP WEAPONS ─────────────────────────────────────
var weaponIds=['crowbar','pistol','shotgun','smg','revolver','rpg','sniper','lasergun','fartgun','ghostgun'];
weaponIds.forEach(function(id,i){
  var g=buildWeapon(id);
  fpGuns.push(g);
  gunGrp.add(g);
  g.visible=(i===0);
});

// Muzzle flashes
var flashMesh=new THREE.Mesh(new THREE.SphereGeometry(.05,6,6),flashM);
flashMesh.position.set(0,.02,-.32); gunGrp.add(flashMesh);
var laserFlashMesh=new THREE.Mesh(new THREE.SphereGeometry(.04,6,6),laserFlashM);
laserFlashMesh.position.set(0,.02,-.46); gunGrp.add(laserFlashMesh);
var fartFlashMesh=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),fartFlashM);
fartFlashMesh.position.set(0,0,-.28); gunGrp.add(fartFlashMesh);

gunGrp.position.set(.18,-.2,-.26);