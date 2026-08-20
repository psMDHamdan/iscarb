/**
 * AI Visual Learning System — LLM Metadata Verification & Self-Correction Engine
 *
 * Implements LLM-based structured evaluation of candidate diagrams.
 * Evaluates candidate images using a 4-factor orthogonal rubric:
 *   - Educational Value (35%)
 *   - Relevance (30%)
 *   - Clarity & Quality (20%)
 *   - Diagrammatic Nature (15%)
 *
 * Calculates composite score (0-100), applies minimum threshold (>= 70),
 * assigns standardized rejection taxonomy codes, and handles JSON repair and graceful fallback.
 */

import type {
  CandidateEvaluation,
  CandidateImageMetadata,
  RejectionCode,
  ScoringBreakdown,
  VerificationResult,
  VisualPipelineOptions,
  VisualSearchQuery,
} from "./types";

// Attempt to load dotenv for standalone script support
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require("dotenv");
  dotenv?.config?.();
} catch {
  // Ignore in environments where dotenv is unavailable
}

export const DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
export const DEFAULT_CHAT_MODEL =
  process.env.OPENAI_CHAT_MODEL || "openai/gpt-oss-20b";
export const MIN_COMPOSITE_THRESHOLD = 70;

/**
 * Calculates orthogonal 4-factor weighted score
 */
export function calculateCompositeScore(scores: {
  educationalValue: number;
  relevance: number;
  clarity: number;
  diagrammaticNature: number;
}): ScoringBreakdown {
  const edu = Math.max(0, Math.min(10, scores.educationalValue || 0));
  const rel = Math.max(0, Math.min(10, scores.relevance || 0));
  const cla = Math.max(0, Math.min(10, scores.clarity || 0));
  const diag = Math.max(0, Math.min(10, scores.diagrammaticNature || 0));

  const weightedSum = edu * 0.35 + rel * 0.30 + cla * 0.20 + diag * 0.15;
  const totalWeightedScore = Number((weightedSum * 10).toFixed(1));
  const confidence = Number((totalWeightedScore / 100).toFixed(3));

  return {
    educationalValue: edu,
    relevance: rel,
    clarity: cla,
    diagrammaticNature: diag,
    totalWeightedScore,
    confidence,
  };
}

/**
 * Extracts and cleans JSON payload from raw LLM text output
 */
