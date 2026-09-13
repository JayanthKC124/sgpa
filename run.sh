#!/usr/bin/env bash
# ── SGP Calculator – Linux/macOS Quick Start ──────────────────────────────────
set -e
echo ""
echo " SGP Calculator – VTU 2022 Scheme"
echo " ----------------------------------"

# Create virtualenv if not present
if [ ! -d ".venv" ]; then
    echo " Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate
source .venv/bin/activate

# Install dependencies
echo " Installing dependencies..."
pip install -q -r requirements.txt

# Check API key
if [ -z "$GEMINI_API_KEY" ]; then
    echo ""
    echo " WARNING: GEMINI_API_KEY is not set!"
    echo " Get a free key at: https://aistudio.google.com/app/apikey"
    echo ""
    read -rp "  Paste your Gemini API key: " GEMINI_API_KEY
    export GEMINI_API_KEY
fi

echo ""
echo " Starting server at http://localhost:5000"
echo " Press Ctrl+C to stop."
echo ""

python app.py
