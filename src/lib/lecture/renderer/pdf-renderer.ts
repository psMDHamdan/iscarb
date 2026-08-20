/**
 * PDF Renderer (TASK-08 §C, F11).
 * ===========================================================================
 * Converts the approved HTML output to PDF via html-pdf-node. Because the
 * HTML is rendered from the same approved SlideArtifact JSON, PDF ≡ HTML
 * content by construction (AC-10). The LLM is never re-invoked.
 */
import htmlPdf from "html-pdf-node";
import type { Options } from "html-pdf-node";

export async function renderPDF(html: string, options?: Options): Promise<Buffer> {
  const buffer = await htmlPdf.generatePdf(
    { content: html },
    { format: "A4", printBackground: true, ...options }
  );
  return Buffer.from(buffer);
}
