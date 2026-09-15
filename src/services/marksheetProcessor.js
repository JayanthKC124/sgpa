/**
 * marksheetProcessor.js
 * =====================
 * Orchestrates: OCR (browser-local) → parse → match → SGPA.
 * Zero API keys. Zero server calls. Runs 100% in the browser.
 */

import { extractTextFromFile } from "./ocrEngine.js";
import { parseMarksheetText }  from "./marksheetParser.js";

/**
 * Process a marksheet file end-to-end.
 *
 * @param {File}     file
 * @param {function} onProgress  - called with status string at each step
 * @param {string}   semester    - e.g. "4"
 * @param {string}   branch      - e.g. "CSE"
 * @returns {Promise<object>}    - normalised result for the UI renderer
 */
export async function processMarksheet(file, onProgress, semester = "4", branch = "CSE") {
  if (!file) throw new Error("No file provided.");
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File is too large. Maximum allowed size is 15 MB.");
  }

  // ── Step 1: OCR ──────────────────────────────────────────────────────────────
  onProgress?.("Starting OCR…");
  const ocrText = await extractTextFromFile(file, onProgress);

  if (!ocrText || ocrText.trim().length < 20) {
    return {
      status: "error",
      errorMessage: "Could not extract any text from the file. Try a clearer scan or a higher-resolution image.",
      filename: file.name,
      unmatched: [],
    };
  }

  // ── Step 2: Parse + Match + SGPA (all local JS) ───────────────────────────
  onProgress?.("Matching subjects with curriculum…");

  let data;
  try {
    data = parseMarksheetText(ocrText, "2022", semester, branch);
  } catch (err) {
    return {
      status: "error",
      errorMessage: err.message,
      filename: file.name,
      unmatched: [],
    };
  }

  onProgress?.("Calculating grades and SGPA…");

  if (!data.subjects || data.subjects.length === 0) {
    return {
      status: "error",
      errorMessage:
        "No subjects were recognised. " +
        "Make sure you selected the correct semester, and the marksheet is a clear VTU 2022 Scheme document.",
      filename: file.name,
      unmatched: data.unmatched_subjects || [],
    };
  }

  // ── Step 3: Shape result for the UI renderer ──────────────────────────────
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
    status:    data.status || "success",
    sgpaResult,
    unmatched: data.unmatched_subjects || [],
    scheme:    data.scheme   || "2022",
    semester:  data.semester || semester,
    branch:    data.branch   || branch,
    filename:  file.name,
  };
}
