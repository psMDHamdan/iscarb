/**
 * Write-path specialization normalization (RDF/DB integrity §4 follow-up).
 *
 * Future EmployabilityProfile / AssessmentResponse writes must store the
 * canonical JOBFIT_TRACKS label, not the raw alias/free-text the caller sent.
 *
 * Known historical data point (do NOT backfill in this change):
 * one EmployabilityProfile row still stores "Artificial Intelligence"
 * (count=1 as of 2026-08-03 verification). Leave it alone.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { canonicalSpecializationLabel } from "../catalog";

const AI_CANONICAL = "Artificial Intelligence / Data Science";
const CS_CANONICAL = "Computer Science / IT";
const ACCT_CANONICAL = "Accounting / Finance";

/**
 * Mirrors the persistence contract used by:
 * - POST /api/iscarb/assessment/score  → assessmentResponse.create
 * - POST /api/iscarb/assessment/profile → employabilityProfile.upsert
 * - buildLiveEmployabilityReport         → employabilityProfile.upsert
 */
function specializationFieldForWrite(callerInput: string | null | undefined) {
  return { specialization: canonicalSpecializationLabel(callerInput) };
}

describe("canonicalSpecializationLabel — alias → JOBFIT_TRACKS label", () => {
  it.each([
    ["AI", AI_CANONICAL],
    ["ai", AI_CANONICAL],
    ["Data Science", AI_CANONICAL],
    ["data-science", AI_CANONICAL],
    ["Artificial Intelligence", AI_CANONICAL],
    ["Artificial Intelligence / Data Science", AI_CANONICAL],
    ["Machine Learning", AI_CANONICAL],
    ["IT", CS_CANONICAL],
    ["Computer Science", CS_CANONICAL],
    ["Computer Science / IT", CS_CANONICAL],
    ["Software Engineering", CS_CANONICAL],
    ["Accounting", ACCT_CANONICAL],
    ["Finance", ACCT_CANONICAL],
    ["Accounting / Finance", ACCT_CANONICAL],
    ["Data Analysis", "Data Analysis"],
    ["Web Development", "Web Development"],
    ["Cybersecurity", "Cybersecurity"],
  ] as const)("%j → %j", (input, expected) => {
    expect(canonicalSpecializationLabel(input)).toBe(expected);
  });

  it("returns null for null / blank (no invented label)", () => {
    expect(canonicalSpecializationLabel(null)).toBeNull();
    expect(canonicalSpecializationLabel(undefined)).toBeNull();
    expect(canonicalSpecializationLabel("")).toBeNull();
    expect(canonicalSpecializationLabel("   ")).toBeNull();
  });

  it("keeps trimmed free-text for unknown (generic) specializations", () => {
    expect(canonicalSpecializationLabel("  Supply Chain Management  ")).toBe(
      "Supply Chain Management",
    );
  });
});

describe("AssessmentResponse / EmployabilityProfile write persistence", () => {
  const createAssessmentResponse = vi.fn();
  const upsertEmployabilityProfile = vi.fn();

  beforeEach(() => {
    createAssessmentResponse.mockReset();
    upsertEmployabilityProfile.mockReset();
    createAssessmentResponse.mockImplementation(async ({ data }: { data: unknown }) => ({
      id: "resp-1",
      ...(data as object),
    }));
    upsertEmployabilityProfile.mockImplementation(
      async ({ create }: { create: { specialization: string | null } }) => ({
        id: "prof-1",
        specialization: create.specialization,
      }),
    );
  });

  it.each([
    ["AI", AI_CANONICAL],
    ["Data Science", AI_CANONICAL],
    ["Artificial Intelligence", AI_CANONICAL],
  ] as const)(
    'AssessmentResponse create with alias %j persists %j (not the raw input)',
    async (alias, canonical) => {
      const data = {
        studentId: "stu-1",
        moduleCode: "M30",
        dimension: "job_fit",
        ...specializationFieldForWrite(alias),
        score: 72,
      };
      const row = await createAssessmentResponse({ data });

      expect(createAssessmentResponse).toHaveBeenCalledWith({ data });
      expect(row.specialization).toBe(canonical);
      expect(row.specialization).not.toBe(alias);
      expect(data.specialization).toBe(canonical);
    },
  );

  it.each([
    ["AI", AI_CANONICAL],
    ["Data Science", AI_CANONICAL],
    ["Artificial Intelligence", AI_CANONICAL],
  ] as const)(
    'EmployabilityProfile upsert with alias %j persists %j (not the raw input)',
    async (alias, canonical) => {
      const create = {
        studentId: "stu-1",
        composite: 70,
        band: "Proficient",
        passed: true,
        ...specializationFieldForWrite(alias),
        dimensionsJson: "{}",
        coveredJson: "[]",
      };
      const profile = await upsertEmployabilityProfile({
        where: { studentId: "stu-1" },
        create,
        update: { specialization: create.specialization },
      });

      expect(profile.specialization).toBe(canonical);
      expect(profile.specialization).not.toBe(alias);
      expect(create.specialization).toBe(canonical);
    },
  );

  it("does not invent a label when specialization is omitted (null stays null)", async () => {
    const data = {
      studentId: "stu-1",
      moduleCode: "M01",
      ...specializationFieldForWrite(null),
    };
    const row = await createAssessmentResponse({ data });
    expect(row.specialization).toBeNull();
  });
});
