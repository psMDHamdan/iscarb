import { chatJson } from "@/lib/ai-engine";
import type { SlideContentJson, ReviewResult } from "../types";

const VISUAL_REVIEW_PROMPT = `
You are the Visual Quality Reviewer for the iSCARB Lecture Pipeline.
Your job is to review the generated Visual Specification and Composition Layout against strict visual quality guidelines.

## SCORING (0-10)
Evaluate:
1. visualRelevance
2. conceptClarity
3. informationHierarchy
4. layoutQuality
5. visualVariety
6. readability
7. diagramCorrectness
8. dataIntegrity
9. studentActionVisibility
10. designConsistency

## HARD FAILS
Fail the slide if it exhibits any of the following:
- decorativeOnly
- emptyVisual
- placeholderVisual
- duplicateLayout (if highly repetitive)
- unreadableText
- unsupportedChart
- brokenDiagram
- visualContentMismatch

Return a JSON object:
{
  "status": "PASS" | "SOFT_FAIL" | "HARD_FAIL",
  "score": 0-100,
  "criticalIssues": [],
  "majorIssues": [],
  "minorIssues": [],
  "failedRules": [],
  "repairActions": []
}
`;

export async function verifyVisualQuality(slide: SlideContentJson): Promise<{ reviewedSlide: SlideContentJson; result: ReviewResult }> {
  if (!slide.visualSpec) {
    return {
      reviewedSlide: slide,
      result: {
        status: "HARD_FAIL",
        score: 0,
        criticalIssues: ["Missing visual specification."],
        majorIssues: [],
        minorIssues: [],
        failedRules: ["emptyVisual"],
        unsupportedClaims: [],
        weakQuestions: [],
        weakExamples: [],
        missingConcepts: [],
        repairActions: ["Generate visual specification for this slide."],
      }
    };
  }

  const prompt = `
Review the following slide composition:

Title: \${slide.title}
Visual Spec: \${JSON.stringify(slide.visualSpec)}
Composition: \${slide.compositionLayout}
Text Blocks: \${slide.visibleContent.join(" | ")}
`;

  const reviewJson = await chatJson(prompt, "gpt-4o", VISUAL_REVIEW_PROMPT);
  
  const result: ReviewResult = {
    status: reviewJson.status,
    score: reviewJson.score,
    criticalIssues: reviewJson.criticalIssues || [],
    majorIssues: reviewJson.majorIssues || [],
    minorIssues: reviewJson.minorIssues || [],
    failedRules: reviewJson.failedRules || [],
    unsupportedClaims: [],
    weakQuestions: [],
    weakExamples: [],
    missingConcepts: [],
    repairActions: reviewJson.repairActions || [],
  };

  return { reviewedSlide: slide, result };
}
