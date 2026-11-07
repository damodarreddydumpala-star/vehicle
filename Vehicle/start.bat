@echo off
title Vehicle Service Centre Management System
color 0E

echo ====================================================================
echo        APEX VEHICLE SERVICE CENTRE MANAGEMENT SYSTEM
echo ====================================================================
echo.
echo Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected.
echo Database: SQLite (service_centre.db)
echo Starting server at http://localhost:3000 ...
echo.

:: Automatically open default browser after 1.5 seconds
start "" timeout /t 2 /nobreak >nul & start http://localhost:3000/index.html

:: Start Node server
node server.js

pause
