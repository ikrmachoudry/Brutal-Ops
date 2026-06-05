const { MAX_PLAYERS } = require('../config/server.config');

class GameState {
  constructor() {
    this.players  = {};
    this.nextId   = 1;
    this.adminId  = null;
    this.currentMap = 'villa';
    this.doors    = {};
    this.pickups  = {
      pu_pistol:  {id:'pu_pistol',  weapon:'pistol',  available:true},
      pu_shotgun: {id:'pu_shotgun', weapon:'shotgun', available:true},
      pu_smg:     {id:'pu_smg',     weapon:'smg',     available:true},
      pu_revolver:{id:'pu_revolver',weapon:'revolver',available:true},
      pu_rpg:     {id:'pu_rpg',     weapon:'rpg',     available:true},
      pu_crossbow:{id:'pu_crossbow',weapon:'crossbow',available:true},
    };
  }

  addPlayer(ws) {
    if (Object.keys(this.players).length >= MAX_PLAYERS) return null;
    const id = 'p' + this.nextId++;
    const spawns = [
      [0,1.7,0],[18,1.7,10],[-18,1.7,-10],[35,1.7,-18],[-35,1.7,18],
      [45,1.7,5],[-45,1.7,-5],[0,1.7,22],[0,1.7,-22],[-50,1.7,0],[50,1.7,0]
    ];
    const sp = spawns[Math.floor(Math.random()*spawns.length)];
    this.players[id] = {
      ws, id,
      name:    'Player'+this.nextId,  // fallback if no name sent
      char:    'doctor',  // default — overridden by JOIN message
      x: sp[0], y: sp[1], z: sp[2],
      rotY:    0,
      hp:      100,
      weapon:  'crowbar',
      kills:   0,
      deaths:  0,
      xp:      0,
      rank:    1,
      alive:   true,
      crouching: false,
      moving:  false,       // ← NEW: leg animation flag
      sprinting: false,     // ← NEW: sprint flag
    };
    if (!this.adminId) this.adminId = id;
    return id;
  }

  removePlayer(id) {
    delete this.players[id];
    if (this.adminId === id) {
      const remaining = Object.keys(this.players);
      this.adminId = remaining.length > 0 ? remaining[0] : null;
    }
  }

  isAdmin(id)         { return id === this.adminId; }
  getPlayer(id)       { return this.players[id]; }
  getPlayerCount()    { return Object.keys(this.players).length; }

  updatePlayer(id, data) {
    if (!this.players[id]) return;
    const allowed = [
      'x','y','z','rotY','hp','weapon','alive',
      'name','char','crouching','moving','sprinting'
    ];
    allowed.forEach(k => {
      if (data[k] !== undefined) this.players[id][k] = data[k];
    });
  }

  damagePlayer(targetId, amount, attackerId) {
    const p = this.players[targetId];
    if (!p || !p.alive) return null;
    p.hp = Math.max(0, p.hp - amount);
    if (p.hp === 0) {
      p.alive = false;
      p.deaths++;
      const a = this.players[attackerId];
      if (a) { a.kills++; a.xp += 100; a.rank = Math.floor(a.xp/500)+1; }
      return 'DEAD';
    }
    return 'HIT';
  }

  respawnPlayer(id) {
    const p = this.players[id];
    if (!p) return;
    const spawns = [[0,0],[8,8],[-8,8],[8,-8],[-8,-8],[0,12],[-12,0],[12,0]];
    const sp = spawns[Math.floor(Math.random()*spawns.length)];
    p.hp=100; p.alive=true;
    p.x=sp[0]; p.y=1.7; p.z=sp[1];
    p.weapon='crowbar';
  }

  toggleDoor(id) {
    if (!this.doors[id]) this.doors[id] = {id, open:false};
    this.doors[id].open = !this.doors[id].open;
    return this.doors[id];
  }

  takePickup(id, playerId) {
    const pk = this.pickups[id];
    if (!pk || !pk.available) return null;
    pk.available = false;
    setTimeout(() => { if(this.pickups[id]) this.pickups[id].available=true; }, 10000);
    return pk;
  }

  getSnapshot() {
    return {
      players: Object.values(this.players).map(p => ({
        id:        p.id,
        name:      p.name,
        char:      p.char,
        x:         p.x,
        y:         p.y,
        z:         p.z,
        rotY:      p.rotY,
        hp:        p.hp,
        weapon:    p.weapon,
        alive:     p.alive,
        kills:     p.kills,
        deaths:    p.deaths,
        rank:      p.rank,
        crouching: p.crouching,
        moving:    p.moving,     // ← sent to all clients for leg animation
        sprinting: p.sprinting,  // ← sent for faster leg animation
      }))
    };
  }
}

module.exports = GameState;