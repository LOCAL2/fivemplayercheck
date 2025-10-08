@echo off
echo Starting FiveM Player Checker...
echo.
echo This version uses CORS proxy service!
echo No backend server required!
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting Vite Development Server...
call npm run dev
echo.
pause