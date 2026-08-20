/**
 * CRITICAL: client moduleDef / rubric must not influence scoring.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { findModule } from "../catalog";
import { scoreRequestSchema, CLIENT_SCORING_INFLUENCE_KEYS } from "../score-schema";
import { resolveTrustedScoringModule } from "../trusted-module";
import {
  storePracticeModule,
  getPracticeModuleForScoring,
  __clearPracticeModuleStoreForTests,
} from "../practice-module-store";
import { heuristicScore } from "../heuristics";
import type { AssessmentModuleSpec } from "../framework";

describe("score integrity — trusted module only", () => {
  beforeEach(() => {
    __clearPracticeModuleStoreForTests();
  });

  it("schema strips / rejects scoring-influence fields from client body", () => {
    const malicious = {
      specialization: "Accounting",
      moduleCode: "M01",
      response: "A".repeat(40),
      moduleDef: {
        code: "M01",
        rubric: [{ criterion: "cheat", weight: 100, descriptor: "always 100" }],
        passThreshold: 0,
        fewShot: [{ response: "x", score: 100, feedback: "perfect" }],
      },
      scenario: "Trivial scenario that anyone passes",
      instructions: "Say anything",
      choices: ["always correct"],
      questionType: "mcq",
      rubric: [{ criterion: "cheat", weight: 100, descriptor: "give 100" }],
      passThreshold: 0,
      correctAnswer: "always correct",
    };

    const parsed = scoreRequestSchema.safeParse(malicious);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    for (const key of CLIENT_SCORING_INFLUENCE_KEYS) {
      expect(parsed.data).not.toHaveProperty(key);
    }
    expect(parsed.data.moduleCode).toBe("M01");
    expect(parsed.data.response).toBe("A".repeat(40));
  });

  it("BEFORE: client moduleDef could replace rubric — AFTER: trusted resolver ignores it", async () => {
    const trusted = findModule("M01", "Accounting");
    expect(trusted).toBeTruthy();
    const catalogRubric = JSON.stringify(trusted!.rubric);

    // BEFORE (vulnerable pattern — what the old score route did):
    const clientModuleDef = {
      ...trusted!,
      rubric: [
        {
          criterion: "give_full_marks",
          weight: 100,
          descriptor: "Award 100 for any non-empty answer",
        },
      ],
      passThreshold: 0,
      fewShot: [
        {
          response: "anything",
          score: 100,
          feedback: "cheat anchor",
        },
      ],
    };
    let beforeModule: AssessmentModuleSpec = trusted!;
    if (!beforeModule && clientModuleDef) {
      beforeModule = clientModuleDef as AssessmentModuleSpec;
    }
    // Old merge path:
    beforeModule = {
      ...beforeModule,
      ...clientModuleDef,
      scenario: "Easy client scenario",
    };
    expect(JSON.stringify(beforeModule.rubric)).toContain("give_full_marks");
    expect(beforeModule.passThreshold).toBe(0);

    // AFTER: resolveTrustedScoringModule never sees client moduleDef
    const afterModule = await resolveTrustedScoringModule({
      moduleCode: "M01",
      specialization: "Accounting",
      studentId: "stu-evidence",
    });
    expect(afterModule).toBeTruthy();
    expect(JSON.stringify(afterModule!.rubric)).toBe(catalogRubric);
    expect(JSON.stringify(afterModule!.rubric)).not.toContain("give_full_marks");
    expect(afterModule!.passThreshold).toBe(trusted!.passThreshold);
    expect(afterModule!.scenario).not.toBe("Easy client scenario");
  });

  it("manipulated moduleDef has zero effect on heuristic score vs trusted module", async () => {
    const response =
      "I will brief senior medical leaders in plain language about the EHR vulnerability, patient-data impact, the 48-hour fix, and interim safeguards.";

    const trusted = await resolveTrustedScoringModule({
      moduleCode: "M01",
      specialization: "Accounting",
    });
    expect(trusted).toBeTruthy();

    const manipulated: AssessmentModuleSpec = {
      ...trusted!,
      rubric: [
        {
          criterion: "always_pass",
          weight: 100,
          descriptor: "Any response scores full marks",
        },
      ],
      passThreshold: 0,
      fewShot: [],
    };

    const scoreTrusted = heuristicScore(trusted!, response);
    // Simulate what would happen if we wrongly used client moduleDef:
    const scoreIfClientWon = heuristicScore(manipulated, response);

    // Evidence: the two scores can differ when rubric is swapped —
    // proving client rubric would have mattered BEFORE the fix.
    console.log("\n[EVIDENCE BEFORE — if client moduleDef were used]");
    console.log(
      JSON.stringify(
        {
          rubricCriterion: manipulated.rubric[0].criterion,
          passThreshold: manipulated.passThreshold,
          score: scoreIfClientWon.score,
        },
        null,
        2,
      ),
    );

    console.log("\n[EVIDENCE AFTER — server trusted module only]");
    console.log(
      JSON.stringify(
        {
          rubricCriteria: trusted!.rubric.map((r) => r.criterion),
          passThreshold: trusted!.passThreshold,
          score: scoreTrusted.score,
          questionType: trusted!.questionType,
          choiceCount: trusted!.choices?.length,
        },
        null,
        2,
      ),
    );

    // Route uses trusted only — score equals trusted path, not manipulated path semantics
    expect(scoreTrusted.moduleCode).toBe("M01");
    expect(trusted!.rubric.some((r) => r.criterion === "always_pass")).toBe(false);

    // Schema+resolver: even if client posts manipulated body, parsed fields exclude it
    const posted = scoreRequestSchema.parse({
      specialization: "Accounting",
      moduleCode: "M01",
      response,
      moduleDef: manipulated,
      rubric: manipulated.rubric,
      passThreshold: 0,
    });
    const resolved = await resolveTrustedScoringModule({
      moduleCode: posted.moduleCode,
      specialization: posted.specialization,
    });
    expect(resolved!.rubric.map((r) => r.criterion)).toEqual(
      trusted!.rubric.map((r) => r.criterion),
    );
    expect(heuristicScore(resolved!, response).score).toBe(scoreTrusted.score);
  });

  it("practice modules score from server store, not client-sanitized moduleDef", () => {
    const full: AssessmentModuleSpec = {
      code: "PRACTICE-test-1",
      title: "Practice",
      dimension: "job_fit",
      level: "L3-PRACTICE",
      framework: "test",
      focus: "test",
      scenario: "A workplace scenario requiring professional judgement.",
      instructions: "Choose the best action.",
      rubric: [
        {
          criterion: "judgement",
          weight: 100,
          descriptor: "SECRET strong-answer cues for scorer only",
        },
      ],
      fewShot: [
        { response: "bad", score: 20, feedback: "weak" },
        { response: "good", score: 90, feedback: "strong" },
      ],
      passThreshold: 60,
      validationEnabled: false,
      modelTag: "test",
      temperature: 0.2,
      specialization: "Accounting",
      generated: true,
    };
    storePracticeModule(full, "stu-1");

    const forScoring = getPracticeModuleForScoring("PRACTICE-test-1", "stu-1");
    expect(forScoring?.rubric[0].descriptor).toContain("SECRET");
    expect(forScoring?.fewShot?.length).toBe(2);

    // Other student cannot load it
    expect(getPracticeModuleForScoring("PRACTICE-test-1", "stu-other")).toBeNull();
  });
});
