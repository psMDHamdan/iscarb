/**
 * Phase 5 — signup Job-Fit safeguard unit tests (no DB / no AI).
 */
import { describe, expect, it } from "vitest";
import {
  oneCorrectAnswerOk,
  runSignupJobFitSafeguards,
  specialtyRelevanceOk,
  structuralCompletenessOk,
  type GeneratedJobFitDraft,
} from "../jobfit-signup-safeguards";
import { specialtyNeedsSignupJobFitGeneration } from "../jobfit-signup-coverage-pure";

function goodDraft(overrides: Partial<GeneratedJobFitDraft> = {}): GeneratedJobFitDraft {
  return {
    moduleCode: "JOBFIT-MARINE-BIOLOGY-1",
    title: "Marine Biology field diagnosis",
    focus: "Diagnosing a reef survey failure",
    framework: "Scientific method",
    scenario:
      "A Marine Biology survey team in the Red Sea finds bleaching and inconsistent transect counts across three sites.",
    instructions:
      "Select the best next action for a junior Marine Biology analyst before the next dive window.",
    choices: [
      {
        text: "Re-run the failed transect with the same protocol and ignore environmental covariates.",
        label: "incorrect",
        rationale: "Repeats a flawed protocol without diagnosing measurement or site bias.",
      },
      {
        text: "Pause further dives, audit transect SOP adherence and environmental logs, then redesign sampling for the next window.",
        label: "correct",
        rationale: "Stops compounding error and grounds the fix in Marine Biology survey method.",
      },
      {
        text: "Publish the incomplete counts immediately to meet the grant deadline.",
        label: "incorrect",
        rationale: "Prioritizes speed over data integrity and scientific standards.",
      },
      {
        text: "Switch to a completely different specialty method from accounting analytics.",
        label: "incorrect",
        rationale: "Cross-domain contamination unrelated to Marine Biology field methods.",
      },
    ],
    correctIndex: 1,
    rubric: [
      { criterion: "problem_definition", weight: 30, descriptor: "Frames the survey defect." },
      { criterion: "domain_root_cause", weight: 40, descriptor: "Marine Biology method grounding." },
      { criterion: "decision_quality", weight: 30, descriptor: "Safeguarded next step." },
    ],
    ...overrides,
  };
}

describe("specialtyNeedsSignupJobFitGeneration", () => {
  it("flags free-text majors", () => {
    expect(specialtyNeedsSignupJobFitGeneration("Marine Biology")).toBe(true);
    expect(specialtyNeedsSignupJobFitGeneration("Philosophy")).toBe(true);
  });
  it("skips curated tracks and aliases", () => {
    expect(specialtyNeedsSignupJobFitGeneration("Accounting")).toBe(false);
    expect(specialtyNeedsSignupJobFitGeneration("Computer Science / IT")).toBe(false);
    expect(specialtyNeedsSignupJobFitGeneration("Finance")).toBe(false);
  });
});

describe("signup Job-Fit safeguards", () => {
  it("passes a well-formed specialty MCQ", () => {
    const draft = goodDraft();
    expect(structuralCompletenessOk(draft).ok).toBe(true);
    expect(oneCorrectAnswerOk(draft).ok).toBe(true);
    expect(specialtyRelevanceOk("Marine Biology", draft)).toBe(true);
    expect(runSignupJobFitSafeguards("Marine Biology", draft).ok).toBe(true);
  });

  it("rejects zero or multiple correct labels", () => {
    const none = goodDraft({
      choices: goodDraft().choices.map((c) => ({ ...c, label: "incorrect" as const })),
      correctIndex: 0,
    });
    expect(oneCorrectAnswerOk(none).ok).toBe(false);
    expect(oneCorrectAnswerOk(none).reasons.some((r) => r.startsWith("correct_label_count_"))).toBe(
      true,
    );

    const multi = goodDraft();
    multi.choices[0] = { ...multi.choices[0], label: "correct" };
    multi.choices[1] = { ...multi.choices[1], label: "correct" };
    expect(oneCorrectAnswerOk(multi).ok).toBe(false);
  });

  it("rejects correctIndex mismatch vs label", () => {
    const draft = goodDraft({ correctIndex: 0 });
    const result = oneCorrectAnswerOk(draft);
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes("mismatch"))).toBe(true);
  });

  it("rejects weak specialty relevance", () => {
    const draft = goodDraft({
      scenario: "A general professional practice team has a vague problem at work.",
      instructions: "Pick any reasonable action in this discipline.",
      title: "Generic workplace issue",
      choices: goodDraft().choices.map((c) => ({
        ...c,
        text: c.text.replace(/Marine Biology/gi, "general work"),
      })),
    });
    expect(specialtyRelevanceOk("Marine Biology", draft)).toBe(false);
    expect(runSignupJobFitSafeguards("Marine Biology", draft).ok).toBe(false);
  });

  it("rejects broken rubric weights", () => {
    const draft = goodDraft({
      rubric: [{ criterion: "only", weight: 50, descriptor: "bad" }],
    });
    expect(structuralCompletenessOk(draft).ok).toBe(false);
  });
});
