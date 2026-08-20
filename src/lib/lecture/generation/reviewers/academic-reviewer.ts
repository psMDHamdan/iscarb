import { chatJson } from "@/lib/ai-engine";
import { SlideContentJson, ReviewResult } from "../types";

export async function verifyAcademicContent(
  slides: SlideContentJson[],
  clos: { id: string; text: string }[]
): Promise<{ reviewedSlides: SlideContentJson[]; result: ReviewResult }> {
  
  const prompt = `
You are the Academic Content Reviewer (Professor) for an AI Co-Pilot.
Review the ENTIRE 20-slide lecture progression for academic rigor, coherence, and depth.

CLOs:
${JSON.stringify(clos, null, 2)}

SLIDES:
${JSON.stringify(slides.map(s => ({ no: s.slideNo, title: s.title, objective: s.learningObjective, bullets: s.visibleContent, interaction: s.interaction, examples: s.examples, assessment: s.assessment })), null, 2)}

Check:
1. Is the lecture factually sound?
2. Is the progression logical (Concept -> Mechanism -> Example -> Misconception -> Application -> Assessment)?
3. Are explanations deep enough?
4. Are examples realistic?
5. Are questions unambiguous?
6. Are students asked to think?
7. Does difficulty increase?
8. Does the final assessment measure the CLOs?
9. Is any slide redundant?
10. Are any slides empty or purely decorative?

Return a JSON object matching this schema:
{
  "status": "PASS" | "SOFT_FAIL" | "HARD_FAIL" | "NEEDS_FACULTY_REVIEW",
  "score": 0-5,
  "criticalIssues": ["..."],
  "majorIssues": ["..."],
  "minorIssues": ["..."],
  "failedRules": ["..."],
  "weakQuestions": ["slideNo: issue"],
  "weakExamples": ["slideNo: issue"],
  "missingConcepts": ["..."],
  "repairActions": ["..."]
}
`;

  const response = await chatJson(prompt, "gpt-4o"); 

  const result: ReviewResult = {
    status: response.status || "NEEDS_FACULTY_REVIEW",
    score: response.score || 0,
    criticalIssues: response.criticalIssues || [],
    majorIssues: response.majorIssues || [],
    minorIssues: response.minorIssues || [],
    failedRules: response.failedRules || [],
    unsupportedClaims: [],
    weakQuestions: response.weakQuestions || [],
    weakExamples: response.weakExamples || [],
    missingConcepts: response.missingConcepts || [],
    repairActions: response.repairActions || []
  };

  return {
    reviewedSlides: slides, 
    result
  };
}
