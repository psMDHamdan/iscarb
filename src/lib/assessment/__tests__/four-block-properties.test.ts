/**
 * Four-Block Scorer — Property Tests (Tasks 3.2, 3.4–3.9)
 *
 * Covers all properties for the four-block scoring path:
 *   Property 1  (Task 3.2): Exactly ONE chatJsonRaw call, regardless of rubric size
 *   Property 2  (Task 3.4): Valid AI JSON response parses successfully without throwing
 *   Property 3  (Task 3.5): score clamped [0,100]; perCriterion[i].score clamped [0, weight]
 *   Property 4  (Task 3.6): Hard gate cap — gate score < weight*0.10 → score≤39, band="weak", passed=false
 *   Property 5  (Task 3.7): Missing required fields → throws Error("four-block: malformed AI response")
 *   Property 8  (Task 3.8): band = bandFor(score).id, passed = score >= module.passThreshold
 *   Property 9  (Task 3.9): perCriterion length = rubric length, weight/max aligned
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ─── Call-counter for Property 1 ────────────────────────────────────────────
// Must be declared BEFORE vi.mock so the factory closure captures the binding.
let callCount = 0;
// The mock payload can be swapped per test by setting mockPayload
let mockPayload: unknown = null;

vi.mock("@/lib/ai-engine", () => {
  return {
    chatJsonRaw: async (_opts: unknown) => {
      callCount += 1;
      return {
        content: JSON.stringify(mockPayload),
        json: mockPayload,
        usage: { prompt_tokens: 100, completion_tokens: 50 },
        latencyMs: 800,
        model: "gpt-4-turbo",
        guarded: false,
      };
    },
    withTimeout: async <T>(promise: Promise<T>) => promise,
  };
});

import { scoreResponseFourBlock } from "@/lib/assessment/four-block-scoring";
import { bandFor } from "@/lib/assessment/framework";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";

// ─── Module fixture helpers ──────────────────────────────────────────────────

function makeModule(
  rubric: Array<{ criterion: string; weight: number; gate?: boolean }>,
  passThreshold = 60,
): AssessmentModuleSpec {
  return {
    code: "TEST-01",
    title: "Test Module",
    dimension: "job_fit",
    level: "L2",
    framework: "STAR",
    focus: "test",
    scenario: "You are presented with a scenario.",
    instructions: "Answer thoroughly.",
    rubric: rubric.map((r) => ({
      criterion: r.criterion,
      weight: r.weight,
      descriptor: `Descriptor for ${r.criterion}`,
      gate: r.gate,
    })),
    fewShot: [],
    passThreshold,
    validationEnabled: false,
    modelTag: "gpt-4-turbo",
    temperature: 0.3,
    specialization: null,
    generated: false,
  };
}

/** Standard 3-criterion module whose weights sum to 100. */
const BASE_MODULE = makeModule([
  { criterion: "Clarity", weight: 40 },
  { criterion: "Depth", weight: 35 },
  { criterion: "Structure", weight: 25 },
]);

/** Return a well-formed AI payload aligned to the given rubric. */
function validPayload(
  rubric: Array<{ criterion: string; weight: number }>,
  score = 72,
): unknown {
  return {
    score,
    perCriterion: rubric.map((r) => ({
      criterion: r.criterion,
      score: Math.round(r.weight * 0.8),
      justification: `Good performance on ${r.criterion}.`,
    })),
    feedback: "Overall solid response demonstrating competency.",
    strengths: ["Clear argument", "Good structure"],
    improvements: ["Add more examples", "Expand technical detail"],
  };
}

