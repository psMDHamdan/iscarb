/**
 * Lecture Ingestion — DOCX parser (mammoth).
 * ===========================================================================
 * Uses mammoth's raw-text extraction (no style model needed) then splits the
 * paragraph stream into blocks. Heading-like lines are typed "heading".
 */
import mammoth from "mammoth";
import type { RawBlock } from "../types";

const HEADING_RE = /^(#{1,6}\s|learning\s+outcome|clo|objective|definition|theorem|formula|introduction|conclusion|summary|section)/i;

export async function parseDocx(buffer: Buffer): Promise<RawBlock[]> {
  const result = await mammoth.extractRawText({ buffer });
  const paragraphs = result.value
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length);

  const blocks: RawBlock[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const text = paragraphs[i];
    blocks.push({
      locator: `para:${i + 1}`,
      type: HEADING_RE.test(text) ? "heading" : "text",
      text,
    });
  }

  if (blocks.length === 0) {
    throw new Error("No paragraphs found in the DOCX file");
  }
  return blocks;
}
