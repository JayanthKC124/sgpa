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

  if (!response.ok && isOcrFallbackError(data.error)) {
    onProgress?.("Running local OCR in your browser…");
    const ocrText = await runBrowserOcr(file);
    formData.append("ocr_text", ocrText);
    response = await fetch("/api/calculate", { method: "POST", body: formData });
  }

  const finalData = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(finalData.error || data.error || `Server error (${response.status})`);
  }

  return finalData;
}

function isOcrFallbackError(message = "") {
  return /no selectable text|OCR runtime unavailable|scanned|image-only/i.test(message);
}

async function runBrowserOcr(file) {
  if (!window.Tesseract) {
    throw new Error("Browser OCR is unavailable. Refresh the page and try again.");
  }

  const worker = await window.Tesseract.createWorker("eng");
  try {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      if (!window.pdfjsLib) throw new Error("PDF OCR support is unavailable. Refresh the page and try again.");
      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const pages = [];
      for (let index = 1; index <= pdf.numPages; index += 1) {
        const page = await pdf.getPage(index);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        pages.push((await worker.recognize(canvas)).data.text);
      }
      return pages.join("\n");
    }
    const image = await loadOcrImage(file);
    const firstPass = await worker.recognize(image).then(result => result.data.text);
    const enhanced = enhanceOcrImage(image);
    const secondPass = await worker.recognize(enhanced).then(result => result.data.text);
    return `${firstPass}\n${secondPass}`;
  } finally {
    await worker.terminate();
  }
}

function loadOcrImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read the JPEG image."));
    image.src = URL.createObjectURL(file);
  });
}

function enhanceOcrImage(source) {
  const scale = Math.min(3, 2600 / Math.max(source.naturalWidth || source.width, source.naturalHeight || source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round((source.naturalWidth || source.width) * scale);
  canvas.height = Math.round((source.naturalHeight || source.height) * scale);
  const context = canvas.getContext("2d");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const gray = pixels.data[index] * 0.299 + pixels.data[index + 1] * 0.587 + pixels.data[index + 2] * 0.114;
    const contrast = Math.max(0, Math.min(255, (gray - 128) * 1.8 + 128));
    pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = contrast;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}
