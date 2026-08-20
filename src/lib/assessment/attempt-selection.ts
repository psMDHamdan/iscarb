/**
 * Per-attempt module / scenario selection for the 4D employability path.
 *
 * Selection is a pure function of (attemptId, studentId, specialization) so
 * modules and score routes can re-derive the same set without a CMS write.
 * Rubrics stay on the catalog modules; only which modules and which scenario
 * variant are attempt-scoped.
 */

import type { AssessmentModuleSpec, DimensionId } from "./framework";
import {
  jobFitModulesFor,
  normalizeSpec,
  resolveAssessmentModuleSet,
  UNIVERSAL_MODULES,
} from "./catalog";
import { variantCount, variantFor } from "./scenario-variants";

/** How many Job-Fit modules to serve per attempt (matches historic exam shape). */
export const JOBFIT_PER_ATTEMPT = 3;

/** Target counts per universal dimension (subset so retakes can differ). */
const UNIVERSAL_PICK: Record<Exclude<DimensionId, "job_fit">, number> = {
  core_professionalism: 3,
  business_digital: 3,
  growth_potential: 2,
};

const DIM_ORDER: DimensionId[] = [
  "core_professionalism",
  "business_digital",
  "growth_potential",
];

export interface AttemptSeedInput {
  attemptId: string;
  studentId?: string | null;
  specialization: string;
}

export interface AttemptSelectionMeta {
  attemptId: string;
  seed: string;
  variantMap: Record<string, number>;
  selectedCodes: string[];
}

export interface AttemptModuleSet {
  modules: AssessmentModuleSpec[];
  jobFitSource: "curated" | "generic";
  cluster: string;
  meta: AttemptSelectionMeta;
}

/** FNV-1a 32-bit hash → unsigned int. */
function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — deterministic, no deps. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickN<T>(pool: T[], n: number, rand: () => number): T[] {
  const copy = [...pool];
  shuffleInPlace(copy, rand);
  return copy.slice(0, Math.min(n, copy.length));
}

/** Canonical seed string for an attempt (stable across modules + score). */
export function attemptSeedKey(input: AttemptSeedInput): string {
  const attempt = (input.attemptId || "default").trim() || "default";
  const student = (input.studentId || "anon").trim() || "anon";
  const spec = normalizeSpec(input.specialization || "unknown");
  return `${attempt}|${student}|${spec}`;
}

function applyVariant(
  module: AssessmentModuleSpec,
  variantIndex: number,
): AssessmentModuleSpec {
  const v = variantFor(module.code, variantIndex);
  if (!v) return { ...module };
  return {
    ...module,
    scenario: v.scenario,
    instructions: v.instructions,
  };
}

/**
 * Build the attempt-scoped module set. Without attemptId, returns the full
 * catalog set with default scenarios (legacy behaviour for callers that omit it).
 */
export function selectModulesForAttempt(
  specialization: string,
  opts: { attemptId?: string | null; studentId?: string | null } = {},
): AttemptModuleSet {
  const jf = jobFitModulesFor(specialization);
  const attemptId = (opts.attemptId || "").trim();

  // Legacy path: no attempt id → same full module set as the public API (no variation).
  if (!attemptId) {
    const resolved = resolveAssessmentModuleSet(specialization);
    return {
      modules: resolved.modules,
      jobFitSource: resolved.jobFitSource,
      cluster: resolved.cluster,
      meta: {
        attemptId: "",
        seed: "",
        variantMap: {},
        selectedCodes: resolved.modules.map((m) => m.code),
      },
    };
  }

  const seed = attemptSeedKey({
    attemptId,
    studentId: opts.studentId,
    specialization,
  });
  const rand = mulberry32(hash32(seed));
  const variantMap: Record<string, number> = {};

  // Seeded retakes draw from all modules to support 47-module assessment
  const selectedModules: AssessmentModuleSpec[] = [];
  
  for (const m of UNIVERSAL_MODULES) {
    const nAlt = variantCount(m.code);
    const variantIndex = nAlt > 0 ? Math.floor(rand() * (nAlt + 1)) : 0;
    variantMap[m.code] = variantIndex;
    selectedModules.push(applyVariant(m, variantIndex));
  }

  selectedModules.sort(
    (a, b) => {
      const idxA = DIM_ORDER.indexOf(a.dimension);
      const idxB = DIM_ORDER.indexOf(b.dimension);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    }
  );

  const modules = selectedModules;

  return {
    modules,
    jobFitSource: jf.source,
    cluster: jf.cluster,
    meta: {
      attemptId,
      seed,
      variantMap,
      selectedCodes: modules.map((m) => m.code),
    },
  };
}

/** Look up one module from the attempt-scoped set. */
export function findModuleForAttempt(
  code: string,
  specialization: string,
  opts: { attemptId?: string | null; studentId?: string | null } = {},
): AssessmentModuleSpec | null {
  const { modules } = selectModulesForAttempt(specialization, opts);
  return modules.find((m) => m.code === code) ?? null;
}
