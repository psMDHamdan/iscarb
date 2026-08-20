/**
 * Assessment Engine — Property 10: Pre-Score Gate Short-Circuits AI
 * ===========================================================================
 * For any student response that evaluatePreScoreGates classifies as a
 * non-answer (Gate 1) or placeholder/template (Gate 2), scoreResponse MUST
 * return the gate-failure result without invoking chatJsonRaw,
 * scoreResponseDualCall, or heuristicScore.
 *
 * Validates: Requirements 2.5
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ─── Mock @/lib/ai-engine — track if chatJsonRaw or chatJson is called ────────
const chatJsonRawCalled = { count: 0 };
const chatJsonCalled = { count: 0 };

vi.mock("@/lib/ai-engine", () => ({
  chatJsonRaw: vi.fn(async () => {
    chatJsonRawCalled.count += 1;
    return {
      content: "{}",
      json: null,
      usage: {},
      latencyMs: 0,
      model: "gpt-4-turbo",
      guarded: false,
    };
  }),
  chatJson: vi.fn(async () => {
    chatJsonCalled.count += 1;
    return {
      content: "{}",
      json: null,
      usage: {},
      latencyMs: 0,
      model: "gpt-4-turbo",
      guarded: true,
    };
  }),
  withTimeout: vi.fn(async <T>(promise: Promise<T>) => promise),
}));

// ─── Mock ./four-block-scoring — track if scoreResponseFourBlock is called ───
const fourBlockCalled = { count: 0 };

vi.mock("@/lib/assessment/four-block-scoring", () => ({
  scoreResponseFourBlock: vi.fn(async () => {
    fourBlockCalled.count += 1;
    return { score: 75, source: "ai" };
  }),
}));

// ─── Mock ./dual-call-scoring — track if scoreResponseDualCall is called ──────
const dualCallCalled = { count: 0 };

vi.mock("@/lib/assessment/dual-call-scoring", () => ({
  scoreResponseDualCall: vi.fn(async () => {
    dualCallCalled.count += 1;
    return { score: 70, source: "ai" };
  }),
}));

// ─── Mock ./heuristics — track if heuristicScore is called ────────────────────
const heuristicCalled = { count: 0 };

vi.mock("@/lib/assessment/heuristics", () => ({
  heuristicScore: vi.fn(() => {
    heuristicCalled.count += 1;
    return { score: 50, source: "fallback" };
  }),
  heuristicValidate: vi.fn(() => true),
}));

// ─── Mock ./score-diagnostics to avoid any side-effects ─────────────────────
vi.mock("@/lib/assessment/score-diagnostics", () => ({
  buildGateFailureDiagnostics: vi.fn(() => ({})),
  buildScoringDiagnostics: vi.fn(() => ({ finalOutput: {} })),
}));

// ─── Mock @/lib/logger ────────────────────────────────────────────────────────
vi.mock("@/lib/logger", () => ({
  moduleLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { scoreResponse } from "@/lib/assessment/engine";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";

// ─── Module fixture ───────────────────────────────────────────────────────────

/**
 * A realistic module whose scenario and instructions use distinct vocabulary
 * so student responses won't accidentally be flagged as "prompt copy-back".
 */
const FIXTURE_MODULE: AssessmentModuleSpec = {
  code: "CP-ETHICS-01",
  title: "Professional Ethics in the Workplace",
  dimension: "core_professionalism",
  level: "L2",
  framework: "STAR",
  focus: "Ethical decision-making",
  scenario:
    "You are a junior accountant at a Saudi financial firm. Your manager asks you to backdate an invoice to close the quarterly books.",
  instructions:
    "Explain the specific steps you would take to respond to this request, citing relevant professional obligations and how you would protect both yourself and the organization.",
  rubric: [
    {
      criterion: "Ethical Reasoning",
      weight: 40,
      descriptor:
        "Identifies the ethical violation and articulates why it matters for a regulated entity.",
    },
    {
      criterion: "Action Steps",
      weight: 35,
      descriptor:
        "Describes concrete, sequenced actions (document, escalate, consult compliance).",
    },
    {
      criterion: "Professional Tone",
      weight: 25,
      descriptor:
        "Maintains composure and professional language; avoids blame or accusation.",
    },
  ],
  fewShot: [],
  passThreshold: 60,
  validationEnabled: false,
  modelTag: "gpt-4-turbo",
  temperature: 0.3,
  specialization: null,
  generated: false,
};

// ─── Helper: reset all call counters before each test ────────────────────────
beforeEach(() => {
  chatJsonRawCalled.count = 0;
  chatJsonCalled.count = 0;
  fourBlockCalled.count = 0;
  dualCallCalled.count = 0;
  heuristicCalled.count = 0;
  vi.clearAllMocks();
});

