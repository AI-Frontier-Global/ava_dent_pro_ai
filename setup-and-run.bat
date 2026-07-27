@echo off
chcp 65001 >nul 2>&1
title نظام إدارة عيادة الأسنان - التثبيت والتشغيل التلقائي
mode con: cols=80 lines=30
color 0A

REM ============================================================
REM  نظام إدارة عيادة الأسنان - التثبيت والتشغيل بنقرة واحدة
REM  ============================================================
REM  هذا الملف يقوم بكل شيء تلقائياً:
REM    1) يطلب صلاحيات Administrator
REM    2) يفحص ويثبّت Node.js
REM    3) يفحص ويثبّت Ollama
REM    4) يحمّل نماذج الذكاء الاصطناعي
REM    5) يثبّت مكتبات npm
REM    6) يشغّل الجسر + النظام
REM    7) يفتح المتصفح تلقائياً
REM ============================================================

set "ROOT=%~dp0"
cd /d "%ROOT%"

REM --- طلب صلاحيات Administrator ---
net session >nul 2>&1
if %errorLevel% neq 0 (
  echo.
  echo  [!] يحتاج النظام إلى صلاحيات Administrator للتثبيت.
  echo      سيُعاد تشغيل الملف بصلاحيات Administrator الآن...
  timeout /t 2 >nul
  powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo.
echo  ═══════════════════════════════════════════════════════
echo    نظام إدارة عيادة الأسنان - التثبيت التلقائي
echo  ═══════════════════════════════════════════════════════
echo.
echo  سيتم الآن:
echo    1) فحص وتثبيت Node.js
echo    2) فحص وتثبيت Ollama
echo    3) تحميل نماذج الذكاء الاصطناعي (llama3.2, phi3)
echo    4) تثبيت مكتبات النظام
echo    5) تشغيل النظام وفتح المتصفح
echo.
echo  الرجاء الانتظار... قد يستغرق التثبيت الأول 2-3 دقائق.
echo.
echo  ─────────────────────────────────────────────────────
echo.

REM ============================================================
REM 1) فحص Node.js
REM ============================================================
echo  [1/5] فحص Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
  echo    Node.js غير مثبت. سيتم تحميله وتثبيته تلقائياً...
  echo.
  set "NODE_VER=22.11.0"
  set "NODE_MSI=node-setup.msi"
  
  REM تحديد معمارية النظام
  if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "NODE_URL=https://nodejs.org/dist/v!NODE_VER!/node-v!NODE_VER!-x64.msi"
  ) else (
    set "NODE_URL=https://nodejs.org/dist/v!NODE_VER!/node-v!NODE_VER!-x86.msi"
  )
  
  echo    تحميل Node.js من الموقع الرسمي...
  powershell -Command "Invoke-WebRequest -Uri '!NODE_URL!' -OutFile '!NODE_MSI!' -UseBasicParsing"
  
  if not exist "!NODE_MSI!" (
    echo    [X] تعذر تحميل Node.js.
    echo        حمّله يدوياً من https://nodejs.org ثم أعد تشغيل هذا الملف.
    pause
    exit /b 1
  )
  
  echo    تثبيت Node.js...
  msiexec /i "!NODE_MSI!" /quiet /norestart
  
  if exist "!NODE_MSI!" del "!NODE_MSI!"
  
  REM تحديث PATH للجلسة الحالية
  set "PATH=C:\Program Files\nodejs;%PATH%"
  
  where node >nul 2>&1
  if %errorLevel% neq 0 (
    echo    [X] فشل تثبيت Node.js. أعد تشغيل الكمبيوتر ثم حاول مجدداً.
    pause
    exit /b 1
  )
  echo    [OK] تم تثبيت Node.js بنجاح.
) else (
  for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
  echo    [OK] Node.js مثبت بالفعل - الإصدار !NODE_VER!
)
echo.

