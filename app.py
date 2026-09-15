"""
SGP Calculator – Flask Backend
================================
Routes:
  GET  /                  → serve the frontend SPA
  POST /api/calculate     → upload marksheet + semester/branch, get SGPA result
  GET  /api/health        → health check

Environment Variables:
  GEMINI_API_KEY   (required) – Google Gemini API key
  PORT             (optional, default 5000)
"""

import logging
import os
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from extractor import extract_from_file

# ─── Load .env file if present (before anything uses os.environ) ──────────────
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _, _v = _line.partition("=")
            os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

@app.route("/src/<path:filename>")
def serve_src(filename):
    return send_from_directory("src", filename)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXT = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}

# ─── Curriculum data (mirrors src/data/curriculum.js) ─────────────────────────
# Structure: CURRICULUM[scheme][semKey][branch] = {label, subjects, totalCredits}
# subjects = {CODE: {name, credits, type, variant(opt), baseCode(opt)}}

def _sub(name, credits, typ="theory", variant=False):
    return {"name": name, "credits": credits, "type": typ,
            **({"variant": True} if variant else {})}

CURRICULUM = {
  "2022": {

    # ── PHYSICS CYCLE (1st Sem) ── from screenshot ────────────────────────────
    "P_CYCLE": {
      "CSE": {
        "label": "Physics Cycle – CSE Stream (CSE/ISC/BT)",
        "totalCredits": 20,
        "subjects": {
          "BMATSx01":  _sub("Mathematics – I/II for CSE Stream",                          4, variant=True),
          "BPHYSx02":  _sub("Applied Physics for CSE Stream",                            4, variant=True),
          "BPOPSx03":  _sub("Principles of Programming Using C",                         3, variant=True),
          "BESCKx04x": _sub("Engineering Science Course – I/II",                         3, variant=True),
          "BETCKx05x": _sub("Emerging Technology Course – I/II / Prog. Language Course", 3, variant=True),
          "BPLCKx05x": _sub("Emerging Technology Course – I/II / Prog. Language Course", 3, variant=True),
          "BENGKx06":  _sub("Communicative English / Professional Writing Skills",       1, variant=True),
          "BPWSKx06":  _sub("Communicative English / Professional Writing Skills",       1, variant=True),
          "BKSKKx07":  _sub("Samskrutika Kannada / Balake Kannada",                      1, variant=True),
          "BKBKKx07":  _sub("Balake Kannada",                                            1, variant=True),
          "BICOKx07":  _sub("Indian Constitution",                                       1, variant=True),
          "BIDTKx58":  _sub("Innovation and Design Thinking",                            1, variant=True),
          "BSFHKx58":  _sub("Scientific Foundations of Health",                          1, variant=True),
          "BPHYLx09":  _sub("Applied Physics Lab",                                       1, "lab", variant=True),
          "BPOPLx10":  _sub("Programming in C Lab",                                      1, "lab", variant=True),
          "BCPLKx59":  _sub("Constitution & Professional Ethics / NSS/PE/Yoga",          0, "activity", variant=True),
        },
      },
    },

    # ── CHEMISTRY CYCLE (2nd Sem) ── from screenshot ──────────────────────────
    "C_CYCLE": {
      "CSE": {
        "label": "Chemistry Cycle – CSE Stream (CSE/ISC/BT)",
        "totalCredits": 20,
        "subjects": {
          "BMATSx01":  _sub("Mathematics – I/II for CSE Stream",                          4, variant=True),
          "BCHYSx02":  _sub("Applied Chemistry for CSE Stream",                          4, variant=True),
          "BCEDKx03":  _sub("Computer-Aided Engineering Drawing",                        3, variant=True),
          "BESCKx04x": _sub("Engineering Science Course – I/II",                         3, variant=True),
          "BETCKx05x": _sub("Emerging Technology Course – I/II / Prog. Language Course", 3, variant=True),
          "BPLCKx05x": _sub("Emerging Technology Course – I/II / Prog. Language Course", 3, variant=True),
          "BENGKx06":  _sub("Communicative English / Professional Writing Skills",       1, variant=True),
          "BPWSKx06":  _sub("Communicative English / Professional Writing Skills",       1, variant=True),
          "BKSKKx07":  _sub("Samskrutika Kannada / Balake Kannada",                      1, variant=True),
          "BKBKKx07":  _sub("Balake Kannada",                                            1, variant=True),
          "BICOKx07":  _sub("Indian Constitution",                                       1, variant=True),
          "BIDTKx58":  _sub("Innovation and Design Thinking",                            1, variant=True),
          "BSFHKx58":  _sub("Scientific Foundations of Health",                          1, variant=True),
          "BCHYLx09":  _sub("Applied Chemistry Lab",                                     1, "lab", variant=True),
          "BCPLKx59":  _sub("Constitution & Professional Ethics / NSS/PE/Yoga",          0, "activity", variant=True),
        },
      },
    },

    # ── 3rd SEMESTER ── from screenshot ──────────────────────────────────────
    "3": {
      "CSE": {
        "label": "3rd Semester – CS/IS/AIML",
        "totalCredits": 21,
        "subjects": {
          "BCS301":  _sub("Mathematics for Computer Science",        4),
          "BCS302":  _sub("Digital Design & Computer Organization",  4),
          "BCS303":  _sub("Operating Systems",                       4),
          "BCS304":  _sub("Data Structures and Applications",        3),
          "BCSL305": _sub("Data Structures Lab",                     1, "lab"),
          "BCS306x": _sub("ESC/ETC/PLC",                             3, variant=True),
          "BSCK307": _sub("Social Connect and Responsibility",       1),
          "BCS358x": _sub("Ability Enhancement Course / Skill Enhancement Course – III", 1, variant=True),
          "BNSK359": _sub("NSS / PE / Yoga",                         0, "activity"),
          "BPEK359": _sub("NSS / PE / Yoga",                         0, "activity"),
          "BYOK359": _sub("NSS / PE / Yoga",                         0, "activity"),
        },
      },
    },

    # ── 4th SEMESTER ── correct data ─────────────────────────────────────────
    "4": {
      "CSE": {
        "label": "4th Semester – CS/IS/AIML",
        "totalCredits": 19,
        "subjects": {
          "BCS401":  _sub("Analysis & Design of Algorithms",                          3),
          "BCS402":  _sub("Microcontrollers",                                         4),
          "BCS403":  _sub("Database Management Systems",                              4),
          "22CS42":  _sub("Analysis & Design of Algorithms",                          3),
          "22CS43":  _sub("Microcontrollers",                                         4),
          "22IS43":  _sub("Microcontrollers",                                         4),
          "22CS44":  _sub("Database Management Systems",                              4),
          "22CSL45": _sub("Analysis & Design of Algorithms Lab",                      1, "lab"),
          "BCSL404": _sub("Analysis & Design of Algorithms Lab",                      1, "lab"),
          "BCS405":  _sub("ESC / ETC / PLC",                                          3, variant=True),
          "BCS456":  _sub("Ability Enhancement / Skill Enhancement Course-IV",        1, variant=True),
          "BBOK407": _sub("Biology for Engineers",                                    2),
          "BUHK408": _sub("Universal Human Values Course",                           1),
          "BNSK459": _sub("NSS / PE / Yoga",                                         0, "activity"),
          "BPEK459": _sub("NSS / PE / Yoga",                                         0, "activity"),
          "BYOK459": _sub("NSS / PE / Yoga",                                         0, "activity"),
        },
      },
    },

    # ── 5th SEMESTER ── from screenshot ──────────────────────────────────────
    "5": {
      "CSE": {
        "label": "5th Semester – CS/IS/AIML",
        "totalCredits": 21,
        "subjects": {
          "BCS501":  _sub("Software Engineering & Project Management",  3),
          "BCS502":  _sub("Computer Networks",                          4),
          "BCS503":  _sub("Theory of Computation",                      4),
          "BCSL504": _sub("Web Technology Lab",                         1, "lab"),
          "BCS515x": _sub("Professional Elective Course",               3, variant=True),
          "BCS586":  _sub("Mini Project",                               2, "project"),
          "BRMK557": _sub("Research Methodology and IPR",               3),
          "BNSK558": _sub("Environmental Studies",                       2),
          "BNSK559": _sub("NSS / PE / Yoga",                            0, "activity"),
          "BPEK559": _sub("NSS / PE / Yoga",                            0, "activity"),
          "BYOK559": _sub("NSS / PE / Yoga",                            0, "activity"),
        },
      },
    },

    # ── 6th SEMESTER ── from screenshot ──────────────────────────────────────
    "6": {
      "CSE": {
        "label": "6th Semester – CS/IS/AIML",
        "totalCredits": 19,
        "subjects": {
          "BCS601":  _sub("Cloud Computing (Open Stack/Google)",                      4),
          "BCS602":  _sub("Machine Learning",                                         4),
          "BCS613x": _sub("Professional Elective Course",                             3, variant=True),
          "BCS654x": _sub("Open Elective Course",                                     3, variant=True),
          "BCS685":  _sub("Project Phase I",                                          2, "project"),
          "BCSL606": _sub("Machine Learning Lab",                                     1, "lab"),
          "BCS617x": _sub("Ability Enhancement Course / Skill Development Course V",  1, variant=True),
          "BNSK659": _sub("NSS / PE / Yoga",                                          0, "activity"),
          "BPEK659": _sub("NSS / PE / Yoga",                                          0, "activity"),
          "BYOK659": _sub("NSS / PE / Yoga",                                          0, "activity"),
        },
      },
    },

    # ── 7th SEMESTER ── from screenshot ──────────────────────────────────────
    "7": {
      "CSE": {
        "label": "7th Semester – CS/IS/AIML",
        "totalCredits": 20,
        "subjects": {
          "BCS701":  _sub("Internet of Things",               4),
          "BCS702":  _sub("Parallel Computing",               4),
          "BCS703":  _sub("Cryptography & Network Security",  4),
          "BCS714x": _sub("Professional Elective Course",     3, variant=True),
          "BCS755x": _sub("Open Elective Course",             3, variant=True),
          "BCS786":  _sub("Major Project Phase-II",           6, "project"),
          "BNSK759": _sub("NSS / PE / Yoga",                  0, "activity"),
          "BPEK759": _sub("NSS / PE / Yoga",                  0, "activity"),
          "BYOK759": _sub("NSS / PE / Yoga",                  0, "activity"),
        },
      },
    },

    # ── 8th SEMESTER ── from screenshot ──────────────────────────────────────
    "8": {
      "CSE": {
        "label": "8th Semester – CS/IS/AIML",
        "totalCredits": 16,
        "subjects": {
          "BCS801x": _sub("Professional Elective (Online Courses) – Only through NPTEL", 3, variant=True),
          "BCS802x": _sub("Open Elective (Online Courses) – Only through NPTEL",         3, variant=True),
          "BCS803":  _sub("Internship (Industry/Research)",                              10, "project"),
        },
      },
    },

  }, # end 2022
}

