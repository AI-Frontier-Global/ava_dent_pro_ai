@echo off
chcp 65001 >nul 2>&1
title Smile Clinic - Local Bridge Setup
setlocal EnableDelayedExpansion

echo.
echo ============================================================
echo   عيادة سمايل - إعداد الجسر المحلي للذكاء الاصطناعي
echo   Smile Clinic - Local AI Bridge Setup
echo ============================================================
echo.

REM ------ المتغيرات ------
set "BRIDGE_DIR=%~dp0"
set "BRIDGE_DIR=%BRIDGE_DIR:~0,-1%"
set "BRIDGE_FILE=%BRIDGE_DIR%\local-ollama-bridge.js"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_NAME=SmileClinicBridge.lnk"
set "NODE_MIN_VERSION=18"

REM ------ فحص وجود ملف الجسر ------
if not exist "%BRIDGE_FILE%" (
    echo [ERROR] ملف local-ollama-bridge.js غير موجود في هذا المجلد.
    echo         ضع هذا الملف في نفس مجلد setup-bridge.bat
    echo.
    pause
    exit /b 1
)

REM ------ فحص Node.js ------
echo [1/4] فحص Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo         Node.js غير موجود. جاري التحميل والتثبيت الصامت...
    goto :INSTALL_NODE
) else (
    for /f "tokens=* delims=" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
    echo         Node.js موجود: !NODE_VER!
    goto :CHECK_OLLAMA
)

:INSTALL_NODE
REM تحميل Node.js LTS وتثبيته بصمت عبر PowerShell
set "NODE_URL=https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi"
set "NODE_INSTALLER=%TEMP%\node-install.msi"

echo         تحميل Node.js من الموقع الرسمي...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_INSTALLER%' -UseBasicParsing; Write-Host '        تم التحميل بنجاح' } catch { Write-Host '        فشل التحميل: ' $_.Exception.Message; exit 1 }"

if %ERRORLEVEL% NEQ 0 (
    echo         [ERROR] فشل تحميل Node.js.
    echo         يرجى تثبيت Node.js يدوياً من https://nodejs.org
    pause
    exit /b 1
)

echo         تثبيت Node.js بصمت...
msiexec /i "%NODE_INSTALLER%" /qn /norestart
if %ERRORLEVEL% NEQ 0 (
    echo         [ERROR] فشل تثبيت Node.js.
    pause
    exit /b 1
)

REM تحديث PATH للجلسة الحالية
set "PATH=%ProgramFiles%\nodejs;%PATH%"
del "%NODE_INSTALLER%" >nul 2>&1
echo         تم تثبيت Node.js بنجاح.

:CHECK_OLLAMA
echo.
echo [2/4] فحص Ollama...
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo         Ollama غير موجود. جاري التحميل...
    set "OLLAMA_URL=https://ollama.com/download/OllamaSetup.exe"
    set "OLLAMA_INSTALLER=%TEMP%\OllamaSetup.exe"
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '!OLLAMA_URL!' -OutFile '!OLLAMA_INSTALLER!' -UseBasicParsing } catch { Write-Host '        فشل التحميل: ' $_.Exception.Message; exit 1 }"
    if !ERRORLEVEL! NEQ 0 (
        echo         [WARNING] فشل تحميل Ollama. يمكنك تثبيته لاحقاً من ollama.com
    ) else (
        echo         تثبيت Ollama بصمت...
        "!OLLAMA_INSTALLER!" /S
        del "!OLLAMA_INSTALLER!" >nul 2>&1
        echo         تم تثبيت Ollama.
    )
) else (
    echo         Ollama موجود.
)

REM ------ تثبيت حزم npm ------
echo.
echo [3/4] تثبيت الحزم المطلوبة (express, cors, localtunnel)...
cd /d "%BRIDGE_DIR%"
call npm install express cors localtunnel --silent 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo         [WARNING] قد تحتاج لتشغيل npm install يدوياً.
) else (
    echo         تم تثبيت الحزم بنجاح.
)

REM ------ إنشاء اختصار في Startup ------
echo.
echo [4/4] إنشاء اختصار التشغيل التلقائي...
set "VBS_SCRIPT=%TEMP%\create_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%STARTUP_DIR%\%SHORTCUT_NAME%" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%SystemRoot%\system32\cmd.exe" >> "%VBS_SCRIPT%"
echo oLink.Arguments = "/c node ""%BRIDGE_FILE%""" >> "%VBS_SCRIPT%"
echo oLink.WorkingDirectory = "%BRIDGE_DIR%" >> "%VBS_SCRIPT%"
echo oLink.WindowStyle = 7 >> "%VBS_SCRIPT%"
echo oLink.Description = "Smile Clinic Local AI Bridge" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"
cscript //nologo "%VBS_SCRIPT%" >nul 2>&1
del "%VBS_SCRIPT%" >nul 2>&1

if exist "%STARTUP_DIR%\%SHORTCUT_NAME%" (
    echo         تم إنشاء اختصار في مجلد بدء التشغيل.
    echo         سيعمل الجسر تلقائياً عند تشغيل الجهاز.
) else (
    echo         [WARNING] تعذر إنشاء الاختصار.
)

REM ------ تشغيل الجسر في الخلفية ------
echo.
echo ============================================================
echo   تشغيل الجسر المحلي الآن...
echo ============================================================
start /b cmd /c "node local-ollama-bridge.js"

echo.
echo   تم! الجسر المحلي يعمل الآن على http://localhost:3001
echo   سيعمل تلقائياً عند تشغيل الجهاز في كل مرة.
echo.
echo   عد إلى نظام العيادة واضغط "تحديث الحالة" في الإعدادات.
echo.
echo   هذا الملف يمكن إغلاقه الآن بأمان.
echo.
pause
exit /b 0
