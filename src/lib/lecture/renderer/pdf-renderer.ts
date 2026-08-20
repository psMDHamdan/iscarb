/**
 * PDF Renderer (TASK-08 §C, F11).
 * ===========================================================================
 * Converts the approved HTML output to PDF via Puppeteer. Because the
 * HTML is rendered from the same approved SlideArtifact JSON, PDF ≡ HTML
 * content by construction (AC-10). The LLM is never re-invoked.
 *
 * Uses `domcontentloaded` (not `networkidle0`) so inline presentation scripts
 * never stall the page load, and honors PUPPETEER_EXECUTABLE_PATH so system
 * Chrome is used instead of a downloaded Chromium revision.
 */
import puppeteer from "puppeteer";
import type { Options } from "html-pdf-node";

export async function renderPDF(html: string, options?: Options): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      ...options,
    } as Parameters<typeof page.pdf>[0]);
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}