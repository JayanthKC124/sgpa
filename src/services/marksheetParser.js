/**
 * marksheetParser.js
 * ==================
 * Parses raw OCR text to extract VTU subject codes and marks.
 * Runs 100% in the browser — no server call needed.
 */

import { CURRICULUM } from "../data/curriculum.js";

/**
 * Levenshtein edit distance between two strings.
 */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1];
    for (let j = 0; j < b.length; j++) {
      curr.push(Math.min(
        prev[j + 1] + 1,
        curr[j]     + 1,
        prev[j]     + (a[i] === b[j] ? 0 : 1)
      ));
    }
    prev.splice(0, prev.length, ...curr);
  }
  return prev[b.length];
}

/**
 * Normalise a subject code for comparison.
 */
function norm(code) {
  return String(code).toUpperCase().replace(/[\s\-]/g, "");
}

/**
 * Match a raw OCR code against the semester's subject dict.
 * Returns { code, subject } or null.
 */
function matchCode(rawCode, subjectsMap) {
  const n = norm(rawCode);

  // 1. Exact
  if (subjectsMap[n]) return { code: n, subject: subjectsMap[n] };

  // 2. Variant prefix — e.g. BCS405A → BCS405, BCS456B → BCS456
  const stripped = n.replace(/[A-E]$/, ""); // strip trailing A/B/C/D/E
  for (const [k, v] of Object.entries(subjectsMap)) {
    const kn = norm(k).replace(/X+$/, ""); // strip trailing X's (variant marker)
    if (stripped === kn || n === kn) return { code: k, subject: v };
  }

  // 3. Fuzzy (edit distance ≤ 2, length difference ≤ 1)
  let bestKey = null, bestDist = 999;
  for (const k of Object.keys(subjectsMap)) {
    const kn = norm(k).replace(/X+$/, "");
    const cmp = stripped.length >= n.length - 1 ? stripped : n;
    if (Math.abs(cmp.length - kn.length) > 1) continue;
    const d = editDistance(cmp, kn);
    if (d < bestDist) { bestDist = d; bestKey = k; }
  }
  if (bestDist <= 2 && bestKey) {
    return { code: bestKey, subject: subjectsMap[bestKey] };
  }

  return null;
}

/**
 * Parse raw OCR text and extract {code, marks} pairs.
 * Looks for patterns like:  BCS401   78   or   BCS401: 78
 */
function extractFromText(text) {
  const results = [];
  const seen    = new Set();

  // Match lines that contain a subject-code-like token and a number
  // Subject codes: 3–8 uppercase letters/digits, optionally ending in A/B/C/D/E
  const CODE_RE  = /\b([A-Z]{1,5}[0-9]{2,4}[A-Z0-9]{0,3})\b/g;
  const MARKS_RE = /\b(\d{1,3})\b/g;

  const lines = text.split("\n");
  for (const line of lines) {
    const uLine = line.toUpperCase().replace(/[oO]/g, match => /\d/.test(line[line.indexOf(match)-1] || '') ? '0' : match);

    // Find all code-like tokens
    const codeMatches = [...uLine.matchAll(CODE_RE)];
    if (!codeMatches.length) continue;

    // Find all numbers on the line
    const numMatches = [...uLine.matchAll(MARKS_RE)]
      .map(m => parseInt(m[1], 10))
      .filter(n => n >= 0 && n <= 100);

    for (const cm of codeMatches) {
      const raw = cm[1];
      // Must look like a real subject code: starts with B or has digit pattern
      if (!/^[A-Z]{1,5}[0-9]{2,4}/.test(raw)) continue;
      if (seen.has(raw)) continue;

      // Pick the most likely marks: largest number ≤ 100 on the line
      // (avoid matching the code digits themselves as marks)
      const codeDigits = raw.replace(/[^0-9]/g, "");
      const candidates = numMatches.filter(n => String(n) !== codeDigits && n <= 100);
      const marks = candidates.length > 0
        ? candidates.reduce((a, b) => Math.abs(b - 75) < Math.abs(a - 75) ? b : a) // closest to 75 heuristic
        : null;

      seen.add(raw);
      results.push({ code: raw, marks });
    }
  }

  return results;
}

