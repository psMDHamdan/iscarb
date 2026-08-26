import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    assessmentAttempt: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    student: { findUnique: vi.fn() },
    assessmentResponse: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    employabilityProfile: { upsert: vi.fn() },
    assessmentSnapshot: { create: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}));

vi.mock("@/lib/assessment/attempt-exam-set", () => ({
  parseAttemptExamSet: vi.fn(),
  findAttemptQuestion: vi.fn(),
}));

vi.mock("@/lib/assessment/keyed-mcq-scoring", () => ({
  resolveSelectedCanonicalIndex: vi.fn(() => 0),
  scoreKeyedMcq: vi.fn(({ question }: { question: { code: string; dimension: string } }) => ({
    moduleCode: question.code,
    dimension: question.dimension,
    score: 80,
    band: "strong",
    passed: true,
    perCriterion: [],
    feedback: "ok",
    strengths: [],
    improvements: [],
    validationPassed: true,
    model: "keyed_mcq",
    source: "keyed_mcq",
    latencyMs: 1,
  })),
}));

vi.mock("@/lib/assessment/engine", () => ({
  assembleProfile: vi.fn(() => ({
    composite: 80,
    band: "strong",
    passed: true,
    dimensions: [],
    covered: [],
  })),
}));

vi.mock("@/lib/assessment/live-employability-report", () => ({
  buildLiveEmployabilityReport: vi.fn(async () => ({
    kind: "employability-live",
    studentId: "stu-1",
    studentName: "Test",
    specialization: "Computer Science / IT",
    computedAt: new Date().toISOString(),
    excludedSeed: true,
    isCurrentOnly: true,
    profile: {
      composite: 80,
      band: "strong",
      passed: true,
      specialization: "Computer Science / IT",
      dimensions: [],
      covered: [],
      computedAt: new Date().toISOString(),
      liveModuleCount: 1,
    },
    results: [],
    modules: [],
    answers: {},
    dimensionChapters: [],
  })),
  toAttemptSnapshotView: vi.fn((report: { studentId: string }) => ({
    id: `live_${report.studentId}`,
    kind: "employability",
    studentId: report.studentId,
    specialization: "Computer Science / IT",
    computedAt: new Date().toISOString(),
    timedOut: false,
    profile: {
      composite: 80,
      band: "strong",
      passed: true,
      specialization: "Computer Science / IT",
      dimensions: [],
      covered: [],
      computedAt: new Date().toISOString(),
    },
    results: [],
    modules: [],
    answers: {},
  })),
}));

import { db } from "@/lib/db";
import { parseAttemptExamSet, findAttemptQuestion } from "@/lib/assessment/attempt-exam-set";
import { finalizeAttemptReport } from "@/lib/assessment/finalize-attempt-report";

describe("finalizeAttemptReport — ISC-QA-001", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.student.findUnique).mockResolvedValue({
      id: "stu-1",
      universityId: null,
      name: "Test",
    } as any);
    vi.mocked(db.assessmentResponse.findMany).mockResolvedValue([]);
    vi.mocked(db.employabilityProfile.upsert).mockResolvedValue({} as any);
    vi.mocked(db.assessmentSnapshot.create).mockResolvedValue({} as any);
    vi.mocked(db.assessmentAttempt.update).mockResolvedValue({} as any);
  });

  it("returns idempotent snapshot when attempt already completed", async () => {
    vi.mocked(db.assessmentAttempt.findUnique).mockResolvedValue({
      id: "att-1",
      studentId: "stu-1",
      status: "completed",
      specialization: "Computer Science / IT",
      answersJson: JSON.stringify({ M01: "0" }),
      blueprintJson: "{}",
    } as any);
    vi.mocked(parseAttemptExamSet).mockReturnValue({
      status: "ready",
      questions: [{ code: "M01", dimension: "job_fit" }],
    } as any);

    const result = await finalizeAttemptReport({
      attemptId: "att-1",
      studentId: "stu-1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.completed).toBe(true);
      expect(result.attempt.id).toBe("att-1");
    }
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("refuses requireComplete when answers are missing", async () => {
    vi.mocked(db.assessmentAttempt.findUnique).mockResolvedValue({
      id: "att-1",
      studentId: "stu-1",
      status: "in_progress",
      specialization: "Computer Science / IT",
      answersJson: JSON.stringify({ M01: "0" }),
      blueprintJson: "{}",
    } as any);
    vi.mocked(parseAttemptExamSet).mockReturnValue({
      status: "ready",
      questions: [
        { code: "M01", dimension: "job_fit" },
        { code: "M02", dimension: "job_fit" },
      ],
    } as any);

    const result = await finalizeAttemptReport({
      attemptId: "att-1",
      studentId: "stu-1",
      requireComplete: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("ATTEMPT_INCOMPLETE");
  });

  it("hydrates answers from AssessmentResponse when answersJson is empty (NO_ANSWERS fix)", async () => {
    vi.mocked(db.assessmentAttempt.findUnique).mockResolvedValue({
      id: "att-1",
      studentId: "stu-1",
      status: "in_progress",
      specialization: "Computer Science / IT",
      answersJson: "{}",
      blueprintJson: "{}",
    } as any);
    vi.mocked(parseAttemptExamSet).mockReturnValue({
      status: "ready",
      questions: [{ code: "M01", dimension: "core_professionalism" }],
    } as any);
    vi.mocked(findAttemptQuestion).mockImplementation((_set, code) => ({
      code,
      dimension: "core_professionalism",
    }) as any);
    // First findMany hydrates answers; second finds already-scored modules
    vi.mocked(db.assessmentResponse.findMany)
      .mockResolvedValueOnce([{ moduleCode: "M01", rawResponse: "choice-text-0" }] as any)
      .mockResolvedValueOnce([{ moduleCode: "M01" }] as any);

    const result = await finalizeAttemptReport({
      attemptId: "att-1",
      studentId: "stu-1",
      requireComplete: true,
    });

    expect(result.ok).toBe(true);
    expect(db.assessmentAttempt.update).toHaveBeenCalled();
    if (result.ok) {
      expect(result.completed).toBe(true);
      expect(result.scoredCount).toBe(1);
    }
  });

  it("scores unanswered modules and marks completed when full", async () => {
    vi.mocked(db.assessmentAttempt.findUnique).mockResolvedValue({
      id: "att-1",
      studentId: "stu-1",
      status: "in_progress",
      specialization: "Computer Science / IT",
      answersJson: JSON.stringify({ M01: "0" }),
      blueprintJson: "{}",
    } as any);
    vi.mocked(parseAttemptExamSet).mockReturnValue({
      status: "ready",
      questions: [{ code: "M01", dimension: "core_professionalism" }],
    } as any);
    vi.mocked(findAttemptQuestion).mockImplementation((_set, code) => ({
      code,
      dimension: "core_professionalism",
    }) as any);

    const result = await finalizeAttemptReport({
      attemptId: "att-1",
      studentId: "stu-1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.completed).toBe(true);
      expect(result.scoredCount).toBe(1);
    }
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.assessmentAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "completed" },
      }),
    );
    expect(db.assessmentSnapshot.create).toHaveBeenCalled();
  });
});
