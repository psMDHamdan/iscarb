import "server-only";
import { chatJson as defaultChatJson, withTimeout as defaultWithTimeout } from "@/lib/ai-engine";
import { moduleLogger } from "@/lib/logger";
import { scoringModel } from "@/lib/assessment/scoring-model";
import {
  AssessmentModuleSpec,
  CriterionScore,
  RubricCriterion,
  ScoredResponse,
  bandFor,
  clamp,
  isPass,
  round1,
} from "./framework";
import { recordAuditAgreement } from "./audit-agreement";
import type {
  CriterionAuditTrail,
  ScoringDiagnostics,
} from "./score-diagnostics";
import { formatDiagnosticsAudit } from "./score-diagnostics";
import { asSentence, sharesRootIssue, pushDistinctSentence } from "./text-dedupe";
const CALL_TIMEOUT_MS = 60000;
const MAX_PARALLEL_CRITERIA = 3;
const RETRY_DELAY_MS = 1500;
const log = moduleLogger("dual-call-scoring");

type ChatJsonFn = typeof defaultChatJson;
type WithTimeoutFn = typeof defaultWithTimeout;
let chatJsonImpl: ChatJsonFn = defaultChatJson;
let withTimeoutImpl: WithTimeoutFn = defaultWithTimeout;

export function __setDualCallAiForTests(opts: {
  chatJson?: ChatJsonFn;
  withTimeout?: WithTimeoutFn;
}) {
  if (opts.chatJson) chatJsonImpl = opts.chatJson;
  if (opts.withTimeout) withTimeoutImpl = opts.withTimeout;
}

export function __resetDualCallAiForTests() {
  chatJsonImpl = defaultChatJson;
  withTimeoutImpl = defaultWithTimeout;
}

export interface CallAResult {
  score: number;
  quote: string | null;
  justification: string;
}

export interface CallBResult {
  verdict: "YES" | "NO";
  reasoning: string;
}

export interface CriterionPassResult {
  trail: CriterionAuditTrail;
  criterionScore: CriterionScore;
  firstPassAgreed: boolean;
  firstPassRejected: boolean;
}

const GENERIC_JUSTIFICATION_PATTERNS = [
  /strong alignment based on how the answer addresses the descriptor/i,
  /partial coverage of .+; the answer touches the idea but lacks depth/i,
  /solid signal on .+ with clear but incomplete alignment/i,
  /little or no engagement with .+ relative to/i,
  /based on how the answer addresses the descriptor/i,
  /clear but incomplete alignment to the descriptor/i,
  /the answer touches the idea but lacks depth against the descriptor/i,
  /demonstrates (good|strong|solid|clear) (understanding|alignment|coverage)/i,
  /shows (adequate|sufficient|good) understanding of (the )?criterion/i,
  /the response (adequately|sufficiently|clearly) (addresses|covers|meets) (the )?criterion/i,
];

export function isGenericJustification(
  justification: string,
  studentAnswer: string,
): boolean {
  const j = (justification || "").trim();
  if (j.length < 24) return true;
  if (GENERIC_JUSTIFICATION_PATTERNS.some((re) => re.test(j))) return true;
  const answerTokens = new Set(
    studentAnswer
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4),
  );
  const justTokens = j
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  const overlap = justTokens.filter((t) => answerTokens.has(t)).length;
  return overlap < 1;
}

function quoteInAnswer(response: string, quote: string | null): boolean {
  if (!quote?.trim()) return false;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const nq = norm(quote);
  const nr = norm(response);
  if (nr.includes(nq)) return true;
  const prefix = nq.slice(0, Math.min(60, nq.length));
  return prefix.length >= 12 && nr.includes(prefix);
}

function truncateAnchorText(text: string, max = 320): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Per-criterion calibration block from module.fewShot.
 * Anchors are holistic (overall /100 + feedback); we map them onto this
 * criterion's 0–10 scale so Call A/B stay criterion-scoped rather than
 * dumping four-block Block 4 wholesale.
 */
