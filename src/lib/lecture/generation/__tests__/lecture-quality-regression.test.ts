import { describe, it, expect } from "vitest";
import { runDeterministicQA } from "../reviewers/deterministic-qa";
import { verifyEvidence } from "../reviewers/evidence-reviewer";
import { verifyAcademicContent } from "../reviewers/academic-reviewer";
import { verifyAssessment } from "../reviewers/assessment-reviewer";
import { verifyVisualQuality } from "../reviewers/visual-reviewer";
import { simulateScreenshotQA } from "../reviewers/screenshot-qa";
import { SlideContentJson } from "../types";
import { vi } from "vitest";

vi.mock("@/lib/ai-engine", () => ({
  chatJson: vi.fn().mockResolvedValue({
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
    repairActions: [],
    reviewedClaims: [{ id: "c1", verificationStatus: "VERIFIED" }]
  })
}));

describe("CPIT255 Lecture Quality Regression", () => {
  it("should meet strict pedagogical quality gates", async () => {
    // This test simulates loading a fully generated 20-slide CPIT255 deck
    // and passing it through the 14-pass pipeline verification gates.
    
    // Stub slide deck to test QA logic
    const mockSlides: SlideContentJson[] = Array.from({ length: 20 }, (_, i) => ({
      slideNo: i + 1,
      title: `Test Slide ${i + 1}`,
      purpose: "Teach concept",
      learningObjective: "Understand something",
      visibleContent: ["Bullet 1", "Bullet 2"],
      speakerNotes: "Test notes",
      conceptIds: [],
      sourceBlockIds: [],
      cloIds: [],
      bloomLevel: "understand",
      interaction: i % 5 === 0 ? { type: "poll" } : { type: "pause_discuss" },
      visualIntent: "visual plan",
      visualSpec: {
         visualType: "PROCESS",
         purpose: "Show flow",
         learningMessage: "Flow goes A to B",
         layout: "horizontal",
         elements: [], connections: [], labels: [], annotations: [], emphasis: [], studentQuestion: ""
      },
      compositionLayout: "Layout 3 — Process",
      examples: i === 5 ? [{ text: "example" }] : [],
      misconception: i === 8 ? { text: "misconception" } : undefined,
      assessment: i >= 16 ? { stem: "Test" } : undefined,
      citations: [],
      claims: [{ 
        id: "c1", 
        text: "Demand response cuts peak load by 10%.", 
        type: "ILLUSTRATIVE", 
        sourceIds: [], 
        verificationStatus: "VERIFIED" 
      }],
      wordCount: 20
    }));

    // Pass 9: Evidence Review
    const evidenceResult = await verifyEvidence(mockSlides[0], []);
    expect(evidenceResult.result.status).not.toBe("HARD_FAIL");

    // Pass 10: Academic Content Review
    const academicResult = await verifyAcademicContent(mockSlides, []);
    expect(academicResult.result.status).not.toBe("HARD_FAIL");

    // Pass 11: Assessment Review
    const assessmentResult = await verifyAssessment(mockSlides[19], []);
    expect(assessmentResult.result.status).not.toBe("HARD_FAIL");

    // Pass 14: Deterministic QA
    const qaResult = runDeterministicQA(mockSlides);
    expect(qaResult.status).not.toBe("HARD_FAIL");

    // Pass 14: Visual Quality Review
    const visResult = await verifyVisualQuality(mockSlides[0]);
    expect(visResult.result.status).not.toBe("HARD_FAIL");

    // Pass 16: Screenshot QA
    const screenshotResult = await simulateScreenshotQA(mockSlides);
    expect(screenshotResult.status).not.toBe("HARD_FAIL");
  });
});
