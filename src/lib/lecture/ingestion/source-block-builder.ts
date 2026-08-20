/**
 * Lecture Ingestion — source block builder + criticality classifier.
 * ===========================================================================
 * Persists parsed RawBlocks as LectureSourceBlock rows and marks the source
 * document parseStatus = "done". Deduplicates identical (locator, text) rows
 * within one document, assigns a semantic criticality, and flattens parent
 * relationships into a per-document sequence.
 *
 * Fix 7: adds detectDomainContamination() which flags blocks whose content
 * belongs to a completely different academic domain than the registered
 * course. Contaminated blocks get status = "domain_contaminated" so the
 * generation layer can skip them without re-running detection on every slide.
 */
import { db } from "@/lib/db";
import type { LectureSourceDocument } from "@prisma/client";
import type { RawBlock } from "./types";

export type Criticality = "critical" | "normal" | "low";

const CRITICAL_PREFIX_RE = /^(CLO|Learning Outcome|Objective|Definition:|Theorem:|Formula:)/i;

const CRITICAL_PATTERNS: RegExp[] = [
  /\b(?:grading|grade[sd]?|exam[s]?|assignment[s]?|due date|deadline[s]?|marks?|weight[s]?|must|required|mandatory|objective[s]?)\b/i,
  /\blearning outcomes?\b/i,
  /\bclo(s)?\b/i,
];

const LOW_PATTERNS: RegExp[] = [
  /\b(?:example[s]?|illustration[s]?|e\.g\.|for instance|figure[s]?|image[s]?|appendix|note[s]?)\b/i,
];

// ---------------------------------------------------------------------------
// Domain contamination signals — each entry names a distinct academic domain
// and the keywords that strongly identify it.
// A block is "contaminated" if it matches a domain signal that the course
// context (title + description) does NOT also match.
// ---------------------------------------------------------------------------
const DOMAIN_CONTAMINATION_SIGNALS: Array<{ label: string; keywords: RegExp }> = [
  {
    label: "Structural Mechanics / FEA",
    keywords: /\b(von mises|finite element analysis|\bFEA\b|yield criterion|beam deflection|truss analysis|stress distribution|structural mechanics)\b/i,
  },
  {
    label: "Generic education brochure",
    keywords: /higher education develops critical thinking|domain expertise and problem-solving capabilities/i,
  },
  {
    label: "Unrelated national initiative boilerplate",
    keywords: /aligned with national digital transformation initiative|national digital transformation/i,
  },
];

/**
 * Returns true when the block text belongs to a domain that the course context
 * does NOT share. The course context is a free-text string combining the
 * course title, description, and discipline label.
 *
 * Intentionally conservative: only fires on strong multi-word domain signals,
 * never on single ambiguous words.
 */
export function detectDomainContamination(blockText: string, courseContext: string): boolean {
  const lowerCourse = courseContext.toLowerCase();
  for (const { keywords } of DOMAIN_CONTAMINATION_SIGNALS) {
    if (keywords.test(blockText) && !keywords.test(lowerCourse)) {
      return true;
    }
  }
  return false;
}

export interface SourceBlockInput {
  locator: string;
  type: string;
  text: string;
  criticality: Criticality;
  status: string;
}

export function assessCriticality(
  blockOrText: Pick<RawBlock, "type" | "text"> | string,
  _pageOrIndex?: number,
  explicitType?: RawBlock["type"]
): Criticality {
  const block: Pick<RawBlock, "type" | "text"> =
    typeof blockOrText === "string"
      ? { text: blockOrText, type: explicitType || "paragraph" }
      : blockOrText;

  if (block.type === "heading") return "critical";
  if (block.type === "table") return "critical";

  const rawText = block.text || "";
  const text = `${block.type}: ${rawText}`;

  // Plan §C: CLO-style prefixes (CLO / Learning Outcome / Objective /
  // Definition: / Theorem: / Formula:) are always critical.
  if (rawText && CRITICAL_PREFIX_RE.test(rawText)) return "critical";
  if (CRITICAL_PATTERNS.some((re) => re.test(text))) return "critical";

  // Plan §C: decorative content — page numbers, footers, empty shells.
  if (rawText.trim().length < 10 || /^\d+$/.test(rawText.trim())) return "low";
  if (LOW_PATTERNS.some((re) => re.test(text))) return "low";

  return "normal";
}

/**
 * Persist blocks for a document. Sets parseStatus="done" on the document.
 * Throws on failure so the parse worker marks the document as failed.
 *
 * courseContext — optional free-text string combining course title, description,
 * and discipline. When provided, blocks that belong to an unrelated domain are
 * persisted with status = "domain_contaminated" so the generation layer can
 * skip them without re-running detection per slide.
 */
export async function buildSourceBlocks(
  projectId: string,
  documentId: string,
  rawBlocks: RawBlock[],
  courseContext: string = ""
): Promise<void> {
  // Deduplicate by (locator, text) while preserving order.
  const seen = new Set<string>();
  const rows: SourceBlockInput[] = [];
  for (const raw of rawBlocks) {
    // Thoroughly strip null bytes which Postgres cannot store in UTF-8 fields
    const safeText = raw.text?.replace(/\0/g, "") ?? "";
    const safeLocator = raw.locator?.replace(/\0/g, "") ?? "unknown";
    const safeType = raw.type?.replace(/\0/g, "") ?? "unknown";

    if (!safeText.trim()) continue;

    const key = `${safeLocator}|${safeText}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Domain contamination check — mark contaminated blocks so the generation
    // layer can skip them without running detection again per slide.
    const isContaminated = courseContext
      ? detectDomainContamination(safeText, courseContext)
      : false;

    if (isContaminated) {
      console.warn(`[SourceBlockBuilder] Domain-contaminated block at ${safeLocator}: "${safeText.slice(0, 80)}..."`);
    }

    rows.push({
      locator: safeLocator,
      type: safeType,
      text: safeText,
      criticality: assessCriticality({ type: raw.type, text: safeText }),
      status: isContaminated ? "domain_contaminated" : "unresolved",
    });
  }

  await db.lectureSourceBlock.createMany({
    data: rows.map((r) => ({
      projectId,
      documentId,
      locator: r.locator,
      type: r.type,
      text: r.text,
      criticality: r.criticality,
      status: r.status,
    })),
    skipDuplicates: true,
  });

  await db.lectureSourceDocument.update({
    where: { id: documentId },
    data: { parseStatus: "done" },
  });
}

/**
 * Aggregate a document's blocks into a lightweight source-map summary, grouped
 * by type with a total count. Used by the source-map endpoint.
 */
export function summarizeBlocks(blocks: { type: string }[]): { byType: Record<string, number>; total: number } {
  const byType: Record<string, number> = {};
  for (const b of blocks) {
    byType[b.type] = (byType[b.type] ?? 0) + 1;
  }
  return { byType, total: blocks.length };
}
