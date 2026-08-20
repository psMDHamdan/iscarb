/**
 * Live specialization-aware exam generation (exam-time AI).
 *
 * Resolves the same 47-module skeleton as the bank path
 * (resolveAssessmentModuleSet) and overlays every module with a freshly
 * generated, specialization-bound scenario, decision task and four detailed
 * plausible options via generateSpecializationQuestion (9-check validator +
 * generate → critique → regenerate loop, quality thresholds).
 *
 * Guarantees (per the iSCARB FINAL IMPLEMENTATION PROMPT):
 *  - The specialization is a hard constraint supplied by the app.
 *  - Old / generic / seeded questions are never silently served: a module
 *    whose generation fails after retries is kept with catalog content but
 *    flagged contentSource="generation_failed" (never silent substitution).
 *  - Per-session cache (studentId::specialization) so refresh / re-entry
 *    reuses the exact same served questions — this also keeps scoring
 *    consistent (see trusted-module live overlay lookup).
 *
 * KNOWN LIMITATION: the overlay cache is process-local. On a multi-instance /
 * serverless deployment, or after a restart between exam start and finish,
 * getLiveGeneratedOverlayForModule may miss and the trusted scorer falls back
 * to bank / catalog content for the scenario/options (rubric always stays
 * from the catalog, so scores remain valid but the prompt context may differ
 * from what the candidate read). For a single-instance deployment the cache
 * is fully consistent.
 */
import "server-only";

import { resolveAssessmentModuleSet } from "@/lib/assessment/catalog";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";
import { mapWithConcurrency } from "@/lib/assessment/score-concurrency";
import {
  BATCH_SIZE,
  generateSpecializationQuestion,
  generateSpecializationQuestionBatch,
  type GeneratedMCQ,
} from "@/lib/assessment/specialization-question-generator";
import { withTimeout } from "@/lib/ai-engine";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("live-exam-generation");

// ── Toggles / budget ─────────────────────────────────────────────────────────
/** Disable live generation with EXAM_LIVE_GENERATION="false". */
export const liveGenerationEnabled = (): boolean =>
  (process.env.EXAM_LIVE_GENERATION ?? "false").toLowerCase() === "true";

/** In-process per-session cache TTL — long enough for a full exam attempt. */
const CACHE_TTL_MS = 6 * 60 * 60_000;

/** Cap parallel batched LLM calls across NVIDIA key pool.
 * 5 = number of NVIDIA keys (ai-engine round-robin sweet spot; higher
 * concurrency caused 429s / 100–185s spikes). Also lets later batches
 * deterministically receive fingerprints of earlier scenarios. */
const GENERATION_CONCURRENCY = 5;

/** Wall-clock budget for one module's generation (incl. retries). */
const MODULE_BUDGET_MS = 600_000;

/** Wall-clock budget for one batch (4 modules) incl. straggler retries.
 * Worst case: 2 batched attempts (each ≤ 260s) + up to 4 single-question
 * fallbacks (each internally bounded at 130s × 3 attempts = 390s) — the
 * budget must exceed that so one slow straggler never fails its siblings.
 * Internal per-call timeouts bound everything, so this is just headroom. */
const CHUNK_BUDGET_MS = 1_800_000;

// ── Types ────────────────────────────────────────────────────────────────────
export type LiveExamContentSource = "live_ai" | "generation_failed" | "generating_in_background";

export type LiveExamModule = AssessmentModuleSpec & {
  contentSource: LiveExamContentSource;
  generationError?: string | null;
  /** Retained for server-side keyed scoring of live-generated previews. */
  correctIndex?: number;
};

export type LiveExamResolution = {
  modules: LiveExamModule[];
  jobFitSource: "curated" | "generic";
  cluster: string;
  mode: "universal-plus-jobfit";
  liveGenerated: number;
  generationFailed: number;
  failures: { code: string; error: string }[];
};

type CachedExam = {
  modules: LiveExamModule[];
  jobFitSource: "curated" | "generic";
  cluster: string;
  mode: "universal-plus-jobfit";
  generatedAt: number;
};

const cache = new Map<string, CachedExam>();

// In-flight dedupe: a background prewarm and the Start click must share ONE
// generation per session — otherwise the student could be served two different
// question sets and the scoring overlay would mismatch what they read.
const inflight = new Map<string, Promise<LiveExamResolution>>();

function cacheKey(studentId: string | null | undefined, specialization: string): string {
  return `${studentId || "anon"}::${specialization}`;
}

