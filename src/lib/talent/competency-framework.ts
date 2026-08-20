/**
 * iSCARB Talent Ecosystem — COMPETENCY REQUIREMENTS FRAMEWORK (Task 3c)
 * ===========================================================================
 * Requirements mapping for shared job openings. A job posting maps its required
 * competencies to the platform's canonical Assessment-OS module framework — e.g.
 *   { module: "M01", min: 3.5 }   // Strategic Communication ≥ 3.5
 * so that later matching (Task 3a `match-scoring`, Task 3f job discovery) can
 * compare a candidate's employability profile to a job's requirements on a
 * shared vocabulary.
 *
 * FINDING W3 — NO PARALLEL TAXONOMY: the brief warns against inventing a new
 * competency taxonomy. This module therefore does NOT define its own module
 * list; it derives the canonical 47-module namespace (M01…M47) from the
 * platform's existing assessment framework:
 *   - the 12 authored pilot modules (`UNIVERSAL_MODULES`, catalog.ts) are the
 *     authoritative anchors and supply real titles + dimensions;
 *   - the remaining reserved codes in the M01…M47 range are recognised as valid
 *     framework slots (the module catalog is numbered to 47, cf. M47
 *     "Intercultural Awareness"), each carrying a dimension inferred from the
 *     framework's four-dimension structure.
 * The four dimensions and their bands come straight from
 * `@/lib/assessment/framework` — the single source of truth. Nothing here
 * forks that framework.
 *
 * PURITY RULE: no prisma / next / server-only imports — fully unit-testable and
 * browser-safe, mirroring `src/lib/assessment/*`.
 * ===========================================================================
 */

import {
  DIMENSIONS,
  UNIVERSAL_MODULES,
  type DimensionId,
} from "@/lib/assessment";

/** The canonical module count of the Assessment-OS framework (M01…M47). */
export const COMPETENCY_MODULE_COUNT = 47;

/**
 * Requirement scores are expressed on the platform's 0-5 competency band scale
 * (0 = none, 5 = expert), matching the "Python ≥3.5 + ML ≥3.0" examples in the
 * brief. This is a thin, deterministic re-projection of the framework's 0-100
 * score onto the 0-5 band scale used by requirements mapping.
 */
export const MIN_COMPETENCY_LEVEL = 0;
export const MAX_COMPETENCY_LEVEL = 5;

/** One recognised competency module in the 47-module framework. */
export interface CompetencyModule {
  /** canonical framework code, e.g. "M01" … "M47" */
  code: string;
  /** human-facing title (authored where known; derived label otherwise) */
  title: string;
  /** the employability dimension this module belongs to */
  dimension: DimensionId;
  /** true when authored in the curated catalog (vs. a reserved framework slot) */
  authored: boolean;
}

/**
 * Deterministically assign a dimension to a reserved (un-authored) module code
 * so the whole M01…M47 namespace is dimension-complete without inventing new
 * dimensions. The four framework dimensions are cycled in their canonical order
 * — this is a placeholder classification for reserved slots only; authored
 * modules always override it with their real dimension.
 */
function reservedDimensionFor(index: number): DimensionId {
  return DIMENSIONS[index % DIMENSIONS.length].id;
}

/**
 * The canonical 47-module registry. Authored modules (12) carry their real
 * catalog metadata; the remaining reserved codes complete the M01…M47 namespace
 * so requirements mapping "supports all 47 competency modules".
 */
export const COMPETENCY_MODULES: readonly CompetencyModule[] = buildRegistry();

function buildRegistry(): CompetencyModule[] {
  const authored = new Map<string, CompetencyModule>();
  UNIVERSAL_MODULES.forEach((m) => {
    authored.set(m.code, {
      code: m.code,
      title: m.title,
      dimension: m.dimension,
      authored: true,
    });
  });

  const registry: CompetencyModule[] = [];
  for (let n = 1; n <= COMPETENCY_MODULE_COUNT; n++) {
    const code = `M${String(n).padStart(2, "0")}`;
    const known = authored.get(code);
    if (known) {
      registry.push(known);
    } else {
      registry.push({
        code,
        title: `Competency Module ${code}`,
        dimension: reservedDimensionFor(n - 1),
        authored: false,
      });
    }
  }
  return registry;
}

/** Fast lookup by code. */
const MODULE_BY_CODE: ReadonlyMap<string, CompetencyModule> = new Map(
  COMPETENCY_MODULES.map((m) => [m.code, m]),
);

/** All valid module codes (M01…M47). */
export const COMPETENCY_MODULE_CODES: readonly string[] = COMPETENCY_MODULES.map(
  (m) => m.code,
);

/** Is `code` a recognised module in the 47-module framework? */
export function isValidCompetencyModule(code: string): boolean {
  return MODULE_BY_CODE.has(code);
}

