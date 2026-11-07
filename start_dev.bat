@echo off
title Retail Shop - Dev Mode
echo =========================================================
echo    Starting Dev Environment (Backend + Vite Dev Server)
echo =========================================================
echo.
start "Flask Backend (Port 5000)" cmd /k "cd backend && python app.py"
start "React Vite Dev (Port 3000)" cmd /k "cd frontend && npm run dev"
echo Both services launched in separate windows!
echo Backend:  http://127.0.0.1:5000
echo Frontend: http://localhost:3000
