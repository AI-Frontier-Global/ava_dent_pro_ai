@echo off
chcp 65001 >nul 2>&1
title النسخ الاحتياطي - نظام إدارة عيادة الأسنان
mode con: cols=70 lines=20
color 0B

set "ROOT=%~dp0"
cd /d "%ROOT%"

set "BACKUP_DIR=%ROOT%Backups"
set "TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_PATH=%BACKUP_DIR%\backup_%TIMESTAMP%"

echo.
echo  ═══════════════════════════════════════════
echo    النسخ الاحتياطي - نظام إدارة عيادة الأسنان
echo  ═══════════════════════════════════════════
echo.

if not exist "%BACKUP_DIR%" (
  mkdir "%BACKUP_DIR%"
  echo  تم إنشاء مجلد النسخ الاحتياطية.
)

echo  جاري إنشاء نسخة احتياطية...
echo  المسار: %BACKUP_PATH%
echo.

mkdir "%BACKUP_PATH%" 2>nul

REM نسخ ملفات البيانات والإعدادات
if exist "%ROOT%config.json" copy "%ROOT%config.json" "%BACKUP_PATH%\" >nul
if exist "%ROOT%.env" copy "%ROOT%.env" "%BACKUP_PATH%\" >nul
if exist "%ROOT%package.json" copy "%ROOT%package.json" "%BACKUP_PATH%\" >nul

REM نسخ قاعدة البيانات المحلية إن وُجدت
if exist "%ROOT%data" xcopy "%ROOT%data" "%BACKUP_PATH%\data\" /E /I /Y >nul
if exist "%ROOT%*.db" copy "%ROOT%*.db" "%BACKUP_PATH%\" >nul
if exist "%ROOT%*.sqlite" copy "%ROOT%*.sqlite" "%BACKUP_PATH%\" >nul

REM نسخ نماذج Ollama المحفوظة محلياً (إن وُجدت في مجلد المشروع)
if exist "%ROOT%models" xcopy "%ROOT%models" "%BACKUP_PATH%\models\" /E /I /Y >nul

echo  [OK] تم إنشاء النسخة الاحتياطية بنجاح.
echo  المسار: %BACKUP_PATH%
echo.

REM الاحتفاظ بآخر 30 نسخة فقط
set "COUNT=0"
for /f "delims=" %%d in ('dir /b /ad /o-n "%BACKUP_DIR%\backup_*" 2^>nul') do (
  set /a COUNT+=1
  if !COUNT! gtr 30 (
    rmdir /s /q "%BACKUP_DIR%\%%d" 2>nul
  )
)

echo  يتم الاحتفاظ بآخر 30 نسخة احتياطية فقط.
echo.
echo  اضغط أي مفتاح للخروج...
pause >nul
