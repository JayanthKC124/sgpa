/**
 * grading.js
 * ==========
 * Converts raw marks into VTU grade letters and grade points.
 *
 * Grading scale (VTU 2022 Scheme – Absolute):
 *   90–100  →  O   →  10
 *   80–89   →  A+  →  9
 *   70–79   →  A   →  8
 *   60–69   →  B+  →  7
 *   50–59   →  B   →  6
 *   40–49   →  C   →  5
 *   Below 40 → F   →  0
 */

/** @type {Array<{min:number, max:number, grade:string, point:number}>} */
const GRADE_SCALE = [
  { min: 90, max: 100, grade: "O",  point: 10 },
  { min: 80, max: 89,  grade: "A+", point: 9  },
  { min: 70, max: 79,  grade: "A",  point: 8  },
  { min: 60, max: 69,  grade: "B+", point: 7  },
  { min: 50, max: 59,  grade: "B",  point: 6  },
  { min: 40, max: 49,  grade: "C",  point: 5  },
  { min: 0,  max: 39,  grade: "F",  point: 0  },
];

/**
 * @typedef {Object} GradeResult
 * @property {string}  grade       - Grade letter (O, A+, A, B+, B, C, F)
 * @property {number}  gradePoint  - Numeric grade point (0–10)
 * @property {boolean} passed      - true if gradePoint > 0
 * @property {string}  status      - 'Passed' | 'Failed'
 */

/**
 * Convert marks to grade information.
 * @param {number|null|undefined} marks
 * @returns {GradeResult}
 */
export function getGrade(marks) {
  if (marks === null || marks === undefined) {
    return { grade: "—", gradePoint: 0, passed: false, status: "Failed" };
  }

  const m = Number(marks);

  if (isNaN(m) || m < 0 || m > 100) {
    return { grade: "—", gradePoint: 0, passed: false, status: "Failed" };
  }

  for (const row of GRADE_SCALE) {
    if (m >= row.min && m <= row.max) {
      return {
        grade:      row.grade,
        gradePoint: row.point,
        passed:     row.point > 0,
        status:     row.point > 0 ? "Passed" : "Failed",
      };
    }
  }

  // Fallback (should never reach here)
  return { grade: "F", gradePoint: 0, passed: false, status: "Failed" };
}

/** Expose the scale for rendering a reference table in the UI */
export { GRADE_SCALE };
