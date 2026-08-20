/**
 * Official Sources Hub — NCAAA parser (TASK-06 §E).
 * ===========================================================================
 * Extracts structured NCAAA accreditation requirement clauses from an official
 * snapshot using chatJson. The snapshot text is the ONLY input — the model is
 * told never to invent clauses (NFR-12), mirroring the Jaheziah parser.
 *
 * The parser returns typed clauses; callers upsert NCAAARequirement rows tied
 * to the snapshot id so the evidence workspace only ever shows requirements
 * derived from real, approved official content (AC-17).
 */
import { db } from "@/lib/db";
import { chatJson } from "@/lib/ai-engine";

const MODEL = "openai/gpt-oss-20b";

export interface NcaaaRequirementClause {
  /** e.g. "Standard 4.1" or "4.1" */
  clause: string;
  /** e.g. "clo_alignment" | "active_learning" | "assessment_rubrics" | ... */
  evidenceType: string;
}

export interface NcaaaParseResult {
  requirements: NcaaaRequirementClause[];
}

export class NcaaaParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NcaaaParseError";
  }
}

const EVIDENCE_TYPE_HINT = [
  "clo_alignment",
  "active_learning",
  "assessment_rubrics",
  "source_attribution",
  "national_vision",
  "program_identity",
  "faculty_qualifications",
  "student_support",
  "quality_assurance",
].join(", ");

/**
 * Parse an official NCAAA standards snapshot into requirement clauses.
 * `snapshotId` must reference a real AuthoritativeSourceSnapshot. Only the
 * snapshot's contentText is sent to the model — nothing from model memory.
 */
export async function parseNcaaaStandard(snapshotId: string): Promise<NcaaaParseResult> {
  const snapshot = await db.authoritativeSourceSnapshot.findUnique({
    where: { id: snapshotId },
  });
  if (!snapshot) throw new NcaaaParseError(`Snapshot not found: ${snapshotId}`);

  const system =
    "You are a strict document parser for Saudi NCAAA (National Center for Academic Accreditation " +
    "and Evaluation) accreditation standards. Extract the requirement clauses that are actually " +
    "present in the document. Never invent standards, clauses, or sub-clauses (NFR-12). " +
    "Return STRICT JSON only, no prose.";
  const user = [
    `Parse this NCAAA standards document.`,
    `Extract each numbered accreditation requirement clause and classify its evidence type.`,
    `Clause ids look like "4.1", "Standard 4.1", "11.2", etc. Keep the original numbering.`,
    `Evidence type must be one of: ${EVIDENCE_TYPE_HINT}.`,
    `Return STRICT JSON: { "requirements": [{ "clause": string, "evidenceType": string }] }.`,
    `Source: ${snapshot.contentText.slice(0, 12000)}`,
  ].join("\n");

  const result = await chatJson({ system, user, temperature: 0.1, model: MODEL });

  if (!result.json || (result.json as { fallback?: boolean }).fallback === true) {
    throw new NcaaaParseError("Model returned no parseable JSON");
  }

  const raw = (result.json as { requirements?: unknown }).requirements;
  if (!Array.isArray(raw)) {
    throw new NcaaaParseError("Model response missing requirements array");
  }

  const requirements: NcaaaRequirementClause[] = [];
  for (const item of raw) {
    const rec = (item ?? {}) as Record<string, unknown>;
    const clause = String(rec.clause ?? rec.id ?? "").trim();
    const evidenceType = String(rec.evidenceType ?? "quality_assurance").trim();
    if (clause) requirements.push({ clause, evidenceType });
  }
  if (requirements.length === 0) {
    throw new NcaaaParseError("No requirements extracted from the snapshot");
  }

  return { requirements };
}
