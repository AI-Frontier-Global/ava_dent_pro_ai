@chcp 65001 >nul
@echo off
title Uninstall - Dental Clinic System
mode con: cols=70 lines=22
color 0C

REM ============================================================
REM  Dental Clinic System - Uninstall Utility
REM  Stops processes and removes project files and local data
REM  Does NOT remove Node.js or Ollama (may be used by others)
REM ============================================================

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo.
echo  ========================================================
echo    إزالة نظام إدارة عيادة الأسنان
echo  ========================================================
echo.
echo  This will remove the system from your computer.
echo.
echo  WARNING: All system files and local data will be deleted.
echo  It is recommended to run backup.bat first.
echo.
echo  Note: Node.js and Ollama will NOT be removed.
echo.
echo  --------------------------------------------------------
echo.
set /p CONFIRM="Are you sure? (yes/no): "

if /i not "%CONFIRM%"=="yes" (
  echo.
  echo  Cancelled. Nothing was deleted.
  pause
  exit /b
)

echo.
echo  Removing ...

REM Stop running processes
taskkill /f /im node.exe 2>nul
taskkill /f /im ollama.exe 2>nul

timeout /t 2 >nul

REM Remove node_modules
if exist "%ROOT%node_modules" (
  rmdir /s /q "%ROOT%node_modules"
  echo  [OK] Removed npm packages.
)

REM Remove dist
if exist "%ROOT%dist" (
  rmdir /s /q "%ROOT%dist"
  echo  [OK] Removed build files.
)

REM Remove local data
if exist "%ROOT%data" (
  rmdir /s /q "%ROOT%data"
  echo  [OK] Removed local database.
)

REM Remove backups
if exist "%ROOT%Backups" (
  rmdir /s /q "%ROOT%Backups"
  echo  [OK] Removed backups.
)

echo.
echo  ========================================================
echo    System removed successfully.
echo  ========================================================
echo.
echo  To remove Node.js: Control Panel - Programs - Uninstall Node.js
echo  To remove Ollama: Control Panel - Programs - Uninstall Ollama
echo.
pause