SEMESTER_LABELS = {
    "P_CYCLE": "Physics Cycle (1st Sem)",
    "C_CYCLE": "Chemistry Cycle (2nd Sem)",
    "3": "3rd Semester", "4": "4th Semester",
    "5": "5th Semester", "6": "6th Semester",
    "7": "7th Semester", "8": "8th Semester",
}


# ─── Grading ──────────────────────────────────────────────────────────────────
GRADE_SCALE = [
    (90, 100, "O",  10), (80, 89, "A+", 9), (70, 79, "A",  8),
    (60,  69, "B+",  7), (50, 59, "B",  6), (40, 49, "C",  5),
    (0,   39, "F",   0),
]

def _get_grade(marks):
    if marks is None:
        return "—", 0, False
    try:
        m = float(marks)
    except (TypeError, ValueError):
        return "—", 0, False
    for lo, hi, grade, gp in GRADE_SCALE:
        if lo <= m <= hi:
            return grade, gp, gp > 0
    return "F", 0, False


# ─── Subject Matching ─────────────────────────────────────────────────────────

def _edit_distance(a, b):
    if len(a) < len(b):
        return _edit_distance(b, a)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for ca in a:
        curr = [prev[0] + 1]
        for j, cb in enumerate(b):
            curr.append(min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (0 if ca == cb else 1)))
        prev = curr
    return prev[-1]