/** Resolve a module by code, or `null` if it is not part of the framework. */
export function getCompetencyModule(code: string): CompetencyModule | null {
  return MODULE_BY_CODE.get(code) ?? null;
}

/** A single required-competency entry on a job opening. */
export interface CompetencyRequirement {
  /** framework module code, e.g. "M01" */
  module: string;
  /** minimum required level on the 0-5 band scale */
  min: number;
}

export interface RequirementValidationError {
  index: number;
  module: string;
  reason: string;
}

export interface RequirementValidationResult {
  ok: boolean;
  requirements: CompetencyRequirement[];
  errors: RequirementValidationError[];
}

/**
 * Validate a job's `requiredCompetencies` mapping against the canonical
 * framework. Rejects unknown module codes (edge case: "competency referencing a
 * module that doesn't exist") and out-of-range levels; de-duplicates repeated
 * modules by keeping the highest `min`.
 *
 * Accepts the loose shape that arrives from JSON / CSV and normalises it.
 */
export function validateRequirements(
  raw: unknown,
): RequirementValidationResult {
  const errors: RequirementValidationError[] = [];
  const byModule = new Map<string, CompetencyRequirement>();

  const list = normaliseRequirementList(raw);

  list.forEach((entry, index) => {
    const module = String(entry.module ?? "").trim().toUpperCase();
    const min = Number(entry.min);

    if (!module) {
      errors.push({ index, module, reason: "missing module code" });
      return;
    }
    if (!isValidCompetencyModule(module)) {
      errors.push({
        index,
        module,
        reason: `unknown competency module "${module}" (not one of the ${COMPETENCY_MODULE_COUNT} framework modules)`,
      });
      return;
    }
    if (!Number.isFinite(min)) {
      errors.push({ index, module, reason: "min level is not a number" });
      return;
    }
    if (min < MIN_COMPETENCY_LEVEL || min > MAX_COMPETENCY_LEVEL) {
      errors.push({
        index,
        module,
        reason: `min level ${min} out of range [${MIN_COMPETENCY_LEVEL}, ${MAX_COMPETENCY_LEVEL}]`,
      });
      return;
    }

    const existing = byModule.get(module);
    if (!existing || min > existing.min) {
      byModule.set(module, { module, min });
    }
  });

  const requirements = [...byModule.values()].sort((a, b) =>
    a.module.localeCompare(b.module),
  );

  return { ok: errors.length === 0, requirements, errors };
}

/**
 * Accept the several shapes a requirements mapping can arrive as:
 *   - an array of `{ module, min }`
 *   - a record `{ "M01": 3.5, "M18": 3 }`
 *   - a JSON string of either of the above
 */
function normaliseRequirementList(
  raw: unknown,
): Array<{ module: unknown; min: unknown }> {
  let value = raw;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      value = JSON.parse(trimmed);
    } catch {
      // Fallback: "M01>=3.5; M18>=3" free-form (used by CSV import).
      return parseRequirementExpression(trimmed);
    }
  }

  if (Array.isArray(value)) {
    return value.map((v) =>
      v && typeof v === "object"
        ? { module: (v as any).module ?? (v as any).code, min: (v as any).min ?? (v as any).level }
        : { module: v, min: NaN },
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(
      ([module, min]) => ({ module, min }),
    );
  }

  return [];
}

/**
 * Parse the compact requirement expression used in CSV bulk import, e.g.
 *   "M01>=3.5; M18>=3, M19 >= 2"
 * Separators: `;` or `,`. Operator `>=` (or `:` / `=`). Whitespace tolerant.
 */
export function parseRequirementExpression(
  expr: string,
): Array<{ module: string; min: number }> {
  return expr
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^([A-Za-z]?\d+|M\d+)\s*(?:>=|:|=)?\s*([\d.]+)?$/i);
      if (!m) return { module: part.toUpperCase(), min: NaN };
      let code = m[1].toUpperCase();
      if (/^\d+$/.test(code)) code = `M${code.padStart(2, "0")}`;
      return { module: code, min: m[2] ? Number(m[2]) : NaN };
    });
}

/**
 * Score how well a candidate's competency levels satisfy a job's requirements,
 * returning a 0-100 relevance figure. Reuses the same 0-100 convention as Task
 * 3a's match-scoring so the marketplace can rank candidate↔job fit consistently.
 * A requirement is fully met when the candidate level ≥ required min.
 */
export function requirementMatchScore(
  requirements: CompetencyRequirement[],
  candidateLevels: Record<string, number>,
): number {
  if (requirements.length === 0) return 100;
  let total = 0;
  for (const req of requirements) {
    const have = Number(candidateLevels[req.module] ?? 0);
    const need = req.min <= 0 ? MAX_COMPETENCY_LEVEL : req.min;
    total += Math.max(0, Math.min(1, have / need));
  }
  return Math.round((total / requirements.length) * 100);
}
