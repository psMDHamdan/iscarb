/**
 * Unit tests for question-bank lifecycle transitions (mocked repository).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BankQuestionStatus } from "@prisma/client";

const getBankQuestionById = vi.fn();
const updateBankQuestion = vi.fn();
const computeBankQuestionContentHash = vi.fn();

vi.mock("@/lib/assessment/question-bank-repository", () => ({
  BankQuestionStatus,
  getBankQuestionById: (...a: unknown[]) => getBankQuestionById(...a),
  updateBankQuestion: (...a: unknown[]) => updateBankQuestion(...a),
  computeBankQuestionContentHash: (...a: unknown[]) =>
    computeBankQuestionContentHash(...a),
  toPublicBankQuestion: (r: { correctIndex: number; choicesJson: string; rubricJson: string }) => {
    const { correctIndex: _c, ...rest } = r as { correctIndex: number } & Record<string, unknown>;
    return {
      ...rest,
      choices: JSON.parse(r.choicesJson),
      rubric: JSON.parse(r.rubricJson).map((x: { criterion: string; weight: number }) => ({
        criterion: x.criterion,
        weight: x.weight,
      })),
    };
  },
}));

function baseRow(status: BankQuestionStatus, overrides: Record<string, unknown> = {}) {
  return {
    id: "q1",
    moduleCode: "M01",
    dimension: "core_professionalism",
    specialization: null,
    title: "t",
    titleAr: null,
    level: "L1",
    framework: "f",
    focus: "f",
    estimateMinutes: 10,
    passThreshold: 70,
    scenario: "s",
    instructions: "i",
    choicesJson: JSON.stringify(["A", "B", "C", "D"]),
    correctIndex: 0,
    rubricJson: JSON.stringify([{ criterion: "c", weight: 100, descriptor: "d" }]),
    status,
    provenance: "curated",
    contentHash: "hash0",
    aiModelUsed: null,
    version: 1,
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    reviewId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("question-bank-lifecycle", () => {
  beforeEach(() => {
    vi.resetModules();
    getBankQuestionById.mockReset();
    updateBankQuestion.mockReset();
    computeBankQuestionContentHash.mockReset();
    computeBankQuestionContentHash.mockReturnValue("hash0");
    updateBankQuestion.mockImplementation(async (_id: string, patch: Record<string, unknown>) => ({
      ...baseRow(BankQuestionStatus.draft),
      ...patch,
      status: patch.status ?? BankQuestionStatus.draft,
    }));
  });

  it("allows draft → submit → approve → publish", async () => {
    const {
      submitBankQuestionForReview,
      approveBankQuestion,
      publishBankQuestion,
    } = await import("@/lib/assessment/question-bank-lifecycle");

    getBankQuestionById.mockResolvedValueOnce(baseRow(BankQuestionStatus.draft));
    updateBankQuestion.mockResolvedValueOnce(baseRow(BankQuestionStatus.in_review));
    await submitBankQuestionForReview("q1", "u1");
    expect(updateBankQuestion.mock.calls[0][1].status).toBe("in_review");

    getBankQuestionById.mockResolvedValueOnce(baseRow(BankQuestionStatus.in_review));
    updateBankQuestion.mockResolvedValueOnce(baseRow(BankQuestionStatus.approved));
    await approveBankQuestion("q1", "u1");
    expect(updateBankQuestion.mock.calls[1][1].status).toBe("approved");

    getBankQuestionById.mockResolvedValueOnce(baseRow(BankQuestionStatus.approved));
    updateBankQuestion.mockResolvedValueOnce(baseRow(BankQuestionStatus.published));
    await publishBankQuestion("q1", "u1");
    expect(updateBankQuestion.mock.calls[2][1].status).toBe("published");
  });

  it("rejects draft → publish", async () => {
    const { publishBankQuestion, BankLifecycleError } = await import(
      "@/lib/assessment/question-bank-lifecycle"
    );
    getBankQuestionById.mockResolvedValueOnce(baseRow(BankQuestionStatus.draft));
    await expect(publishBankQuestion("q1", "u1")).rejects.toBeInstanceOf(
      BankLifecycleError,
    );
  });

  it("returns published content edits to in_review", async () => {
    const { editBankQuestionContent } = await import(
      "@/lib/assessment/question-bank-lifecycle"
    );
    getBankQuestionById.mockResolvedValueOnce(
      baseRow(BankQuestionStatus.published, { contentHash: "old" }),
    );
    computeBankQuestionContentHash.mockReturnValue("new-hash");
    updateBankQuestion.mockResolvedValueOnce(
      baseRow(BankQuestionStatus.in_review, {
        correctIndex: 2,
        contentHash: "new-hash",
      }),
    );

    const result = await editBankQuestionContent("q1", "u1", { correctIndex: 2 });
    expect(result.rereviewRequired).toBe(true);
    expect(updateBankQuestion.mock.calls[0][1].status).toBe("in_review");
    expect(updateBankQuestion.mock.calls[0][1].correctIndex).toBe(2);
  });
});
