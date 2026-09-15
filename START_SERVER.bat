@echo off
title Smart SGPA Calculator - Server
color 1F
cls

echo.
echo  ============================================================
echo   Smart SGPA Calculator  ^|  VTU 2022 Scheme  ^|  All Semesters
echo  ============================================================
echo.

REM ── Check if venv exists ──────────────────────────────────────────────────────
if not exist ".venv\Scripts\python.exe" (
    echo  [ERROR] Virtual environment not found.
    echo  Run this first:
    echo    python -m venv .venv
    echo    .venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

REM ── Load API key from .env if present ─────────────────────────────────────────
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        if /i "%%A"=="GEMINI_API_KEY" (
            if not "%%B"=="" (
                set "GEMINI_API_KEY=%%B"
            )
        )
    )
)

REM ── Ask for API key if still not set ─────────────────────────────────────────
if "%GEMINI_API_KEY%"=="" (
    echo  You need a FREE Gemini API key to use OCR extraction.
    echo  Get one at: https://aistudio.google.com/app/apikey
    echo.
    set /p GEMINI_API_KEY="  Paste your Gemini API key and press Enter: "
    echo.
    REM Save it to .env so you don't have to enter it again
    if not "%GEMINI_API_KEY%"=="" (
        echo GEMINI_API_KEY=%GEMINI_API_KEY%> .env
        echo  [OK] API key saved to .env ^(auto-loaded next time^)
        echo.
    )
)

if "%GEMINI_API_KEY%"=="" (
    echo  [WARNING] No API key entered. OCR will not work.
    echo  You can still run the server - upload will show an error.
    echo.
)

REM ── Start server ─────────────────────────────────────────────────────────────
echo  Starting server...
echo.
echo  ============================================================
echo   Open your browser and go to:
echo.
echo     http://localhost:5000
echo.
echo   Press Ctrl+C to stop the server.
echo  ============================================================
echo.

.venv\Scripts\python.exe app.py

echo.
echo  Server stopped.
pause