export function extractJsonFromLlmOutput(rawText: string): any {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty LLM response");
  }

  // Strip DeepSeek / reasoning <think>...</think> blocks
  let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Strip markdown code fences (```json ... ``` or ``` ...)
  const fenceMatch = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(cleaned);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Attempt direct parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Locate JSON object or array bounds
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const jsonCandidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (err: any) {
        throw new Error(`Failed to parse LLM JSON: ${err.message}`);
      }
    }

    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      const jsonCandidate = cleaned.slice(firstBracket, lastBracket + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (err: any) {
        throw new Error(`Failed to parse LLM JSON Array: ${err.message}`);
      }
    }

    throw new Error("No JSON structure detected in LLM response");
  }
}

/**
 * Constructs prompt for LLM evaluation
 */
export function buildVerificationPrompt(
  query: VisualSearchQuery,
  candidates: CandidateImageMetadata[]
): string {
  const candidateDescriptions = candidates.map((c, idx) => {
    return `[Candidate #${idx + 1}]
- Candidate ID: ${c.id}
- File Name: ${c.fileName}
- Clean Title: ${c.cleanTitle}
- Description: ${c.description || "N/A"}
- Categories: ${c.categories.length > 0 ? c.categories.join(", ") : "N/A"}
- Dimensions: ${c.width}x${c.height} (Aspect Ratio: ${c.aspectRatio})
- MIME Type: ${c.mimeType}
- License: ${c.license || "Unknown"}
- Direct URL: ${c.url}
- Thumbnail URL: ${c.thumbUrl}`;
  }).join("\n\n");

  return `You are an expert AI Academic Visual Evaluator for an educational platform.
Your task is to analyze candidate images from Wikimedia Commons for the following query:
- TOPIC: "${query.topic}"
- SUBJECT: "${query.subject}"
- DESIRED TYPE: "${query.diagramType || "diagram/schematic"}"

EVALUATION RULES:
1. Four-factor scoring rubric (0 to 10 for each factor):
   - Educational Value (Weight 35%): Does it teach, explain mechanisms, label structures, or show clear functional relationships?
   - Relevance (Weight 30%): Does it accurately depict the exact requested topic and domain?
   - Clarity & Quality (Weight 20%): Is it a clean schematic, high resolution, legible, and uncluttered?
   - Diagrammatic Nature (Weight 15%): Is it a vector schematic, flowchart, chart, or cross-section rather than a raw real-world photo?

2. Rejection Taxonomy:
   If a candidate is not a suitable educational diagram, assign one of these standardized rejection codes:
   - "REJECT_PORTRAIT_OR_PERSON": Photo/painting/statue of a person or historical figure.
   - "REJECT_FLAG_OR_EMBLEM": National/regional flag, coat of arms, seal, or heraldry.
   - "REJECT_CURRENCY_OR_STAMP": Postage stamp, banknote, coin, or medal.
   - "REJECT_DECORATIVE_ART": Fine art painting, sculpture, or decorative artwork without schematic value.
   - "REJECT_BOOK_OR_DOCUMENT_SCAN": Scanned text page, book cover, or signature.
   - "REJECT_RAW_UNLABELED_PHOTO": Real-world photo lacking instructional labels/callouts.
   - "REJECT_OFF_TOPIC": Image is unrelated to the subject or topic.
   - "REJECT_LOW_PEDAGOGICAL_VALUE": Cluttered, confusing, or illegible visual.

3. Confidence Threshold:
   - Minimum acceptable composite score is 70/100.
   - If composite score >= 70 and not rejected, status is "ACCEPTED".
   - If composite score < 70, status is "REJECTED".

4. Output Format:
   Return ONLY a valid JSON object matching this exact schema:
{
  "selectedCandidateId": "<ID of best accepted candidate or null if none acceptable>",
  "evaluations": [
    {
      "candidateId": "<ID>",
      "status": "ACCEPTED" | "REJECTED",
      "rejectionCode": "<RejectionCode or null>",
      "rejectionReason": "<Short explanation if rejected or null>",
      "scores": {
        "educationalValue": <0-10>,
        "relevance": <0-10>,
        "clarity": <0-10>,
        "diagrammaticNature": <0-10>
      },
      "reasoningChain": "<2-3 sentence justification of the score and pedagogical utility>"
    }
  ],
  "suggestedReformulation": "<Suggested alternative search term if all rejected, or null>"
}

CANDIDATES TO EVALUATE:
${candidateDescriptions}
`;
}

/**
 * Deterministic semantic scoring fallback engine used when LLM API is unavailable/offline
 */
export function evaluateCandidateDeterministically(
  candidate: CandidateImageMetadata,
  query: VisualSearchQuery
): CandidateEvaluation {
  const titleLower = candidate.cleanTitle.toLowerCase();
  const descLower = (candidate.description || "").toLowerCase();
  const catLower = candidate.categories.join(" ").toLowerCase();
  const topicLower = query.topic.toLowerCase();
  const topicWords = topicLower.split(/\s+/).filter((w) => w.length > 2);

  // Check relevance match
  let topicMatches = 0;
  for (const word of topicWords) {
    if (titleLower.includes(word) || descLower.includes(word) || catLower.includes(word)) {
      topicMatches++;
    }
  }
  const matchRatio = topicWords.length > 0 ? topicMatches / topicWords.length : 0.5;

  // Diagram indicators
  const isSvg = candidate.mimeType === "image/svg+xml" || candidate.fileName.endsWith(".svg");
  const hasDiagramWord =
    /\b(diagram|schematic|chart|cycle|structure|flowchart|cross[_\s]section|illustration|map|model|anatomy|system)\b/i.test(
      `${candidate.title} ${candidate.description} ${catLower}`
    );
  const isLabeled =
    /\b(labeled|labelled|en|english|overview|pathway|process|mechanism)\b/i.test(
      `${candidate.title} ${candidate.description}`
    );

  let edu = 5.0;
  let rel = 5.0;
  let cla = 6.0;
  let diag = 5.0;

  if (matchRatio >= 0.8) {
    rel = 9.0;
  } else if (matchRatio >= 0.5) {
    rel = 7.5;
  } else {
    rel = 4.0;
  }

  if (hasDiagramWord) {
    diag += 3.0;
    edu += 2.5;
  }
  if (isSvg) {
    cla += 2.5;
    diag += 1.5;
  }
  if (isLabeled) {
    edu += 1.5;
    cla += 1.0;
  }

  // Bound scores between 0 and 10
  edu = Math.min(10, Math.max(1, edu));
  rel = Math.min(10, Math.max(1, rel));
  cla = Math.min(10, Math.max(1, cla));
  diag = Math.min(10, Math.max(1, diag));

  const scoring = calculateCompositeScore({
    educationalValue: edu,
    relevance: rel,
    clarity: cla,
    diagrammaticNature: diag,
  });

  const passed = scoring.totalWeightedScore >= MIN_COMPOSITE_THRESHOLD && rel >= 6.0;

  return {
    candidateId: candidate.id,
    title: candidate.cleanTitle,
    url: candidate.url,
    thumbUrl: candidate.thumbUrl,
    status: passed ? "ACCEPTED" : "REJECTED",
    rejectionCode: passed ? undefined : rel < 6.0 ? "REJECT_OFF_TOPIC" : "REJECT_LOW_PEDAGOGICAL_VALUE",
    rejectionReason: passed
      ? undefined
      : rel < 6.0
      ? "Image content does not match the target academic concept."
      : "Visual lacks sufficient diagrammatic or instructional clarity.",
    scores: scoring,
    reasoningChain: passed
      ? `Candidate provides strong instructional representation for "${query.topic}" with clear diagrammatic structures (Score: ${scoring.totalWeightedScore}/100).`
      : `Candidate evaluated with composite score ${scoring.totalWeightedScore}/100, which does not meet the minimum threshold of ${MIN_COMPOSITE_THRESHOLD}.`,
    metadata: candidate,
  };
}

/**
 * Parses and validates LLM verification JSON response
 */
export function parseLLMVerificationResponse(
  rawResponse: string,
  candidates: CandidateImageMetadata[],
  threshold: number = MIN_COMPOSITE_THRESHOLD
): VerificationResult {
  const candidateMap = new Map(candidates.map((c) => [c.id, c]));

  let parsed: any;
  try {
    parsed = extractJsonFromLlmOutput(rawResponse);
  } catch (err: any) {
    console.warn("Failed to parse LLM verification JSON, applying deterministic evaluation:", err.message);
    // Fallback to deterministic scoring
    const evaluations = candidates.map((c) =>
      evaluateCandidateDeterministically(c, { topic: c.cleanTitle, subject: "general" })
    );
    const acceptedList = evaluations.filter((e) => e.status === "ACCEPTED");
    const topAccepted =
      acceptedList.length > 0
        ? acceptedList.reduce((best, cur) =>
            cur.scores.totalWeightedScore > best.scores.totalWeightedScore ? cur : best
          )
        : null;

    return {
      status: topAccepted ? "SUCCESS" : "RETRY_NEEDED",
      selectedCandidate: topAccepted,
      evaluatedCandidates: evaluations,
      discardedCandidates: evaluations.filter((e) => e.status === "REJECTED"),
      attemptCount: 1,
      queriesAttempted: [],
      llmRawOutput: rawResponse,
    };
  }

  const rawEvaluations = Array.isArray(parsed.evaluations) ? parsed.evaluations : [];
  const evaluatedCandidates: CandidateEvaluation[] = [];

  for (const rawEval of rawEvaluations) {
    const candidateId = String(rawEval.candidateId || "");
    const candidate = candidateMap.get(candidateId);
    if (!candidate) continue;

    const rawScores = rawEval.scores || {};
    const scores = calculateCompositeScore({
      educationalValue: Number(rawScores.educationalValue) || 0,
      relevance: Number(rawScores.relevance) || 0,
      clarity: Number(rawScores.clarity) || 0,
      diagrammaticNature: Number(rawScores.diagrammaticNature) || 0,
    });

    const isScorePassing = scores.totalWeightedScore >= threshold;
    const isDeclaredAccepted = String(rawEval.status).toUpperCase() === "ACCEPTED";
    const status: "ACCEPTED" | "REJECTED" = isScorePassing && isDeclaredAccepted ? "ACCEPTED" : "REJECTED";

    let rejectionCode: RejectionCode | undefined = undefined;
    if (status === "REJECTED") {
      rejectionCode =
        rawEval.rejectionCode ||
        (scores.relevance < 5 ? "REJECT_OFF_TOPIC" : "REJECT_LOW_PEDAGOGICAL_VALUE");
    }

    evaluatedCandidates.push({
      candidateId,
      title: candidate.cleanTitle,
      url: candidate.url,
      thumbUrl: candidate.thumbUrl,
      status,
      rejectionCode,
      rejectionReason: rawEval.rejectionReason || (status === "REJECTED" ? "Did not meet score threshold" : undefined),
      scores,
      reasoningChain: rawEval.reasoningChain || "Evaluated by LLM visual verification model.",
      metadata: candidate,
    });
  }

  // Ensure all candidates in batch were evaluated
  for (const c of candidates) {
    if (!evaluatedCandidates.some((e) => e.candidateId === c.id)) {
      const fallbackEval = evaluateCandidateDeterministically(c, { topic: c.cleanTitle, subject: "general" });
      evaluatedCandidates.push(fallbackEval);
    }
  }

  const acceptedCandidates = evaluatedCandidates.filter((e) => e.status === "ACCEPTED");

  // Select top accepted candidate with highest composite score
  let selectedCandidate: CandidateEvaluation | null = null;
  if (acceptedCandidates.length > 0) {
    selectedCandidate = acceptedCandidates.reduce((best, curr) =>
      curr.scores.totalWeightedScore > best.scores.totalWeightedScore ? curr : best
    );
  }

  return {
    status: selectedCandidate ? "SUCCESS" : "RETRY_NEEDED",
    selectedCandidate,
    evaluatedCandidates,
    discardedCandidates: evaluatedCandidates.filter((e) => e.status === "REJECTED"),
    attemptCount: 1,
    queriesAttempted: [],
    suggestedReformulation: parsed.suggestedReformulation || undefined,
    llmRawOutput: rawResponse,
  };
}

/**
 * Evaluates candidate images using LLM inference (NVIDIA NIM / OpenAI endpoint)
 */
export async function evaluateCandidatesWithLLM(
  query: VisualSearchQuery,
  candidates: CandidateImageMetadata[],
  options: VisualPipelineOptions = {}
): Promise<VerificationResult> {
  if (!candidates || candidates.length === 0) {
    return {
      status: "RETRY_NEEDED",
      selectedCandidate: null,
      evaluatedCandidates: [],
      discardedCandidates: [],
      attemptCount: 1,
      queriesAttempted: [query.topic],
      suggestedReformulation: `${query.topic} diagram`,
    };
  }

  const threshold = options.minConfidenceThreshold ?? query.minConfidenceThreshold ?? MIN_COMPOSITE_THRESHOLD;

  // Retrieve API keys from env or options
  const apiKey =
    options.apiKey ||
    process.env.NVIDIA_API_KEY ||
    process.env.NVIDIA_API_KEY_2 ||
    process.env.OPENAI_API_KEY;

  const baseUrl =
    options.baseUrl ||
    process.env.NVIDIA_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    DEFAULT_NVIDIA_BASE_URL;

  const model =
    options.aiModel ||
    process.env.OPENAI_CHAT_MODEL ||
    DEFAULT_CHAT_MODEL;

  // If no API key configured, use deterministic evaluation engine
  if (!apiKey) {
    const evaluations = candidates.map((c) => evaluateCandidateDeterministically(c, query));
    const accepted = evaluations.filter((e) => e.status === "ACCEPTED");
    const topCandidate =
      accepted.length > 0
        ? accepted.reduce((best, cur) =>
            cur.scores.totalWeightedScore > best.scores.totalWeightedScore ? cur : best
          )
        : null;

    return {
      status: topCandidate ? "SUCCESS" : "RETRY_NEEDED",
      selectedCandidate: topCandidate,
      evaluatedCandidates: evaluations,
      discardedCandidates: evaluations.filter((e) => e.status === "REJECTED"),
      attemptCount: 1,
      queriesAttempted: [query.topic],
    };
  }

  const prompt = buildVerificationPrompt(query, candidates);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 25000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI Academic Visual Verification Engine for the iSCARB visual learning system. Analyze candidate diagram metadata and emit precise JSON evaluations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`LLM Verification API returned status ${response.status}: ${response.statusText}`);
      throw new Error(`LLM HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    return parseLLMVerificationResponse(rawContent, candidates, threshold);
  } catch (error: any) {
    console.warn("LLM API execution encountered error, falling back to deterministic evaluation:", error?.message || error);
    const evaluations = candidates.map((c) => evaluateCandidateDeterministically(c, query));
    const accepted = evaluations.filter((e) => e.status === "ACCEPTED");
    const topCandidate =
      accepted.length > 0
        ? accepted.reduce((best, cur) =>
            cur.scores.totalWeightedScore > best.scores.totalWeightedScore ? cur : best
          )
        : null;

    return {
      status: topCandidate ? "SUCCESS" : "RETRY_NEEDED",
      selectedCandidate: topCandidate,
      evaluatedCandidates: evaluations,
      discardedCandidates: evaluations.filter((e) => e.status === "REJECTED"),
      attemptCount: 1,
      queriesAttempted: [query.topic],
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
