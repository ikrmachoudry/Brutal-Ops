'use strict';
const { RESPAWN_TIME } = require('../config/server.config');
const WebSocket = require('ws');

class MessageRouter {
  constructor(gs, wss) { this.gs=gs; this.wss=wss; }

  handle(playerId, msg) {
    switch(msg.type) {

      case 'ADMIN_CHECK': {
        const amAdmin = this.gs.isAdmin(playerId);
        this.sendTo(playerId, {type: amAdmin ? 'ADMIN_YES' : 'ADMIN_NO'});
        break;
      }

      case 'JOIN': {
        this.gs.updatePlayer(playerId, {
          name: msg.name || 'Soldier',
          char: msg.char || 'doctor',
        });
        const amAdmin2 = this.gs.isAdmin(playerId);
        this.sendTo(playerId, {
          type:'JOINED', id:playerId, isAdmin:amAdmin2,
          doors:   this.gs.doors,
          pickups: Object.values(this.gs.pickups)
        });
        this.broadcast({type:'PLAYER_JOINED', id:playerId, name:msg.name});
        break;
      }

      case 'MOVE': {
        this.gs.updatePlayer(playerId, {
          x:         msg.x,
          y:         msg.y,
          z:         msg.z,
          rotY:      msg.rotY,
          crouching: msg.crouching || false,
          moving:    msg.moving    || false,
          sprinting: msg.sprinting || false,
          char:      msg.char      || 'doctor',
          weapon:    msg.weapon    || 'crowbar',
        });
        break;
      }

      case 'WEAPON_CHANGE': {
        this.gs.updatePlayer(playerId, {weapon:msg.weapon});
        break;
      }

      case 'SHOOT': {
        this.broadcast({
          type:'PLAYER_SHOT', from:playerId, weapon:msg.weapon,
          x:msg.x, y:msg.y, z:msg.z,
          dirX:msg.dirX, dirY:msg.dirY, dirZ:msg.dirZ
        });
        break;
      }

      case 'HIT': {
        const hitResult = this.gs.damagePlayer(msg.targetId, msg.damage, playerId);
        const hitTarget = this.gs.getPlayer(msg.targetId);
        if (hitResult === 'DEAD') {
          this.broadcast({
            type:       'PLAYER_DIED',
            id:         msg.targetId,
            killerId:   playerId,
            killerName: this.gs.getPlayer(playerId)?.name || 'Unknown',
            victimName: hitTarget?.name || 'Unknown',
          });
          setTimeout(() => {
            this.gs.respawnPlayer(msg.targetId);
            this.broadcast({type:'PLAYER_RESPAWNED', id:msg.targetId});
          }, RESPAWN_TIME);
        } else if (hitResult === 'HIT') {
          this.sendTo(msg.targetId, {
            type:'YOU_HIT', hp:hitTarget.hp, by:playerId
          });
        }
        break;
      }

      case 'GRENADE': {
        this.broadcast({
          type:'GRENADE_THROWN', from:playerId,
          x:msg.x, y:msg.y, z:msg.z,
          vx:msg.vx, vy:msg.vy, vz:msg.vz
        });
        break;
      }

      case 'GRENADE_EXPLODE': {
        const gr = msg.radius || 6;
        // Broadcast visual to all
        this.broadcast({type:'GRENADE_EXPLODE', x:msg.x, y:msg.y||0, z:msg.z, radius:gr});
        // Server-side damage ALL players in radius (including shooter)
        Object.keys(this.gs.players).forEach(pid => {
          const pp = this.gs.getPlayer(pid);
          if (!pp || !pp.alive) return;
          const dx=pp.x-msg.x, dy=(pp.y||0)-( msg.y||0), dz=pp.z-msg.z;
          const dist = Math.sqrt(dx*dx+dy*dy+dz*dz);
          if (dist < gr) {
            const dmg = Math.round(80*(1-dist/gr));
            if (dmg <= 0) return;
            const res = this.gs.damagePlayer(pid, dmg, playerId);
            if (res==='DEAD') {
              this.broadcast({
                type:'PLAYER_DIED', id:pid, killerId:playerId,
                killerName: this.gs.getPlayer(playerId)?.name || 'Unknown',
                victimName: pp.name
              });
              setTimeout(()=>{
                this.gs.respawnPlayer(pid);
                this.broadcast({type:'PLAYER_RESPAWNED', id:pid});
              }, RESPAWN_TIME);
            } else if (res==='HIT') {
              this.sendTo(pid, {type:'YOU_HIT', hp:this.gs.getPlayer(pid).hp, by:playerId});
            }
          }
        });
        break;
      }

      case 'DOOR_TOGGLE': {
        const toggledDoor = this.gs.toggleDoor(msg.doorId);
        if (toggledDoor)
          this.broadcast({type:'DOOR_STATE', doorId:msg.doorId, open:toggledDoor.open});
        break;
      }

      case 'PICKUP': {
        const pickedUp = this.gs.takePickup(msg.pickupId, playerId);
        if (pickedUp) {
          this.broadcast({type:'PICKUP_TAKEN', pickupId:msg.pickupId, by:playerId});
          setTimeout(() => {
            this.broadcast({type:'PICKUP_RESPAWN', pickupId:msg.pickupId});
          }, 10000);
        }
        break;
      }

      case 'FOOTSTEP': {
        const walker = this.gs.getPlayer(playerId);
        if (!walker) break;
        Object.keys(this.gs.players).forEach(pid => {
          if (pid === playerId) return;
          this.sendTo(pid, {
            type:'PLAYER_FOOTSTEP', from:playerId,
            x:walker.x, y:walker.y, z:walker.z,
            sprinting:walker.sprinting,
          });
        });
        break;
      }

      case 'LASER_BEAM': {
        this.broadcast({type:'LASER_BEAM', from:playerId,
          fx:msg.fx,fy:msg.fy,fz:msg.fz,tx:msg.tx,ty:msg.ty,tz:msg.tz});
        break;
      }

      case 'FART_CLOUD': {
        this.broadcast({type:'FART_CLOUD', from:playerId,
          x:msg.x, y:msg.y, z:msg.z, massive:msg.massive||false});
        break;
      }

      case 'GHOST_SPAWN': {
        this.broadcast({type:'GHOST_SPAWN', from:playerId,
          x:msg.x, y:msg.y, z:msg.z, dx:msg.dx, dz:msg.dz,
          name: this.gs.getPlayer(playerId)?.name || 'GHOST'});
        break;
      }

      case 'DEATH_EXPLOSION': {
        // Broadcast to all OTHER players only — sender already shows it locally
        this.broadcastExcept(playerId, {type:'DEATH_EXPLOSION', id:playerId, x:msg.x, y:msg.y, z:msg.z});
        break;
      }

      case 'POOP_SPAWN': {
        // client sends x,y,z — broadcast same
        this.broadcast({type:'POOP_SPAWN', from:playerId,
          x:msg.x, y:msg.y, z:msg.z});
        break;
      }

      case 'BULLET_MARK': {
        this.broadcast({type:'BULLET_MARK', from:playerId,
          x:msg.x, y:msg.y, z:msg.z,
          nx:msg.nx, ny:msg.ny, nz:msg.nz, wid:msg.wid||''});
        break;
      }

      case 'RPG_IMPACT': {
        this.broadcast({type:'RPG_IMPACT', x:msg.x, y:msg.y, z:msg.z});
        break;
      }

      case 'CHAT_MSG': {
        const chatPlayer = this.gs.getPlayer(playerId);
        this.broadcast({type:'CHAT_MSG', from:chatPlayer?.name || '?', text:(msg.text||'').slice(0,100)});
        break;
      }

      default: break;
    }
  }

  sendTo(id, data) {
    const p = this.gs.getPlayer(id);
    if (p?.ws?.readyState === WebSocket.OPEN) p.ws.send(JSON.stringify(data));
  }

  broadcastExcept(excludeId, data) {
    const msg = JSON.stringify(data);
    const excludePlayer = this.gs.getPlayer(excludeId);
    this.wss.clients.forEach(c => {
      if (c.readyState === WebSocket.OPEN && c !== excludePlayer?.ws) c.send(msg);
    });
  }

  broadcast(data) {
    const msg = JSON.stringify(data);
    this.wss.clients.forEach(c => {
      if (c.readyState === WebSocket.OPEN) c.send(msg);
    });
  }
}

module.exports = MessageRouter;