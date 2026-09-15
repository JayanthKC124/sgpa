"""
Marksheet OCR Extractor
=======================
Sends the uploaded marksheet (PDF or image) to Google Gemini Vision API.

Strategy:
  - PDF   → sent directly as application/pdf (Gemini reads it natively)
  - Image → sent as image/png / image/jpeg

Dependencies:
  pip install google-genai pillow
"""

import io
import json
import os
import re
from pathlib import Path

from google import genai
from google.genai import types
from PIL import Image

# ── Model ──────────────────────────────────────────────────────────────────────
_GEMINI_MODEL = "gemini-3.6-flash"

_BASE_PROMPT = """
You are an expert at reading VTU (Visvesvaraya Technological University) student marksheets.

From the marksheet in this image/document, extract EVERY subject's:
  - Subject code
  - Total marks obtained (integer, out of 100)

{valid_codes_section}

IMPORTANT correction rules:
  - If you see a code with slightly wrong spelling due to poor scan quality,
    correct it to the nearest valid code from the list above.
  - Common OCR errors: C↔D, S↔5, B↔8, O↔0, transposed letters.
  - If a code clearly does not match anything, return it as-is.

Rules:
  1. Return ONLY a valid JSON array. No explanation, no markdown fences.
  2. Each element: {{"code": "XXXxxx", "marks": <number>}}
  3. If a subject is ABSENT or marks are not visible, use "marks": null
  4. Use the TOTAL marks column only (not internal/external split).
  5. Do NOT skip any subject row.

Return ONLY the JSON array.
"""


def build_prompt(valid_codes: list) -> str:
    """Build a dynamic extraction prompt listing the exact valid codes."""
    if valid_codes:
        display = ", ".join(valid_codes)
        section = (
            f"The ONLY valid subject codes for this marksheet are:\n"
            f"  {display}\n\n"
            f"Correct any OCR misread to the nearest code from this list."
        )
    else:
        section = "Extract all subject codes you can find on the marksheet."
    return _BASE_PROMPT.format(valid_codes_section=section)


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise EnvironmentError(
            "GEMINI_API_KEY environment variable is not set. "
            "Get a free key at https://aistudio.google.com/app/apikey"
        )
    return genai.Client(api_key=api_key)


def _image_to_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def _parse_response(text: str) -> list:
    """Parse Gemini response into list of {code, marks} dicts."""
    cleaned = re.sub(r"```(?:json)?", "", text).strip()
    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON array found in Gemini response:\n{text[:500]}")

    raw_list = json.loads(match.group())
    results = []
    for item in raw_list:
        code  = str(item.get("code", "")).strip().upper()
        marks = item.get("marks")
        if marks is not None:
            try:
                marks = float(marks)
            except (TypeError, ValueError):
                marks = None
        if code:
            results.append({"code": code, "marks": marks})
    return results


def extract_from_file(file_bytes: bytes, filename: str, valid_codes: list = None) -> list:
    """
    Main entry point.

    Parameters
    ----------
    file_bytes   : bytes      – raw file content
    filename     : str        – original filename
    valid_codes  : list[str]  – known subject codes for this semester

    Returns
    -------
    list of {"code": str, "marks": float|None}
    """
    client = _get_client()
    prompt = build_prompt(valid_codes or [])

    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        # Send PDF directly — Gemini reads PDFs natively, no Poppler needed
        img_bytes = file_bytes
        mime      = "application/pdf"
    elif ext in (".jpg", ".jpeg"):
        pil_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        img_bytes = _image_to_bytes(pil_image)
        mime      = "image/png"
    elif ext == ".png":
        img_bytes = file_bytes
        mime      = "image/png"
    elif ext == ".webp":
        img_bytes = file_bytes
        mime      = "image/webp"
    else:
        raise ValueError(f"Unsupported file type: {ext}. Upload a PDF, JPG, or PNG.")

    response = client.models.generate_content(
        model=_GEMINI_MODEL,
        contents=[
            prompt,
            types.Part.from_bytes(data=img_bytes, mime_type=mime),
        ],
        config=types.GenerateContentConfig(temperature=0),
    )

    return _parse_response(response.text)