// ── Cross-module variety (spec §24–25) ───────────────────────────────────────
// Best-effort topic fingerprint of a generated scenario. Threaded into the
// next module's system prompt so 47 questions never repeat the same situation
// (e.g. "API contract conflict" should not appear 6 times in one exam).
const STOP_WORDS = new Set([
  "which", "should", "would", "about", "after", "before", "during", "between",
  "against", "while", "their", "there", "these", "those", "under", "within",
  "because", "however", "through", "across", "company", "organization",
  "situation", "scenario", "problem", "decision", "candidate", "department",
  "production", "including", "although", "required", "currently", "already",
  "several", "recently", "discovered", "working", "asked", "wants", "needs",
]);

function fingerprintScenario(scenario: string): string {
  const words = scenario
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOP_WORDS.has(w));
  const sig = words.slice(0, 7).join(" ");
  return sig || scenario.slice(0, 60);
}

// ── Overlay ──────────────────────────────────────────────────────────────────
/**
 * Overlay a generated question onto the catalog module. Scoring-critical
 * fields (rubric, fewShot, passThreshold, level, dimension) stay from the
 * catalog — the LLM only provides display content (scenario/task/options).
 */
function overlayFromGenerated(
  catalog: AssessmentModuleSpec,
  gen: GeneratedMCQ,
): AssessmentModuleSpec & { correctIndex?: number } {
  return {
    ...catalog,
    scenario: gen.scenario,
    scenarioAr: gen.scenarioAr,
    instructions: gen.instructions,
    instructionsAr: gen.instructionsAr,
    choices: gen.choices.map((c) => String(c).replace(/^(?:Option\s*\d+|Option\s*[A-D]|[A-D])\s*[\:\.\-]\s*/i, "").trim()),
    choicesAr: gen.choicesAr ? gen.choicesAr.map((c) => String(c).replace(/^(?:الخيار\s*\d+|[أ-د])\s*[\:\.\-]\s*/i, "").trim()) : undefined,
    questionType: "mcq",
    generated: true,
    correctIndex: gen.correctIndex,
    rubric: catalog.rubric.map((r) => ({ ...r })),
    fewShot: (catalog.fewShot ?? []).map((a) => ({ ...a })),
  };
}

// ── Main resolver ────────────────────────────────────────────────────────────
/**
 * Resolve the exam's 47 modules with live specialization-aware generation.
 * Cached per (studentId, specialization) so a refresh never regenerates and
 * the student always re-sees the exact questions they started with.
 */
/**
 * Options for resolveExamModulesFromLiveGeneration.
 * - retryFailedOnly: re-generate ONLY modules currently flagged generation_failed
 *   (keeps the successful live_ai content). Used by the UI's per-question retry.
 */
export type LiveGenerationOptions = {
  retryFailedOnly?: boolean;
};

/** Generate a single module's live question (throws on failure). */
async function generateModuleQuestion(
  module: AssessmentModuleSpec,
  specialization: string,
  usedTopics: string[],
): Promise<AssessmentModuleSpec> {
  const gen = await withTimeout(
    generateSpecializationQuestion({
      specialization,
      competency: module.focus || module.title,
      moduleCode: module.code,
      moduleTitle: module.title,
      moduleFramework: module.framework,
      usedTopics,
    }),
    MODULE_BUDGET_MS,
    `live-gen:${module.code}`,
  );
  return overlayFromGenerated(module, gen);
}

