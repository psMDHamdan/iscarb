/**
 * Source-material readiness gate (spec §12 / §38 hard stop).
 * ===========================================================================
 * Generation MUST NOT proceed when the original source material is missing
 * or unusable. Instead of a generic failure, the API returns a distinct,
 * actionable error code so the studio can tell faculty exactly what to fix:
 *
 *   - SOURCE_MATERIAL_UNAVAILABLE — no source document has ever been attached.
 *   - PARSING_FAILED            — documents exist but their text extraction
 *                                 failed or produced no usable blocks.
 *   - PARSING_PARTIAL           — extraction produced too few usable blocks to
 *                                 ground a 20-slide lecture (source is likely a
 *                                 stub or slide deck without real content).
 *
 * Everything else (plans, CLOs, alignment) is already validated in the
 * generate route before this gate runs.
 */

import { db } from "@/lib/db";

export type SourceReadinessCode =
  | "SOURCE_READY"
  | "SOURCE_MATERIAL_UNAVAILABLE"
  | "PARSING_FAILED"
  | "PARSING_PARTIAL";

export interface SourceReadinessResult {
  code: SourceReadinessCode;
  message: string;
  documentCount: number;
  blockCount: number;
}

interface SourceDocumentRow {
  id: string;
  parseStatus: string;
  type: string;
}

/** Below this usable-block count the source cannot ground a full lecture. */
// Lowered from 4 to 1 because browser-side extraction creates a single
// block with all the extracted text. The LLM can work with any amount of source.
const MIN_USABLE_BLOCKS = 1;

/**
 * Assesses whether the project's source material is present and parseable
 * enough to ground generation. Pure read — never mutates.
 */
export async function checkSourceReadiness(
  projectId: string
): Promise<SourceReadinessResult> {
  const documents = await db.lectureSourceDocument.findMany({
    where: { projectId },
    select: { id: true, parseStatus: true, type: true },
  }) as SourceDocumentRow[];

  const blockCount = await db.lectureSourceBlock.count({ where: { projectId } });

  if (documents.length === 0) {
    return {
      code: "SOURCE_MATERIAL_UNAVAILABLE",
      message:
        "No source material is attached to this lecture. Upload the original PDF, slide deck, or document before generating content.",
      documentCount: 0,
      blockCount: 0,
    };
  }

  const anyParsedOrDone = documents.some(
    (d) => d.parseStatus === "done" || d.parseStatus === "parsing"
  );
  const anyFailed = documents.some((d) => d.parseStatus === "failed");

  if (blockCount === 0 || (!anyParsedOrDone && anyFailed)) {
    return {
      code: "PARSING_FAILED",
      message:
        "Source document parsing failed or produced no usable text. Re-upload the source material so its content can be extracted.",
      documentCount: documents.length,
      blockCount,
    };
  }

  if (blockCount < MIN_USABLE_BLOCKS) {
    return {
      code: "PARSING_PARTIAL",
      message: `Source parsing produced only ${blockCount} usable content blocks (minimum ${MIN_USABLE_BLOCKS} required). The source may be incomplete or image-only — add a richer source document.`,
      documentCount: documents.length,
      blockCount,
    };
  }

  return {
    code: "SOURCE_READY",
    message: "Source material is available and parseable.",
    documentCount: documents.length,
    blockCount,
  };
}