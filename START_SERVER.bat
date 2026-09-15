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
    echo  Run these commands first:
    echo    python -m venv .venv
    echo    .venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

REM ── Start server ─────────────────────────────────────────────────────────────
echo  Starting server...
echo  No API key needed - OCR runs locally in your browser.
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
