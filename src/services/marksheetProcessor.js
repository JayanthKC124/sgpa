/**
 * marksheetProcessor.js
 * =====================
 * Calls the backend and normalises the response for the UI.
 */

import { parseMarksheet } from "./marksheetParser.js";

export async function processMarksheet(file, onProgress, semester = "4", branch = "CSE") {
  onProgress?.("Reading marksheet with AI…");

  const data = await parseMarksheet(file, onProgress, semester, branch);

  onProgress?.("Calculating grades and SGPA…");

  if (!data.subjects || data.subjects.length === 0) {
    return {
      status: "error",
      errorMessage:
        "No recognized subjects found in the marksheet. " +
        "Please upload a clear VTU 2022 Scheme marksheet.",
      filename: file.name,
      unmatched: data.unmatched_subjects || [],
    };
  }

  const sgpaResult = {
    subjects:          data.subjects,
    totalCredits:      data.total_credits,
    totalCreditPoints: data.total_credit_points,
    sgpa:              data.sgpa,
    passedCount:       data.passed_count,
    failedCount:       data.failed_count,
    subjectCount:      data.subject_count,
  };

  return {
    status:   data.status || "success",
    sgpaResult,
    unmatched: data.unmatched_subjects || [],
    scheme:    data.scheme   || "2022",
    semester:  data.semester || "4th Semester",
    branch:    data.branch   || "CS / IS / AIML",
    filename:  file.name,
  };
}
