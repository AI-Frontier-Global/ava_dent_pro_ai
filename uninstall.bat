@echo off
chcp 65001 >nul 2>&1
title إزالة النظام - نظام إدارة عيادة الأسنان
mode con: cols=70 lines=22
color 0C

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo.
echo  ═══════════════════════════════════════════
echo    إزالة نظام إدارة عيادة الأسنان
echo  ═══════════════════════════════════════════
echo.
echo  هذا الملف سيقوم بإزالة النظام من جهازك.
echo.
echo  تحذير: سيتم حذف جميع ملفات النظام والبيانات المحلية.
echo  ينصح بإنشاء نسخة احتياطية قبل المتابعة (backup.bat).
echo.
echo  ملاحظة: لن يتم إزالة Node.js أو Ollama لأنهما قد
echo  يكونان مفيدَين لبرامج أخرى على جهازك.
echo.
echo  ─────────────────────────────────────────────
echo.
set /p CONFIRM="هل أنت متأكد؟ (نعم/لا): "

if /i not "%CONFIRM%"=="نعم" (
  echo.
  echo  تم إلغاء العملية. لم يتم حذف أي شيء.
  pause
  exit /b
)

echo.
echo  جاري الإزالة...

REM إيقاف العمليات الجارية
taskkill /f /im node.exe 2>nul
taskkill /f /im ollama.exe 2>nul

timeout /t 2 >nul

REM حذف مجلد node_modules
if exist "%ROOT%node_modules" (
  rmdir /s /q "%ROOT%node_modules"
  echo  [OK] تم حذف مكتبات npm.
)

REM حذف مجلد dist
if exist "%ROOT%dist" (
  rmdir /s /q "%ROOT%dist"
  echo  [OK] تم حذف ملفات الإنتاج.
)

REM حذف البيانات المحلية
if exist "%ROOT%data" (
  rmdir /s /q "%ROOT%data"
  echo  [OK] تم حذف قاعدة البيانات المحلية.
)

REM حذف النسخ الاحتياطية
if exist "%ROOT%Backups" (
  rmdir /s /q "%ROOT%Backups"
  echo  [OK] تم حذف النسخ الاحتياطية.
)

echo.
echo  ═══════════════════════════════════════════
echo    تمت إزالة النظام بنجاح.
echo  ═══════════════════════════════════════════
echo.
echo  لإزالة Node.js: لوحة التحكم ← البرامج ← إزالة Node.js
echo  لإزالة Ollama: لوحة التحكم ← البرامج ← إزالة Ollama
echo.
pause
