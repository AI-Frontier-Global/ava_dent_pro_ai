@chcp 65001 >nul
@echo off
title Dental Clinic System - Auto Setup and Run
mode con: cols=80 lines=30
color 0A

REM ============================================================
REM  Dental Clinic Management System - One-Click Setup
REM  Auto-installs: Node.js, Ollama, AI models, npm packages
REM  Then runs the bridge + web server and opens the browser
REM ============================================================

set "ROOT=%~dp0"
cd /d "%ROOT%"

REM --- Request Administrator privileges ---
net session >nul 2>&1
if %errorLevel% neq 0 (
  echo.
  echo  [!] Administrator privileges are required for installation.
  echo      Restarting this file as Administrator...
  timeout /t 2 >nul
  powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo.
echo  ========================================================
echo    نظام إدارة عيادة الأسنان - التثبيت التلقائي
echo  ========================================================
echo.
echo  1) Node.js
echo  2) Ollama
echo  3) llama3.2, phi3
echo  4) npm
echo  5) Bridge + Web Server
echo.
echo  2-3
echo.
echo  --------------------------------------------------------
echo.

REM ============================================================
REM 1) Check Node.js
REM ============================================================
echo  [1/5] Node.js ...
where node >nul 2>&1
if %errorLevel% neq 0 (
  echo    Node.js not found. Downloading and installing...
  echo.
  set "NODE_VER=22.11.0"
  set "NODE_MSI=node-setup.msi"

  if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "NODE_URL=https://nodejs.org/dist/v!NODE_VER!/node-v!NODE_VER!-x64.msi"
  ) else (
    set "NODE_URL=https://nodejs.org/dist/v!NODE_VER!/node-v!NODE_VER!-x86.msi"
  )

  echo    Downloading Node.js ...
  powershell -Command "Invoke-WebRequest -Uri '!NODE_URL!' -OutFile '!NODE_MSI!' -UseBasicParsing"

  if not exist "!NODE_MSI!" (
    echo    [X] Node.js download failed.
    echo        https://nodejs.org
    pause
    exit /b 1
  )

  echo    Installing Node.js ...
  msiexec /i "!NODE_MSI!" /quiet /norestart

  if exist "!NODE_MSI!" del "!NODE_MSI!"

  set "PATH=C:\Program Files\nodejs;%PATH%"

  where node >nul 2>&1
  if %errorLevel% neq 0 (
    echo    [X] Node.js installation failed. Restart your computer and try again.
    pause
    exit /b 1
  )
  echo    [OK] Node.js installed.
) else (
  for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
  echo    [OK] Node.js - !NODE_VER!
)
echo.

REM ============================================================
REM 2) Check Ollama
REM ============================================================
echo  [2/5] Ollama ...
where ollama >nul 2>&1
if %errorLevel% neq 0 (
  echo    Ollama not found. Downloading and installing...
  set "OLLAMA_EXE=ollama-setup.exe"

  echo    Downloading Ollama ...
  powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile '!OLLAMA_EXE!' -UseBasicParsing"

  if not exist "!OLLAMA_EXE!" (
    echo    [X] Ollama download failed.
    echo        https://ollama.com
    pause
    exit /b 1
  )

  echo    Installing Ollama ...
  "!OLLAMA_EXE!" /SILENT

  if exist "!OLLAMA_EXE!" del "!OLLAMA_EXE!"

  set "PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Ollama;%PATH%"

  timeout /t 5 >nul

  where ollama >nul 2>&1
  if %errorLevel% neq 0 (
    echo    [!] Ollama installed. Restart your computer then run this file again.
    pause
    exit /b 1
  )
  echo    [OK] Ollama installed.
) else (
  echo    [OK] Ollama.
)
echo.

REM ============================================================
REM 3) Start Ollama server and pull models
REM ============================================================
echo  [3/5] Ollama server + models ...

powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -UseBasicParsing -TimeoutSec 3).StatusCode } catch { 0 }" >nul 2>&1
if %errorLevel% neq 200 (
  echo    Starting Ollama server ...
  start "" /B ollama serve
  timeout /t 5 >nul
)

for %%m in (llama3.2 phi3) do (
  echo    Pulling model: %%m
  ollama pull %%m
  echo    [OK] %%m
)
echo.

REM ============================================================
REM 4) npm install
REM ============================================================
echo  [4/5] npm install ...
cd /d "%ROOT%"
call npm install --silent 2>nul
if %errorLevel% neq 0 (
  echo    [!] Minor npm warning, continuing...
)
echo    [OK] npm packages installed.
echo.

REM ============================================================
REM 5) Run bridge + web server
REM ============================================================
echo  [5/5] Starting system ...
echo.
echo  --------------------------------------------------------
echo.

start "Ollama Bridge" cmd /k "cd /d "%ROOT%" && node local-ollama-bridge.js"

timeout /t 3 >nul

start "" /B cmd /c "cd /d "%ROOT%" && npm run dev -- --host 0.0.0.0 --port 5173"

echo  Starting ... please wait.
timeout /t 8 >nul

echo.
echo  ========================================================
echo    System is ready! Opening browser...
echo  ========================================================
echo.

start "" "http://localhost:5173"

echo  System is running at:
echo    http://localhost:5173
echo.
echo  Close the "Ollama Bridge" window to stop.
echo  Run this file again to restart.
echo.
echo  Keep this window open while using the system.
echo.
pause
