import { chatJson, DEFAULT_AI_MODEL } from "@/lib/ai-engine";
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
${JSON.stringify(slides.map(s => ({ no: s.slideNo, title: s.title, objective: s.learningObjective, bullets: s.body?.bullets, interaction: s.interaction, examples: s.examples, assessment: s.assessment })), null, 2)}

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

  const response = await chatJson({ user: prompt, model: DEFAULT_AI_MODEL });
  const json = (response.json || {}) as any; 

  const result: ReviewResult = {
    status: json.status || "NEEDS_FACULTY_REVIEW",
    score: json.score || 0,
    criticalIssues: json.criticalIssues || [],
    majorIssues: json.majorIssues || [],
    minorIssues: json.minorIssues || [],
    failedRules: json.failedRules || [],
    unsupportedClaims: [],
    weakQuestions: json.weakQuestions || [],
    weakExamples: json.weakExamples || [],
    missingConcepts: json.missingConcepts || [],
    repairActions: json.repairActions || []
  };

  return {
    reviewedSlides: slides, 
    result
  };
}
