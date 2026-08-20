/**
 * Lecture Planning — Jaheziah eligibility resolution (BRD §3.4, FR-016).
 * ===========================================================================
 * Resolves which national-alignment mode applies to a course specialty:
 *
 *   OFFICIAL_JAHEZIAH   — exact specialty match + fresh standard snapshot (≤90 days)
 *   STALE_OFFICIAL_SOURCE — exact match but snapshot older than 90 days
 *   CONFIRM_REQUIRED    — partial/ambiguous specialty match (faculty must confirm)
 *   COURSE_READINESS    — no match at all; no Jaheziah labels shown
 */
export type JaheziahMode = "OFFICIAL_JAHEZIAH" | "CONFIRM_REQUIRED" | "COURSE_READINESS" | "STALE_OFFICIAL_SOURCE";

const SNAPSHOT_STALE_DAYS = 90;

export interface StandardSnapshot {
  specialtyKey: string;
  createdAt: Date;
}

export interface JaheziahResolution {
  mode: JaheziahMode;
  candidateSpecialtyKey?: string;
  confidence?: number;
  rationale: string;
  sourceSnapshotId?: string;
  requiredAction: "confirm_standard" | null;
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
}

export function resolveJaheziahMode(specialty: string, standards: StandardSnapshot[]): JaheziahResolution {
  const target = norm(specialty);
  if (!target) {
    return { mode: "COURSE_READINESS", rationale: "No specialty provided; no Jaheziah standard can be matched.", requiredAction: null };
  }

  // 1. Exact (case-insensitive normalized) match.
  const exact = standards.find((s) => norm(s.specialtyKey) === target);
  if (exact) {
    const ageDays = (Date.now() - exact.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > SNAPSHOT_STALE_DAYS) {
      return {
        mode: "STALE_OFFICIAL_SOURCE",
        candidateSpecialtyKey: exact.specialtyKey,
        confidence: 1,
        rationale: `Exact specialty match '${exact.specialtyKey}' found but its official standard snapshot is ${Math.round(ageDays)} days old (> ${SNAPSHOT_STALE_DAYS} days).`,
        sourceSnapshotId: undefined,
        requiredAction: null,
      };
    }
    return {
      mode: "OFFICIAL_JAHEZIAH",
      candidateSpecialtyKey: exact.specialtyKey,
      confidence: 1,
      rationale: `Exact specialty match '${exact.specialtyKey}' with a current official standard snapshot.`,
      sourceSnapshotId: undefined,
      requiredAction: null,
    };
  }

  // 2. Partial / ambiguous match → faculty confirmation required.
  const partial = standards
    .map((s) => ({ standard: s, similarity: similarity(target, norm(s.specialtyKey)) }))
    .filter((x) => x.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)[0];

  if (partial && partial.similarity >= 0.4) {
    return {
      mode: "CONFIRM_REQUIRED",
      candidateSpecialtyKey: partial.standard.specialtyKey,
      confidence: partial.similarity,
      rationale: `Specialty '${specialty}' does not exactly match a Jaheziah standard; closest candidate is '${partial.standard.specialtyKey}' (confidence ${(partial.similarity * 100).toFixed(0)}%). Faculty confirmation required before official labels are shown.`,
      sourceSnapshotId: undefined,
      requiredAction: "confirm_standard",
    };
  }

  // 3. No match.
  return {
    mode: "COURSE_READINESS",
    rationale: `No Jaheziah standard found for specialty '${specialty}'. Course uses national course-readiness alignment; no Jaheziah labels are shown.`,
    requiredAction: null,
  };
}

/** Simple token-overlap similarity in [0, 1]. */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const tokensA = new Set(a.split(" ").filter(Boolean));
  const tokensB = new Set(b.split(" ").filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let overlap = 0;
  for (const t of tokensA) if (tokensB.has(t)) overlap++;
  const union = tokensA.size + tokensB.size - overlap;
  return union === 0 ? 0 : overlap / union;
}
