/**
 * Lecture Ingestion — parser dispatcher.
 * ===========================================================================
 * Maps a LectureSourceDocument.type to the matching parser. Unsupported types
 * raise a descriptive error so the worker fails the job visibly.
 */
import type { DocumentType, RawBlock } from "../types";
import { parsePdf } from "./pdf-parser";
import { parsePptx } from "./pptx-parser";
import { parseDocx } from "./docx-parser";
import { parseHtml } from "./html-parser";

export type { DocumentType, RawBlock };

const PARSERS: Record<DocumentType, (buf: Buffer) => Promise<RawBlock[]> | RawBlock[]> = {
  pdf: parsePdf,
  pptx: parsePptx,
  docx: parseDocx,
  html: (buf: Buffer) => parseHtml(buf.toString("utf8")),
};

export async function parseByType(type: string, buffer: Buffer): Promise<RawBlock[]> {
  const parser = PARSERS[type as DocumentType];
  if (!parser) {
    throw new Error(`Unsupported document type: ${type}`);
  }
  return parser(buffer);
}
