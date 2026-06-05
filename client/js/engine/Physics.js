'use strict';
// ── BRUTAL OPS — Physics.js ──────────────────────────────────
// Fixes: player underground bug, correct eye-height, ceiling height
// ------------------------------------------------------------
var PLAYER_R=0.38,GRAV=-22,JUMP_V=8.8;
var WALK_SPEED=7.0,SPRINT_SPEED=11.0,CROUCH_SPEED=3.2;
var ACCEL=22.0,FRICTION=16.0,AIR_ACCEL=5.0,AIR_FRICTION=1.2;

var velY=0,velX=0,velZ=0,onGround=true,sprintStamina=1.0;
// Eye height: 1.7 standing, 1.05 crouching
var crouchHeight=1.7,crouchHeightFull=1.7,crouchHeightDown=1.05;
var bobTime=0,bobX=0,bobY=0,stepTimer=0;

function colTest(ax,az){
  var all=(typeof colliders!=='undefined'?colliders:[]).concat(
    typeof dynCol!=='undefined'?dynCol.filter(function(c){return c.active;}):[]);
  for(var i=0;i<all.length;i++){
    var c=all[i];
    var clX=Math.max(c.cx-c.hw,Math.min(ax,c.cx+c.hw));
    var clZ=Math.max(c.cz-c.hd,Math.min(az,c.cz+c.hd));
    var dx=ax-clX,dz=az-clZ;
    if(dx*dx+dz*dz<PLAYER_R*PLAYER_R)return true;
  }
  return false;
}

function resolveCol(nx,nz){
  var ox=playerPos.x,oz=playerPos.z;
  if(!colTest(nx,nz))return[nx,nz];
  if(!colTest(nx,oz))return[nx,oz];
  if(!colTest(ox,nz))return[ox,nz];
  return[ox,oz];
}

function getFloorY(x,z){
  if(typeof MapLoader!=='undefined'&&MapLoader.getFloorY){
    var f=MapLoader.getFloorY(x,z);
    if(f!==null&&f!==undefined)return f;
  }
  return 0;
}

function getBounds(){
  if(typeof MapLoader!=='undefined'&&MapLoader.getBounds)return MapLoader.getBounds();
  return{minX:-58,maxX:58,minZ:-48,maxZ:48};
}

function physicsUpdate(inputDir,crouching,sprinting,dt){
  var wantSprint=sprinting&&!crouching&&inputDir.length()>0.05;
  if(wantSprint&&sprintStamina>0)sprintStamina=Math.max(0,sprintStamina-dt*.4);
  else sprintStamina=Math.min(1,sprintStamina+dt*.25);
  var actualSprint=wantSprint&&sprintStamina>0;
  var spEl=document.getElementById('spfill');
  if(spEl)spEl.style.width=(sprintStamina*100)+'%';

  var targetSpeed=crouching?CROUCH_SPEED:actualSprint?SPRINT_SPEED:WALK_SPEED;
  var accel=onGround?ACCEL:AIR_ACCEL;
  var friction=onGround?FRICTION:AIR_FRICTION;
  var moving=inputDir.length()>0.05;

  if(moving){
    velX+=(inputDir.x*targetSpeed-velX)*Math.min(1,accel*dt);
    velZ+=(inputDir.z*targetSpeed-velZ)*Math.min(1,accel*dt);
  }else{
    velX*=Math.max(0,1-friction*dt);
    velZ*=Math.max(0,1-friction*dt);
    if(Math.abs(velX)<0.04)velX=0;
    if(Math.abs(velZ)<0.04)velZ=0;
  }

  var nx=playerPos.x+velX*dt,nz=playerPos.z+velZ*dt;
  var col=resolveCol(nx,nz);nx=col[0];nz=col[1];
  if(nx===playerPos.x)velX=0;
  if(nz===playerPos.z)velZ=0;

  var b=getBounds();
  nx=Math.max(b.minX+PLAYER_R,Math.min(b.maxX-PLAYER_R,nx));
  nz=Math.max(b.minZ+PLAYER_R,Math.min(b.maxZ-PLAYER_R,nz));
  playerPos.x=nx;playerPos.z=nz;

  velY+=GRAV*dt;
  playerPos.y+=velY*dt;

  var floorBase=getFloorY(playerPos.x,playerPos.z);
  // Smooth crouch
  var targetH=crouching?crouchHeightDown:crouchHeightFull;
  crouchHeight+=(targetH-crouchHeight)*Math.min(1,12*dt);
  var fY=floorBase+crouchHeight;

  if(playerPos.y<=fY){
    playerPos.y=fY;velY=0;onGround=true;
  }else{
    onGround=false;
  }
  // Ceiling — map ceiling is ~5.5 units above floor
  if(playerPos.y>floorBase+5.2){playerPos.y=floorBase+5.2;velY=-0.5;}

  // Head bob
  var speed2D=Math.sqrt(velX*velX+velZ*velZ);
  if(speed2D>0.5)bobTime+=dt*(actualSprint?12:8);
  else bobTime*=0.85;
  var bobAmp=crouching?.004:actualSprint?.016:moving?.009:0;
  bobX=Math.sin(bobTime*.5)*bobAmp*.6;
  bobY=Math.abs(Math.sin(bobTime))*bobAmp;

  // Footsteps
  if(speed2D>1.0&&onGround){
    stepTimer+=dt;
    if(stepTimer>=(actualSprint?.28:.42)){
      stepTimer=0;
      try{if(typeof SFX!=='undefined'&&SFX.footstep)SFX.footstep.play('step');}catch(e){}
    }
  }else{stepTimer=0;}

  return{moving:speed2D>0.5,sprinting:actualSprint,crouching:crouching,bobX:bobX,bobY:bobY};
}

function physicsJump(){if(onGround){velY=JUMP_V;onGround=false;}}
function getVelY(){return velY;}
function getOnGround(){return onGround;}
function getSprintStamina(){return sprintStamina;}