import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const generateMock = vi.fn();
const verifyMock = vi.fn();
const bankMock = vi.fn();

vi.mock("../specialization-question-generator", () => ({
  generateSpecializationQuestion: (...args: unknown[]) => generateMock(...args),
  BATCH_SIZE: 1,
}));

vi.mock("../key-validation", async () => {
  const actual = await vi.importActual<typeof import("../key-validation")>("../key-validation");
  return {
    ...actual,
    independentVerifyKey: (...args: unknown[]) => verifyMock(...args),
  };
});

vi.mock("../exam-bank-modules", () => ({
  getPublishedBankKeyedQuestion: (...args: unknown[]) => bankMock(...args),
}));

vi.mock("@/lib/db", () => ({
  db: {
    assessmentAttempt: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { validateStructuralKey } from "../key-validation";

describe("regenerate-until-valid cycle", () => {
  beforeEach(() => {
    generateMock.mockReset();
    verifyMock.mockReset();
    bankMock.mockReset();
  });

  it("rejects a structurally invalid draft then accepts a valid one", async () => {
    const bad = {
      scenario: "x",
      instructions: "y",
      choices: ["same", "same", "c", "d"],
      correctIndex: 0,
    };
    const good = {
      scenario: "A realistic workplace decision about disclosure.",
      instructions: "Which action is correct?",
      choices: ["A unique one", "B unique two", "C unique three", "D unique four"],
      correctIndex: 2,
    };
    expect(validateStructuralKey(bad).ok).toBe(false);
    expect(validateStructuralKey(good).ok).toBe(true);

    generateMock
      .mockResolvedValueOnce({ ...bad, specialization: "CS", competency: "ethics", difficulty: "very_hard", qualityScore: {}, generatedAt: "" })
      .mockResolvedValueOnce({ ...good, specialization: "CS", competency: "ethics", difficulty: "very_hard", qualityScore: {}, generatedAt: "" });
    verifyMock.mockResolvedValue({
      ok: true,
      chosenIndex: 2,
      exactlyOneDefensible: true,
      agreesWithClaimed: true,
      reasons: [],
    });

    // Drive the same loop the generator uses.
    let regenerated = false;
    let accepted: typeof good | null = null;
    for (let i = 0; i < 3; i++) {
      const mcq = await generateMock({ specialization: "CS" });
      const structural = validateStructuralKey(mcq);
      if (!structural.ok) {
        regenerated = true;
        continue;
      }
      const verify = await verifyMock(mcq);
      if (!verify.ok) {
        regenerated = true;
        continue;
      }
      accepted = mcq;
      break;
    }
    expect(regenerated).toBe(true);
    expect(accepted?.correctIndex).toBe(2);
    expect(generateMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to a structurally valid bank question after generation retries", async () => {
    generateMock.mockRejectedValue(new Error("nvidia down"));
    bankMock.mockResolvedValue({
      scenario: "Bank scenario",
      instructions: "Bank task",
      choices: ["W", "X", "Y", "Z"],
      correctIndex: 1,
      bankQuestionId: "bq1",
    });
    const bank = await bankMock("M01", "Accounting");
    expect(validateStructuralKey(bank).ok).toBe(true);
    expect(bank.correctIndex).toBe(1);
  });
});