beforeEach(() => {
  callCount = 0;
  mockPayload = null;
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 1: Exactly ONE chatJsonRaw call regardless of rubric size (Task 3.2)
// Validates: Requirements 1.1
// ─────────────────────────────────────────────────────────────────────────────
describe("Property 1: Four-Block Scorer Makes Exactly One AI Call", () => {
  const rubricSizes = [1, 2, 3, 4, 5];

  rubricSizes.forEach((n) => {
    it(`makes exactly 1 chatJsonRaw call with a ${n}-criterion rubric`, async () => {
      const rubric = Array.from({ length: n }, (_, i) => ({
        criterion: `Criterion${i + 1}`,
        weight: Math.floor(100 / n) + (i === 0 ? 100 - Math.floor(100 / n) * n : 0),
      }));
      // Fix weights to sum to exactly 100
      const totalBefore = rubric.reduce((s, r) => s + r.weight, 0);
      rubric[0].weight += 100 - totalBefore;

      const module = makeModule(rubric);
      mockPayload = validPayload(rubric);
      callCount = 0;

      await scoreResponseFourBlock(module, "This is my response to the scenario.");

      expect(callCount).toBe(1);
    });
  });

  it("still makes exactly 1 call even when saudiContext and fewShot are populated", async () => {
    const module: AssessmentModuleSpec = {
      ...BASE_MODULE,
      saudiContext: "Saudi Vision 2030 context",
      fewShot: [
        { response: "Basic answer", score: 40, feedback: "Needs improvement" },
        { response: "Excellent answer with detail", score: 85, feedback: "Strong performance" },
      ],
    };
    mockPayload = validPayload(BASE_MODULE.rubric);
    callCount = 0;

    await scoreResponseFourBlock(module, "A detailed student response.");

    expect(callCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 2: Valid AI JSON parses successfully without throwing (Task 3.4)
// Validates: Requirements 1.2
// ─────────────────────────────────────────────────────────────────────────────
describe("Property 2: Valid AI JSON Response Parses Without Throwing", () => {
  const validCases: Array<{ label: string; score: number }> = [
    { label: "score=0 (minimum boundary)", score: 0 },
    { label: "score=39 (top of weak band)", score: 39 },
    { label: "score=60 (pass threshold)", score: 60 },
    { label: "score=79 (top of proficient band)", score: 79 },
    { label: "score=100 (maximum boundary)", score: 100 },
    { label: "score=55 (mid-range developing)", score: 55 },
  ];

  validCases.forEach(({ label, score }) => {
    it(`parses successfully with ${label}`, async () => {
      mockPayload = validPayload(BASE_MODULE.rubric, score);

      await expect(
        scoreResponseFourBlock(BASE_MODULE, "Student response text here."),
      ).resolves.toBeDefined();
    });
  });

  it("parses when strengths and improvements are empty arrays", async () => {
    mockPayload = {
      score: 65,
      perCriterion: BASE_MODULE.rubric.map((r) => ({
        criterion: r.criterion,
        score: r.weight * 0.7,
        justification: "Acceptable.",
      })),
      feedback: "Competent response.",
      strengths: [],
      improvements: [],
    };

    await expect(
      scoreResponseFourBlock(BASE_MODULE, "A response."),
    ).resolves.toBeDefined();
  });

  it("parses when perCriterion scores are floats", async () => {
    mockPayload = {
      score: 71,
      perCriterion: BASE_MODULE.rubric.map((r) => ({
        criterion: r.criterion,
        score: r.weight * 0.75,   // float
        justification: "Adequate.",
      })),
      feedback: "Good effort.",
      strengths: ["Thorough"],
      improvements: ["Be more concise"],
    };

    const result = await scoreResponseFourBlock(BASE_MODULE, "My response.");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 3: score clamped [0,100]; perCriterion[i].score clamped [0,weight]
// (Task 3.5)
// Validates: Requirements 1.3
// ─────────────────────────────────────────────────────────────────────────────
describe("Property 3: Score and Per-Criterion Clamping Invariant", () => {
  it("clamps overall score from 150 down to 100", async () => {
    mockPayload = {
      score: 150,
      perCriterion: BASE_MODULE.rubric.map((r) => ({
        criterion: r.criterion,
        score: r.weight,
        justification: "Full marks.",
      })),
      feedback: "Excellent.",
      strengths: ["Outstanding"],
      improvements: [],
    };

    const result = await scoreResponseFourBlock(BASE_MODULE, "Response.");
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("clamps overall score from -20 up to 0", async () => {
    mockPayload = {
      score: -20,
      perCriterion: BASE_MODULE.rubric.map((r) => ({
        criterion: r.criterion,
        score: 0,
        justification: "No marks.",
      })),
      feedback: "Very poor.",
      strengths: [],
      improvements: ["Everything"],
    };

    const result = await scoreResponseFourBlock(BASE_MODULE, "Response.");
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("clamps each perCriterion score to [0, rubric weight]", async () => {
    mockPayload = {
      score: 80,
      perCriterion: BASE_MODULE.rubric.map((r) => ({
        criterion: r.criterion,
        score: r.weight + 999,   // wildly over
        justification: "Over max.",
      })),
      feedback: "Attempted.",
      strengths: ["Effort"],
      improvements: [],
    };

    const result = await scoreResponseFourBlock(BASE_MODULE, "Response.");
    result.perCriterion.forEach((pc, i) => {
      const maxWeight = BASE_MODULE.rubric[i].weight;
      expect(pc.score).toBeGreaterThanOrEqual(0);
      expect(pc.score).toBeLessThanOrEqual(maxWeight);
    });
  });

  it("clamps negative perCriterion scores up to 0", async () => {
    mockPayload = {
      score: 50,
      perCriterion: BASE_MODULE.rubric.map((r) => ({
        criterion: r.criterion,
        score: -50,
        justification: "Negative score.",
      })),
      feedback: "Poor.",
      strengths: [],
      improvements: ["Improve"],
    };

    const result = await scoreResponseFourBlock(BASE_MODULE, "Response.");
    result.perCriterion.forEach((pc) => {
      expect(pc.score).toBeGreaterThanOrEqual(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 4: Hard Gate Cap (Task 3.6)
// gate criterion score < weight*0.10 → score≤39, band="weak", passed=false
// Validates: Requirements 1.4, 7.3
// ─────────────────────────────────────────────────────────────────────────────
describe("Property 4: Hard Gate Cap Invariant", () => {
  /** Module with gate on first criterion (weight=40) */
  const GATE_MODULE = makeModule([
    { criterion: "PhishingId", weight: 40, gate: true },
    { criterion: "Response", weight: 35 },
    { criterion: "Risk", weight: 25 },
  ]);

  it("caps score at 39 when gate criterion scores < weight*0.10 (score=3, threshold=4)", async () => {
    mockPayload = {
      score: 85,         // AI would give high marks
      perCriterion: [
        { criterion: "PhishingId", score: 3, justification: "Missed the threat." },   // <40*0.10=4
        { criterion: "Response", score: 30, justification: "Good steps." },
        { criterion: "Risk", score: 22, justification: "Well articulated." },
      ],
      feedback: "Missed the core threat.",
      strengths: ["Response steps"],
      improvements: ["Identify phishing"],
    };

    const result = await scoreResponseFourBlock(GATE_MODULE, "Response.");
    expect(result.score).toBeLessThanOrEqual(39);
    expect(result.band).toBe("weak");
    expect(result.passed).toBe(false);
  });

  it("caps score at 39 when gate criterion scores exactly 0", async () => {
    mockPayload = {
      score: 90,
      perCriterion: [
        { criterion: "PhishingId", score: 0, justification: "No identification." },
        { criterion: "Response", score: 35, justification: "Excellent steps." },
        { criterion: "Risk", score: 25, justification: "Full marks." },
      ],
      feedback: "Gate failure.",
      strengths: ["Good response"],
      improvements: ["Identify phishing"],
    };

    const result = await scoreResponseFourBlock(GATE_MODULE, "Response.");
    expect(result.score).toBeLessThanOrEqual(39);
    expect(result.band).toBe("weak");
    expect(result.passed).toBe(false);
  });

  it("does NOT cap when gate criterion scores exactly at weight*0.10", async () => {
    // 40 * 0.10 = 4.0; scoring exactly 4 should NOT trigger the gate
    mockPayload = {
      score: 80,
      perCriterion: [
        { criterion: "PhishingId", score: 4, justification: "Barely passed gate." },
        { criterion: "Response", score: 30, justification: "Good." },
        { criterion: "Risk", score: 22, justification: "Good." },
      ],
      feedback: "Passed gate.",
      strengths: ["Identified threshold"],
      improvements: [],
    };

    const result = await scoreResponseFourBlock(GATE_MODULE, "Response.");
    expect(result.score).toBeGreaterThan(39);
  });

  it("does NOT cap when module has no gate criteria", async () => {
    const noGateModule = makeModule([
      { criterion: "Clarity", weight: 50 },
      { criterion: "Structure", weight: 50 },
    ]);
    mockPayload = {
      score: 75,
      perCriterion: [
        { criterion: "Clarity", score: 0, justification: "Poor clarity." },
        { criterion: "Structure", score: 0, justification: "Poor structure." },
      ],
      feedback: "Needs work.",
      strengths: [],
      improvements: ["Improve clarity"],
    };

    const result = await scoreResponseFourBlock(noGateModule, "Response.");
    // Score should be clamped to [0,100] but NOT forced to ≤39
    expect(result.score).toBeGreaterThanOrEqual(0);
    // The overall score from AI is 75 and per-criterion scores are 0, but
    // since no gate, the overall clamped score should remain 75
    expect(result.score).toBe(75);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 5: Missing required fields → throws (Task 3.7)
// Validates: Requirements 1.6
// ─────────────────────────────────────────────────────────────────────────────
describe("Property 5: Invalid AI Response Propagates Error", () => {
  const EXPECTED_ERROR = "four-block: malformed AI response";

  const missingFieldCases: Array<{ label: string; payload: unknown }> = [
    {
      label: "null (not an object)",
      payload: null,
    },
    {
      label: "array (not an object)",
      payload: [1, 2, 3],
    },
    {
      label: "missing 'score'",
      payload: {
        perCriterion: [{ criterion: "Clarity", score: 30, justification: "OK" }],
        feedback: "Good.",
        strengths: ["A"],
        improvements: ["B"],
      },
    },
    {
      label: "missing 'perCriterion'",
      payload: {
        score: 72,
        feedback: "Good.",
        strengths: ["A"],
        improvements: ["B"],
      },
    },
    {
      label: "'perCriterion' is not an array (string)",
      payload: {
        score: 72,
        perCriterion: "criterion1,criterion2",
        feedback: "Good.",
        strengths: ["A"],
        improvements: ["B"],
      },
    },
    {
      label: "'perCriterion' is not an array (object)",
      payload: {
        score: 72,
        perCriterion: { criterion: "Clarity", score: 30 },
        feedback: "Good.",
        strengths: ["A"],
        improvements: ["B"],
      },
    },
    {
      label: "missing 'feedback'",
      payload: {
        score: 72,
        perCriterion: [{ criterion: "Clarity", score: 30, justification: "OK" }],
        strengths: ["A"],
        improvements: ["B"],
      },
    },
    {
      label: "'feedback' is not a string (number)",
      payload: {
        score: 72,
        perCriterion: [{ criterion: "Clarity", score: 30, justification: "OK" }],
        feedback: 42,
        strengths: ["A"],
        improvements: ["B"],
      },
    },
    {
      label: "missing 'strengths'",
      payload: {
        score: 72,
        perCriterion: [{ criterion: "Clarity", score: 30, justification: "OK" }],
        feedback: "Good.",
        improvements: ["B"],
      },
    },
    {
      label: "'strengths' is not an array",
      payload: {
        score: 72,
        perCriterion: [{ criterion: "Clarity", score: 30, justification: "OK" }],
        feedback: "Good.",
        strengths: "very strong",
        improvements: ["B"],
      },
    },
    {
      label: "missing 'improvements'",
      payload: {
        score: 72,
        perCriterion: [{ criterion: "Clarity", score: 30, justification: "OK" }],
        feedback: "Good.",
        strengths: ["A"],
      },
    },
    {
      label: "'improvements' is not an array",
      payload: {
        score: 72,
        perCriterion: [{ criterion: "Clarity", score: 30, justification: "OK" }],
        feedback: "Good.",
        strengths: ["A"],
        improvements: "use examples",
      },
    },
    {
      label: "'score' is NaN (non-numeric string)",
      payload: {
        score: "not-a-number",
        perCriterion: [{ criterion: "Clarity", score: 30, justification: "OK" }],
        feedback: "Good.",
        strengths: ["A"],
        improvements: ["B"],
      },
    },
  ];

  missingFieldCases.forEach(({ label, payload }) => {
    it(`throws "${EXPECTED_ERROR}" when payload has ${label}`, async () => {
      mockPayload = payload;

      await expect(
        scoreResponseFourBlock(BASE_MODULE, "Student response."),
      ).rejects.toThrow(EXPECTED_ERROR);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 8: band = bandFor(score).id, passed = score >= module.passThreshold
// (Task 3.8)
// Validates: Requirements 7.1, 7.2
// ─────────────────────────────────────────────────────────────────────────────
describe("Property 8: Band and Pass Consistency", () => {
  const scoreCases: Array<{ score: number; expectedBand: string; passThreshold: number; expectedPassed: boolean }> = [
    { score: 0, expectedBand: "weak", passThreshold: 60, expectedPassed: false },
    { score: 20, expectedBand: "weak", passThreshold: 60, expectedPassed: false },
    { score: 39, expectedBand: "weak", passThreshold: 60, expectedPassed: false },
    { score: 40, expectedBand: "developing", passThreshold: 60, expectedPassed: false },
    { score: 55, expectedBand: "developing", passThreshold: 60, expectedPassed: false },
    { score: 59, expectedBand: "developing", passThreshold: 60, expectedPassed: false },
    { score: 60, expectedBand: "proficient", passThreshold: 60, expectedPassed: true },
    { score: 70, expectedBand: "proficient", passThreshold: 60, expectedPassed: true },
    { score: 79, expectedBand: "proficient", passThreshold: 60, expectedPassed: true },
    { score: 80, expectedBand: "strong", passThreshold: 60, expectedPassed: true },
    { score: 95, expectedBand: "strong", passThreshold: 60, expectedPassed: true },
    { score: 100, expectedBand: "strong", passThreshold: 60, expectedPassed: true },
    // Non-standard pass threshold
    { score: 70, expectedBand: "proficient", passThreshold: 75, expectedPassed: false },
    { score: 75, expectedBand: "proficient", passThreshold: 75, expectedPassed: true },
  ];

  scoreCases.forEach(({ score, expectedBand, passThreshold, expectedPassed }) => {
    it(`score=${score} with threshold=${passThreshold} → band="${expectedBand}", passed=${expectedPassed}`, async () => {
      const module = makeModule(
        [
          { criterion: "Clarity", weight: 50 },
          { criterion: "Structure", weight: 50 },
        ],
        passThreshold,
      );
      mockPayload = {
        score,
        perCriterion: [
          { criterion: "Clarity", score: 25, justification: "OK" },
          { criterion: "Structure", score: 25, justification: "OK" },
        ],
        feedback: "Adequate response.",
        strengths: ["Clear"],
        improvements: ["Depth"],
      };

      const result = await scoreResponseFourBlock(module, "Response.");

      expect(result.band).toBe(expectedBand);
      // Verify band matches bandFor(result.score).id (not just the expected literal)
      expect(result.band).toBe(bandFor(result.score).id);
      expect(result.passed).toBe(expectedPassed);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 9: perCriterion array alignment (Task 3.9)
// length = rubric.length, weight/max aligned to rubric
// Validates: Requirements 7.4
// ─────────────────────────────────────────────────────────────────────────────
describe("Property 9: perCriterion Array Alignment", () => {
  const rubricVariants: Array<Array<{ criterion: string; weight: number }>> = [
    // 1 criterion
    [{ criterion: "Alpha", weight: 100 }],
    // 2 criteria
    [{ criterion: "Alpha", weight: 60 }, { criterion: "Beta", weight: 40 }],
    // 3 criteria (standard)
    [
      { criterion: "Clarity", weight: 40 },
      { criterion: "Depth", weight: 35 },
      { criterion: "Structure", weight: 25 },
    ],
    // 4 criteria
    [
      { criterion: "C1", weight: 30 },
      { criterion: "C2", weight: 30 },
      { criterion: "C3", weight: 25 },
      { criterion: "C4", weight: 15 },
    ],
    // 5 criteria
    [
      { criterion: "C1", weight: 25 },
      { criterion: "C2", weight: 25 },
      { criterion: "C3", weight: 20 },
      { criterion: "C4", weight: 20 },
      { criterion: "C5", weight: 10 },
    ],
  ];

  rubricVariants.forEach((rubric, idx) => {
    it(`has exactly ${rubric.length} perCriterion entries matching rubric order (variant ${idx + 1})`, async () => {
      const module = makeModule(rubric);
      mockPayload = validPayload(rubric, 72);

      const result = await scoreResponseFourBlock(module, "My answer here.");

      // Length must match rubric length
      expect(result.perCriterion).toHaveLength(rubric.length);

      // Each entry must align with the corresponding rubric entry
      rubric.forEach((rc, i) => {
        const pc = result.perCriterion[i];
        expect(pc.criterion).toBe(rc.criterion);
        expect(pc.weight).toBe(rc.weight);
        expect(pc.max).toBe(rc.weight);
        expect(pc.score).toBeGreaterThanOrEqual(0);
        expect(pc.score).toBeLessThanOrEqual(rc.weight);
      });
    });
  });

  it("fills in missing AI perCriterion entries with score=0 rather than dropping them", async () => {
    // AI returns only ONE criterion even though rubric has 3
    mockPayload = {
      score: 60,
      perCriterion: [
        { criterion: "Clarity", score: 35, justification: "Good." },
        // "Depth" and "Structure" are absent
      ],
      feedback: "Partial.",
      strengths: ["Clarity"],
      improvements: ["Cover all criteria"],
    };

    const result = await scoreResponseFourBlock(BASE_MODULE, "Response.");

    // Must still have 3 entries
    expect(result.perCriterion).toHaveLength(BASE_MODULE.rubric.length);

    // Missing criteria should have score=0
    const depthEntry = result.perCriterion.find((pc) => pc.criterion === "Depth");
    const structureEntry = result.perCriterion.find((pc) => pc.criterion === "Structure");
    expect(depthEntry?.score).toBe(0);
    expect(structureEntry?.score).toBe(0);
  });

  it("weight and max always equal rubric[i].weight regardless of AI-supplied score", async () => {
    mockPayload = {
      score: 50,
      perCriterion: BASE_MODULE.rubric.map((r) => ({
        criterion: r.criterion,
        score: r.weight * 0.5,
        justification: "Half marks.",
      })),
      feedback: "Average.",
      strengths: ["Effort"],
      improvements: ["Depth"],
    };

    const result = await scoreResponseFourBlock(BASE_MODULE, "Response.");

    BASE_MODULE.rubric.forEach((rc, i) => {
      expect(result.perCriterion[i].weight).toBe(rc.weight);
      expect(result.perCriterion[i].max).toBe(rc.weight);
    });
  });
});
