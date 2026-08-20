import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { validateStructuralKey } from "../key-validation";
import {
  canonicalIndexFromShuffledSelection,
  resolveSelectedCanonicalIndex,
  scoreKeyedMcq,
} from "../keyed-mcq-scoring";
import { choiceShuffleSeed, sanitizeChoiceStrings, sanitizeExamModuleForClient } from "../public-question-payload";
import type { AttemptExamQuestion } from "../attempt-exam-set";

const question: AttemptExamQuestion = {
  code: "M01",
  title: "Integrity",
  titleAr: null,
  dimension: "core_professionalism",
  level: "L2",
  framework: "test",
  focus: "ethics",
  passThreshold: 60,
  estimateMinutes: 2,
  specialization: null,
  scenario: "A colleague asks you to hide an error.",
  instructions: "What should you do?",
  choices: ["Hide it", "Report it", "Ignore it", "Blame someone else"],
  correctIndex: 1,
  contentSource: "live_ai",
  validation: {
    structural: true,
    independentVerify: true,
    generateAttempts: 2,
    verifyAttempts: 2,
    regenerated: true,
  },
};

describe("validateStructuralKey", () => {
  it("accepts 4 distinct options and an in-range index", () => {
    expect(validateStructuralKey({
      scenario: "s",
      instructions: "i",
      choices: ["a", "b", "c", "d"],
      correctIndex: 2,
    }).ok).toBe(true);
  });

  it("rejects duplicates, empties, and out-of-range keys", () => {
    expect(validateStructuralKey({
      scenario: "s",
      instructions: "i",
      choices: ["a", "a", "c", "d"],
      correctIndex: 0,
    }).ok).toBe(false);
    expect(validateStructuralKey({
      scenario: "s",
      instructions: "i",
      choices: ["a", "b", "c", ""],
      correctIndex: 0,
    }).ok).toBe(false);
    expect(validateStructuralKey({
      scenario: "s",
      instructions: "i",
      choices: ["a", "b", "c", "d"],
      correctIndex: 4,
    }).ok).toBe(false);
  });
});

describe("keyed MCQ scoring", () => {
  it("fully-correct is 100 / strong", () => {
    const scored = scoreKeyedMcq({ question, selectedCanonicalIndex: 1 });
    expect(scored.score).toBe(100);
    expect(scored.passed).toBe(true);
    expect(scored.source).toBe("keyed_mcq");
    expect(scored.model).toBe("keyed_mcq");
    expect(scored.latencyMs).toBeLessThan(50);
  });

  it("fully-wrong is 0 / weak", () => {
    const scored = scoreKeyedMcq({ question, selectedCanonicalIndex: 0 });
    expect(scored.score).toBe(0);
    expect(scored.passed).toBe(false);
    expect(scored.band).toBe("weak");
  });

  it("maps shuffled selectedIndex back to the canonical key", () => {
    const seed = choiceShuffleSeed("att-1", "stu-1", "M01");
    const shuffled = sanitizeChoiceStrings(question.choices, seed);
    const displayIndex = shuffled.indexOf("Report it");
    expect(displayIndex).toBeGreaterThanOrEqual(0);
    const canonical = canonicalIndexFromShuffledSelection(question.choices, displayIndex, seed);
    expect(canonical).toBe(1);
    const resolved = resolveSelectedCanonicalIndex({
      question,
      selectedIndex: displayIndex,
      attemptId: "att-1",
      studentId: "stu-1",
    });
    expect(resolved).toBe(1);
  });
});

describe("client payload never includes the key", () => {
  it("strips correctIndex and shuffles choices", () => {
    const pub = sanitizeExamModuleForClient(
      { ...question, questionType: "mcq", rubric: [] },
      { studentId: "stu-1", attemptId: "att-1" },
    );
    expect(pub).not.toHaveProperty("correctIndex");
    expect(pub.choices).toHaveLength(4);
    expect([...pub.choices].sort()).toEqual([...question.choices].sort());
  });
});

describe("independentVerifyKey parser and reviewer", () => {
  it("accepts verifier matching index as number or letter", async () => {
    const { independentVerifyKey } = await import("../key-validation");
    const aiEngine = await import("@/lib/ai-engine");
    const chatSpy = vi.spyOn(aiEngine, "chatJson");

    // Case 1: number index
    chatSpy.mockResolvedValueOnce({
      json: { chosenIndex: 1, exactlyOneDefensible: true, rationale: "Correct" },
    } as any);
    const res1 = await independentVerifyKey({
      scenario: "s",
      instructions: "i",
      choices: ["a", "b", "c", "d"],
      correctIndex: 1,
    });
    expect(res1.ok).toBe(true);
    expect(res1.chosenIndex).toBe(1);

    // Case 2: letter index "B"
    chatSpy.mockResolvedValueOnce({
      json: { chosen_index: "B", rationale: "Option B is best" },
    } as any);
    const res2 = await independentVerifyKey({
      scenario: "s",
      instructions: "i",
      choices: ["a", "b", "c", "d"],
      correctIndex: 1,
    });
    expect(res2.ok).toBe(true);
    expect(res2.chosenIndex).toBe(1);

    // Case 3: verifier disagrees
    chatSpy.mockResolvedValueOnce({
      json: { chosenIndex: 0, exactlyOneDefensible: true },
    } as any);
    const res3 = await independentVerifyKey({
      scenario: "s",
      instructions: "i",
      choices: ["a", "b", "c", "d"],
      correctIndex: 1,
    });
    expect(res3.ok).toBe(false);
    expect(res3.reasons).toContain("verifier_chose_0_claimed_1");

    chatSpy.mockRestore();
  });
});
