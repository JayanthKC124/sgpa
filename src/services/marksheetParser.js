/**
 * marksheetParser.js
 * ==================
 * Sends the uploaded file + semester/branch to POST /api/calculate.
 */

export async function parseMarksheet(file, onProgress, semester = "4", branch = "CSE") {
  if (!file) throw new Error("No file provided.");

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File is too large. Maximum allowed size is 10 MB.");
  }

  onProgress?.("Uploading marksheet…");

  const formData = new FormData();
  formData.append("file",     file);
  formData.append("scheme",   "2022");
  formData.append("semester", semester);
  formData.append("branch",   branch);

  let response;
  try {
    response = await fetch("/api/calculate", { method: "POST", body: formData });
  } catch {
    throw new Error(
      "Cannot reach the server. Make sure the Python backend is running on port 5000."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Server error (${response.status})`);
  }

  return data;
}
