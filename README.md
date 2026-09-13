# SGP Calculator – VTU 2022 Scheme

**Automatic SGPA calculator for VTU students.**
Upload your marksheet (PDF or image) → AI reads it → SGPA is calculated instantly.

---

## What it does

| Step | What happens |
|------|--------------|
| 1 | Student uploads their marksheet (PDF or JPG/PNG) |
| 2 | Google Gemini Vision reads the marksheet and extracts subject codes + marks |
| 3 | Each subject code is looked up in the built-in curriculum database |
| 4 | Credits are assigned automatically — **no manual entry needed** |
| 5 | Marks are converted to grades and grade points (VTU absolute grading) |
| 6 | Credit points = Credits × Grade Point |
| 7 | SGPA = Total Credit Points ÷ Total Credits |
| 8 | A clean dashboard shows subjects, marks, grades, credits, credit points, SGPA |

---

## Version 1 – Scope

- **Scheme:** 2022 (CBCS)
- **Semester:** 4th
- **Branches:** CS (Computer Science), IS (Information Science), AIML (Artificial Intelligence & ML)

---

## Grading System (VTU Absolute)

| Marks    | Grade | Grade Point |
|----------|-------|-------------|
| 90 – 100 | O     | 10          |
| 80 – 89  | A+    | 9           |
| 70 – 79  | A     | 8           |
| 60 – 69  | B+    | 7           |
| 55 – 59  | B     | 6           |
| 50 – 54  | C     | 5           |
| 40 – 49  | P     | 4           |
| 0 – 39   | F     | 0 (Fail)    |

---

## Project Structure

```
sgp-calculator/
├── app.py              ← Flask backend (routes, orchestration)
├── curriculum.py       ← Predefined subject codes, names, credits
├── extractor.py        ← Gemini Vision OCR module
├── grading.py          ← Grading logic + SGPA calculation
├── requirements.txt    ← Python dependencies
├── run.bat             ← Windows quick-start script
├── run.sh              ← Linux/macOS quick-start script
└── static/
    └── index.html      ← Single-page frontend dashboard
```

---

## Setup & Running

### Prerequisites

- Python 3.10+
- A free **Gemini API key** from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- *(For PDF support)* Install [Poppler](https://github.com/oschwartz10612/poppler-windows/releases) (Windows) or `sudo apt install poppler-utils` (Linux)

### Windows

```bat
set GEMINI_API_KEY=your_key_here
run.bat
```

### Linux / macOS

```bash
export GEMINI_API_KEY=your_key_here
chmod +x run.sh
./run.sh
```

Then open **http://localhost:5000** in your browser.

---

## API

### `POST /api/calculate`

Upload a marksheet file as `multipart/form-data` with field name `file`.

**Success Response (200)**
```json
{
  "sgpa": 8.12,
  "total_credits": 20,
  "earned_credits": 20,
  "total_credit_points": 162.5,
  "subjects": [
    {
      "code": "22CS42",
      "name": "Design and Analysis of Algorithms",
      "marks": 78,
      "credits": 3,
      "grade": "A",
      "grade_point": 8,
      "credit_points": 24,
      "status": "Pass"
    }
  ],
  "failed_subjects": [],
  "unmatched_subjects": []
}
```

---

## Notes

- Credits come exclusively from the curriculum database — students never enter them manually.
- Subjects whose codes are not found in the database are flagged as "Unmatched" and excluded from SGPA.
- Failed subjects (grade F / Ab) still count in total credits but contribute 0 grade points.
