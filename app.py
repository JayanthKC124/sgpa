"""
SGP Calculator – Flask Backend (File Server Only)
==================================================
All OCR, matching, grading and SGPA logic runs in the browser (JS).
This server only serves static files — no API key needed.

Routes:
  GET  /           → index.html
  GET  /src/*      → JS modules
  GET  /api/health → {"status": "ok"}
"""

import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)


@app.route("/src/<path:filename>")
def serve_src(filename):
    return send_from_directory("src", filename)


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n  SGP Calculator running at http://localhost:{port}\n")
    print("  No API key needed — OCR runs locally in your browser.\n")
    app.run(host="0.0.0.0", port=port, debug=False)