function formatCriterionCalibrationAnchors(
  module: AssessmentModuleSpec,
  criterion: RubricCriterion,
): string {
  const anchors = module.fewShot ?? [];
  if (anchors.length === 0) return "";

  const lines = anchors.map((a, i) => {
    const approx0to10 = Math.round(clamp(a.score, 0, 100) / 10);
    return [
      `Anchor ${i + 1} — overall module ${a.score}/100 (≈ ${approx0to10}/10 when quality on "${criterion.criterion}" tracks overall):`,
      `  Example response: "${truncateAnchorText(a.response)}"`,
      `  Assessor note: ${truncateAnchorText(a.feedback, 220)}`,
    ].join("\n");
  });

  return [
    `CALIBRATION ANCHORS for criterion "${criterion.criterion}" (${criterion.weight} pts of 100):`,
    ...lines,
    `Scale guide: match the student to the nearest anchor's severity for THIS criterion.`,
    `A response like a low anchor that engages the criterion incorrectly still earns a low non-zero 0–10 — not an automatic 0.`,
    `A response like a high anchor should score near 10 on this criterion.`,
  ].join("\n");
}

/**
 * Call B evidence calibration: anchors teach that a clear WRONG answer about
 * the criterion is still verifiable evidence (score low via Call A), not a NO.
 */
function formatCallBEvidenceAnchors(
  module: AssessmentModuleSpec,
  criterion: RubricCriterion,
): string {
  const anchors = module.fewShot ?? [];
  if (anchors.length === 0) return "";

  const lines = anchors.map((a, i) => {
    const band =
      a.score >= 80 ? "strong" : a.score >= 40 ? "partial/developing" : "weak/incorrect";
    return (
      `Anchor ${i + 1} (${band}, overall ${a.score}/100): responses in this band still contain ` +
      `criterion-relevant claims about "${criterion.criterion}" that an auditor can verify — ` +
      `including clearly wrong choices. Example claim surface: "${truncateAnchorText(a.response, 160)}"`
    );
  });

  return [
    `EVIDENCE CALIBRATION for "${criterion.criterion}":`,
    ...lines,
    `Verdict YES if the quote makes a substantive claim about this criterion (correct OR incorrect).`,
    `Verdict NO only if the quote is off-topic, empty, or mere unrelated vocabulary with no criterion claim.`,
  ].join("\n");
}

function callASystem(): string {
  return [
    "You are a calibrated competency assessor. Score ONE criterion only.",
    "Return STRICT JSON. No prose outside JSON.",
    "Rules:",
    "- score: integer 0–10 for how well THIS answer demonstrates THIS criterion alone.",
    "- Use any CALIBRATION ANCHORS as the severity scale for this criterion (map overall anchor quality onto 0–10 here).",
    "- A wrong but on-criterion answer matching a low anchor should score low but usually > 0 — not an automatic 0.",
    "- quote: exact contiguous substring copied verbatim from the student answer that is your best evidence. Use null if none.",
    "- justification: ONE sentence that cites a concrete, answer-specific detail (names, actions, numbers, phrasing from the answer). Never use generic rubric boilerplate that could apply to any answer.",
  ].join("\n");
}

function callAUser(
  module: AssessmentModuleSpec,
  response: string,
  criterion: RubricCriterion,
): string {
  const parts = [
    `CRITERION: ${criterion.criterion}`,
    `DESCRIPTOR: ${criterion.descriptor}`,
  ];
  const anchors = formatCriterionCalibrationAnchors(module, criterion);
  if (anchors) {
    parts.push("", anchors);
  }
  parts.push(
    ``,
    `STUDENT ANSWER:`,
    `"""`,
    response,
    `"""`,
    ``,
    `Return JSON: { "score": <0-10>, "quote": "<verbatim substring or null>", "justification": "<one answer-specific sentence>" }`,
  );
  return parts.join("\n");
}

function callBSystem(): string {
  return [
    "You are an independent evidence auditor. You have NOT seen any prior scoring.",
    "Read ONLY the quote in isolation. Do not invent context outside the quote.",
    "Return STRICT JSON.",
    "YES = the quote makes a substantive claim about the named criterion (including a clearly wrong claim).",
    "NO = the quote is off-topic, empty, or only related vocabulary with no criterion-relevant claim.",
    "Do NOT require the quote to demonstrate a correct or high-quality answer — correctness is scored elsewhere.",
  ].join("\n");
}

