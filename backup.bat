@chcp 65001 >nul
@echo off
title Backup - Dental Clinic System
mode con: cols=70 lines=20
color 0B

REM ============================================================
REM  Dental Clinic System - Backup Utility
REM  Copies data, config, and local DB files to Backups folder
REM  Keeps the most recent 30 backup copies
REM ============================================================

set "ROOT=%~dp0"
cd /d "%ROOT%"

set "BACKUP_DIR=%ROOT%Backups"
set "TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_PATH=%BACKUP_DIR%\backup_%TIMESTAMP%"

echo.
echo  ========================================================
echo    النسخ الاحتياطي - نظام إدارة عيادة الأسنان
echo  ========================================================
echo.

if not exist "%BACKUP_DIR%" (
  mkdir "%BACKUP_DIR%"
  echo  Created backup folder.
)

echo  Creating backup ...
echo  Path: %BACKUP_PATH%
echo.

mkdir "%BACKUP_PATH%" 2>nul

REM Copy data and config files
if exist "%ROOT%config.json" copy "%ROOT%config.json" "%BACKUP_PATH%\" >nul
if exist "%ROOT%.env" copy "%ROOT%.env" "%BACKUP_PATH%\" >nul
if exist "%ROOT%package.json" copy "%ROOT%package.json" "%BACKUP_PATH%\" >nul

REM Copy local database if present
if exist "%ROOT%data" xcopy "%ROOT%data" "%BACKUP_PATH%\data\" /E /I /Y >nul
if exist "%ROOT%*.db" copy "%ROOT%*.db" "%BACKUP_PATH%\" >nul
if exist "%ROOT%*.sqlite" copy "%ROOT%*.sqlite" "%BACKUP_PATH%\" >nul

REM Copy local Ollama models if present in project folder
if exist "%ROOT%models" xcopy "%ROOT%models" "%BACKUP_PATH%\models\" /E /I /Y >nul

echo  [OK] Backup created successfully.
echo  Path: %BACKUP_PATH%
echo.

REM Keep only the latest 30 backups
setlocal enabledelayedexpansion
set "COUNT=0"
for /f "delims=" %%d in ('dir /b /ad /o-n "%BACKUP_DIR%\backup_*" 2^>nul') do (
  set /a COUNT+=1
  if !COUNT! gtr 30 (
    rmdir /s /q "%BACKUP_DIR%\%%d" 2>nul
  )
)
endlocal

echo  Keeping the latest 30 backups only.
echo.
echo  Press any key to exit ...
pause >nul