// ─── Helper: assert all AI / scoring paths were NOT invoked ──────────────────
function assertNoAICalled() {
  expect(fourBlockCalled.count).toBe(0);
  expect(dualCallCalled.count).toBe(0);
  expect(heuristicCalled.count).toBe(0);
  expect(chatJsonRawCalled.count).toBe(0);
  expect(chatJsonCalled.count).toBe(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 10: Pre-Score Gate Short-Circuits AI
// Validates: Requirements 2.5
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 10: Pre-Score Gate Short-Circuits AI", () => {
  // ── Gate 1 — Non-answer cases ───────────────────────────────────────────

  describe("Gate 1 — Non-answer responses: no AI paths invoked", () => {
    it("empty string triggers Gate 1 — no AI called", async () => {
      const result = await scoreResponse(FIXTURE_MODULE, "");

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });

    it("whitespace-only string triggers Gate 1 — no AI called", async () => {
      const result = await scoreResponse(FIXTURE_MODULE, "   ");

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });

    it("single word 'yes' triggers Gate 1 (< 3 words) — no AI called", async () => {
      const result = await scoreResponse(FIXTURE_MODULE, "yes");

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });

    it("two-word response 'No idea' triggers Gate 1 (< 3 words) — no AI called", async () => {
      const result = await scoreResponse(FIXTURE_MODULE, "No idea");

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });

    it("response that is purely task vocabulary copy-back triggers Gate 1 — no AI called", async () => {
      // Exact copy of scenario + instructions = near-copy of the task prompt
      const copyBack = `${FIXTURE_MODULE.scenario} ${FIXTURE_MODULE.instructions}`;
      const result = await scoreResponse(FIXTURE_MODULE, copyBack);

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });
  });

  // ── Gate 2 — Placeholder / template cases ──────────────────────────────

  describe("Gate 2 — Placeholder/template responses: no AI paths invoked", () => {
    it("two bracketed placeholders trigger Gate 2 — no AI called", async () => {
      // score-gates.ts: placeholders.length >= 2 → Gate 2
      const result = await scoreResponse(
        FIXTURE_MODULE,
        "I would first contact [manager name] and then escalate to [compliance officer].",
      );

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });

    it("single obvious placeholder [Your Name] triggers Gate 2 — no AI called", async () => {
      // score-gates.ts: single placeholder with inner matching /^(your .+)/i
      const result = await scoreResponse(
        FIXTURE_MODULE,
        "My name is [Your Name] and I am a professional accountant who would report the issue.",
      );

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });

    it("placeholder [todo] triggers Gate 2 — no AI called", async () => {
      // score-gates.ts: inner includes 'todo'
      const result = await scoreResponse(
        FIXTURE_MODULE,
        "I would take the following steps: [todo] and ensure compliance.",
      );

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });

    it("meta-disclaimer 'here's a sample you can adapt' triggers Gate 2 — no AI called", async () => {
      const result = await scoreResponse(
        FIXTURE_MODULE,
        "Here's a sample you can adapt: I would document the request and escalate to HR.",
      );

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });

    it("meta-disclaimer 'feel free to customize' triggers Gate 2 — no AI called", async () => {
      const result = await scoreResponse(
        FIXTURE_MODULE,
        "Feel free to customize this response to your situation. First, document the request.",
      );

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });

    it("unfilled markdown blanks '______' trigger Gate 2 — no AI called", async () => {
      // score-gates.ts: /_{3,}/.test(text) → Gate 2
      const result = await scoreResponse(
        FIXTURE_MODULE,
        "I would escalate to ______ and document the issue in ______ system.",
      );

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });

    it("mustache-style placeholder '{{manager}}' triggers Gate 2 — no AI called", async () => {
      // score-gates.ts: /\{\{[^{}]+\}\}/.test(text) → Gate 2
      const result = await scoreResponse(
        FIXTURE_MODULE,
        "I would speak with {{manager}} and file a report with {{compliance_team}}.",
      );

      expect(result.source).toBe("fallback");
      assertNoAICalled();
    });
  });

  // ── Gate result shape verification ─────────────────────────────────────

  describe("Gate result shape: source='fallback', gate-appropriate feedback", () => {
    it("Gate 1 result has source='fallback' and score <= 10", async () => {
      const result = await scoreResponse(FIXTURE_MODULE, "");

      expect(result.source).toBe("fallback");
      expect(result.score).toBeLessThanOrEqual(10);
    });

    it("Gate 2 result has source='fallback' and score <= 40", async () => {
      const result = await scoreResponse(
        FIXTURE_MODULE,
        "I would contact [supervisor name] and escalate to [compliance team].",
      );

      expect(result.source).toBe("fallback");
      expect(result.score).toBeLessThanOrEqual(40);
    });

    it("gate result always has passed=false (both gates score below pass threshold)", async () => {
      const gate1Result = await scoreResponse(FIXTURE_MODULE, "");
      expect(gate1Result.passed).toBe(false);

      const gate2Result = await scoreResponse(
        FIXTURE_MODULE,
        "{{template_response}} and {{fill_in_here}}",
      );
      expect(gate2Result.passed).toBe(false);
    });
  });
});
