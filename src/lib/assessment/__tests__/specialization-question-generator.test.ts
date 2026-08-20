/**
 * Unit tests for the specialization-aware question VALIDATOR (the 9-check
 * quality gate used inside generateSpecializationQuestion's
 * generate → critique → regenerate loop).
 *
 * Focus: the rules the student actually sees broken in the exam —
 *   - tasks must be MCQ decision questions, never essay/writing prompts;
 *   - options must be detailed (25–85 words) and length-balanced;
 *   - no option may reveal itself via "best approach" meta-language;
 *   - the scenario must be structurally bound to the specialization.
 */
import { describe, expect, it } from "vitest";

import { getSpecializationProfile } from "@/lib/assessment/specialization-profile";
import { validateQuestion } from "@/lib/assessment/specialization-question-generator";

type RawQuestion = {
  scenario: string;
  task: string;
  options: string[];
  correctIndex: number;
};

const profile = getSpecializationProfile("Web Development");

/** A spec-compliant strong question for Web Development. */
function strongQuestion(): RawQuestion {
  return {
    scenario:
      "You are a backend developer on a high-traffic e-commerce platform. During a release, monitoring shows API latency has increased sharply for checkout requests. The frontend team reports intermittent failures, while the product manager wants the release completed before a campaign begins in six hours. Initial logs suggest the problem may involve a database query, although application-level caching was also changed in the same release. The team must decide whether to roll back, hotfix, or keep the release active while isolating the regression.",
    task: "Which course of action should you recommend first to restore checkout reliability while still preserving the evidence needed to identify whether the database query or the caching change caused the regression?",
    options: [
      "Temporarily roll back the release to restore checkout reliability, while preserving the deployment artifacts and logs needed to isolate whether the database query or caching change caused the regression. This protects the customer path first but delays the campaign release until the root cause is understood.",
      "Keep the release active but disable the affected checkout path behind a feature flag while the engineering team compares database query latency against the previous release. This reduces exposure without discarding the new release, but requires a controlled fallback for customers affected by the feature flag.",
      "Increase database capacity immediately and keep the release in production, because the latency increase is most likely caused by additional traffic rather than the code change. This may restore performance quickly, but risks masking a query or application-level regression that will return under higher load.",
      "Ask the frontend team to reduce checkout requests while continuing the release unchanged, since the frontend reports the visible failures. This limits request volume but does not directly establish whether the backend regression is caused by the database or caching layer.",
    ],
    correctIndex: 2,
  };
}

describe("validateQuestion — MCQ task quality", () => {
  it("accepts a strong decision-based MCQ question", () => {
    const res = validateQuestion(strongQuestion(), "Web Development", "Analytical Decision Making", profile);
    expect(res.failures).toEqual([]);
    expect(res.passed).toBe(true);
  });

  it("rejects an essay-style task ('write a paragraph' / 'describe')", () => {
    const q = strongQuestion();
    q.task = "Write a professional summary of up to 150 words describing how you would handle this situation.";
    const res = validateQuestion(q, "Web Development", "Analytical Decision Making", profile);
    expect(res.failures.some((f) => f.startsWith("CHECK_4_TASK"))).toBe(true);
    expect(res.passed).toBe(false);
  });

  it("rejects a bare generic task ('What would you do?')", () => {
    const q = strongQuestion();
    q.task = "What would you do?";
    const res = validateQuestion(q, "Web Development", "Analytical Decision Making", profile);
    expect(res.failures.some((f) => f.startsWith("CHECK_4_TASK"))).toBe(true);
  });

  it("rejects a technical-knowledge task that ignores the scenario decision", () => {
    const q = strongQuestion();
    q.task = "Explain what a database index is and how it improves query performance.";
    const res = validateQuestion(q, "Web Development", "Analytical Decision Making", profile);
    expect(res.failures.some((f) => f.startsWith("CHECK_4_TASK"))).toBe(true);
  });
});

describe("validateQuestion — option detail & balance", () => {
  it("rejects one-line options (< 25 words)", () => {
    const q = strongQuestion();
    q.options[3] = "Talk to the manager.";
    const res = validateQuestion(q, "Web Development", "Analytical Decision Making", profile);
    expect(res.failures.some((f) => f.startsWith("CHECK_6_OPTION_DETAIL"))).toBe(true);
    expect(res.passed).toBe(false);
  });

  it("rejects length-unbalanced options (correct answer identifiable by size)", () => {
    const q = strongQuestion();
    // 8-word stub vs ~46-word peers → both detail (<25 words) and balance fail.
    q.options[0] = "Roll back the release and restore reliability first.";
    const res = validateQuestion(q, "Web Development", "Analytical Decision Making", profile);
    expect(res.failures.some((f) => f.startsWith("CHECK_6_OPTION_BALANCE"))).toBe(true);
    expect(res.failures.some((f) => f.startsWith("CHECK_6_OPTION_DETAIL"))).toBe(true);
  });

  it("rejects 'the best approach' meta-language that reveals the answer", () => {
    const q = strongQuestion();
    q.options[2] = "The best approach is to roll back the release immediately and re-deploy the previous version to fully restore checkout reliability.";
    const res = validateQuestion(q, "Web Development", "Analytical Decision Making", profile);
    expect(res.failures.some((f) => f.startsWith("CHECK_8_OBVIOUS_ANSWER"))).toBe(true);
  });
});

describe("validateQuestion — specialization binding", () => {
  it("rejects a generic scenario with no domain content", () => {
    const q = strongQuestion();
    q.scenario =
      "You are a new graduate on your first day at work. Your manager asks you to handle a difficult situation involving a tight deadline and a demanding stakeholder. You must decide how to proceed professionally while maintaining a good relationship with everyone involved.";
    q.options = q.options.map(
      () => "A professional approach that balances stakeholder expectations with the project deadline while maintaining quality and clear communication throughout the engagement.",
    );
    const res = validateQuestion(q, "Web Development", "Analytical Decision Making", profile);
    expect(res.failures.some((f) => f.startsWith("CHECK_1_SPECIALIZATION") || f.startsWith("CHECK_9_GENERICITY"))).toBe(true);
    expect(res.passed).toBe(false);
  });
});
