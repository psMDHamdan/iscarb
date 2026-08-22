import { chatJson, DEFAULT_AI_MODEL } from "@/lib/ai-engine";
import { SlideContentJson, ReviewResult, Claim } from "../types";

export async function verifyEvidence(
  slide: SlideContentJson,
  sourceBlocks: { id: string; locator: string; text: string }[]
): Promise<{ reviewedSlide: SlideContentJson; result: ReviewResult }> {
  if (!slide.claims || slide.claims.length === 0) {
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
You are the Evidence Reviewer for an academic AI Co-Pilot.
Verify the following claims against the provided source blocks.

CLAIMS TO VERIFY:
${JSON.stringify(slide.claims, null, 2)}

SOURCE BLOCKS:
${JSON.stringify(sourceBlocks, null, 2)}

For each claim, determine if it is:
- VERIFIED: Directly supported by the text.
- PARTIALLY_SUPPORTED: Supported in concept but numbers/details vary.
- UNSUPPORTED: Not in the text at all, or directly contradicts it.
- CONFLICTING: Text explicitly states something else.

Return a JSON object containing:
{
  "reviewedClaims": [ { "id": "...", "verificationStatus": "..." } ],
  "unsupportedClaimIds": ["..."],
  "notes": "..."
}
`;

  const response = await chatJson({ user: prompt, model: DEFAULT_AI_MODEL });
  const json = (response.json || {}) as any; 
  
  const claimsList = Array.isArray(slide?.claims) ? slide.claims : [];
  const reviewedClaims = claimsList.map(c => {
    const review = json.reviewedClaims?.find((rc: any) => rc.id === c.id);
    return { ...c, verificationStatus: review?.verificationStatus || "UNSUPPORTED" };
  });

  const unsupportedIds = json.unsupportedClaimIds || [];
  const hasUnsupported = unsupportedIds.length > 0;

  const result: ReviewResult = {
    status: hasUnsupported ? "HARD_FAIL" : "PASS",
    score: hasUnsupported ? 1 : 5,
    criticalIssues: hasUnsupported ? ["Unsupported claims detected on slide."] : [],
    majorIssues: [],
    minorIssues: [],
    failedRules: hasUnsupported ? ["All claims must be supported by source material."] : [],
    unsupportedClaims: unsupportedIds,
    weakQuestions: [],
    weakExamples: [],
    missingConcepts: [],
    repairActions: hasUnsupported ? ["Regenerate slide ensuring claims are strictly sourced."] : []
  };

  return {
    reviewedSlide: { ...slide, claims: reviewedClaims as Claim[], reviewStatus: result.status },
    result
  };
}
