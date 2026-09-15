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
import logging
import os
import re
from pathlib import Path

from google import genai
from google.genai import types
from PIL import Image

log = logging.getLogger(__name__)

# ── Model priority list — first working model is used ─────────────────────────
# gemini-2.0-flash is the standard free-tier multimodal model.
# gemini-1.5-flash is the fallback if 2.0 is unavailable for this key.
_MODEL_PRIORITY = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-8b",
]

_BASE_PROMPT = """
You are an expert at reading VTU (Visvesvaraya Technological University) student marksheets.

From the marksheet in this image/document, extract EVERY subject's:
  - Subject code  (e.g. BCS401, BCS402, BCSL404, BBOK407)
  - Total marks obtained (integer 0-100)

{valid_codes_section}

IMPORTANT correction rules:
  - If you see a code with slightly wrong spelling due to poor scan quality,
    correct it to the nearest valid code from the list above.
  - Common OCR errors: C↔D, S↔5, B↔8, O↔0, transposed letters.
  - Variant suffixes like BCS405A or BCS456B are valid — keep them as-is.
  - If a code clearly does not match anything, return it as-is.

Rules:
  1. Return ONLY a valid JSON array. No explanation, no markdown fences.
  2. Each element: {{"code": "XXXxxx", "marks": <number>}}
  3. If a subject is ABSENT or marks are not visible, use "marks": null
  4. Use the TOTAL marks column only (not internal/external split).
  5. Do NOT skip any subject row.

Return ONLY the JSON array, starting with [ and ending with ].
"""


def build_prompt(valid_codes: list) -> str:
    """Build a dynamic extraction prompt listing the exact valid codes."""
    if valid_codes:
        display = ", ".join(valid_codes)
        section = (
            f"The valid subject codes for this semester are:\n"
            f"  {display}\n\n"
            f"Correct any OCR misread to the nearest code from this list."
        )
    else:
        section = "Extract all subject codes you can find on the marksheet."
    return _BASE_PROMPT.format(valid_codes_section=section)


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise EnvironmentError(
            "GEMINI_API_KEY is not set. "
            "Get a free key at https://aistudio.google.com/app/apikey "
            "and set it in the .env file or via START_SERVER.bat."
        )
    return genai.Client(api_key=api_key)


def _image_to_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def _parse_response(text: str) -> list:
    """Parse Gemini response into list of {code, marks} dicts."""
    log.debug("Raw Gemini response:\n%s", text[:1000])

    cleaned = re.sub(r"```(?:json)?|```", "", text).strip()

    # Find the JSON array — be lenient about surrounding text
    match = re.search(r"\[.*?\]", cleaned, re.DOTALL)
    if not match:
        # Try the whole string if it starts with [
        if cleaned.startswith("["):
            match_text = cleaned
        else:
            log.warning("No JSON array in Gemini response: %s", text[:500])
            raise ValueError(
                f"Gemini did not return a JSON array. Response was:\n{text[:400]}"
            )
    else:
        match_text = match.group()

    try:
        raw_list = json.loads(match_text)
    except json.JSONDecodeError as exc:
        log.warning("JSON parse error: %s\nText was: %s", exc, match_text[:400])
        raise ValueError(f"Gemini returned invalid JSON: {exc}") from exc

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

    log.info("Gemini extracted %d subjects: %s",
             len(results), [r["code"] for r in results])
    return results


def _try_generate(client: genai.Client, prompt: str,
                  img_bytes: bytes, mime: str) -> str:
    """Try each model in priority order, return the first successful response text."""
    last_exc = None
    for model in _MODEL_PRIORITY:
        try:
            log.info("Trying Gemini model: %s", model)
            response = client.models.generate_content(
                model=model,
                contents=[
                    prompt,
                    types.Part.from_bytes(data=img_bytes, mime_type=mime),
                ],
                config=types.GenerateContentConfig(temperature=0),
            )
            log.info("Model %s succeeded", model)
            return response.text
        except Exception as exc:
            log.warning("Model %s failed: %s", model, exc)
            last_exc = exc

    raise RuntimeError(
        f"All Gemini models failed. Last error: {last_exc}\n"
        "Check that your GEMINI_API_KEY is valid and has quota."
    ) from last_exc


def extract_from_file(file_bytes: bytes, filename: str,
                      valid_codes: list = None) -> list:
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

    response_text = _try_generate(client, prompt, img_bytes, mime)
    return _parse_response(response_text)