def _get_variant_bases(subjects: dict) -> list:
    return [c for c, s in subjects.items() if s.get("variant")]


def _match_subject(raw_code: str, subjects: dict):
    """
    Match OCR code against a specific semester's subject dict.
    1. Exact  2. Variant prefix  3. Fuzzy (edit dist ≤ 2, len diff ≤ 1)
    """
    code = raw_code.strip().upper().replace(" ", "").replace("-", "")

    # 1. Exact
    if code in subjects:
        return code, subjects[code]

    variant_bases = _get_variant_bases(subjects)

    # 2. Variant prefix
    for base in variant_bases:
        base_norm = base.rstrip("x").rstrip("X")
        if code.startswith(base_norm):
            # Find canonical base in subjects
            for k in subjects:
                if k.rstrip("x").rstrip("X") == base_norm:
                    return k, subjects[k]

    # 3. Fuzzy — also try stripping trailing variant letter (A/B/C/D/E)
    # e.g. BDSL456B → strip trailing B → BDSL456, compare vs BCS456
    code_base = code[:-1] if (len(code) > 4 and code[-1] in "ABCDE") else code

    best_key, best_dist = None, 999
    for known in subjects.keys():
        known_norm = known.rstrip("x").rstrip("X")
        cmp = code_base if code_base != code else code
        if abs(len(cmp) - len(known_norm)) > 1:
            continue
        d = _edit_distance(cmp, known_norm)
        if d < best_dist:
            best_dist = d
            best_key = known

    if best_dist <= 2 and best_key:
        return best_key, subjects[best_key]

    return None, None


