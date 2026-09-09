@echo off
title MEDQLAB Remote Client & Interface Manager
echo ========================================================
echo   MEDQLAB Remote Client & Interface Manager (shadcn/ui)
echo ========================================================
echo.

if not exist frontend\dist (
  echo Membangun frontend React ^& shadcn UI...
  cd frontend
  call npm run build
  cd ..
)

echo Membuka aplikasi di browser (http://localhost:3030)...
start http://localhost:3030
echo.
echo Server berjalan di port 3030.
echo Jangan tutup jendela command prompt ini selama web digunakan.
echo Tekan Ctrl + C untuk menghentikan server.
echo.
node server.js
pause
