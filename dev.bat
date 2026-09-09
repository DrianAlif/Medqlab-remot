@echo off
title MEDQLAB Portal - Hot Reload Dev Mode
echo ========================================================
echo   MEDQLAB Portal (Hot Reload Development Mode)
echo ========================================================
echo.
echo 1. Menjalankan Backend API (Port 3030)...
start "MEDQLAB Backend (Port 3030)" cmd /k "node server.js"

echo 2. Menjalankan Frontend Vite Hot Reload (Port 5173)...
echo.
echo Buka browser di: http://localhost:5173
echo Perubahan / hapus file akan langsung ter-update otomatis!
echo.
cd frontend
call npm.cmd run dev
