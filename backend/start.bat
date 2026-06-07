@echo off
echo Starting Merchant Collection System...
echo.

start "Backend Service" cmd /k "cd /d C:\Users\L2604\IdeaProjects\untitled1\merchant collection && node backend/server.js"
start "Frontend Service" cmd /k "cd /d C:\Users\L2604\IdeaProjects\untitled1\merchant collection && npm start"

echo.
echo Services started successfully!
echo Frontend: http://localhost:8080
echo Backend: http://localhost:3000
echo.
pause
