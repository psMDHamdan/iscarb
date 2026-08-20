/**
 * Lecture Ingestion — OCR fallback (PaddleOCR sidecar).
 * ===========================================================================
 * Sends a PNG buffer to the OCR microservice (ocr/server.py) and returns the
 * recognized text. The OCR server is optional at runtime: when it is not
 * configured or unreachable, `applyOcrFallback` returns the block untouched so
 * parsing never fails because OCR is down.
 */
import type { RawBlock } from "../types";

const OCR_TEXT_MIN_CHARS = 50;

export async function ocrImage(image: Buffer, lang = "en"): Promise<string | null> {
  const ocrUrl = process.env.LECTURE_OCR_URL;
  
  // Fast path: On Vercel / Production, if no OCR sidecar URL is configured, skip immediately to prevent hanging
  if (!ocrUrl && process.env.NODE_ENV === "production") {
    return null;
  }

  const targetUrl = ocrUrl || "http://localhost:8765/ocr";

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "content-type": "application/octet-stream", "x-ocr-lang": lang },
      body: new Uint8Array(image),
      // Fast timeout (2.5s max) to prevent serverless function execution delays on Vercel
      signal: AbortSignal.timeout(2_500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * If a block has little/no text and carries a raster image, OCR it. Returns
 * the block unchanged when OCR is unavailable or yields nothing.
 */
export async function applyOcrFallback(block: RawBlock): Promise<RawBlock> {
  if (!block.image || block.text.trim().length >= OCR_TEXT_MIN_CHARS) return block;
  const text = await ocrImage(block.image);
  if (!text || text.length === 0) return block;
  return { ...block, text, ocrExtracted: true };
}
