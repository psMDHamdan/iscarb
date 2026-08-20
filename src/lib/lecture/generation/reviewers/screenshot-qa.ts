import { chatJson } from "@/lib/ai-engine";
import type { SlideContentJson, ReviewResult } from "../types";

const SCREENSHOT_QA_PROMPT = `
You are the Vision LLM Screenshot QA Simulator.
In production, you would receive actual rendered PNGs of the PPTX slides.
For now, you are receiving the fully composed SlideContentJson (including VisualSpec and Composition Layout).

Your job is to simulate a computer vision review of the slide and detect visual presentation failures.

## DETECT
- empty (lack of visual substance)
- ugly (poor balance/alignment implied by layout and text volume)
- repetitive (too similar to previous slides)
- unreadable (too much text crammed into blocks)
- excessive whitespace (visual doesn't fill 40-65% area)
- text wall (paragraphs instead of short blocks)
- broken diagram (missing connections or orphaned nodes in VisualSpec)

Return a JSON object:
{
  "status": "PASS" | "HARD_FAIL",
  "score": 0-100,
  "failedRules": [],
  "repairActions": []
}
`;

export async function simulateScreenshotQA(slides: SlideContentJson[]): Promise<{ status: "PASS" | "HARD_FAIL"; failures: { slideNo: number; result: ReviewResult }[] }> {
  const failures: { slideNo: number; result: ReviewResult }[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const previousLayouts = slides.slice(Math.max(0, i - 3), i).map(s => s.compositionLayout);

    const prompt = `
Review this simulated slide screenshot representation:

Title: ${slide.title}
Composition: ${slide.compositionLayout}
Previous 3 Layouts: ${previousLayouts.join(", ")}
Word Count: ${slide.wordCount}
Visual Nodes Count: ${slide.visualSpec?.nodes?.length || 0}
Visual Connections Count: ${slide.visualSpec?.connections?.length || 0}
Text Blocks: ${(slide.body?.bullets || []).join(" | ")}
`;

    const reviewJson = await chatJson(prompt, "gpt-4o-mini", SCREENSHOT_QA_PROMPT);
    
    if (reviewJson.status === "HARD_FAIL" || reviewJson.failedRules?.length > 0) {
      failures.push({
        slideNo: slide.slideNo,
        result: {
          status: "HARD_FAIL",
          score: reviewJson.score || 0,
          criticalIssues: reviewJson.failedRules || [],
          majorIssues: [],
          minorIssues: [],
          failedRules: reviewJson.failedRules || [],
          unsupportedClaims: [],
          weakQuestions: [],
          weakExamples: [],
          missingConcepts: [],
          repairActions: reviewJson.repairActions || [],
        }
      });
    }
  }

  return {
    status: failures.length > 0 ? "HARD_FAIL" : "PASS",
    failures
  };
}
