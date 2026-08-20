/**
 * Unit tests for Phase 4 exam-bank matching + fallback (no DB).
 */
import { describe, expect, it } from "vitest";
import { BankQuestionStatus } from "@prisma/client";
import {
  findPublishedBankMatch,
} from "../exam-bank-modules";
import type { AssessmentModuleSpec } from "../framework";

// Re-export internals via a small test harness — findPublishedBankMatch is exported.
// Build a minimal index shape matching BankIndex by calling through findPublishedBankMatch
// with a hand-built index via module private — we only export findPublishedBankMatch which
// needs BankIndex. Looking at the module, BankIndex is not exported. Export a helper or
// test via resolve with mocks.

describe("findPublishedBankMatch", () => {
  const catalog = (overrides: Partial<AssessmentModuleSpec> = {}): AssessmentModuleSpec => ({
    code: "M30",
    title: "SQL",
    dimension: "job_fit",
    level: "L3",
    framework: "SQL",
    focus: "joins",
    scenario: "catalog scenario",
    instructions: "catalog instructions",
    rubric: [{ criterion: "c", weight: 100, descriptor: "d" }],
    fewShot: [],
    passThreshold: 60,
    validationEnabled: false,
    modelTag: "t",
    temperature: 0,
    specialization: "Computer Science / IT",
    generated: false,
    ...overrides,
  });

  function row(partial: {
    moduleCode: string;
    specialization: string | null;
    id?: string;
  }) {
    return {
      id: partial.id ?? "b1",
      moduleCode: partial.moduleCode,
      dimension: "job_fit",
      specialization: partial.specialization,
      title: "t",
      titleAr: null,
      level: "L3",
      framework: "f",
      focus: "f",
      estimateMinutes: 10,
      passThreshold: 70,
      scenario: "bank scenario",
      instructions: "bank instructions",
      choicesJson: JSON.stringify(["A", "B", "C", "D"]),
      correctIndex: 0,
      rubricJson: JSON.stringify([{ criterion: "c", weight: 100, descriptor: "d" }]),
      status: BankQuestionStatus.published,
      provenance: "pregenerated" as const,
      contentHash: "h",
      aiModelUsed: null,
      version: 1,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      reviewId: null,
      needsHumanReview: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  function indexFrom(rows: ReturnType<typeof row>[]) {
    const byCodeSpec = new Map<string, (typeof rows)[0]>();
    const byCode = new Map<string, typeof rows>();
    for (const r of rows) {
      const sk = r.specialization ?? "";
      byCodeSpec.set(`${r.moduleCode}::${sk}`, r);
      const list = byCode.get(r.moduleCode) ?? [];
      list.push(r);
      byCode.set(r.moduleCode, list);
    }
    return { byCodeSpec, byCode };
  }

  it("matches exact code+specialization", () => {
    const idx = indexFrom([
      row({ moduleCode: "M30", specialization: "Computer Science / IT", id: "exact" }),
      row({ moduleCode: "M30", specialization: "Data Analysis", id: "other" }),
    ]);
    const hit = findPublishedBankMatch(catalog(), idx);
    expect(hit?.row.id).toBe("exact");
    expect(hit?.match).toBe("code+specialization");
  });

  it("falls back to code-only for CS/IT remap vs Data Analysis bank tag", () => {
    const idx = indexFrom([
      row({ moduleCode: "M30", specialization: "Data Analysis", id: "da" }),
    ]);
    const hit = findPublishedBankMatch(catalog(), idx);
    expect(hit?.row.id).toBe("da");
    expect(hit?.match).toBe("code-only");
  });

  it("returns null when code missing", () => {
    const idx = indexFrom([
      row({ moduleCode: "M01", specialization: null }),
    ]);
    const hit = findPublishedBankMatch(catalog({ code: "M99" }), idx);
    expect(hit).toBeNull();
  });
});
