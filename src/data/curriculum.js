/**
 * curriculum.js  –  VTU 2022 Scheme  –  ALL Semesters / All Branches
 * ====================================================================
 * Structure:
 *   CURRICULUM[scheme][semKey][branchKey] = { label, subjects, totalCredits }
 *
 * semKey examples : "P_CYCLE", "C_CYCLE", "3", "4", "5", "6", "7", "8"
 * branchKey       : "CSE", "ISE", "AIML", "CIVIL", "EEE", "MECH"  (add more freely)
 *
 * Subject object:
 *   code      – canonical code (uppercase, no spaces)
 *   name      – full subject name
 *   credits   – fixed credit value  (0 = non-credit activity)
 *   type      – "theory" | "lab" | "activity" | "project"
 *   variant   – true if code ends in a variable suffix (x)
 *   baseCode  – root code when variant=true
 *
 * IMPORTANT: Credits ALWAYS come from here. Students never enter them.
 */

// ─── helpers ──────────────────────────────────────────────────────────────────
const T = "theory", L = "lab", A = "activity", P = "project";

function sub(code, name, credits, type = T, variant = false) {
  return { code, name, credits, type, ...(variant ? { variant: true, baseCode: code } : {}) };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  2022 SCHEME
// ═══════════════════════════════════════════════════════════════════════════════
export const CURRICULUM = {
  "2022": {

    // ── PHYSICS CYCLE (1st Semester for Physics-group students) ──────────────
    "P_CYCLE": {
      "CSE": {
        label: "Physics Cycle – CSE Stream (CSE/ISC/BT)",
        totalCredits: 20,
        subjects: {
          BMATSx01: sub("BMATSx01", "Mathematics – I/II for CSE Stream",      4, T, true),
          BPHYSx02: sub("BPHYSx02", "Applied Physics for CSE Stream",         4, T, true),
          BPOPSx03: sub("BPOPSx03", "Principles of Programming Using C",      3, T, true),
          BESCKx04x: sub("BESCKx04x","Engineering Science Course – I/II",     3, T, true),
          // elective slot – BETCKx05x OR BPLCKx05x
          BETCKx05x: sub("BETCKx05x","Emerging Technology / Prog. Language Course – I/II", 3, T, true),
          BENGKx06:  sub("BENGKx06", "Communicative English / Prof. Writing Skills",       1, T, true),
          BKSKKx07:  sub("BKSKKx07", "Samskrutika Kannada / Indian Constitution",          1, T, true),
          BIDTKx58:  sub("BIDTKx58", "Innovation & Design Thinking / Scientific Foundations of Health", 1, T, true),
          // Labs & activity
          BPHYLx09:  sub("BPHYLx09", "Applied Physics Lab",                   1, L, true),
          BPOPLx10:  sub("BPOPLx10", "Programming in C Lab",                  1, L, true),
          BCPLKx59:  sub("BCPLKx59", "Constitution & Professional Ethics / NSS/PE/Yoga", 0, A, true),
        },
      },
      // Add CIVIL / EEE / MECH P_CYCLE here when data is provided
    },

    // ── CHEMISTRY CYCLE (2nd Semester for Physics-group students) ────────────
    "C_CYCLE": {
      "CSE": {
        label: "Chemistry Cycle – CSE Stream (CSE/ISC/BT)",
        totalCredits: 20,
        subjects: {
          BMATSx01: sub("BMATSx01", "Mathematics – I/II for CSE Stream",      4, T, true),
          BCHYSx02: sub("BCHYSx02", "Applied Chemistry for CSE Stream",       4, T, true),
          BPOPSx03: sub("BPOPSx03", "Principles of Programming Using C",      3, T, true),
          BESCKx04x: sub("BESCKx04x","Engineering Science Course – I/II",     3, T, true),
          BETCKx05x: sub("BETCKx05x","Emerging Technology / Prog. Language Course – I/II", 3, T, true),
          BENGKx06:  sub("BENGKx06", "Communicative English / Prof. Writing Skills",       1, T, true),
          BKSKKx07:  sub("BKSKKx07", "Samskrutika Kannada / Indian Constitution",          1, T, true),
          BIDTKx58:  sub("BIDTKx58", "Innovation & Design Thinking / Scientific Foundations of Health", 1, T, true),
          BCHYLx09:  sub("BCHYLx09", "Applied Chemistry Lab",                 1, L, true),
          BPOPLx10:  sub("BPOPLx10", "Programming in C Lab",                  1, L, true),
          BCPLKx59:  sub("BCPLKx59", "Constitution & Professional Ethics / NSS/PE/Yoga", 0, A, true),
        },
      },
    },

    // ── 3rd SEMESTER ──────────────────────────────────────────────────────────
    "3": {
      "CSE": {
        label: "3rd Semester – CS/IS/AIML",
        totalCredits: 21,
        subjects: {
          BCS301: sub("BCS301", "Mathematics for Computer Science – III",  3, T),
          BCS302: sub("BCS302", "Data Structures and Applications",        3, T),
          BCS303: sub("BCS303", "Analog and Digital Electronics",          3, T),
          BCS304: sub("BCS304", "Object Oriented Programming with Java",   3, T),
          BCS305x: sub("BCS305x","Engineering Science Course",             3, T, true),
          BCSL306: sub("BCSL306", "Data Structures Lab",                   1, L),
          BCSL307: sub("BCSL307", "OOP with Java Lab",                     1, L),
          BCS358x: sub("BCS358x","Ability Enhancement Course III",         1, T, true),
          BUHK358: sub("BUHK358", "Universal Human Values",                1, T),
          BNSK359: sub("BNSK359", "NSS / PE / Yoga",                       0, A),
          BPEK359: sub("BPEK359", "NSS / PE / Yoga",                       0, A),
          BYOK359: sub("BYOK359", "NSS / PE / Yoga",                       0, A),
        },
      },
    },

    // ── 4th SEMESTER ─────────────────────────────────────────────────────────
    "4": {
      "CSE": {
        label: "4th Semester – CS/IS/AIML",
        totalCredits: 19,
        subjects: {
          BCS401:  sub("BCS401",  "Analysis & Design of Algorithms",                   3, T),
          BCS402:  sub("BCS402",  "Microcontrollers",                                  4, T),
          BCS403:  sub("BCS403",  "Database Management Systems",                       4, T),
          BCSL404: sub("BCSL404", "Analysis & Design of Algorithms Lab",               1, L),
          BCS405:  sub("BCS405",  "ESC / ETC / PLC",                                   3, T, true),
          BCS456:  sub("BCS456",  "Ability Enhancement / Skill Enhancement Course-IV", 1, T, true),
          BBOK407: sub("BBOK407", "Biology for Engineers",                             2, T),
          BUHK408: sub("BUHK408", "Universal Human Values Course",                    1, T),
          BNSK459: sub("BNSK459", "NSS / PE / Yoga",                                  0, A),
          BPEK459: sub("BPEK459", "NSS / PE / Yoga",                                  0, A),
          BYOK459: sub("BYOK459", "NSS / PE / Yoga",                                  0, A),
        },
      },
    },

    // ── 5th SEMESTER ─────────────────────────────────────────────────────────
    "5": {
      "CSE": {
        label: "5th Semester – CS",
        totalCredits: 20,
        subjects: {
          BCS501: sub("BCS501", "Software Engineering & Project Management",  3, T),
          BCS502: sub("BCS502", "Computer Networks",                          3, T),
          BCS503: sub("BCS503", "Theory of Computation",                      3, T),
          BCS504: sub("BCS504", "Operating Systems",                          3, T),
          BCS505x: sub("BCS505x","Professional Elective – I",                 3, T, true),
          BCSL506: sub("BCSL506","Computer Networks Lab",                     1, L),
          BCSL507: sub("BCSL507","OS Lab",                                    1, L),
          BCS558x: sub("BCS558x","Ability Enhancement Course V",              1, T, true),
          BUHK508: sub("BUHK508","Universal Human Values",                    1, T),
          BNSK559: sub("BNSK559","NSS / PE / Yoga",                           0, A),
          BPEK559: sub("BPEK559","NSS / PE / Yoga",                           0, A),
          BYOK559: sub("BYOK559","NSS / PE / Yoga",                           0, A),
        },
      },
    },

    // ── 6th SEMESTER ─────────────────────────────────────────────────────────
    "6": {
      "CSE": {
        label: "6th Semester – CS",
        totalCredits: 20,
        subjects: {
          BCS601: sub("BCS601", "Compiler Design",                             3, T),
          BCS602: sub("BCS602", "Computer Graphics & Visualization",           3, T),
          BCS603: sub("BCS603", "Artificial Intelligence & Machine Learning",  3, T),
          BCS604: sub("BCS604", "Professional Elective – II",                  3, T, true),
          BCS605x: sub("BCS605x","Open Elective",                              3, T, true),
          BCSL606: sub("BCSL606","AI & ML Lab",                                1, L),
          BCSL607: sub("BCSL607","Compiler Design Lab",                        1, L),
          BCS658x: sub("BCS658x","Ability Enhancement Course VI",              1, T, true),
          BNSK659: sub("BNSK659","NSS / PE / Yoga",                            0, A),
          BPEK659: sub("BPEK659","NSS / PE / Yoga",                            0, A),
          BYOK659: sub("BYOK659","NSS / PE / Yoga",                            0, A),
        },
      },
    },

    // ── 7th SEMESTER ─────────────────────────────────────────────────────────
    "7": {
      "CSE": {
        label: "7th Semester – CS",
        totalCredits: 20,
        subjects: {
          BCS701: sub("BCS701", "Information & Cyber Security",               3, T),
          BCS702: sub("BCS702", "Cloud Computing",                            3, T),
          BCS703x: sub("BCS703x","Professional Elective – III",               3, T, true),
          BCS704x: sub("BCS704x","Professional Elective – IV",                3, T, true),
          BCS705x: sub("BCS705x","Open Elective – II",                        3, T, true),
          BCSL706: sub("BCSL706","Cloud Computing Lab",                       1, L),
          BCSP707: sub("BCSP707","Mini Project / Internship",                 2, P),
          BCS758x: sub("BCS758x","Ability Enhancement Course VII",            1, T, true),
          BNSK759: sub("BNSK759","NSS / PE / Yoga",                           0, A),
          BPEK759: sub("BPEK759","NSS / PE / Yoga",                           0, A),
          BYOK759: sub("BYOK759","NSS / PE / Yoga",                           0, A),
        },
      },
    },

    // ── 8th SEMESTER ─────────────────────────────────────────────────────────
    "8": {
      "CSE": {
        label: "8th Semester – CS",
        totalCredits: 15,
        subjects: {
          BCS801x: sub("BCS801x","Professional Elective – V",                 3, T, true),
          BCS802x: sub("BCS802x","Open Elective – III",                       3, T, true),
          BCSP803: sub("BCSP803","Project Work / Internship",                 8, P),
          BCS858x: sub("BCS858x","Ability Enhancement Course VIII",           1, T, true),
        },
      },
    },

  }, // end 2022
};

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/**
 * Get the subject map for a given scheme/semester/branch.
 * @param {string} scheme   e.g. "2022"
 * @param {string} semKey   e.g. "4", "P_CYCLE", "C_CYCLE"
 * @param {string} branch   e.g. "CSE"
 * @returns {Object|null}   { label, subjects, totalCredits } or null
 */
export function getCurriculum(scheme, semKey, branch) {
  return CURRICULUM?.[scheme]?.[semKey]?.[branch] ?? null;
}

/**
 * All available semesters for a scheme (as display objects).
 */
export const SEMESTERS_2022 = [
  { key: "P_CYCLE", label: "Physics Cycle (1st Sem)" },
  { key: "C_CYCLE", label: "Chemistry Cycle (2nd Sem)" },
  { key: "3",       label: "3rd Semester" },
  { key: "4",       label: "4th Semester" },
  { key: "5",       label: "5th Semester" },
  { key: "6",       label: "6th Semester" },
  { key: "7",       label: "7th Semester" },
  { key: "8",       label: "8th Semester" },
];

export const BRANCHES_2022 = [
  { key: "CSE",   label: "CS / IS / AIML" },
  { key: "CIVIL", label: "Civil Engineering" },
  { key: "EEE",   label: "Electrical / ECE / ETC" },
  { key: "MECH",  label: "Mechanical Engineering" },
];

/** Default (Version 1 – 4th Sem CSE) */
export const DEFAULT_CONTEXT = { scheme: "2022", semKey: "4", branch: "CSE" };
