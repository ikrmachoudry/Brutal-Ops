'use strict';

// ── BRUTAL OPS — MapLoader.js ─────────────────────────────────
// Central map registry. To add a new map:
//   1. Create client/js/maps/YourMap.js
//   2. Add one line: MapLoader.register('yourmap', YourMap);
//   3. Add <script src="js/maps/YourMap.js"> to game.html
// That's it. No other file needs to change.
// ------------------------------------------------------------

var MapLoader = (function(){
  var _maps   = {};
  var _active = null;

  return {
    // Called by each map file to register itself
    register: function(id, mapObj) {
      _maps[id] = mapObj;
    },

    // Called by game.html to load a map by id
    load: function(id, scene, colliders, dynCol, doorMeshes, doorStates, doorTimers) {
      var map = _maps[id];
      if (!map) { console.error('[MapLoader] Map not found:', id); return null; }
      map.init(scene, colliders, dynCol, doorMeshes, doorStates, doorTimers);
      _active = map;
      // Apply bounds to Physics
      if (typeof setMapBounds === 'function' && map.BOUNDS) {
        setMapBounds(map.BOUNDS);
      }
      console.log('[MapLoader] Loaded map:', id);
      return map;
    },

    // Get active map
    get: function() { return _active; },

    // Convenience passthrough
    getDoorStates: function() { return _active ? _active.getDoorStates() : {}; },
    openDoor:      function(id, open) { if (_active) _active.openDoor(id, open); },
    getFloorY:     function(x, z) { return _active ? _active.getFloorY(x, z) : null; },
    getAidBoxes:   function() { return _active ? _active.getAidBoxes() : []; },
    getBounds:     function() { return _active ? _active.BOUNDS : {minX:-41,maxX:41,minZ:-33,maxZ:33}; },
  };
})();

// Register maps here as they are added
// Each map file auto-registers itself at bottom — see VillaMap.js