"""
VTU Grading System – 2022 Scheme
Absolute grading based on marks out of 100.

Grade  | Marks Range | Grade Point
-------|-------------|------------
O      | 90 – 100    | 10
A+     | 80 – 89     | 9
A      | 70 – 79     | 8
B+     | 60 – 69     | 7
B      | 50 – 59     | 6
C      | 40 – 49     | 5
F      | 0  – 39     | 0  (Fail)
Ab     | Absent      | 0
"""

GRADE_TABLE = [
    (90, 100, "O",  10),
    (80,  89, "A+",  9),
    (70,  79, "A",   8),
    (60,  69, "B+",  7),
    (50,  59, "B",   6),
    (40,  49, "C",   5),
    (0,   39, "F",   0),
]


def marks_to_grade(marks) -> tuple[str, int]:
    """
    Convert a numeric marks value (0-100) to (grade, grade_point).
    Returns ("F", 0) for marks below 40 or invalid values.
    Returns ("Ab", 0) for None / absent.
    """
    if marks is None:
        return "Ab", 0

    try:
        m = float(marks)
    except (TypeError, ValueError):
        return "Ab", 0

    if m < 0 or m > 100:
        return "Ab", 0

    for low, high, grade, gp in GRADE_TABLE:
        if low <= m <= high:
            return grade, gp

    return "F", 0


def calculate_sgpa(subjects: list[dict]) -> dict:
    """
    Calculate SGPA from a list of resolved subject dicts.

    Each dict must have:
        code        : subject code (str)
        name        : subject name (str)
        marks       : numeric marks (int/float) or None
        credits     : credit value (int)

    Returns a dict with:
        subjects    : enriched list with grade, grade_point, credit_points
        total_credits       : sum of all subject credits
        earned_credits      : sum of credits for passed subjects
        total_credit_points : sum of credit × grade_point
        sgpa                : float rounded to 2 decimal places
        failed_subjects     : list of failed subject codes
        unmatched_subjects  : list of codes not found in curriculum
    """
    enriched = []
    total_credits = 0
    earned_credits = 0
    total_credit_points = 0.0
    failed = []
    unmatched = []

    for subj in subjects:
        code    = subj.get("code", "")
        name    = subj.get("name", "Unknown")
        marks   = subj.get("marks")
        credits = subj.get("credits")

        if subj.get("unmatched"):
            unmatched.append(code)
            enriched.append({**subj, "grade": "–", "grade_point": 0, "credit_points": 0, "status": "Unmatched"})
            continue

        grade, gp = marks_to_grade(marks)
        credit_points = credits * gp

        total_credits       += credits
        total_credit_points += credit_points

        if gp > 0:
            earned_credits += credits
        else:
            failed.append(code)

        status = "Passed" if gp > 0 else "Failed"
        enriched.append({
            **subj,
            "grade":         grade,
            "grade_point":   gp,
            "credit_points": credit_points,
            "status":        status,
        })

    sgpa = round(total_credit_points / total_credits, 2) if total_credits > 0 else 0.0

    return {
        "subjects":             enriched,
        "total_credits":        total_credits,
        "earned_credits":       earned_credits,
        "total_credit_points":  total_credit_points,
        "sgpa":                 sgpa,
        "failed_subjects":      failed,
        "unmatched_subjects":   unmatched,
    }