function callBUser(
  module: AssessmentModuleSpec,
  criterion: RubricCriterion,
  quote: string,
): string {
  const parts = [
    `A student claims this quote is evidence for scoring the criterion "${criterion.criterion}": ${criterion.descriptor}`,
  ];
  const anchors = formatCallBEvidenceAnchors(module, criterion);
  if (anchors) {
    parts.push("", anchors);
  }
  parts.push(
    ``,
    `QUOTE (read only this):`,
    `"""`,
    quote,
    `"""`,
    ``,
    `Does this quote alone make a substantive claim about "${criterion.criterion}" (correct or incorrect)?`,
    `Return JSON: { "verdict": "YES"|"NO", "reasoning": "<one sentence>" }`,
  );
  return parts.join("\n");
}

async function runCallA(
  module: AssessmentModuleSpec,
  response: string,
  criterion: RubricCriterion,
): Promise<{ result: CallAResult; model: string; latencyMs: number; tokensInput: number; tokensOutput: number }> {
  const maxAttempts = 2;
  let last: CallAResult = { score: 0, quote: null, justification: "call failed" };
  let model = module.modelTag;
  let latencyMs = 0;
  let tokensInput = 0;
  let tokensOutput = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const raw = await withTimeoutImpl(
        chatJsonImpl({
          system: callASystem(),
          user:
            attempt === 0
              ? callAUser(module, response, criterion)
              : [
                  callAUser(module, response, criterion),
                  ``,
                  `PREVIOUS justification was rejected as generic boilerplate.`,
                  `Rewrite justification with a detail UNIQUE to this answer. Do not reuse generic descriptor phrasing.`,
                ].join("\n"),
          temperature: Math.min(module.temperature, 0.3),
          model: scoringModel(module.modelTag),
        }),
        CALL_TIMEOUT_MS,
        `assessment:callA:${module.code}:${criterion.criterion}:${attempt}`,
      );

      model = raw.model;
      latencyMs += raw.latencyMs;
      const u = raw.usage as any;
      if (u) {
        tokensInput += u.promptTokens || u.prompt_tokens || 0;
        tokensOutput += u.completionTokens || u.completion_tokens || 0;
      }
      const json = raw.json as Record<string, unknown> | null;
      if (!json || json.score === undefined || isNaN(Number(json.score))) {
        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
        continue;
      }

      const score = Math.round(clamp(Number(json.score), 0, 10));
      const quote =
        typeof json.quote === "string" && json.quote.trim()
          ? json.quote.trim()
          : null;
      const justification =
        typeof json.justification === "string" ? json.justification.trim() : "";

      last = { score, quote, justification };

      const quoteOk = !quote || quoteInAnswer(response, quote);
      const justOk = !isGenericJustification(justification, response);
      if (quote && !quoteOk) last.quote = null;
      if (quoteOk && justOk && justification.length >= 24) {
        return { result: last, model, latencyMs, tokensInput, tokensOutput };
      }
    } catch (err) {
      log.warn({ err, attempt, module: module.code, criterion: criterion.criterion }, "runCallA failed, will retry");
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  return { result: last, model, latencyMs, tokensInput, tokensOutput };
}