export async function resolveExamModulesFromLiveGeneration(
  specialization: string,
  studentId?: string | null,
  opts?: LiveGenerationOptions,
): Promise<LiveExamResolution> {
  const key = cacheKey(studentId, specialization);
  const hit = cache.get(key);
  const retryFailedOnly = opts?.retryFailedOnly === true;

  // Retry path: regenerate only the failed modules from the cached set, then
  // return the merged result. No default/catalog content is ever served.
  if (retryFailedOnly && hit && Date.now() - hit.generatedAt < CACHE_TTL_MS) {
    const failed = hit.modules.filter((m) => m.contentSource === "generation_failed");
    if (failed.length === 0) return cachedResolution(hit);

    log.info({ specialization, studentId, retryCount: failed.length }, "live exam retry — regenerating failed modules");
    const settled = await mapWithConcurrency(
      failed,
      GENERATION_CONCURRENCY,
      async (module) => {
        try {
          const out = await generateModuleQuestion(module, specialization, []);
          // The input module was flagged generation_failed — never carry its
          // stale error/flag onto the freshly generated twin.
          return { ...out, contentSource: "live_ai" as const, generationError: null };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          log.warn({ specialization, code: module.code, error: msg }, "live exam retry failed again");
          return {
            ...module,
            contentSource: "generation_failed",
            generationError: msg.slice(0, 300),
          };
        }
      },
    );
    // mapWithConcurrency returns allSettled shapes; the callback never rejects
    // (all errors are caught), so unwrap to the plain regenerated modules.
    const regenerated: LiveExamModule[] = settled.map((g, i) =>
      g.status === "fulfilled"
        ? g.value
        : {
            ...failed[i]!,
            contentSource: "generation_failed",
            generationError: "generation worker failed",
          },
    );
    // Replace each failed module with its regenerated twin, preserving the
    // original order and all successful modules untouched.
    const byCode = new Map(regenerated.map((m) => [m.code, m]));
    const merged: LiveExamModule[] = hit.modules.map((m) => byCode.get(m.code) ?? m);
    const next: CachedExam = {
      modules: merged,
      jobFitSource: hit.jobFitSource,
      cluster: hit.cluster,
      mode: hit.mode,
      generatedAt: Date.now(),
    };
    cache.set(key, next);
    return cachedResolution(next);
  }

  if (hit && Date.now() - hit.generatedAt < CACHE_TTL_MS && !retryFailedOnly) {
    log.debug({ specialization, studentId }, "live exam served from per-session cache");
    return cachedResolution(hit);
  }

  // Dedupe concurrent full generations for the same session (background prewarm
  // and the Start click share one generation — consistent questions, no double
  // LLM spend).
  const existing = inflight.get(key);
  if (existing) {
    log.debug({ specialization, studentId }, "live exam generation already in flight — returning placeholder");
    const skeleton = resolveAssessmentModuleSet(specialization);
    return {
      modules: skeleton.modules.map((m) => ({ ...m, contentSource: "generating_in_background" as const })),
      jobFitSource: skeleton.jobFitSource,
      cluster: skeleton.cluster,
      mode: skeleton.mode,
      liveGenerated: 0,
      generationFailed: 0,
      failures: [],
    };
  }

  const promise = (async () => {
    const skeleton = resolveAssessmentModuleSet(specialization);
    const failures: { code: string; error: string }[] = [];
    let liveGenerated = 0;

    // Shared accumulator of already-generated scenario topics (best-effort —
    // workers complete concurrently, so later batches see the topics finished
    // so far; sibling questions within a batch are differentiated by their own
    // module/competency in the batch prompt).
    const usedTopics: string[] = [];

    // One batched LLM call per BATCH_SIZE modules → ~12 calls instead of 47.
    const chunks: AssessmentModuleSpec[][] = [];
    for (let i = 0; i < skeleton.modules.length; i += BATCH_SIZE) {
      chunks.push(skeleton.modules.slice(i, i + BATCH_SIZE));
    }

    const generated = await mapWithConcurrency(
      chunks,
      GENERATION_CONCURRENCY,
      async (chunk) => {
        const results = await withTimeout(
          generateSpecializationQuestionBatch(
            specialization,
            chunk.map((m) => ({
              competency: m.focus || m.title,
              moduleCode: m.code,
              moduleTitle: m.title,
              moduleFramework: m.framework,
            })),
            usedTopics.slice(),
          ),
          CHUNK_BUDGET_MS,
          `live-gen:${chunk[0]!.code}`,
        );
        const out: LiveExamModule[] = [];
        for (let i = 0; i < chunk.length; i++) {
          const module = chunk[i]!;
          const r = results[i];
          if (r?.ok) {
            liveGenerated += 1;
            usedTopics.push(fingerprintScenario(r.mcq.scenario));
            out.push({ ...overlayFromGenerated(module, r.mcq), contentSource: "live_ai" });
          } else {
            const msg = r?.error ?? "batch generation failed";
            failures.push({ code: module.code, error: msg.slice(0, 300) });
            log.warn(
              { specialization, code: module.code, error: msg.slice(0, 300) },
              "live exam generation failed for module — flagged, retryable, no default content served",
            );
            // NO default/catalog content: scenario/instructions/choices are all
            // blanked — the module only carries its identity + a clear error flag.
            // The UI shows a retry state; it is never answered.
            out.push({
              ...module,
              scenario: "",
              instructions: "",
              choices: [] as string[],
              questionType: "mcq",
              contentSource: "generation_failed",
              generationError: msg.slice(0, 300),
            });
          }
        }
        return out;
      },
    );

    // The callback never rejects (all errors are caught above); this mapping is
    // a defensive allSettled-shape guard only — if a chunk worker somehow still
    // rejects, its modules are blanked (never default content).
    const modules: LiveExamModule[] = [];
    generated.forEach((g, ci) => {
      if (g.status === "fulfilled") {
        modules.push(...g.value);
      } else {
        for (const module of chunks[ci] ?? []) {
          modules.push({
            ...module,
            scenario: "",
            instructions: "",
            choices: [] as string[],
            questionType: "mcq",
            contentSource: "generation_failed",
            generationError: "generation worker failed",
          });
        }
      }
    });

    const cached: CachedExam = {
      modules,
      jobFitSource: skeleton.jobFitSource,
      cluster: skeleton.cluster,
      mode: skeleton.mode,
      generatedAt: Date.now(),
    };
    cache.set(key, cached);
    return cachedResolution(cached);
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  const skeleton = resolveAssessmentModuleSet(specialization);
  return {
    modules: skeleton.modules.map((m) => ({ ...m, contentSource: "generating_in_background" as const })),
    jobFitSource: skeleton.jobFitSource,
    cluster: skeleton.cluster,
    mode: skeleton.mode,
    liveGenerated: 0,
    generationFailed: 0,
    failures: [],
  };
}

function cachedResolution(entry: CachedExam): LiveExamResolution {
  return {
    modules: entry.modules,
    jobFitSource: entry.jobFitSource,
    cluster: entry.cluster,
    mode: entry.mode,
    liveGenerated: entry.modules.filter((m) => m.contentSource === "live_ai").length,
    generationFailed: entry.modules.filter((m) => m.contentSource === "generation_failed").length,
    failures: entry.modules
      .filter((m) => m.contentSource === "generation_failed" && m.generationError)
      .map((m) => ({ code: m.code, error: m.generationError as string })),
  };
}

// ── Scoring consistency ──────────────────────────────────────────────────────
export type LiveScenarioOverlay = {
  scenario?: string;
  instructions?: string;
  choices?: string[];
  questionType?: string;
};

/**
 * Look up the live-generated overlay that was actually served to this student
 * so scoring uses the same scenario / task / options the candidate saw.
 * Returns null when there is no cached live exam for this student (the
 * trusted scorer then falls back to bank / catalog content).
 */
export function getLiveGeneratedOverlayForModule(
  studentId: string | null | undefined,
  moduleCode: string,
): LiveScenarioOverlay | null {
  if (!studentId) return null;
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (!key.startsWith(`${studentId}::`)) continue;
    if (now - entry.generatedAt > CACHE_TTL_MS) continue;
    const m = entry.modules.find((x) => x.code === moduleCode);
    if (m?.contentSource === "live_ai") {
      return {
        scenario: m.scenario,
        instructions: m.instructions,
        choices: Array.isArray(m.choices) ? m.choices.map(String) : undefined,
        questionType: "mcq",
      };
    }
  }
  return null;
}

/** Test-only: clear the per-session cache. */
export function clearLiveExamCache(): void {
  cache.clear();
}

/**
 * Server-side keyed lookup for live-generated questions (non-student preview
 * scoring). Non-student sessions have no DB attempt — the questions they see
 * come from this cache, so the score route must resolve the key here too.
 * Matches the modules route's cache key (studentId || "preview").
 */
export function getLiveGeneratedKeyedQuestion(
  studentId: string | null | undefined,
  specialization: string,
  moduleCode: string,
): {
  code: string;
  title: string;
  titleAr: string | null;
  dimension: string;
  framework: string;
  scenario: string;
  instructions: string;
  choices: string[];
  correctIndex: number;
} | null {
  const now = Date.now();
  const keys = [
    cacheKey(studentId || "preview", specialization),
    // Fall back to any live cache entry for this specialty — a stale id or
    // alias mismatch must not block scoring when the question exists.
    ...(studentId ? [cacheKey(studentId, specialization)] : []),
  ];
  for (const key of keys) {
    const entry = cache.get(key);
    if (!entry || now - entry.generatedAt > CACHE_TTL_MS) continue;
    const m = entry.modules.find((x) => x.code === moduleCode);
    if (m?.contentSource === "live_ai" && Number.isInteger(m.correctIndex) && m.correctIndex! >= 0 && m.correctIndex! <= 3) {
      return {
        code: m.code,
        title: m.title,
        titleAr: m.titleAr ?? null,
        dimension: m.dimension,
        framework: m.framework,
        scenario: m.scenario,
        instructions: m.instructions,
        choices: Array.isArray(m.choices) ? m.choices.map(String) : [],
        correctIndex: m.correctIndex!,
      };
    }
  }
  return null;
}


