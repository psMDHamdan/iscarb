/**
 * Unit tests for live specialization-aware exam generation (exam-time AI).
 *
 * Mocks the generator (no real LLM/DB) and the skeleton resolver to prove:
 *  - every module is overlaid with a generated scenario/task/options;
 *  - modules are generated in BATCHES (one LLM call per 4 modules) — the
 *    speed fix that replaced the old 47-call waterfall;
 *  - per-session caching reuses the same questions on re-entry;
 *  - concurrent generations for one session are deduped (prewarm + Start);
 *  - a module whose generation fails is flagged generation_failed (never
 *    silently substituted);
 *  - the scoring overlay lookup returns what was actually served.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveAssessmentModuleSet } from "@/lib/assessment/catalog";
import {
  generateSpecializationQuestion,
  generateSpecializationQuestionBatch,
  type GeneratedMCQ,
} from "@/lib/assessment/specialization-question-generator";
import {
  clearLiveExamCache,
  getLiveGeneratedOverlayForModule,
  resolveExamModulesFromLiveGeneration,
} from "@/lib/assessment/live-exam-generation";

vi.mock("@/lib/assessment/specialization-question-generator", async () => {
  const actual = await vi.importActual<typeof import("@/lib/assessment/specialization-question-generator")>(
    "@/lib/assessment/specialization-question-generator",
  );
  return {
    ...actual,
    generateSpecializationQuestion: vi.fn(),
    generateSpecializationQuestionBatch: vi.fn(),
  };
});

vi.mock("@/lib/assessment/catalog", async () => {
  const actual = await vi.importActual<typeof import("@/lib/assessment/catalog")>(
    "@/lib/assessment/catalog",
  );
  return {
    ...actual,
    resolveAssessmentModuleSet: vi.fn(),
  };
});

const mockedGenerate = vi.mocked(generateSpecializationQuestion);
const mockedBatch = vi.mocked(generateSpecializationQuestionBatch);
const mockedResolve = vi.mocked(resolveAssessmentModuleSet);

function skeletonModule(code: string, overrides: Record<string, unknown> = {}) {
  return {
    code,
    title: `Module ${code}`,
    dimension: "job_fit" as const,
    level: "L2",
    framework: "STAR method",
    focus: "Decision quality",
    scenario: `catalog scenario for ${code}`,
    instructions: `catalog task for ${code}`,
    rubric: [{ criterion: "c", weight: 100, descriptor: "d" }],
    fewShot: [] as never[],
    passThreshold: 60,
    validationEnabled: false,
    modelTag: "t",
    temperature: 0,
    specialization: null,
    generated: false,
    choices: ["a", "b", "c", "d"],
    ...overrides,
  };
}

function generatedMcq(code: string): GeneratedMCQ {
  return {
    scenario: `AI scenario for ${code}`,
    instructions: `AI decision task for ${code}`,
    choices: [
      `AI option 1 for ${code} with detailed rationale and trade-off considerations that make it plausible.`,
      `AI option 2 for ${code} with detailed rationale and trade-off considerations that make it plausible.`,
      `AI option 3 for ${code} with detailed rationale and trade-off considerations that make it plausible.`,
      `AI option 4 for ${code} with detailed rationale and trade-off considerations that make it plausible.`,
    ],
    correctIndex: 2,
    specialization: "Web Development",
    competency: "Decision quality",
    difficulty: "very_hard",
    qualityScore: {
      specializationRelevance: 9,
      competencyRelevance: 9,
      professionalRealism: 9,
      difficulty: 9,
      taskQuality: 9,
      optionQuality: 9,
      distractorPlausibility: 9,
      novelty: 9,
      overall: 9,
    },
    generatedAt: new Date().toISOString(),
  };
}

/** Mock batch: every requested item succeeds with an AI question. */
function mockBatchAllOk() {
  mockedBatch.mockImplementation(async (_spec, items) =>
    items.map((it) => ({ ok: true as const, mcq: generatedMcq(it.moduleCode) })),
  );
}

beforeEach(() => {
  clearLiveExamCache();
  mockedGenerate.mockReset();
  mockedBatch.mockReset();
  mockedResolve.mockReset();
});