/**
 * Parse a marksheet: extract codes + marks from OCR text,
 * match against curriculum, grade and calculate SGPA.
 *
 * @param {string} ocrText    - raw text from Tesseract
 * @param {string} scheme     - e.g. "2022"
 * @param {string} semKey     - e.g. "4"
 * @param {string} branch     - e.g. "CSE"
 * @returns {{ subjects, unmatched, totalCredits, totalCreditPoints, sgpa,
 *             passedCount, failedCount, subjectCount, semester, branch, scheme, status }}
 */
export function parseMarksheetText(ocrText, scheme, semKey, branch) {
  const semData = CURRICULUM?.[scheme]?.[semKey]?.[branch];
  if (!semData) {
    throw new Error(`No curriculum found for ${scheme} / ${semKey} / ${branch}`);
  }

  const subjectsMap = semData.subjects; // { CODE: {name, credits, type, ...} }
  const rawItems    = extractFromText(ocrText);

  const matched   = [];
  const unmatched = [];
  const usedKeys  = new Set();

  for (const item of rawItems) {
    const hit = matchCode(item.code, subjectsMap);
    if (hit && !usedKeys.has(hit.code)) {
      usedKeys.add(hit.code);
      const { grade, gradePoint, passed } = getGrade(item.marks);
      const credits      = hit.subject.credits;
      const creditPoints = credits * gradePoint;
      matched.push({
        code:         hit.code,
        name:         hit.subject.name,
        marks:        item.marks,
        credits,
        type:         hit.subject.type || "theory",
        grade,
        grade_point:  gradePoint,
        credit_points: creditPoints,
        passed,
        status:       passed ? "Passed" : "Failed",
      });
    } else if (!hit) {
      unmatched.push({ rawCode: item.code, marks: item.marks });
    }
  }

  // SGPA
  const totalCredits       = matched.reduce((s, x) => s + (x.credits > 0 ? x.credits : 0), 0);
  const totalCreditPoints  = matched.reduce((s, x) => s + (x.credits > 0 ? x.credit_points : 0), 0);
  const sgpa               = totalCredits > 0
    ? Math.round((totalCreditPoints / totalCredits) * 100) / 100
    : 0;

  const SEMESTER_LABELS = {
    P_CYCLE: "Physics Cycle (1st Sem)", C_CYCLE: "Chemistry Cycle (2nd Sem)",
    "3": "3rd Semester", "4": "4th Semester", "5": "5th Semester",
    "6": "6th Semester", "7": "7th Semester", "8": "8th Semester",
  };

  return {
    subjects:            matched,
    unmatched_subjects:  unmatched,
    total_credits:       totalCredits,
    total_credit_points: totalCreditPoints,
    sgpa,
    passed_count:  matched.filter(s => s.passed).length,
    failed_count:  matched.filter(s => !s.passed).length,
    subject_count: matched.length,
    semester:      SEMESTER_LABELS[semKey] || semKey,
    branch:        semData.label,
    scheme,
    status:        unmatched.length > 0 ? "partial" : "success",
  };
}

// ── VTU grading (inline, no import needed) ────────────────────────────────────
function getGrade(marks) {
  if (marks === null || marks === undefined)
    return { grade: "—", gradePoint: 0, passed: false };
  const m = Number(marks);
  if (isNaN(m)) return { grade: "—", gradePoint: 0, passed: false };
  if (m >= 90) return { grade: "O",  gradePoint: 10, passed: true };
  if (m >= 80) return { grade: "A+", gradePoint: 9,  passed: true };
  if (m >= 70) return { grade: "A",  gradePoint: 8,  passed: true };
  if (m >= 60) return { grade: "B+", gradePoint: 7,  passed: true };
  if (m >= 50) return { grade: "B",  gradePoint: 6,  passed: true };
  if (m >= 40) return { grade: "C",  gradePoint: 5,  passed: true };
  return         { grade: "F",  gradePoint: 0,  passed: false };
}