async function runCallB(
  module: AssessmentModuleSpec,
  criterion: RubricCriterion,
  quote: string,
): Promise<{ result: CallBResult; model: string; latencyMs: number; tokensInput: number; tokensOutput: number }> {
  let lastErr: Error | null = null;
  let tokensInput = 0;
  let tokensOutput = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await withTimeoutImpl(
        chatJsonImpl({
          system: callBSystem(),
          user: callBUser(module, criterion, quote),
          temperature: 0,
          model: scoringModel(module.modelTag),
        }),
        CALL_TIMEOUT_MS,
        `assessment:callB:${module.code}:${criterion.criterion}`,
      );

      const u = raw.usage as any;
      if (u) {
        tokensInput += u.promptTokens || u.prompt_tokens || 0;
        tokensOutput += u.completionTokens || u.completion_tokens || 0;
      }

      const json = raw.json as Record<string, unknown> | null;
      if (json) {
        const verdictRaw = String(json.verdict ?? "NO").toUpperCase();
        const verdict: "YES" | "NO" = verdictRaw === "YES" ? "YES" : "NO";
        const reasoning =
          typeof json.reasoning === "string" && json.reasoning.trim()
            ? json.reasoning.trim()
            : verdict === "YES"
              ? "Quote demonstrates the criterion."
              : "Quote does not demonstrate the criterion.";

        return {
          result: { verdict, reasoning },
          model: raw.model,
          latencyMs: raw.latencyMs,
          tokensInput,
          tokensOutput,
        };
      }
      lastErr = new Error("callB-bad-shape");
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error("callB failed");
    }
    if (attempt < 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }

  return {
    result: { verdict: "NO", reasoning: "Call B failed after retries" },
    model: scoringModel(module.modelTag),
    latencyMs: 0,
    tokensInput,
    tokensOutput,
  };
}

