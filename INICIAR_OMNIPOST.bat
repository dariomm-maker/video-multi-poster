@echo off
title OmniPost - Servidor Local
echo ========================================================
echo        INICIANDO OMNIPOST MULTI-PUBLISHER
echo ========================================================
echo.
set "PATH=C:\Aplicaciones;C:\Aplicaciones\Git\cmd;%PATH%"
cd /d "C:\Users\dario\.gemini\antigravity\scratch\video-multi-poster"

echo 🌐 Abriendo tu navegador en http://localhost:3000 ...
start "" "http://localhost:3000"

echo 🚀 Arrancando servidor de OmniPost...
echo (Manten esta ventana abierta mientras uses la aplicacion)
echo.
npm run dev
pause
