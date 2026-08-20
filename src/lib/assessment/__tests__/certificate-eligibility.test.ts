import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    student: { findUnique: vi.fn() },
    assessmentAttempt: { findFirst: vi.fn() },
    assessmentResponse: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/assessment/catalog", () => ({
  canonicalSpecializationLabel: (s: string | null | undefined) => s || null,
  resolveAssessmentModuleSet: () => ({
    modules: Array.from({ length: 47 }, (_, i) => ({
      code: `M${String(i + 1).padStart(2, "0")}`,
    })),
  }),
}));

import { db } from "@/lib/db";
import { assertCertificateEligibility } from "@/lib/assessment/certificate-eligibility";

describe("assertCertificateEligibility — ISC-QA-002", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.student.findUnique).mockResolvedValue({ id: "stu-1" } as any);
  });

  it("rejects when no completed attempt exists", async () => {
    vi.mocked(db.assessmentAttempt.findFirst).mockResolvedValue(null);
    const result = await assertCertificateEligibility("stu-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("ATTEMPT_NOT_FOUND");
      expect(result.status).toBe(409);
    }
  });

  it("rejects in_progress attempts even if requested by id", async () => {
    vi.mocked(db.assessmentAttempt.findFirst).mockResolvedValue({
      id: "att-1",
      status: "in_progress",
      specialization: "Computer Science / IT",
    } as any);
    const result = await assertCertificateEligibility("stu-1", "att-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("ATTEMPT_INCOMPLETE");
  });

  it("rejects completed attempt with fewer than 47 scored modules", async () => {
    vi.mocked(db.assessmentAttempt.findFirst).mockResolvedValue({
      id: "att-1",
      status: "completed",
      specialization: "Computer Science / IT",
    } as any);
    vi.mocked(db.assessmentResponse.findMany).mockResolvedValue(
      [{ moduleCode: "M01" }, { moduleCode: "M02" }, { moduleCode: "M03" }] as any,
    );
    const result = await assertCertificateEligibility("stu-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("ATTEMPT_INCOMPLETE");
      expect(result.scoredCount).toBe(3);
      expect(result.requiredCount).toBe(47);
    }
  });

  it("allows completed attempt with full 47 scored catalog modules", async () => {
    vi.mocked(db.assessmentAttempt.findFirst).mockResolvedValue({
      id: "att-1",
      status: "completed",
      specialization: "Computer Science / IT",
    } as any);
    vi.mocked(db.assessmentResponse.findMany).mockResolvedValue(
      Array.from({ length: 47 }, (_, i) => ({
        moduleCode: `M${String(i + 1).padStart(2, "0")}`,
      })) as any,
    );
    const result = await assertCertificateEligibility("stu-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.attemptId).toBe("att-1");
      expect(result.scoredCount).toBe(47);
    }
  });
});
