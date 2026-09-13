/**
 * subjectMatcher.js
 * =================
 * Matches extracted subject codes (raw OCR output) against the curriculum.
 *
 * Matching strategy (in order of priority):
 *   1. Exact match (case-insensitive, spaces stripped)
 *   2. Variant prefix match  — BCS405A / BCS405B → BCS405
 *   3. BCS456x variants      — BCS456A / BCS456B → BCS456
 *   4. NSS/PE/Yoga aliases   — BNSK459 / BPEK459 / BYOK459
 *
 * Never randomly assigns credits. If no match → unmatched list.
 */

import { SUBJECTS } from "../data/curriculum.js";

/**
 * Normalize a raw code string for comparison.
 * @param {string} raw
 * @returns {string}
 */
function normalize(raw) {
  return String(raw).toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
}

/** Pre-build a map of normalized canonical codes → Subject */
const NORMALIZED_MAP = Object.fromEntries(
  Object.entries(SUBJECTS).map(([k, v]) => [normalize(k), v])
);

/** Codes that have variant suffixes (ends in letter after base number) */
const VARIANT_BASE_CODES = Object.values(SUBJECTS)
  .filter((s) => s.variant)
  .map((s) => normalize(s.baseCode));

/**
 * @typedef {Object} MatchedSubject
 * @property {string}      rawCode   - Original code from OCR
 * @property {string}      code      - Canonical matched code
 * @property {string}      name
 * @property {number}      credits
 * @property {string}      type
 * @property {number|null} marks
 */

/**
 * @typedef {Object} MatchResult
 * @property {MatchedSubject[]} matched
 * @property {Array<{rawCode:string, marks:number|null}>} unmatched
 */

/**
 * Match a list of {code, marks} pairs against the curriculum.
 *
 * @param {Array<{code:string, marks:number|null}>} extracted
 * @returns {MatchResult}
 */
export function matchSubjects(extracted) {
  const matched   = [];
  const unmatched = [];

  for (const item of extracted) {
    const norm = normalize(item.code);
    let   subject = null;

    // 1. Exact match
    if (NORMALIZED_MAP[norm]) {
      subject = NORMALIZED_MAP[norm];
    }

    // 2. Variant prefix match (e.g. BCS405A → BCS405, BCS456B → BCS456)
    if (!subject) {
      for (const base of VARIANT_BASE_CODES) {
        if (norm.startsWith(base)) {
          subject = NORMALIZED_MAP[base];
          break;
        }
      }
    }

    if (subject) {
      matched.push({
        rawCode: item.code,
        code:    subject.code,
        name:    subject.name,
        credits: subject.credits,
        type:    subject.type,
        marks:   item.marks,
      });
    } else {
      unmatched.push({ rawCode: item.code, marks: item.marks });
    }
  }

  return { matched, unmatched };
}
