'use strict';
// ── BRUTAL OPS — Audio.js ────────────────────────────────────

var SFX = {};
var smgSndId = null, smgPlaying = false;

function loadSound(key, path, vol) {
  try {
    SFX[key] = new Howl({
      src: [path],
      volume: vol || .8,
      loop: false,
      format: ['mp3', 'mpeg', 'wav', 'ogg']
    });
  } catch(e) {}
}

function loadMpeg(key, path, vol) {
  try {
    SFX[key] = new Howl({
      src: [path],
      volume: vol || .8,
      loop: false,
      format: ['mpeg', 'mp3', 'wav']
    });
  } catch(e) {}
}

function initAudio() {
  if (typeof Howl === 'undefined') return;

  // ── WEAPONS ───────────────────────────────────────────────
  loadSound('pistol_fire',  'assets/sounds/weapons/pistol/fire.mp3',         .85);
  loadSound('rifle_fire',   'assets/sounds/weapons/rifle/fire.mp3',          .85);
  loadSound('shotgun_fire', 'assets/sounds/weapons/shotgun/fire.mp3',        .9);
  loadSound('reload',       'assets/sounds/weapons/reload/reload.mp3',       .7);
  loadSound('explosion',    'assets/sounds/weapons/explode/explode.mp3',     .9);
  loadSound('lasergun',     'assets/sounds/weapons/lasergun/lasergun.mp3',   .8);
  loadSound('sniper_fire',  'assets/sounds/weapons/sniper/fire.mp3',         .95);
  loadSound('splash',       'assets/sounds/weapons/splash/splash.mp3',       .9);

  // Files with SPACES in name — Howler handles these fine as long as
  // the HTTP server serves them. Space in URL = %20 but Howler encodes it.
  // Use exact filename strings — Node http server does decodeURIComponent.
  loadSound('rod_swing',    'assets/sounds/weapons/rod/rod%20whip.mp3',      .9);
  loadSound('hitwall',      'assets/sounds/weapons/hit%20wall/hit%20wall.mp3',.55);

  // ── FART / POOP ───────────────────────────────────────────
  loadMpeg('fartgun',   'assets/sounds/weapons/fartgun/fartgun.mp3.mp4',   .9);
  loadMpeg('shithurt',  'assets/sounds/player/shithurt/shithurt.mpeg',      .9);

  // ── PLAYER ────────────────────────────────────────────────
  // "oye bas.mpeg" has a space — encode it
  loadMpeg('hurt',        'assets/sounds/player/hurt/oye%20bas.mpeg',        .85);
  loadMpeg('death_voice', 'assets/sounds/player/death%20voice/hurt.mp3.mpeg',.9);
  loadMpeg('pickup',      'assets/sounds/weapons/pickup/pickup.mpeg',         .9);
  loadMpeg('pickup1',     'assets/sounds/weapons/pickup/pickup1.mpeg',        .9);

  // ── GHOST — move sound NOT loaded (disabled) ──────────────
  loadSound('ghost_fire',  'assets/sounds/weapons/ghost/ghost.mp3',  .85);
  loadMpeg('ghost_hurt1',  'assets/sounds/weapons/ghost/hurt1.mpeg', .8);
  loadMpeg('ghost_hurt2',  'assets/sounds/weapons/ghost/hurt2.mpeg', .8);
  loadMpeg('ghost_die',    'assets/sounds/weapons/ghost/die.mpeg',   .9);
  // ghost_move intentionally NOT loaded

  // ── FOOTSTEP ──────────────────────────────────────────────
  try {
    SFX.footstep = new Howl({
      src: ['assets/sounds/player/footsteps/concrete/footsteps.mp3'],
      volume: .35,
      format: ['mp3', 'mpeg'],
      sprite: { step: [0, 320] }
    });
  } catch(e) {}

  // ── SMG burst ─────────────────────────────────────────────
  try {
    SFX.smg_obj = new Howl({
      src: ['assets/sounds/weapons/smg/fire.mp3'],
      volume: .75,
      loop: false,
      format: ['mp3', 'mpeg'],
      sprite: { burst: [0, 600] }
    });
  } catch(e) {}

  // ── SCARY VOICES ──────────────────────────────────────────
  try { SFX.scary0 = new Howl({src:['assets/sounds/voice/scary/hahaha.mpeg'],    format:['mpeg','mp3'],volume:.8}); }catch(e){}
  try { SFX.scary1 = new Howl({src:['assets/sounds/voice/scary/harisharis.mpeg'],format:['mpeg','mp3'],volume:.8}); }catch(e){}
  try { SFX.scary2 = new Howl({src:['assets/sounds/voice/scary/aja.mpeg'],       format:['mpeg','mp3'],volume:.8}); }catch(e){}

  scheduleVoice();
}

var SCARY_VOICES = { scary0:true, scary1:false, scary2:true };

function scheduleVoice() {
  var delay = 120000 + Math.random()*60000;
  setTimeout(function(){
    if (typeof alive!=='undefined' && alive){
      var active = Object.keys(SCARY_VOICES).filter(function(k){ return SCARY_VOICES[k] && SFX[k]; });
      if (active.length > 0){
        var key = active[Math.floor(Math.random()*active.length)];
        try { SFX[key].play(); } catch(e) {}
      }
    }
    scheduleVoice();
  }, delay);
}

function playFX(key) { try { if (SFX[key]) SFX[key].play(); } catch(e) {} }

function playPickupSound() {
  var s = Math.random() < .5 ? SFX.pickup : SFX.pickup1;
  try { if(s) s.play(); } catch(e) {}
}

function startSMG() {
  if (!SFX.smg_obj) return;
  smgPlaying = true;
  function fireBurst(){
    if (!smgPlaying) return;
    smgSndId = SFX.smg_obj.play('burst');
    SFX.smg_obj.once('end', function(){ if(smgPlaying) setTimeout(fireBurst,0); }, smgSndId);
  }
  fireBurst();
}

function stopSMG() {
  smgPlaying = false;
  if (smgSndId !== null && SFX.smg_obj){
    try { SFX.smg_obj.stop(smgSndId); } catch(e) {}
    smgSndId = null;
  }
}

function playHurt(isDead) {
  try {
    if (isDead && SFX.death_voice) SFX.death_voice.play();
    else if (SFX.hurt) SFX.hurt.play();
  } catch(e) {}
}