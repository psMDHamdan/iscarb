import { chatJson } from "@/lib/ai-engine";
import { SlideContentJson, ReviewResult } from "../types";

export async function verifyAssessment(
  slide: SlideContentJson,
  clos: { id: string; text: string }[]
): Promise<{ reviewedSlide: SlideContentJson; result: ReviewResult }> {
  
  if (!slide.assessment) {
     return {
      reviewedSlide: slide,
      result: {
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
      }
    };
  }

  const prompt = `
You are the Assessment Reviewer for an academic AI Co-Pilot.
Review the embedded question/assessment on this slide.

ASSESSMENT:
${JSON.stringify(slide.assessment, null, 2)}

CLOs:
${JSON.stringify(clos, null, 2)}

Check:
1. Does it test the intended CLO?
2. Is the answer genuinely correct?
3. Is it too easy? (Trivial recall instead of reasoning)
4. Is the answer leaked in the question wording?
5. Is the stem ambiguous?
6. Are ALL distractors plausible and based on realistic misconceptions?
7. Could more than one be correct?

Return a JSON object:
{
  "status": "PASS" | "HARD_FAIL" | "NEEDS_FACULTY_REVIEW",
  "score": 0-5,
  "criticalIssues": ["..."],
  "majorIssues": ["..."],
  "failedRules": ["..."],
  "weakQuestions": ["..."],
  "repairActions": ["..."]
}
`;

  const response = await chatJson({ user: prompt, model: "gpt-4o" });
  const json = (response.json || {}) as any; 

  const result: ReviewResult = {
    status: json.status || "NEEDS_FACULTY_REVIEW",
    score: json.score || 0,
    criticalIssues: json.criticalIssues || [],
    majorIssues: json.majorIssues || [],
    minorIssues: [],
    failedRules: json.failedRules || [],
    unsupportedClaims: [],
    weakQuestions: json.weakQuestions || [],
    weakExamples: [],
    missingConcepts: [],
    repairActions: json.repairActions || []
  };

  return {
    reviewedSlide: { ...slide, reviewStatus: result.status },
    result
  };
}