async function scoreOneCriterion(
  module: AssessmentModuleSpec,
  response: string,
  criterion: RubricCriterion,
): Promise<CriterionPassResult & { tokensInput: number; tokensOutput: number }> {
  const attempts: CriterionAuditTrail["attempts"] = [];
  let firstPassAgreed = false;
  let firstPassRejected = false;
  let totalLatency = 0;
  let tokensInput = 0;
  let tokensOutput = 0;
  let model = module.modelTag;

  const maxRounds = 2;
  for (let round = 0; round < maxRounds; round++) {
    const a = await runCallA(module, response, criterion);
    totalLatency += a.latencyMs;
    tokensInput += a.tokensInput;
    tokensOutput += a.tokensOutput;
    model = a.model;

    let b: CallBResult;
    if (!a.result.quote) {
      b = {
        verdict: "NO",
        reasoning:
          "No verbatim quote was provided; cannot verify criterion evidence.",
      };
    } else {
      const audited = await runCallB(module, criterion, a.result.quote);
      totalLatency += audited.latencyMs;
      tokensInput += audited.tokensInput;
      tokensOutput += audited.tokensOutput;
      model = audited.model;
      b = audited.result;
    }

    attempts.push({
      callA: {
        score: a.result.score,
        quote: a.result.quote,
        justification: a.result.justification,
      },
      callB: b,
    });

    if (round === 0) {
      firstPassAgreed = b.verdict === "YES";
      firstPassRejected = b.verdict === "NO";
    }

    if (b.verdict === "YES") {
      const score0to10 = a.result.score;
      const awarded = round1((score0to10 / 10) * criterion.weight);
      return {
        firstPassAgreed,
        firstPassRejected,
        tokensInput,
        tokensOutput,
        trail: {
          criterion: criterion.criterion,
          attempts,
          final: {
            status: "scored",
            score0to10,
            quote: a.result.quote,
            justification: a.result.justification,
            verdict: "YES",
            verdictReasoning: b.reasoning,
          },
        },
        criterionScore: {
          criterion: criterion.criterion,
          weight: criterion.weight,
          score: awarded,
          max: criterion.weight,
          status: "scored",
          quote: a.result.quote,
          justification: a.result.justification,
          auditVerdict: "YES",
          auditReasoning: b.reasoning,
        },
      };
    }
    if (round < maxRounds - 1) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  return {
    firstPassAgreed,
    firstPassRejected,
    tokensInput,
    tokensOutput,
    trail: {
      criterion: criterion.criterion,
      attempts,
      final: {
        status: "insufficient_evidence",
        score0to10: null,
        quote: null,
        justification: null,
        verdict: "NO",
        verdictReasoning:
          attempts[attempts.length - 1]?.callB.reasoning ??
          "Evidence did not hold up under independent audit.",
      },
    },
    criterionScore: {
      criterion: criterion.criterion,
      weight: criterion.weight,
      score: 0,
      max: criterion.weight,
      status: "insufficient_evidence",
      quote: null,
      justification: "insufficient evidence",
      auditVerdict: "NO",
      auditReasoning:
        attempts[attempts.length - 1]?.callB.reasoning ??
        "Evidence did not hold up under independent audit.",
    },
  };
}

async function runFrameworkCheck(
  module: AssessmentModuleSpec,
  response: string,
): Promise<{ framework: string; justification: string; latencyMs: number; model: string; tokensInput: number; tokensOutput: number }> {
  try {
    const raw = await withTimeoutImpl(
      chatJsonImpl({
        system: [
          "You check whether a named assessment framework fits the TASK the candidate was given.",
          "Justify against the actual task content (what the candidate must produce), not merely the scenario's surface topic.",
          "Avoid boilerplate. Cite a concrete task requirement.",
          "Return STRICT JSON.",
        ].join("\n"),
        user: [
          `FRAMEWORK NAME: ${module.framework}`,
          `MODULE FOCUS: ${module.focus}`,
          `SCENARIO: ${module.scenario}`,
          `TASK: ${module.instructions}`,
          ``,
          `(Student answer is provided only for context of what was attempted; judge framework fit against the TASK.)`,
          `STUDENT ANSWER (context):`,
          `"""${response.slice(0, 800)}"""`,
          ``,
          `Return JSON: { "framework": "${module.framework}", "justification": "<one non-boilerplate sentence tying framework to a concrete task requirement>" }`,
        ].join("\n"),
        temperature: 0.2,
        model: scoringModel(module.modelTag),
      }),
      CALL_TIMEOUT_MS,
      `assessment:framework:${module.code}`,
    );

    let tokensInput = 0;
    let tokensOutput = 0;
    const u = raw.usage as any;
    if (u) {
      tokensInput = u.promptTokens || u.prompt_tokens || 0;
      tokensOutput = u.completionTokens || u.completion_tokens || 0;
    }

    const json = raw.json as Record<string, unknown> | null;
    const justification =
      typeof json?.justification === "string" && json.justification.trim().length >= 24
        ? json.justification.trim()
        : `The task requires the candidate to ${module.focus.toLowerCase().replace(/\.$/, "")}, which is the competency "${module.framework}" is designed to assess — not merely the scenario topic.`;

    const finalJust = /not merely the surface topic of the scenario/i.test(justification)
      ? `Task instructions ask for work that exercises ${module.focus}; "${module.framework}" matches that demanded production, not the scenario's topical veneer.`
      : justification;

    return {
      framework: typeof json?.framework === "string" ? json.framework : module.framework,
      justification: finalJust,
      latencyMs: raw.latencyMs,
      model: raw.model,
      tokensInput,
      tokensOutput,
    };
  } catch {
    return {
      framework: module.framework,
      justification: `Task instructions ask for work that exercises ${module.focus}; "${module.framework}" matches that demanded production, not the scenario's topical veneer.`,
      latencyMs: 0,
      model: scoringModel(module.modelTag),
      tokensInput: 0,
      tokensOutput: 0,
    };
  }
}

async function runCriteriaWithConcurrency(
  module: AssessmentModuleSpec,
  response: string,
  rubric: RubricCriterion[],
): Promise<CriterionPassResult[]> {
  const results: CriterionPassResult[] = [];
  for (let i = 0; i < rubric.length; i += MAX_PARALLEL_CRITERIA) {
    const batch = rubric.slice(i, i + MAX_PARALLEL_CRITERIA);
    const batchResults = await Promise.all(
      batch.map((c) => scoreOneCriterion(module, response, c)),
    );
    results.push(...batchResults);
  }
  return results;
}

function buildDualCallDiagnostics(
  module: AssessmentModuleSpec,
  trails: CriterionAuditTrail[],
  overall: number,
  feedback: string,
  frameworkCheck: { framework: string; justification: string },
  agreement: { agreed: number; total: number; rate: number },
): ScoringDiagnostics {
  const criteria = module.rubric.map((c) => c.criterion);

  const perCriterion = trails.map((t) => ({
    criterion: t.criterion,
    score0to10:
      t.final.status === "insufficient_evidence"
        ? 0
        : (t.final.score0to10 ?? 0),
    explanation:
      t.final.status === "insufficient_evidence"
        ? "insufficient evidence"
        : t.final.justification ?? "",
    status: t.final.status,
  }));

  const scoredOnly = trails.filter((t) => t.final.status === "scored");
  const byScore = [...scoredOnly].sort(
    (a, b) => (b.final.score0to10 ?? 0) - (a.final.score0to10 ?? 0),
  );
  const highest = byScore[0];
  const lowest =
    byScore.length > 1
      ? byScore[byScore.length - 1]
      : trails.find((t) => t.final.status === "insufficient_evidence") ?? byScore[0];

  const evidence = [
    highest
      ? {
          criterion: highest.criterion,
          role: "highest" as const,
          quote: highest.final.quote,
          note: highest.final.quote
            ? "Call A quote verified by independent Call B."
            : "no clear textual evidence exists for this criterion",
        }
      : {
          criterion: criteria[0] ?? "n/a",
          role: "highest" as const,
          quote: null,
          note: "no clear textual evidence exists for this criterion",
        },
    lowest
      ? {
          criterion: lowest.criterion,
          role: "lowest" as const,
          quote: lowest.final.quote,
          note:
            lowest.final.status === "insufficient_evidence"
              ? "insufficient evidence — Call B rejected quote(s)."
              : lowest.final.quote
                ? "Call A quote verified by independent Call B."
                : "no clear textual evidence exists for this criterion",
        }
      : {
          criterion: criteria[criteria.length - 1] ?? "n/a",
          role: "lowest" as const,
          quote: null,
          note: "no clear textual evidence exists for this criterion",
        },
  ];

  const selfVerification = trails.map((t) => ({
    criterion: t.criterion,
    quote: t.final.quote,
    matchesCriterion: (t.final.verdict ?? "NO") as "YES" | "NO",
    resolution:
      t.final.status === "insufficient_evidence"
        ? `NO — insufficient evidence. ${t.final.verdictReasoning ?? ""}`.trim()
        : `${t.final.verdict} — ${t.final.verdictReasoning ?? ""}`.trim(),
  }));

  let mostConvincing: string | null = null;
  let weakest: string | null = null;
  if (highest?.final.quote) {
    mostConvincing = `most convincing on "${highest.criterion}" (e.g. "${highest.final.quote}")`;
  } else if (highest) {
    mostConvincing = `most convincing on "${highest.criterion}" — no clear textual evidence exists for this criterion`;
  }
  if (lowest?.final.status === "insufficient_evidence") {
    weakest = `weakest on "${lowest.criterion}" — insufficient evidence`;
  } else if (lowest?.final.quote) {
    weakest = `weakest on "${lowest.criterion}" (e.g. "${lowest.final.quote}")`;
  } else if (lowest) {
    weakest = `weakest on "${lowest.criterion}" — no clear textual evidence exists for this criterion`;
  }

  const finalOutput = {
    score: overall,
    mostConvincing,
    weakest,
    feedback,
  };

  const rubricSource = {
    criteria,
    origin: "predefined" as const,
    originNote:
      "(a) Predefined and fixed for this module — criteria come from the catalog rubric for this scenario, not generated from the answer.",
  };

  const diagnostics: ScoringDiagnostics = {
    rubricSource,
    perCriterion,
    evidence,
    selfVerification,
    finalOutput,
    frameworkCheck,
    criterionAudits: trails,
    agreementRate: agreement,
    auditText: "",
  };
  diagnostics.auditText = formatDiagnosticsAudit(diagnostics);
  return diagnostics;
}

function humanizeCriterionName(criterion: string): string {
  return criterion.replace(/_/g, " ");
}



/**
 * Compose 2–3 sentence narrative feedback from Call A/B trail text.
 * Deterministic string composition only — no extra model call.
 * Low-scoring criteria that share one root issue are collapsed to one
 * diagnostic sentence; a second sentence adds a distinct point or names
 * which criteria that shared issue affected.
 */
function buildStudentFeedback(
  module: AssessmentModuleSpec,
  overall: number,
  trails: CriterionAuditTrail[],
): string {
  const byScoreAsc = [...trails].sort(
    (a, b) => (a.final.score0to10 ?? -1) - (b.final.score0to10 ?? -1),
  );
  const byScoreDesc = [...byScoreAsc].reverse();

  const lowTrails = byScoreAsc.filter(
    (t) =>
      t.final.status === "insufficient_evidence" ||
      (t.final.score0to10 ?? 0) <= 5,
  );
  const strong = byScoreDesc.find(
    (t) => t.final.status === "scored" && (t.final.score0to10 ?? 0) >= 7 && t.final.justification,
  );
  const mid = byScoreDesc.find(
    (t) =>
      t.final.status === "scored" &&
      (t.final.score0to10 ?? 0) > 5 &&
      (t.final.score0to10 ?? 0) < 7 &&
      t.final.justification,
  );

  const sentences: string[] = [];

  if (strong?.final.justification) {
    pushDistinctSentence(sentences, strong.final.justification);
  } else if (mid?.final.justification) {
    pushDistinctSentence(sentences, mid.final.justification);
  } else if (overall >= 60 && lowTrails.length === 0) {
    pushDistinctSentence(
      sentences,
      `The response addresses the ${module.focus.replace(/\.$/, "")} task at a ${overall}/100 level`,
    );
  }

  // Prefer the most informative low justification once; skip near-duplicates.
  let usedLowJustification: CriterionAuditTrail | null = null;
  for (const t of lowTrails) {
    if (t.final.status === "insufficient_evidence") {
      const reason = t.final.verdictReasoning?.trim();
      const added = pushDistinctSentence(
        sentences,
        reason
          ? `On ${humanizeCriterionName(t.criterion)}, the answer lacked verifiable evidence (${reason})`
          : `On ${humanizeCriterionName(t.criterion)}, the answer lacked verifiable evidence against the rubric`,
      );
      if (added) {
        usedLowJustification = t;
        break;
      }
    } else if (t.final.justification) {
      const added = pushDistinctSentence(sentences, t.final.justification);
      if (added) {
        usedLowJustification = t;
        break;
      }
    }
  }

  // Second sentence: another non-overlapping low/mid point, or a bridging note
  // when several low criteria share the same root issue already stated.
  if (sentences.length < 2) {
    let addedSecond = false;
    for (const t of lowTrails) {
      if (t === usedLowJustification) continue;
      if (t.final.status === "insufficient_evidence") continue;
      if (!t.final.justification) continue;
      if (pushDistinctSentence(sentences, t.final.justification)) {
        addedSecond = true;
        break;
      }
    }
    if (!addedSecond && mid?.final.justification) {
      addedSecond = pushDistinctSentence(sentences, mid.final.justification);
    }
    if (!addedSecond && lowTrails.length >= 2 && usedLowJustification) {
      const others = lowTrails
        .filter((t) => t !== usedLowJustification)
        .map((t) => humanizeCriterionName(t.criterion));
      const primary = humanizeCriterionName(usedLowJustification.criterion);
      const list =
        others.length === 1
          ? others[0]
          : `${others.slice(0, -1).join(", ")} and ${others[others.length - 1]}`;
      pushDistinctSentence(
        sentences,
        `The same underlying gap also limited the score on ${list} (alongside ${primary})`,
      );
    }
  }

  if (sentences.length === 0) {
    const anyJust = trails.find((t) => t.final.justification)?.final.justification;
    if (anyJust) {
      pushDistinctSentence(sentences, anyJust);
    } else {
      pushDistinctSentence(
        sentences,
        `The response scores ${overall}/100 on the ${module.focus.replace(/\.$/, "")} task`,
      );
    }
  }

  if (sentences.length === 1 && overall < 60) {
    pushDistinctSentence(
      sentences,
      "Tighten the answer against the rubric criteria that were only partially or incorrectly addressed",
    );
  }

  return sentences.slice(0, 3).join(" ");
}

/** Specific improvement tips from low-scoring criterion justifications. */
function buildImprovements(trails: CriterionAuditTrail[]): string[] {
  return trails
    .filter(
      (t) =>
        t.final.status === "insufficient_evidence" ||
        (t.final.score0to10 ?? 0) <= 5,
    )
    .slice(0, 3)
    .map((t) => {
      const label = humanizeCriterionName(t.criterion);
      if (t.final.status === "insufficient_evidence") {
        const reason = t.final.verdictReasoning?.trim();
        return reason
          ? `For ${label}: ${asSentence(reason)} Add concrete, on-criterion evidence the auditor can verify.`
          : `For ${label}: add concrete textual evidence that can be verified against this rubric criterion.`;
      }
      const justification = t.final.justification?.trim();
      if (justification && !/^insufficient evidence$/i.test(justification)) {
        return `For ${label}: ${asSentence(justification)}`;
      }
      return `For ${label}: deepen the answer so it clearly meets this rubric criterion.`;
    });
}

export async function scoreResponseDualCall(
  module: AssessmentModuleSpec,
  response: string,
): Promise<ScoredResponse> {
  const t0 = Date.now();

  const settled = await runCriteriaWithConcurrency(module, response, module.rubric);

  const agreed = settled.filter((s) => s.firstPassAgreed).length;
  const total = settled.length;
  const rate = total > 0 ? agreed / total : 0;

  void recordAuditAgreement({
    moduleCode: module.code,
    agreed,
    total,
    firstPassRejects: settled
      .filter((s) => s.firstPassRejected)
      .map((s) => s.trail.criterion),
  });

  const framework = await runFrameworkCheck(module, response);

  const perCriterion = settled.map((s) => s.criterionScore);
  const overall = round1(
    clamp(
      perCriterion.reduce((sum, c) => sum + c.score, 0),
      0,
      100,
    ),
  );

  const trails = settled.map((s) => s.trail);
  const agreement = { agreed, total, rate: round1(rate * 100) / 100 };

  const feedback = buildStudentFeedback(module, overall, trails);
  const improvements = buildImprovements(trails);

  let diagnostics = buildDualCallDiagnostics(
    module,
    trails,
    overall,
    feedback,
    {
      framework: framework.framework,
      justification: framework.justification,
    },
    agreement,
  );
  diagnostics = {
    ...diagnostics,
    finalOutput: { ...diagnostics.finalOutput, feedback },
    auditText: "",
  };
  diagnostics.auditText = formatDiagnosticsAudit(diagnostics);

  const strengths = trails
    .filter((t) => t.final.status === "scored" && (t.final.score0to10 ?? 0) >= 7)
    .slice(0, 3)
    .map((t) =>
      t.final.quote
        ? `${t.criterion}: "${t.final.quote}"`
        : t.criterion,
    );

  const latencyMs = Date.now() - t0;
  const model = framework.model || module.modelTag;

  const tokensInput =
    settled.reduce((acc, s) => acc + s.tokensInput, 0) + framework.tokensInput;
  const tokensOutput =
    settled.reduce((acc, s) => acc + s.tokensOutput, 0) + framework.tokensOutput;
  const k2CostPer1kIn = 0.005;
  const k2CostPer1kOut = 0.015;
  const costUsd =
    (tokensInput / 1000) * k2CostPer1kIn + (tokensOutput / 1000) * k2CostPer1kOut;

  log.info(
    {
      module: module.code,
      overall,
      agreementRate: agreement.rate,
      firstPassRejects: settled
        .filter((s) => s.firstPassRejected)
        .map((s) => s.trail.criterion),
      insufficient: trails
        .filter((t) => t.final.status === "insufficient_evidence")
        .map((t) => t.criterion),
      latencyMs,
    },
    "dual-call scoring complete",
  );

  return {
    moduleCode: module.code,
    dimension: module.dimension,
    score: overall,
    band: bandFor(overall).id,
    passed: isPass(overall, module.passThreshold),
    perCriterion,
    feedback,
    strengths,
    improvements,
    validationPassed: null,
    model,
    source: "ai",
    latencyMs,
    tokensInput,
    tokensOutput,
    costUsd,
    diagnostics,
  };
}
