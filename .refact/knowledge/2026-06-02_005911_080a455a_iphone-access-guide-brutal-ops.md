---
id: "c04bde08-9968-4efc-babc-68173bb746be"
title: "iPhone Access Guide - Brutal-Ops Network Setup"
kind: process
created: 2026-06-02
updated: 2026-06-02
review_after: 2026-08-31
status: active
tags: ["task-report", "completed", "domain:brutal-ops", "component:client-networking", "workflow:mobile-deployment", "workflow:network-configuration", "verification:ip-address-setup", "tool:safari", "mobile-access", "lan-multiplayer", "landscape-orientation", "permission-handling", "protocol:sse", "language:javascript", "entity:name", "entity:port"]
filenames: ["client/character.html", "client/game.html", "client/index.html", "server/server.js"]
links: ["9662ce65-8558-4f5f-8b77-b593b773c637"]
source_chat_id: "2fa86094-e2bb-48be-8bd1-4c4b315b85e1"
created_at: "2026-06-01T19:59:11.056322900+00:00"
summary: "📱 iPhone Access Guide - Brutal Ops"
description: "**✅ What Was Fixed**"
entities: ["name", "port", "char", "ipconfig", "ipconfig"]
related_files: ["client/character.html", "client/game.html", "client/index.html", "server/server.js"]
related_entities: ["char", "ipconfig", "name", "port"]
content_hash: "3a8093150966ed8238cca461976d1abb06c3b036c322a9a6a3d3e7c119c21bfc"
source_tool: "memories_add_enriched"
---

## 📱 iPhone Access Guide - Brutal Ops

### **✅ What Was Fixed**

All IP addresses updated to **192.168.1.5**:
- ✅ `client/game.html` - Line 145 (fallback IP)
- ✅ `client/index.html` - Line 147 (input field default) + Line 163 (fallback)

---

## 🚀 How to Play on iPhone

### **Step 1: Start Server on Your PC**

```bash
cd C:\Users\LENOVO\Desktop\Brutal-Ops
npm install
npm start
```

You should see:
```
Brutal-Ops server running on port 3000
Share this IP with friends on your WiFi to join
```

### **Step 2: Get Your PC's IP Address**

**On Windows, find your local IP:**
```bash
ipconfig
```

Look for "IPv4 Address" under your WiFi adapter. Example: `192.168.1.5`

**Make sure it's on same WiFi as iPhone!**

### **Step 3: Open on iPhone**

1. **Switch iPhone to landscape mode** (IMPORTANT!)
2. Open Safari browser
3. Enter URL:
   ```
   http://192.168.1.5:3000/client/game.html?name=YourName
   ```

**Or use character select page first:**
   ```
   http://192.168.1.5:3000/client/index.html
   ```
   - Enter player name
   - Server IP: `192.168.1.5`
   - Port: `3000`
   - Click "DEPLOY"

### **Step 4: Grant Permissions**

- ✅ Allow **Full Screen** when prompted
- ✅ **Rotate to Landscape** - the game requires landscape mode
- ✅ Safari will ask to access camera/location - tap "Allow"

---

## 🔧 Network Configuration Files

### **Files That Need 192.168.1.5:**

| File | Lines | What It Does |
|------|-------|--------------|
| `client/game.html` | 145 | Fallback IP when URL param missing |
| `client/index.html` | 147, 163 | Default input field + fallback |
| `client/character.html` | (if exists) | Same config |

### **Server-Side (Already Working):**

`server/server.js` line 47:
```javascript
server.listen(PORT, '0.0.0.0', () => { ... });
```
✅ Listens on ALL IPs (0.0.0.0), so it's accessible from iPhone

---

## 📋 URL Parameters (Optional)

You can pass parameters in the URL to customize:

```
http://192.168.1.5:3000/client/game.html?name=PLAYER1&ip=192.168.1.5&port=3000&char=robot
```

| Parameter | Default | Values |
|-----------|---------|--------|
| `name` | "Soldier" | Any text (player username) |
| `ip` | 192.168.1.5 | Your PC's local IP |
| `port` | 3000 | Server port |
| `char` | "robot" | robot, doctor, businessman, zombie |

---

## ✅ Checklist Before Testing on iPhone

- [ ] Server running on PC (`npm start`)
- [ ] iPhone on **same WiFi** as PC
- [ ] iPhone rotated to **landscape**
- [ ] Correct IP address entered (192.168.1.5)
- [ ] Port is 3000
- [ ] Browser URL is: `http://192.168.1.5:3000/client/game.html`

---

## 🐛 Troubleshooting

### **"Can't connect / Loading forever"**
- Check PC IP: Run `ipconfig` on Windows
- Make sure iPhone is on **same WiFi network**
- PC firewall might block: Try disabling temporarily
- Try refreshing (pull down, release)

### **"Screen is black / Nothing shows"**
- Wait 3 seconds (game loading)
- Check console: Safari → Settings → Advanced → Web Inspector
- Rotate device to landscape
- Check browser console for errors

### **"Can connect but no multiplayer"**
- Make sure server console shows "Player connected"
- Check server running on port 3000
- Try a second browser tab to test second player

### **"Port 3000 already in use"**
```bash
# On Windows, kill the process:
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

---

## 🎮 iPhone Controls

### **Landscape Mode (Full Controls)**
- **Left side**: Movement joystick + crouch button
- **Right side**: Look around + fire + jump + reload
- **Grenades**: Green button (bottom right)
- **Use/Interact**: Blue button (right side)

### **Portrait Mode**
- ❌ Game disabled (shows rotation prompt)
- Need to rotate to landscape to play

---

## 🌐 Network Diagram

```
iPhone (Safari)
   ↓
   ↓ HTTP Request
   ↓ ws://192.168.1.5:3000
   ↓
[PC Server - 192.168.1.5:3000]
   ↓
   ↓ WebSocket Connection
   ↓
PC & iPhone communicate in real-time
```

---

## 📝 Changes Made

### **client/game.html**
```javascript
// OLD:
var HOST_IP = QP.get('ip') || '192.168.1.15';

// NEW:
var HOST_IP = QP.get('ip') || '192.168.1.5';
```

### **client/index.html**
```javascript
// Input field default:
<input id="ip" ... value="192.168.1.5" />

// Fallback if empty:
var ip = ... || '192.168.1.5';
```

---

## 🔒 Security Note

⚠️ **Local Network Only**
- This setup works only on local WiFi
- To play over internet, you'd need:
  - Port forwarding
  - HTTPS certificate
  - Public domain
  - (Not implemented yet)

---

## 🎯 Test Steps

1. Start server: `npm start`
2. Get PC IP: `ipconfig` → IPv4 Address
3. On iPhone Safari: `http://[YOUR_IP]:3000/client/index.html`
4. Enter player name
5. Check IP is correct
6. Click DEPLOY
7. Rotate to landscape
8. Click "JOIN GAME"
9. You should see the concrete arena!

---

## Summary

✅ **Network configured for 192.168.1.5**
✅ **All fallback IPs updated**
✅ **Server listens on all interfaces (0.0.0.0)**
✅ **Ready for iPhone access**

**To play on iPhone:**
1. Start server on PC
2. Find PC's IP (192.168.1.5 or similar)
3. On iPhone: `http://[PC_IP]:3000/client/game.html`
4. Rotate to landscape
5. Join game!
