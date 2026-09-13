"""
VTU 2022 Scheme – 4th Semester Curriculum Database
Branches: CS (Computer Science), IS (Information Science), AIML (AI & ML)

Subject structure:
  code        : Official VTU subject code
  name        : Full subject name
  credits     : L:T:P credit structure (total)
  type        : Theory / Lab / Project
  branches    : which branches this subject appears in
"""

CURRICULUM = {
    # ─── CS & IS COMMON SUBJECTS ──────────────────────────────────────────────
    "22CS42": {
        "name": "Design and Analysis of Algorithms",
        "credits": 3,
        "type": "Theory",
        "branches": ["CS", "IS"],
    },
    "22CS43": {
        "name": "Microcontrollers and Embedded Systems",
        "credits": 3,
        "type": "Theory",
        "branches": ["CS"],
    },
    "22IS43": {
        "name": "Microcontrollers and Embedded Systems",
        "credits": 3,
        "type": "Theory",
        "branches": ["IS"],
    },
    "22CS44": {
        "name": "Operating Systems",
        "credits": 3,
        "type": "Theory",
        "branches": ["CS", "IS"],
    },
    "22CS45": {
        "name": "Software Engineering and Project Management",
        "credits": 3,
        "type": "Theory",
        "branches": ["CS"],
    },
    "22IS45": {
        "name": "Software Engineering and Project Management",
        "credits": 3,
        "type": "Theory",
        "branches": ["IS"],
    },
    "22CS46": {
        "name": "Computer Organization and Architecture",
        "credits": 3,
        "type": "Theory",
        "branches": ["CS", "IS"],
    },
    # Electives (Universal Elective / Professional Elective – choose one)
    "22CSD47": {
        "name": "Fundamentals of Compiler Design (Department Elective)",
        "credits": 3,
        "type": "Theory",
        "branches": ["CS"],
    },
    "22ISD47": {
        "name": "Fundamentals of Compiler Design (Department Elective)",
        "credits": 3,
        "type": "Theory",
        "branches": ["IS"],
    },
    # Open Elective (common to all branches in 4th sem)
    "22CS48X": {
        "name": "Open Elective – CS",
        "credits": 3,
        "type": "Theory",
        "branches": ["CS"],
    },
    "22IS48X": {
        "name": "Open Elective – IS",
        "credits": 3,
        "type": "Theory",
        "branches": ["IS"],
    },
    # Labs
    "22CSL48": {
        "name": "Design and Analysis of Algorithms Lab",
        "credits": 1,
        "type": "Lab",
        "branches": ["CS"],
    },
    "22ISL48": {
        "name": "Design and Analysis of Algorithms Lab",
        "credits": 1,
        "type": "Lab",
        "branches": ["IS"],
    },
    "22CSL49": {
        "name": "Operating Systems Lab",
        "credits": 1,
        "type": "Lab",
        "branches": ["CS"],
    },
    "22ISL49": {
        "name": "Operating Systems Lab",
        "credits": 1,
        "type": "Lab",
        "branches": ["IS"],
    },
    # Additional mandatory 4th sem subjects (CS/IS)
    "22UH49": {
        "name": "Universal Human Values",
        "credits": 1,
        "type": "Theory",
        "branches": ["CS", "IS", "AIML"],
    },

    # ─── AIML SPECIFIC SUBJECTS ───────────────────────────────────────────────
    "22AI41": {
        "name": "Design and Analysis of Algorithms",
        "credits": 3,
        "type": "Theory",
        "branches": ["AIML"],
    },
    "22AI42": {
        "name": "Probability, Statistics and Queuing Theory",
        "credits": 3,
        "type": "Theory",
        "branches": ["AIML"],
    },
    "22AI43": {
        "name": "Database Management Systems",
        "credits": 3,
        "type": "Theory",
        "branches": ["AIML"],
    },
    "22AI44": {
        "name": "Operating Systems",
        "credits": 3,
        "type": "Theory",
        "branches": ["AIML"],
    },
    "22AI45": {
        "name": "Computer Vision",
        "credits": 3,
        "type": "Theory",
        "branches": ["AIML"],
    },
    "22AID46": {
        "name": "Department Elective – AIML",
        "credits": 3,
        "type": "Theory",
        "branches": ["AIML"],
    },
    "22AIL47": {
        "name": "DAA Lab",
        "credits": 1,
        "type": "Lab",
        "branches": ["AIML"],
    },
    "22AIL48": {
        "name": "Computer Vision Lab",
        "credits": 1,
        "type": "Lab",
        "branches": ["AIML"],
    },

    # ─── COMMON MANDATORY (all three branches, 4th sem) ───────────────────────
    "22CIV49": {
        "name": "Constitution of India and Professional Ethics",
        "credits": 1,
        "type": "Theory",
        "branches": ["CS", "IS", "AIML"],
    },
}

# ─── SUBJECT CODE ALIASES ──────────────────────────────────────────────────────
# Some marksheets print codes without leading zeros or with minor variants.
# Map them to canonical codes.
ALIASES: dict[str, str] = {
    "22CS 42": "22CS42",
    "22CS 43": "22CS43",
    "22IS 43": "22IS43",
    "22CS 44": "22CS44",
    "22CS 45": "22CS45",
    "22IS 45": "22IS45",
    "22CS 46": "22CS46",
    "22AI 41": "22AI41",
    "22AI 42": "22AI42",
    "22AI 43": "22AI43",
    "22AI 44": "22AI44",
    "22AI 45": "22AI45",
}


def resolve_code(raw: str) -> str:
    """Normalize a raw subject code extracted from OCR."""
    cleaned = raw.strip().upper().replace(" ", "").replace("-", "")
    if cleaned in CURRICULUM:
        return cleaned
    # Try alias map
    spaced = raw.strip().upper()
    if spaced in ALIASES:
        return ALIASES[spaced]
    return cleaned


def get_subject(code: str) -> dict | None:
    """Return the curriculum entry for a subject code, or None if not found."""
    canonical = resolve_code(code)
    return CURRICULUM.get(canonical)


def all_codes_for_branch(branch: str) -> list[str]:
    """Return all subject codes that belong to the given branch."""
    branch = branch.upper()
    return [code for code, info in CURRICULUM.items() if branch in info["branches"]]
