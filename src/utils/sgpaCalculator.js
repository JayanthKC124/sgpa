/**
 * sgpaCalculator.js
 * =================
 * Calculates credit points per subject and the final SGPA.
 *
 * Rules:
 *  - Credit Points  = Credits × Grade Point  (per subject)
 *  - SGPA           = Total Credit Points ÷ Total Credits
 *  - Subjects with 0 credits are excluded from the SGPA denominator.
 *  - Failed subjects contribute 0 credit points but their credits
 *    still count in the denominator.
 *  - Round SGPA to 2 decimal places.
 */

import { getGrade } from "./grading.js";

/**
 * @typedef {Object} SubjectResult
 * @property {string}   code
 * @property {string}   name
 * @property {number|null} marks
 * @property {number}   credits
 * @property {string}   grade
 * @property {number}   gradePoint
 * @property {number}   creditPoints
 * @property {boolean}  passed
 * @property {string}   status       - 'Passed' | 'Failed'
 * @property {string}   type         - 'theory' | 'lab' | 'activity'
 */

/**
 * @typedef {Object} SGPAResult
 * @property {SubjectResult[]} subjects
 * @property {number}          totalCredits
 * @property {number}          totalCreditPoints
 * @property {number}          sgpa
 * @property {number}          passedCount
 * @property {number}          failedCount
 * @property {number}          subjectCount
 */

/**
 * Calculate SGPA from matched subjects with marks.
 *
 * @param {Array<{code:string, name:string, marks:number|null, credits:number, type:string}>} matchedSubjects
 * @returns {SGPAResult}
 */
export function calculateSGPA(matchedSubjects) {
  let totalCredits      = 0;
  let totalCreditPoints = 0;
  let passedCount       = 0;
  let failedCount       = 0;

  const subjects = matchedSubjects.map((subj) => {
    const { grade, gradePoint, passed, status } = getGrade(subj.marks);
    const creditPoints = subj.credits * gradePoint;

    // Only count in denominator if credits > 0
    if (subj.credits > 0) {
      totalCredits      += subj.credits;
      totalCreditPoints += creditPoints;
    }

    if (passed) passedCount++;
    else        failedCount++;

    return {
      code:         subj.code,
      name:         subj.name,
      marks:        subj.marks,
      credits:      subj.credits,
      grade,
      gradePoint,
      creditPoints,
      passed,
      status,
      type:         subj.type,
    };
  });

  const sgpa =
    totalCredits > 0
      ? Math.round((totalCreditPoints / totalCredits) * 100) / 100
      : 0;

  return {
    subjects,
    totalCredits,
    totalCreditPoints,
    sgpa,
    passedCount,
    failedCount,
    subjectCount: subjects.length,
  };
}
