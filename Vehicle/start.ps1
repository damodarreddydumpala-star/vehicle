# Vehicle Service Centre Management System PowerShell Launcher
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "       APEX VEHICLE SERVICE CENTRE MANAGEMENT SYSTEM" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/"
    Exit 1
}

Write-Host "[OK] Node.js detected." -ForegroundColor Green
Write-Host "Starting Vehicle Service Centre server at http://localhost:3000..." -ForegroundColor Yellow
Write-Host ""

Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000/index.html"
} | Out-Null

node "$PSScriptRoot\server.js"