# ─── Result Builder ───────────────────────────────────────────────────────────

def _build_result(raw_subjects, filename, scheme, sem_key, branch):
    sem_data = CURRICULUM.get(scheme, {}).get(sem_key, {}).get(branch)
    if not sem_data:
        return None, f"No curriculum found for {scheme} / {sem_key} / {branch}"

    subjects_db = sem_data["subjects"]
    matched, unmatched = [], []

    for item in raw_subjects:
        raw_code = item.get("code", "")
        marks    = item.get("marks")
        canon, info = _match_subject(raw_code, subjects_db)

        if info:
            grade, gp, passed = _get_grade(marks)
            credits       = info["credits"]
            credit_points = credits * gp
            matched.append({
                "code": canon, "name": info["name"], "marks": marks,
                "credits": credits, "type": info["type"],
                "grade": grade, "grade_point": gp,
                "credit_points": credit_points,
                "passed": passed,
                "status": "Passed" if passed else "Failed",
            })
        else:
            unmatched.append({"rawCode": raw_code, "marks": marks})

    total_credits       = sum(s["credits"] for s in matched if s["credits"] > 0)
    total_credit_points = sum(s["credit_points"] for s in matched if s["credits"] > 0)
    sgpa = round(total_credit_points / total_credits, 2) if total_credits > 0 else 0.0

    result = {
        "subjects":            matched,
        "unmatched_subjects":  unmatched,
        "total_credits":       total_credits,
        "total_credit_points": total_credit_points,
        "sgpa":                sgpa,
        "passed_count":        sum(1 for s in matched if s["passed"]),
        "failed_count":        sum(1 for s in matched if not s["passed"]),
        "subject_count":       len(matched),
        "filename":            filename,
        "scheme":              scheme,
        "semester":            SEMESTER_LABELS.get(sem_key, sem_key),
        "branch":              sem_data["label"],
        "status":              "partial" if unmatched else "success",
    }
    return result, None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _allowed(filename):
    from pathlib import Path
    return Path(filename).suffix.lower() in ALLOWED_EXT


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/calculate", methods=["POST"])
def calculate():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename."}), 400
    if not _allowed(file.filename):
        return jsonify({"error": "Unsupported file type. Upload a PDF, JPG, or PNG."}), 415

    file_bytes = file.read()
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        return jsonify({"error": "File too large. Max 10 MB."}), 413

    # Semester + branch selection from form
    scheme  = request.form.get("scheme",  "2022")
    sem_key = request.form.get("semester","4")
    branch  = request.form.get("branch",  "CSE")

    # Build OCR prompt for this specific semester
    sem_data = CURRICULUM.get(scheme, {}).get(sem_key, {}).get(branch)
    valid_codes = list(sem_data["subjects"].keys()) if sem_data else []

    log.info("Processing %s | scheme=%s sem=%s branch=%s | valid_codes=%d",
             file.filename, scheme, sem_key, branch, len(valid_codes))

    try:
        raw_subjects = extract_from_file(file_bytes, file.filename, valid_codes)
    except EnvironmentError as e:
        log.error("API key error: %s", e)
        return jsonify({"error": str(e)}), 503
    except ValueError as e:
        log.error("Parse error: %s", e)
        return jsonify({"error": f"Could not read marksheet: {e}"}), 422
    except RuntimeError as e:
        log.error("Gemini model error: %s", e)
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        log.exception("Extraction failed unexpectedly")
        return jsonify({"error": f"Failed to process marksheet: {e}"}), 500

    log.info("Extracted %d raw subjects: %s",
             len(raw_subjects), [s["code"] for s in raw_subjects])

    if not raw_subjects:
        return jsonify({
            "error": "No subjects found in the marksheet. "
                     "Make sure you selected the correct semester and uploaded a clear VTU marksheet."
        }), 422

    result, err = _build_result(raw_subjects, file.filename, scheme, sem_key, branch)
    if err:
        return jsonify({"error": err}), 400

    log.info("SGPA=%s | matched=%d unmatched=%d",
             result["sgpa"], len(result["subjects"]), len(result["unmatched_subjects"]))
    return jsonify(result), 200


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"\n  SGP Calculator running at http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
