@echo off
REM ── SGP Calculator – Windows Quick Start ─────────────────────────────────────
echo.
echo  SGP Calculator – VTU 2022 Scheme
echo  ----------------------------------

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found. Install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

REM Create virtualenv if not present
if not exist ".venv" (
    echo  Creating virtual environment...
    python -m venv .venv
)

REM Activate
call .venv\Scripts\activate.bat

REM Install dependencies
echo  Installing dependencies...
pip install -q -r requirements.txt

REM Check API key
if "%GEMINI_API_KEY%"=="" (
    echo.
    echo  WARNING: GEMINI_API_KEY is not set!
    echo  Get a free key at: https://aistudio.google.com/app/apikey
    echo  Then run:  set GEMINI_API_KEY=your_key_here
    echo.
    set /p GEMINI_API_KEY="  Paste your Gemini API key here: "
)

echo.
echo  Starting server at http://localhost:5000
echo  Press Ctrl+C to stop.
echo.

python app.py
