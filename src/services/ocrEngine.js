/**
 * ocrEngine.js
 * ============
 * 100% local OCR using Tesseract.js (browser) + pdf.js.
 * No API key. No internet. Works offline.
 */

/** Convert a PDF file to an array of image canvases (one per page). */
async function pdfToCanvases(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const canvases = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page     = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.5 }); // higher = sharper OCR
    const canvas   = document.createElement("canvas");
    canvas.width   = viewport.width;
    canvas.height  = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    canvases.push(canvas);
  }
  return canvases;
}

/** Enhance a canvas for better OCR: grayscale + contrast boost. */
function enhanceCanvas(src) {
  const scale  = Math.min(3, 3000 / Math.max(src.width, src.height));
  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(src.width  * scale);
  canvas.height = Math.round(src.height * scale);
  const ctx    = canvas.getContext("2d");
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const gray     = img.data[i] * 0.299 + img.data[i+1] * 0.587 + img.data[i+2] * 0.114;
    const contrast = Math.max(0, Math.min(255, (gray - 128) * 1.9 + 128));
    img.data[i] = img.data[i+1] = img.data[i+2] = contrast;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Run Tesseract on one image source, return raw text. */
async function recognizeOne(worker, source) {
  const result = await worker.recognize(source);
  return result.data.text;
}

/**
 * Extract raw text from a file using Tesseract.js + pdf.js.
 * @param {File} file
 * @param {function} onProgress
 * @returns {Promise<string>} raw OCR text
 */
export async function extractTextFromFile(file, onProgress) {
  if (!window.Tesseract) {
    throw new Error("Tesseract.js is not loaded. Refresh the page and try again.");
  }

  onProgress?.("Loading OCR engine…");
  const worker = await window.Tesseract.createWorker("eng", 1, {
    logger: () => {}, // silence verbose logs
  });

  try {
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "pdf") {
      if (!window.pdfjsLib) {
        throw new Error("pdf.js is not loaded. Refresh the page and try again.");
      }
      onProgress?.("Converting PDF pages…");
      const canvases = await pdfToCanvases(file);
      const texts = [];
      for (let i = 0; i < canvases.length; i++) {
        onProgress?.(`Reading page ${i + 1} of ${canvases.length}…`);
        const enhanced = enhanceCanvas(canvases[i]);
        texts.push(await recognizeOne(worker, enhanced));
        texts.push(await recognizeOne(worker, canvases[i])); // also try original
      }
      return texts.join("\n");

    } else {
      // Image file
      onProgress?.("Reading image with OCR…");
      const img = await loadImage(file);
      const raw = await recognizeOne(worker, img);
      const enhanced = enhanceCanvas(drawImageToCanvas(img));
      const enhanced2 = await recognizeOne(worker, enhanced);
      return raw + "\n" + enhanced2;
    }

  } finally {
    await worker.terminate();
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img  = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = URL.createObjectURL(file);
  });
}

function drawImageToCanvas(img) {
  const canvas  = document.createElement("canvas");
  canvas.width  = img.naturalWidth  || img.width;
  canvas.height = img.naturalHeight || img.height;
  canvas.getContext("2d").drawImage(img, 0, 0);
  return canvas;
}
