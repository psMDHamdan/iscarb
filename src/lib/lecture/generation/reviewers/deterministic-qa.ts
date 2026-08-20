import { SlideContentJson, ReviewResult } from "../types";

export function runDeterministicQA(
  slides: SlideContentJson[]
): ReviewResult {
  const result: ReviewResult = {
    status: "PASS",
    score: 5,
    criticalIssues: [],
    majorIssues: [],
    minorIssues: [],
    failedRules: [],
    unsupportedClaims: [],
    weakQuestions: [],
    weakExamples: [],
    missingConcepts: [],
    repairActions: []
  };

  if (slides.length !== 20) {
    result.status = "HARD_FAIL";
    result.criticalIssues.push(`Expected 20 slides, got ${slides.length}`);
  }

  let visualPlans = 0;
  let examplesCount = 0;
  let pauseAndDiscuss = 0;
  let polls = 0;
  let collaborations = 0;
  let calculations = 0;
  let readinessChecks = 0;

  slides.forEach((slide) => {
    if (slide.wordCount > 40) {
      result.failedRules.push(`Slide ${slide.slideNo}: Word count ${slide.wordCount} > 40`);
      result.status = "SOFT_FAIL";
    }
    const bullets = slide.body?.bullets?.length || 0;
    if (bullets > 5) {
      result.failedRules.push(`Slide ${slide.slideNo}: Bullet count ${bullets} > 5`);
      result.status = "SOFT_FAIL";
    }

    if (slide.visualIntent && slide.visualIntent.generateDiagram) visualPlans++;
    if (slide.examples && slide.examples.length > 0) examplesCount += slide.examples.length;
    if (slide.body?.studentAction?.type === "poll") polls++;
    if (slide.body?.studentAction?.type === "pause_discuss") pauseAndDiscuss++;
    if (slide.body?.studentAction?.type === "collaboration") collaborations++;
    if (slide.body?.studentAction?.type === "calculation") calculations++;

    if (!slide.title || slide.title.length < 3) {
      result.criticalIssues.push(`Slide ${slide.slideNo}: Empty or missing title`);
      result.status = "HARD_FAIL";
    }
  });

  if (visualPlans < 18) {
    result.failedRules.push(`Requires >= 18 visual plans, found ${visualPlans}`);
    if (result.status === "PASS") result.status = "SOFT_FAIL";
  }
  if (polls < 2) {
    result.failedRules.push(`Requires >= 2 polls, found ${polls}`);
    if (result.status === "PASS") result.status = "SOFT_FAIL";
  }
  if (pauseAndDiscuss < 3) {
    result.failedRules.push(`Requires >= 3 pause & discuss, found ${pauseAndDiscuss}`);
    if (result.status === "PASS") result.status = "SOFT_FAIL";
  }
  if (collaborations < 1) {
    result.failedRules.push(`Requires >= 1 collaboration, found ${collaborations}`);
    if (result.status === "PASS") result.status = "SOFT_FAIL";
  }
  if (examplesCount < 3) {
    result.failedRules.push(`Requires >= 3 examples, found ${examplesCount}`);
    if (result.status === "PASS") result.status = "SOFT_FAIL";
  }
  if (readinessChecks < 4) {
    result.failedRules.push(`Requires >= 4 readiness checks, found ${readinessChecks}`);
    if (result.status === "PASS") result.status = "SOFT_FAIL";
  }
  if (calculations < 1) {
    result.failedRules.push(`Requires >= 1 calculation arc, found ${calculations}`);
    if (result.status === "PASS") result.status = "SOFT_FAIL";
  }

  if (result.status !== "PASS") {
    result.score = result.status === "HARD_FAIL" ? 1 : 3;
    result.repairActions.push("Regenerate failing slides to meet deterministic constraints.");
  }

  return result;
}
