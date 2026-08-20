import "server-only";

import { chatJsonRaw } from "@/lib/ai-engine";
import { scoringModel } from "@/lib/assessment/scoring-model";
import {
  AssessmentModuleSpec,
  ScoredResponse,
  bandFor,
  clamp,
  isPass,
  round1,
} from "./framework";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("batch-scoring");

const SCORING_SYSTEM_PROMPT =
  "You are a calibrated competency assessor inside iSCARB. Evaluate in a Saudi professional context.\nReturn STRICT JSON only. No prose before or after. No markdown fences.";

export interface BatchItem {
  module: AssessmentModuleSpec;
  response: string;
}

export async function scoreBatchResponsesChunked(
  items: BatchItem[],
  chunkSize: number = 10
): Promise<ScoredResponse[]> {
  const results: ScoredResponse[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    log.info(`Scoring chunk ${i / chunkSize + 1} of ${Math.ceil(items.length / chunkSize)} (size: ${chunk.length})`);
    
    try {
      const chunkResults = await scoreChunk(chunk);
      results.push(...chunkResults);
    } catch (err) {
      log.error({ err }, `Failed to score chunk ${i / chunkSize + 1}, falling back to empty scores for this chunk`);
      // Fallback: 0 scores for failed chunks to prevent whole batch failure
      for (const item of chunk) {
        results.push(fallbackZeroScore(item.module, item.response));
      }
    }
  }

  return results;
}

async function scoreChunk(items: BatchItem[]): Promise<ScoredResponse[]> {
  const t0 = Date.now();
  
  const parts: string[] = [
    "ROLE: You are an expert competency assessor for iSCARB, the Saudi Higher Education Readiness platform.",
    "CONTEXT: You must evaluate a BATCH of student free-text responses against their respective rubrics.",
    "GIBBERISH RULE: If the student response is random characters, keyboard mashing, or complete gibberish, you MUST score every criterion as 0, give an overall score of 0, and provide feedback stating that the answer was illegible or random.",
    "\n---",
  ];

  items.forEach((item, index) => {
    parts.push(`## ITEM ${index + 1}`);
    parts.push(`MODULE CODE: ${item.module.code}`);
    if (item.module.saudiContext) {
      parts.push(`SAUDI CONTEXT: ${item.module.saudiContext}`);
    }
    parts.push(`SCENARIO: ${item.module.scenario}`);
    parts.push(`TASK: ${item.module.instructions}`);
    
    const rubricLines = item.module.rubric.map(rc => `- ${rc.criterion} (${rc.weight} pts): ${rc.descriptor}`);
    parts.push(`RUBRIC (weights sum to 100):\n${rubricLines.join("\n")}`);
    
    parts.push(`STUDENT RESPONSE:\n"""\n${item.response}\n"""`);
    parts.push("---\n");
  });

  parts.push(`Return EXACTLY this JSON shape (an array of results in the EXACT same order as the items above):`);
  parts.push(`{`);
  parts.push(`  "results": [`);
  parts.push(`    {`);
  parts.push(`      "itemIndex": <integer 1 to ${items.length}>,`);
  parts.push(`      "score": <integer 0-100>,`);
  parts.push(`      "perCriterion": [ { "criterion": "<name>", "score": <number 0-weight>, "justification": "<one sentence>" } ],`);
  parts.push(`      "feedback": "<2-3 sentence feedback>",`);
  parts.push(`      "strengths": ["<strength 1>", "<strength 2>"],`);
  parts.push(`      "improvements": ["<improvement 1>", "<improvement 2>"]`);
  parts.push(`    }`);
  parts.push(`  ]`);
  parts.push(`}`);

  const userPrompt = parts.join("\n");

  const aiResult = await chatJsonRaw({
    system: SCORING_SYSTEM_PROMPT,
    user: userPrompt,
    temperature: 0.1,
    model: scoringModel(items[0].module.modelTag), // assume all use same model
  });

  const latencyMs = Date.now() - t0;
  
  if (!aiResult.json || !Array.isArray((aiResult.json as any).results)) {
    throw new Error("Invalid JSON structure returned by batch scoring AI");
  }

  const aiResults = (aiResult.json as any).results as any[];
  
  // Map back to ScoredResponse
  return items.map((item, index) => {
    const aiData = aiResults.find(r => r.itemIndex === index + 1);
    if (!aiData) return fallbackZeroScore(item.module, item.response);

    const score = clamp(Math.round(aiData.score ?? 0), 0, 100);
    const band = bandFor(score);

    const perCriterion = item.module.rubric.map((rc) => {
      const aiCrit = (aiData.perCriterion || []).find((c: any) => c.criterion === rc.criterion);
      const critScore = clamp(round1(aiCrit?.score ?? 0), 0, rc.weight);
      return {
        criterion: rc.criterion,
        weight: rc.weight,
        score: critScore,
        max: rc.weight,
        justification: typeof aiCrit?.justification === "string" ? aiCrit.justification : null,
      };
    });

    const safeArray = (val: any) => (Array.isArray(val) ? val.map(String) : []);

    return {
      moduleCode: item.module.code,
      dimension: item.module.dimension,
      score,
      band: band.id,
      passed: isPass(score, item.module.passThreshold),
      perCriterion,
      feedback: typeof aiData.feedback === "string" ? aiData.feedback : "Feedback not provided.",
      strengths: safeArray(aiData.strengths),
      improvements: safeArray(aiData.improvements),
      validationPassed: null,
      model: item.module.modelTag,
      source: "ai",
      latencyMs: Math.round(latencyMs / items.length), // amortized latency
      tokensInput: aiResult.tokensInput ? Math.round(aiResult.tokensInput / items.length) : undefined,
      tokensOutput: aiResult.tokensOutput ? Math.round(aiResult.tokensOutput / items.length) : undefined,
    };
  });
}

function fallbackZeroScore(module: AssessmentModuleSpec, response: string): ScoredResponse {
  return {
    moduleCode: module.code,
    dimension: module.dimension,
    score: 0,
    band: "weak",
    passed: false,
    perCriterion: module.rubric.map(rc => ({
      criterion: rc.criterion,
      weight: rc.weight,
      score: 0,
      max: rc.weight,
      justification: "Batch scoring failed for this item.",
    })),
    feedback: "The AI was unable to score this response during the batch process.",
    strengths: [],
    improvements: [],
    validationPassed: null,
    model: scoringModel(module.modelTag),
    source: "fallback",
    latencyMs: 0,
  };
}
