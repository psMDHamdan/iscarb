/**
 * Regression: Gate 1 must not zero legit answers with years / % / rule lines,
 * and must zero scenario paste.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isNonAnswer } from "@/lib/assessment/score-gates";
import type { AssessmentModuleSpec } from "@/lib/assessment/framework";

const BASE: AssessmentModuleSpec = {
  code: "T01",
  title: "Test module",
  dimension: "core_professionalism",
  level: "L1-A",
  framework: "STAR method",
  focus: "interview",
  specialization: null,
  scenario:
    "At NEOM you were assigned as a junior AI engineer to develop an anomaly-detection system for autonomous electric shuttle buses. One week before the pilot launch, a software bug caused false alarms. Your rapid troubleshooting reduced false-positive alerts by 92% and saved SAR 1.2 million.",
  instructions:
    "Write a STAR answer describing what YOU did. Do not copy the scenario.",
  rubric: [
    { criterion: "structure", weight: 40, descriptor: "Clear STAR structure" },
    { criterion: "result", weight: 60, descriptor: "Quantified outcome" },
  ],
  fewShot: [],
  passThreshold: 60,
  validationEnabled: false,
  modelTag: "test",
  temperature: 0.2,
  generated: false,
  estimateMinutes: 5,
};

describe("score-gates isNonAnswer regressions", () => {
  it("does not flag a long DMAIC-style answer with rule lines and percentages", () => {
    const answer = `
DMAIC REPORT: Predictive Maintenance False-Positive Reduction
═══════════════════════════════════════
DEFINE
Problem Statement: During ramp-up the AI system generated false-positive alerts.
Goal: Reduce false-positive alert rate by 80% within 4 weeks while keeping 100% detection.
═══════════════════════════════════════
MEASURE
KPIs: FPR, downtime hours, MTBFA.
═══════════════════════════════════════
ANALYZE
Root cause: model trained on steady-state only.
═══════════════════════════════════════
IMPROVE
Retrain with ramp-up data and add human confirmation before shutdown.
═══════════════════════════════════════
CONTROL
Weekly dashboard and automated retraining if FPR >5%.
`;
    expect(isNonAnswer(BASE, answer)).toBe(false);
  });

  it("does not flag career plans that mention Vision 2030 and week ranges", () => {
    const answer = `
PERSONAL TRANSITION PLAN
After two years in predictive maintenance I will move into AI sustainability analytics.
Weeks 1-2: complete an ESG course and review Vision 2030 targets.
Weeks 3-4: map plant sensor data to emissions KPIs.
Weeks 5-8: build a narrow proof-of-concept anomaly model.
Weeks 9-12: present results to leadership and iterate.
This plan covers concern, control, curiosity, and confidence with concrete actions.
`;
    expect(isNonAnswer(BASE, answer)).toBe(false);
  });

  it("flags a near-exact scenario paste", () => {
    expect(isNonAnswer(BASE, BASE.scenario)).toBe(true);
  });

  it("flags scenario paste with a short Task stub", () => {
    expect(isNonAnswer(BASE, `${BASE.scenario}\nTask`)).toBe(true);
  });

  it("still flags keyboard-mash gibberish", () => {
    expect(isNonAnswer(BASE, "asdfghjkl qwerty zxcvbn mnbvcxz")).toBe(true);
  });

  it("does not flag MCQ option text with zero scenario vocabulary overlap", () => {
    const mcq: AssessmentModuleSpec = {
      ...BASE,
      questionType: "mcq",
      choices: [
        "Prioritize sprint backlog by business value, hold daily standups, and measure team velocity iteratively.",
        "Freeze requirements permanently at the start of a multi-year development cycle.",
        "Skip sprint retrospectives to maximize active coding time for team members.",
        "Assign tasks during sprints without estimating effort or capacity constraints.",
      ],
      scenario:
        "A startup, QuickPlate, wants to create a new mobile app. The market is competitive and user preferences change quickly.",
      instructions: "Which methodology is appropriate: Agile or Waterfall?",
    };
    expect(
      isNonAnswer(
        mcq,
        "Prioritize sprint backlog by business value, hold daily standups, and measure team velocity iteratively.",
      ),
    ).toBe(false);
  });

  it("still flags empty MCQ responses", () => {
    const mcq: AssessmentModuleSpec = { ...BASE, questionType: "mcq", choices: ["A", "B", "C", "D"] };
    expect(isNonAnswer(mcq, "")).toBe(true);
  });

  it("still applies Gate 1 zero-overlap to free-text (non-MCQ)", () => {
    const freeText = {
      ...BASE,
      scenario:
        "A startup, QuickPlate, wants to create a new mobile app. The market is competitive and user preferences change quickly. They want a basic version in 3 months and then iterate based on feedback.",
      instructions: "1. Which methodology is appropriate: Agile or Waterfall? 2. Justify your choice in 2 to 3 sentences.",
    };
    expect(
      isNonAnswer(
        freeText,
        "Prioritize sprint backlog by business value, hold daily standups, and measure team velocity iteratively.",
      ),
    ).toBe(true);
  });
});
