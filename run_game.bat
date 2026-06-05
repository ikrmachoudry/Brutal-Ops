@echo off
title BRUTAL OPS — LAUNCHER
color 0a
cls

echo.
echo  ██████╗ ██████╗ ██╗   ██╗████████╗ █████╗ ██╗      ██████╗ ██████╗ ███████╗
echo  ██╔══██╗██╔══██╗██║   ██║╚══██╔══╝██╔══██╗██║     ██╔═══██╗██╔══██╗██╔════╝
echo  ██████╔╝██████╔╝██║   ██║   ██║   ███████║██║     ██║   ██║██████╔╝███████╗
echo  ██╔══██╗██╔══██╗██║   ██║   ██║   ██╔══██║██║     ██║   ██║██╔═══╝ ╚════██║
echo  ██████╔╝██║  ██║╚██████╔╝   ██║   ██║  ██║███████╗╚██████╔╝██║     ███████║
echo  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝     ╚══════╝
echo.
echo  ============================================================
echo   MULTIPLAYER FPS  ^|  Three.js  ^|  WebSockets
echo  ============================================================
echo.

cd /d "%~dp0"

:: Check Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0c
    echo  [ERROR] Node.js not found. Download from https://nodejs.org
    pause
    exit /b 1
)

:: Install packages if needed
if not exist "node_modules" (
    echo  [SETUP] Installing packages...
    call npm install
)

:: ── KILL ALL CONFLICTING PORTS ──────────────────────────────
echo  [INFO] Clearing ports...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8181 "') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8080 "') do taskkill /f /pid %%a >nul 2>&1
timeout /t 2 /nobreak >nul

:: ── GET LOCAL IP ─────────────────────────────────────────────
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr "192.168"') do set LOCAL_IP=%%a
set LOCAL_IP=%LOCAL_IP: =%

:: ── START GAME SERVER ────────────────────────────────────────
echo  [SERVER] Starting WebSocket server on port 3000...
start "BRUTAL OPS SERVER" cmd /k "color 0b && title BRUTAL OPS SERVER && node server/server.js"
timeout /t 2 /nobreak >nul

:: ── START CLIENT ON PORT 8181 ────────────────────────────────
echo  [CLIENT] Starting game client on port 8181...
start "BRUTAL OPS CLIENT" cmd /k "color 09 && title BRUTAL OPS CLIENT && npx serve client -p 8181"
timeout /t 3 /nobreak >nul

:: ── OPEN BROWSER ─────────────────────────────────────────────
echo  [BROWSER] Opening game...
start "" "http://localhost:8181"

echo.
echo  ============================================================
echo   GAME IS RUNNING!
echo.
echo   YOUR PC:    http://localhost:8181
echo   iPHONE:     http://%LOCAL_IP%:8181
echo   SERVER WS:  ws://%LOCAL_IP%:3000
echo.
echo   On iPhone open Safari and type:
echo   http://%LOCAL_IP%:8181
echo.
echo   Server IP to enter in game: %LOCAL_IP%
echo   Port: 3000
echo  ============================================================
echo.
pause