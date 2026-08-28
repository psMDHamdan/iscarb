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
  
  // Fast path: in production, if no OCR sidecar URL is configured, skip immediately
  if (!ocrUrl && process.env.NODE_ENV === "production") {
    return null;
  }

  const targetUrl = ocrUrl || "http://localhost:8765/ocr";
  const timeoutMs = process.env.LECTURE_OCR_TIMEOUT ? parseInt(process.env.LECTURE_OCR_TIMEOUT, 10) : 8000;

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "content-type": "application/octet-stream", "x-ocr-lang": lang },
      body: new Uint8Array(image),
      // Increased timeout to allow PaddleOCR time to process complex slides
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.warn(`[OCR] HTTP error ${res.status} from ${targetUrl}`);
      return null;
    }
    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      console.warn(`[OCR] Timeout (${timeoutMs}ms) calling ${targetUrl}`);
    } else {
      console.warn(`[OCR] Connection failed: ${err.message}`);
    }
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