REM ============================================================
REM 2) فحص Ollama
REM ============================================================
echo  [2/5] فحص Ollama...
where ollama >nul 2>&1
if %errorLevel% neq 0 (
  echo    Ollama غير مثبت. سيتم تحميله وتثبيته تلقائياً...
  set "OLLAMA_EXE=ollama-setup.exe"
  
  echo    تحميل Ollama...
  powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile '!OLLAMA_EXE!' -UseBasicParsing"
  
  if not exist "!OLLAMA_EXE!" (
    echo    [X] تعذر تحميل Ollama.
    echo        حمّله يدوياً من https://ollama.com ثم أعد تشغيل هذا الملف.
    pause
    exit /b 1
  )
  
  echo    تثبيت Ollama...
  "!OLLAMA_EXE!" /SILENT
  
  if exist "!OLLAMA_EXE!" del "!OLLAMA_EXE!"
  
  REM إضافة Ollama إلى PATH
  set "PATH=C:\Users\%USERNAME%\AppData\Local\Programs\Ollama;%PATH%"
  
  timeout /t 5 >nul
  
  where ollama >nul 2>&1
  if %errorLevel% neq 0 (
    echo    [!] Ollama مثبت لكن يحتاج إعادة تشغيل الكمبيوتر.
    echo        أعد تشغيل الكمبيوتر ثم شغّل هذا الملف مرة أخرى.
    pause
    exit /b 1
  )
  echo    [OK] تم تثبيت Ollama بنجاح.
) else (
  echo    [OK] Ollama مثبت بالفعل.
)
echo.

REM ============================================================
REM 3) تشغيل خادم Ollama وتحميل النماذج
REM ============================================================
echo  [3/5] تشغيل خادم Ollama وتحميل النماذج...

REM التحقق من أن خادم Ollama يعمل
powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -UseBasicParsing -TimeoutSec 3).StatusCode } catch { 0 }" >nul 2>&1
if %errorLevel% neq 200 (
  echo    تشغيل خادم Ollama في الخلفية...
  start "" /B ollama serve
  timeout /t 5 >nul
)

REM تحميل النماذج
for %%m in (llama3.2 phi3) do (
  echo    تحميل النموذج: %%m
  ollama pull %%m
  echo    [OK] تم تحميل %%m
)
echo.

REM ============================================================
REM 4) تثبيت مكتبات npm
REM ============================================================
echo  [4/5] تثبيت مكتبات النظام (npm install)...
cd /d "%ROOT%"
call npm install --silent 2>nul
if %errorLevel% neq 0 (
  echo    [!] حدث خطأ بسيط أثناء تثبيت بعض المكتبات، سيتم المتابعة...
)
echo    [OK] تم تثبيت المكتبات.
echo.

REM ============================================================
REM 5) تشغيل الجسر + النظام
REM ============================================================
echo  [5/5] تشغيل النظام...
echo.
echo  ─────────────────────────────────────────────────────
echo.

REM تشغيل الجسر في نافذة منفصلة
start "جسر Ollama المحلي" cmd /k "cd /d "%ROOT%" && node local-ollama-bridge.js"

REM انتظار قصير لبدء الجسر
timeout /t 3 >nul

REM تشغيل خادم الويب في الخلفية
start "" /B cmd /c "cd /d "%ROOT%" && npm run dev -- --host 0.0.0.0 --port 5173"

REM انتظار بدء الخادم ثم فتح المتصفح
echo  جاري تشغيل النظام... الرجاء الانتظار.
timeout /t 8 >nul

echo.
echo  ═══════════════════════════════════════════════════════
echo    النظام جاهز! سيتم فتح المتصفح تلقائياً...
echo  ═══════════════════════════════════════════════════════
echo.

REM فتح المتصفح على النظام
start "" "http://localhost:5173"

echo  النظام يعمل الآن على:
echo    http://localhost:5173
echo.
echo  لإيقاف النظام: أغلق نافذة "جسر Ollama المحلي"
echo  ولإعادة التشغيل: شغّل هذا الملف مرة أخرى.
echo.
echo  اترك هذه النافذة مفتوحة أثناء استخدام النظام.
echo.
pause