describe("resolveExamModulesFromLiveGeneration", () => {
  it("overlays every module with a generated scenario/task/options via one batched call", async () => {
    mockedResolve.mockReturnValue({
      modules: [skeletonModule("M01"), skeletonModule("M02")],
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockBatchAllOk();

    const res = await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");

    expect(res.modules).toHaveLength(2);
    expect(res.liveGenerated).toBe(2);
    expect(res.generationFailed).toBe(0);
    // Both modules resolved in ONE batched LLM call, not two.
    expect(mockedBatch).toHaveBeenCalledTimes(1);
    expect(mockedBatch.mock.calls[0]![1]).toHaveLength(2);
    expect(res.modules[0]!.contentSource).toBe("live_ai");
    expect(res.modules[0]!.scenario).toBe("AI scenario for M01");
    expect(res.modules[0]!.instructions).toBe("AI decision task for M01");
    expect(res.modules[0]!.choices).toHaveLength(4);
    // Scoring-critical fields stay from catalog.
    expect(res.modules[0]!.rubric[0]!.criterion).toBe("c");
    expect(res.modules[0]!.passThreshold).toBe(60);
  });

  it("caches per (studentId, specialization) so refresh reuses the same questions", async () => {
    mockedResolve.mockReturnValue({
      modules: [skeletonModule("M01")],
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockBatchAllOk();

    const first = await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");
    const second = await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");

    expect(mockedBatch).toHaveBeenCalledTimes(1);
    expect(second.modules[0]!.scenario).toBe(first.modules[0]!.scenario);
  });

  it("dedupes concurrent full generations for the same session (prewarm + Start)", async () => {
    mockedResolve.mockReturnValue({
      modules: [skeletonModule("M01")],
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockBatchAllOk();

    const [a, b] = await Promise.all([
      resolveExamModulesFromLiveGeneration("Web Development", "stu-1"),
      resolveExamModulesFromLiveGeneration("Web Development", "stu-1"),
    ]);

    // One generation shared by both callers — identical questions, no double LLM spend.
    expect(mockedBatch).toHaveBeenCalledTimes(1);
    expect(a.modules[0]!.scenario).toBe(b.modules[0]!.scenario);
  });

  it("threads usedTopics across batches so later questions avoid earlier scenario areas", async () => {
    // 24 modules → 6 batches (BATCH_SIZE=4), 5 workers: batches 0–4 start with
    // no prior topics, batch 5 is picked up after an earlier batch completed,
    // so it deterministically receives fingerprints of earlier scenarios.
    mockedResolve.mockReturnValue({
      modules: Array.from({ length: 24 }, (_, i) => skeletonModule(`M${String(i + 1).padStart(2, "0")}`)),
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockBatchAllOk();

    await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");

    const calls = mockedBatch.mock.calls;
    expect(calls.length).toBe(6);
    // The very first batch starts with no prior topics.
    expect(calls[0]![2]).toEqual([]);
    // A later batch receives fingerprints of earlier scenarios.
    const withTopics = calls.find((c) => (c[2] ?? []).length > 0);
    expect(withTopics).toBeDefined();
    expect(withTopics![2]![0]).toContain("scenario");
  });

  it("does not share questions across different students", async () => {
    mockedResolve.mockReturnValue({
      modules: [skeletonModule("M01")],
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockBatchAllOk();

    await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");
    await resolveExamModulesFromLiveGeneration("Web Development", "stu-2");

    expect(mockedBatch).toHaveBeenCalledTimes(2);
  });

  it("flags a failed module generation_failed with NO default/catalog content", async () => {
    mockedResolve.mockReturnValue({
      modules: [skeletonModule("M01"), skeletonModule("M02")],
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockedBatch.mockImplementation(async (_spec, items) =>
      items.map((it) =>
        it.moduleCode === "M02"
          ? { ok: false as const, moduleCode: "M02", error: "QUESTION_GENERATION_FAILED after 3 attempts" }
          : { ok: true as const, mcq: generatedMcq(it.moduleCode) },
      ),
    );

    const res = await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");

    expect(res.liveGenerated).toBe(1);
    expect(res.generationFailed).toBe(1);
    const failed = res.modules.find((m) => m.code === "M02")!;
    expect(failed.contentSource).toBe("generation_failed");
    expect(failed.scenario).toBe("");
    expect(failed.instructions).toBe("");
    expect(failed.choices).toEqual([]);
    expect(failed.generationError).toContain("QUESTION_GENERATION_FAILED");
    expect(res.failures[0]!.code).toBe("M02");
  });

  it("retry regenerates ONLY the failed module (single path) and keeps the rest untouched", async () => {
    mockedResolve.mockReturnValue({
      modules: [skeletonModule("M01"), skeletonModule("M02"), skeletonModule("M03")],
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockedBatch.mockImplementation(async (_spec, items) =>
      items.map((it) =>
        it.moduleCode === "M02"
          ? { ok: false as const, moduleCode: "M02", error: "boom" }
          : { ok: true as const, mcq: generatedMcq(it.moduleCode) },
      ),
    );
    mockedGenerate.mockImplementation(async ({ moduleCode }) => generatedMcq(moduleCode));

    const first = await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");
    expect(first.generationFailed).toBe(1);
    expect(first.liveGenerated).toBe(2);

    const retried = await resolveExamModulesFromLiveGeneration("Web Development", "stu-1", {
      retryFailedOnly: true,
    });

    // Full set preserved in original order, failed module now generated.
    expect(retried.modules.map((m) => m.code)).toEqual(["M01", "M02", "M03"]);
    expect(retried.generationFailed).toBe(0);
    expect(retried.liveGenerated).toBe(3);
    expect(retried.modules[0]!.scenario).toBe("AI scenario for M01"); // untouched
    expect(retried.modules[1]!.scenario).toBe("AI scenario for M02"); // regenerated
    expect(retried.modules[1]!.contentSource).toBe("live_ai");
    // Only M02 was re-generated via the single-question path: 1 batched call
    // (initial) + 1 single call (retry).
    expect(mockedBatch).toHaveBeenCalledTimes(1);
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
  });

  it("retry keeps a module flagged when regeneration fails again", async () => {
    mockedResolve.mockReturnValue({
      modules: [skeletonModule("M01"), skeletonModule("M02")],
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockBatchAllOk();
    mockedBatch.mockImplementationOnce(async (_spec, items) =>
      items.map((it) =>
        it.moduleCode === "M02"
          ? { ok: false as const, moduleCode: "M02", error: "boom" }
          : { ok: true as const, mcq: generatedMcq(it.moduleCode) },
      ),
    );
    mockedGenerate.mockImplementation(async ({ moduleCode }) => {
      if (moduleCode === "M02") throw new Error("still broken");
      return generatedMcq(moduleCode);
    });

    await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");
    const retried = await resolveExamModulesFromLiveGeneration("Web Development", "stu-1", {
      retryFailedOnly: true,
    });

    expect(retried.modules).toHaveLength(2);
    const m02 = retried.modules.find((m) => m.code === "M02")!;
    expect(m02.contentSource).toBe("generation_failed");
    expect(m02.generationError).toContain("still broken");
    expect(retried.generationFailed).toBe(1);
  });

  it("retry with nothing failed returns the cached set without regenerating", async () => {
    mockedResolve.mockReturnValue({
      modules: [skeletonModule("M01")],
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockBatchAllOk();

    await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");
    const before = mockedBatch.mock.calls.length;
    const retried = await resolveExamModulesFromLiveGeneration("Web Development", "stu-1", {
      retryFailedOnly: true,
    });

    expect(retried.liveGenerated).toBe(1);
    expect(mockedBatch).toHaveBeenCalledTimes(before);
  });
});

describe("getLiveGeneratedOverlayForModule", () => {
  it("returns the served scenario/task/options for scoring consistency", async () => {
    mockedResolve.mockReturnValue({
      modules: [skeletonModule("M01")],
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockBatchAllOk();

    await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");
    const overlay = getLiveGeneratedOverlayForModule("stu-1", "M01");

    expect(overlay).not.toBeNull();
    expect(overlay!.scenario).toBe("AI scenario for M01");
    expect(overlay!.instructions).toBe("AI decision task for M01");
    expect(overlay!.choices).toHaveLength(4);
    expect(overlay!.questionType).toBe("mcq");
  });

  it("returns null for an unknown student or a failed module", async () => {
    mockedResolve.mockReturnValue({
      modules: [skeletonModule("M01"), skeletonModule("M02")],
      jobFitSource: "curated",
      cluster: "x",
      mode: "universal-plus-jobfit",
    });
    mockedBatch.mockImplementation(async (_spec, items) =>
      items.map((it) =>
        it.moduleCode === "M02"
          ? { ok: false as const, moduleCode: "M02", error: "boom" }
          : { ok: true as const, mcq: generatedMcq(it.moduleCode) },
      ),
    );

    await resolveExamModulesFromLiveGeneration("Web Development", "stu-1");
    expect(getLiveGeneratedOverlayForModule("other-stu", "M01")).toBeNull();
    expect(getLiveGeneratedOverlayForModule("stu-1", "M02")).toBeNull();
  });
});
