/**
 * Lecture Ingestion — PDF parser (pdfjs-dist).
 * ===========================================================================
 * Extracts per-page text blocks using pdfjs-dist. Pages whose text is too
 * short (image-heavy slides) are rasterised to PNG via @napi-rs/canvas so the
 * OCR fallback can recover their content (TASK-02 §"OCR fallback").
 */
import { createCanvas } from "@napi-rs/canvas";
import type { RawBlock } from "../types";
import { applyOcrFallback } from "./ocr-fallback";
import { loadPdfjs as loadPdfjsWorker } from "@/lib/lecture/pdfjs-loader";

const OCR_TEXT_MIN_CHARS = 50;

/**
 * pdfjs-dist legacy build is DOM-free and works under Node (same pattern used
 * in src/lib/assessment/content-extraction.ts). The DOMMatrix polyfill covers
 * canvas-based page rendering when available. The loader also fixes the
 * Turbopack "fake worker" module resolution (see pdfjs-loader).
 */
export async function loadPdfjs(): Promise<any> {
  const pdfjs = await loadPdfjsWorker();
  if (typeof globalThis.DOMMatrix === "undefined") {
    // Minimal identity matrix used by pdfjs' render path.
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    } as any;
  }
  return pdfjs;
}

export async function parsePdf(buffer: Buffer): Promise<RawBlock[]> {
  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const blocks: RawBlock[] = [];

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const textContent = await page.getTextContent();
    let text = textContent.items
      .map((item: any) => (typeof item.str === "string" ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const locator = `page:${pageNo}`;
    if (text.length >= OCR_TEXT_MIN_CHARS) {
      blocks.push({ locator, type: "text", text });
      continue;
    }

    // Thin text → likely image-heavy; render page and try OCR.
    let image: Buffer | undefined;
    try {
      const viewport = page.getViewport({ scale: 2 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
      await page.render({ canvasContext: ctx, viewport }).promise;
      image = canvas.toBuffer("image/png");
    } catch (err) {
      // Rendering failed (e.g. canvas unavailable in this runtime) — keep text as-is.
      image = undefined;
    }

    let block: RawBlock = { locator, type: "text", text, image };
    if (image) {
      block = await applyOcrFallback(block);
    }
    blocks.push(block);
  }

  return blocks;
}
