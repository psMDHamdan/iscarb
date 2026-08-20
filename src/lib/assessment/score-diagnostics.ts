/**
 * Auditable scoring diagnostics — externalizes intermediate grading steps
 * (Sections 1–6) so rubric source, criterion scores, evidence, and framework
 * labels can be inspected. Pure module (no server-only).
 */

import type {
  AssessmentModuleSpec,
  CriterionScore,
  ScoredResponse,
} from "./framework";
import { evidencePhraseForCriterion } from "./score-gates";

export interface DiagnosticCriterionScore {
  criterion: string;
  score0to10: number;
  explanation: string;
  status?: "scored" | "insufficient_evidence";
}

/** Full dual-call audit trail for one criterion (Call A + independent Call B). */
export interface CriterionAuditTrail {
  criterion: string;
  attempts: Array<{
    callA: {
      score: number;
      quote: string | null;
      justification: string;
    };
    callB: { verdict: "YES" | "NO"; reasoning: string };
  }>;
  final: {
    status: "scored" | "insufficient_evidence";
    score0to10: number | null;
    quote: string | null;
    justification: string | null;
    verdict: "YES" | "NO" | null;
    verdictReasoning: string | null;
  };
}

export interface DiagnosticEvidenceItem {
  criterion: string;
  role: "highest" | "lowest";
  quote: string | null;
  note: string;
}

export interface DiagnosticVerificationItem {
  criterion: string;
  quote: string | null;
  matchesCriterion: "YES" | "NO";
  resolution: string;
}

export interface ScoringDiagnostics {
  /** SECTION 1 */
  rubricSource: {
    criteria: string[];
    origin: "predefined" | "generated";
    originNote: string;
  };
  /** SECTION 2 */
  perCriterion: DiagnosticCriterionScore[];
  /** SECTION 3 */
  evidence: DiagnosticEvidenceItem[];
  /** SECTION 4 */
  selfVerification: DiagnosticVerificationItem[];
  /** SECTION 5 — mirrors final user-facing claims */
  finalOutput: {
    score: number;
    mostConvincing: string | null;
    weakest: string | null;
    feedback: string;
  };
  /** SECTION 6 */
  frameworkCheck: {
    framework: string;
    justification: string;
  };
  /** Dual-call Call A + Call B trail (persisted with the score). */
  criterionAudits?: CriterionAuditTrail[];
  /** First-pass agreement for this submission (Call B YES / criteria scored). */
  agreementRate?: { agreed: number; total: number; rate: number };
  /** Full prose dump of all sections (for logs / audit UI). */
  auditText: string;
}

function ratio(c: CriterionScore): number {
  return c.max > 0 ? c.score / c.max : 0;
}

function to0to10(c: CriterionScore): number {
  return Math.round(ratio(c) * 10);
}

function quoteInAnswer(response: string, quote: string | null): boolean {
  if (!quote) return false;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return norm(response).includes(norm(quote).slice(0, Math.min(80, quote.length)));
}

/**
 * Diagnostics when a pre-score gate fires — do not invent rubric strengths/quotes.
 */
export function buildGateFailureDiagnostics(
  module: AssessmentModuleSpec,
  gate: 1 | 2,
  scored: Pick<ScoredResponse, "score" | "feedback">,
): ScoringDiagnostics {
  const criteria = module.rubric.map((c) => c.criterion);
  const rubricSource: ScoringDiagnostics["rubricSource"] = {
    criteria,
    origin: "predefined",
    originNote:
      "(a) Predefined and fixed for this module — criteria come from the catalog rubric for this scenario, not generated from the answer.",
  };

  const perCriterion: DiagnosticCriterionScore[] = module.rubric.map((c) => ({
    criterion: c.criterion,
    score0to10: gate === 1 ? 0 : Math.round((scored.score / 100) * 10),
    explanation:
      gate === 1
        ? "Gate 1 (non-answer): criterion not scored — no substantive task engagement."
        : "Gate 2 (template/placeholder): criterion capped — response is not completed genuine work.",
  }));

  const evidence: DiagnosticEvidenceItem[] = [
    {
      criterion: criteria[0] ?? "n/a",
      role: "highest",
      quote: null,
      note:
        gate === 1
          ? "Gate 1 — no clear textual evidence exists for this criterion (non-answer)."
          : "Gate 2 — placeholders/template detected; quotes are not treated as genuine evidence.",
    },
    {
      criterion: criteria[criteria.length - 1] ?? "n/a",
      role: "lowest",
      quote: null,
      note:
        gate === 1
          ? "Gate 1 — no clear textual evidence exists for this criterion (non-answer)."
          : "Gate 2 — placeholders/template detected; quotes are not treated as genuine evidence.",
    },
  ];

  const selfVerification: DiagnosticVerificationItem[] = evidence.map((e) => ({
    criterion: e.criterion,
    quote: null,
    matchesCriterion: "NO",
    resolution: "NO — no clear textual evidence exists for this criterion (pre-score gate).",
  }));

  const finalOutput: ScoringDiagnostics["finalOutput"] = {
    score: scored.score,
    mostConvincing: null,
    weakest: null,
    feedback: scored.feedback,
  };

  const frameworkCheck: ScoringDiagnostics["frameworkCheck"] = {
    framework: module.framework,
    justification: `This framework fits because the task asks the candidate to demonstrate ${module.focus} in the given workplace situation, which is what "${module.framework}" is designed to assess — not merely the surface topic of the scenario.`,
  };

  const auditText = [
    "SECTION 1 — RUBRIC SOURCE",
    `Criteria: ${criteria.map((c) => `"${c}"`).join(", ")}`,
    rubricSource.originNote,
    "",
    "SECTION 2 — PER-CRITERION SCORE",
    ...perCriterion.map((c) => `- ${c.criterion}: ${c.score0to10}/10 — ${c.explanation}`),
    "",
    "SECTION 3 — EVIDENCE SELECTION",
    ...evidence.map(
      (e) => `- ${e.role.toUpperCase()} ("${e.criterion}"): ${e.note}`,
    ),
    "",
    "SECTION 4 — SELF-VERIFICATION",
    ...selfVerification.map(
      (v) => `- "${v.criterion}": ${v.matchesCriterion}. ${v.resolution}`,
    ),
    "",
    "SECTION 5 — FINAL OUTPUT",
    `Score: ${finalOutput.score}/100`,
    `Pre-score Gate ${gate} failure — normal most-convincing/weakest labels suppressed.`,
    finalOutput.feedback,
    "",
    "SECTION 6 — FRAMEWORK CHECK",
    `Framework: ${frameworkCheck.framework}`,
    frameworkCheck.justification,
  ].join("\n");

  return {
    rubricSource,
    perCriterion,
    evidence,
    selfVerification,
    finalOutput,
    frameworkCheck,
    auditText,
  };
}

/**
 * Build Sections 1–6 from the module rubric (always predefined) + scored criteria
 * + student text. Never invents criteria that are not on the module.
 */
export function buildScoringDiagnostics(
  module: AssessmentModuleSpec,
  response: string,
  scored: Pick<ScoredResponse, "score" | "feedback" | "perCriterion">,
): ScoringDiagnostics {
  const criteria = module.rubric.map((c) => c.criterion);

  const rubricSource: ScoringDiagnostics["rubricSource"] = {
    criteria,
    origin: "predefined",
    originNote:
      "(a) Predefined and fixed for this module — criteria come from the catalog rubric for this scenario, not generated from the answer.",
  };

  const sorted = [...scored.perCriterion].sort((a, b) => ratio(b) - ratio(a));
  const byName = new Map(module.rubric.map((c) => [c.criterion, c]));

  const perCriterion: DiagnosticCriterionScore[] = scored.perCriterion.map((c) => {
    const rub = byName.get(c.criterion);
    const s10 = to0to10(c);
    let explanation: string;
    if (s10 <= 2) {
      explanation = `Little or no engagement with "${c.criterion}" relative to: ${rub?.descriptor ?? "the rubric descriptor"}.`;
    } else if (s10 <= 5) {
      explanation = `Partial coverage of "${c.criterion}"; the answer touches the idea but lacks depth against the descriptor.`;
    } else if (s10 <= 7) {
      explanation = `Solid signal on "${c.criterion}" with clear but incomplete alignment to the descriptor.`;
    } else {
      explanation = `Strong alignment with "${c.criterion}" based on how the answer addresses the descriptor.`;
    }
    return { criterion: c.criterion, score0to10: s10, explanation };
  });

  const highest = sorted[0];
  const lowest = [...sorted].reverse().find((c) => c.criterion !== highest?.criterion) ?? sorted[sorted.length - 1];

  const evidence: DiagnosticEvidenceItem[] = [];
  const selfVerification: DiagnosticVerificationItem[] = [];

  for (const item of [
    { c: highest, role: "highest" as const },
    { c: lowest, role: "lowest" as const },
  ]) {
    if (!item.c) continue;
    const rub = byName.get(item.c.criterion);
    let quote = rub ? evidencePhraseForCriterion(response, rub) : null;
    let note = quote
      ? "Verbatim (or closely extracted) sentence from the student answer."
      : "no clear textual evidence exists for this criterion";

    // SECTION 4 self-check: quote must be about THIS criterion's terms.
    let matches: "YES" | "NO" = "NO";
    let resolution = note;
    if (quote && rub) {
      const need = new Set(
        `${rub.criterion} ${rub.descriptor}`
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length >= 3),
      );
      const qTerms = quote
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      const hits = qTerms.filter((t) => need.has(t)).length;
      const inAnswer = quoteInAnswer(response, quote);
      matches = hits >= 1 && inAnswer ? "YES" : "NO";
      if (matches === "NO") {
        quote = null;
        note = "no clear textual evidence exists for this criterion";
        resolution =
          "NO — selected text did not clearly demonstrate this criterion; replaced with no clear textual evidence.";
      } else {
        resolution = "YES — quote demonstrates this specific criterion.";
      }
    } else {
      resolution =
        "NO — no clear textual evidence exists for this criterion.";
    }

    evidence.push({
      criterion: item.c.criterion,
      role: item.role,
      quote,
      note,
    });
    selfVerification.push({
      criterion: item.c.criterion,
      quote,
      matchesCriterion: matches,
      resolution,
    });
  }

  const highEv = evidence.find((e) => e.role === "highest");
  const lowEv = evidence.find((e) => e.role === "lowest");

  let mostConvincing: string | null = null;
  let weakest: string | null = null;
  if (highEv?.quote) {
    mostConvincing = `most convincing on "${highEv.criterion}" (e.g. "${highEv.quote}")`;
  } else if (highEv) {
    mostConvincing = `most convincing on "${highEv.criterion}" — no clear textual evidence exists for this criterion`;
  }
  if (lowEv?.quote) {
    weakest = `weakest on "${lowEv.criterion}" (e.g. "${lowEv.quote}")`;
  } else if (lowEv) {
    weakest = `weakest on "${lowEv.criterion}" — no clear textual evidence exists for this criterion`;
  }

  const finalFeedbackParts = [
    `The response shows a ${scored.score >= 80 ? "strong" : scored.score >= 60 ? "proficient" : scored.score >= 40 ? "developing" : "weak"} grasp of the ${module.framework} scenario (${scored.score}/100).`,
  ];
  if (mostConvincing && weakest) {
    finalFeedbackParts.push(`It is ${mostConvincing} and ${weakest}.`);
  } else if (mostConvincing) {
    finalFeedbackParts.push(`It is ${mostConvincing}.`);
  }

  const finalOutput: ScoringDiagnostics["finalOutput"] = {
    score: scored.score,
    mostConvincing,
    weakest,
    feedback: finalFeedbackParts.join(" "),
  };

  const frameworkCheck: ScoringDiagnostics["frameworkCheck"] = {
    framework: module.framework,
    justification: `This framework fits because the task asks the candidate to demonstrate ${module.focus} in the given workplace situation, which is what "${module.framework}" is designed to assess — not merely the surface topic of the scenario.`,
  };

  const auditText = formatDiagnosticsAudit({
    rubricSource,
    perCriterion,
    evidence,
    selfVerification,
    finalOutput,
    frameworkCheck,
  });

  return {
    rubricSource,
    perCriterion,
    evidence,
    selfVerification,
    finalOutput,
    frameworkCheck,
    auditText,
  };
}

export function formatDiagnosticsAudit(
  d: Omit<ScoringDiagnostics, "auditText">,
): string {
  const lines: string[] = [];

  lines.push("SECTION 1 — RUBRIC SOURCE");
  lines.push(`Criteria: ${d.rubricSource.criteria.map((c) => `"${c}"`).join(", ")}`);
  lines.push(d.rubricSource.originNote);
  lines.push("");

  lines.push("SECTION 2 — PER-CRITERION SCORE (Call A)");
  for (const c of d.perCriterion) {
    const status =
      c.status === "insufficient_evidence" ? " [insufficient evidence]" : "";
    lines.push(
      `- ${c.criterion}: ${
        c.status === "insufficient_evidence" ? "—" : `${c.score0to10}/10`
      }${status} — ${c.explanation}`,
    );
  }
  lines.push("");

  lines.push("SECTION 3 — EVIDENCE SELECTION");
  for (const e of d.evidence) {
    lines.push(
      `- ${e.role.toUpperCase()} ("${e.criterion}"): ${
        e.quote ? `"${e.quote}"` : e.note
      }`,
    );
  }
  lines.push("");

  lines.push("SECTION 4 — INDEPENDENT AUDIT (Call B)");
  for (const v of d.selfVerification) {
    lines.push(`- "${v.criterion}": ${v.matchesCriterion}. ${v.resolution}`);
  }
  if (d.agreementRate) {
    lines.push(
      `First-pass Call A↔B agreement: ${d.agreementRate.agreed}/${d.agreementRate.total} (${Math.round(d.agreementRate.rate * 100)}%)`,
    );
  }
  lines.push("");

  if (d.criterionAudits?.length) {
    lines.push("CALL A + CALL B TRAIL (per criterion)");
    for (const trail of d.criterionAudits) {
      lines.push(`▸ ${trail.criterion} → final: ${trail.final.status}`);
      trail.attempts.forEach((att, i) => {
        lines.push(
          `  Round ${i + 1} Call A: score=${att.callA.score}/10 quote=${
            att.callA.quote ? `"${att.callA.quote}"` : "null"
          }`,
        );
        lines.push(`    justification: ${att.callA.justification}`);
        lines.push(
          `  Round ${i + 1} Call B: ${att.callB.verdict} — ${att.callB.reasoning}`,
        );
      });
      if (trail.final.status === "insufficient_evidence") {
        lines.push(`  Final: insufficient evidence (numeric score withheld)`);
      } else {
        lines.push(
          `  Final: ${trail.final.score0to10}/10 | quote=${
            trail.final.quote ? `"${trail.final.quote}"` : "null"
          }`,
        );
      }
    }
    lines.push("");
  }

  lines.push("SECTION 5 — FINAL OUTPUT");
  lines.push(`Score: ${d.finalOutput.score}/100`);
  if (d.finalOutput.mostConvincing) lines.push(d.finalOutput.mostConvincing);
  if (d.finalOutput.weakest) lines.push(d.finalOutput.weakest);
  lines.push(d.finalOutput.feedback);
  lines.push("");

  lines.push("SECTION 6 — FRAMEWORK CHECK");
  lines.push(`Framework: ${d.frameworkCheck.framework}`);
  lines.push(d.frameworkCheck.justification);

  return lines.join("\n");
}

/** Prompt instructions forcing the LLM to externalize Sections 1–6 in JSON. */
export function diagnosticScoringPromptBlock(module: AssessmentModuleSpec): string {
  const criteriaList = module.rubric.map((c) => `"${c.criterion}"`).join(", ");
  return [
    `DIAGNOSTIC MODE (required): Externalize every intermediate step. Rubric criteria for this module are PREDEFINED and FIXED: ${criteriaList}. Do NOT invent new criteria from the answer — that would be origin (b) and you must not do it.`,
    `Return STRICT JSON including a "diagnostics" object with this shape:`,
    `{`,
    `  "score": <0-100>,`,
    `  "criteria": [ { "criterion": "<exact predefined name>", "score": <0..weight> } ],`,
    `  "feedback": "<Section 5 final prose only>",`,
    `  "strengths": ["..."],`,
    `  "improvements": ["..."],`,
    `  "diagnostics": {`,
    `    "section1": { "criteria": [${criteriaList}], "origin": "predefined", "note": "<(a) predefined and fixed…>" },`,
    `    "section2": [ { "criterion": "<name>", "score0to10": <0-10>, "explanation": "<one sentence>" } ],`,
    `    "section3": [ { "criterion": "<highest|lowest name>", "role": "highest"|"lowest", "quote": "<verbatim student sentence or null>", "note": "..." } ],`,
    `    "section4": [ { "criterion": "<name>", "matchesCriterion": "YES"|"NO", "resolution": "<if NO: no clear textual evidence exists for this criterion>" } ],`,
    `    "section5": { "score": <0-100>, "mostConvincing": "<label with quote or no clear evidence>", "weakest": "<...>", "feedback": "<final>" },`,
    `    "section6": { "framework": "${module.framework}", "justification": "<one sentence why this framework fits the task content>" }`,
    `  }`,
    `}`,
    `Rules: Section 2 BEFORE selecting quotes. Section 3 quotes must be about THAT criterion only. Section 4: if NO, do not force a mismatched quote. Section 5 may ONLY use criteria/scores/quotes already derived in 1–4.`,
  ].join("\n");
}

/** Merge AI diagnostics JSON into our canonical ScoringDiagnostics when present. */
export function parseAiDiagnostics(
  module: AssessmentModuleSpec,
  response: string,
  scored: Pick<ScoredResponse, "score" | "feedback" | "perCriterion">,
  raw: unknown,
): ScoringDiagnostics {
  // Always have a deterministic baseline; overlay AI fields when well-formed.
  const base = buildScoringDiagnostics(module, response, scored);
  if (!raw || typeof raw !== "object") return base;

  const d = raw as Record<string, unknown>;
  const s1 = d.section1 as Record<string, unknown> | undefined;
  const s2 = d.section2;
  const s3 = d.section3;
  const s4 = d.section4;
  const s5 = d.section5 as Record<string, unknown> | undefined;
  const s6 = d.section6 as Record<string, unknown> | undefined;

  if (s1 && typeof s1.origin === "string") {
    const origin = s1.origin === "generated" ? "generated" : "predefined";
    base.rubricSource.origin = origin;
    base.rubricSource.originNote =
      typeof s1.note === "string"
        ? s1.note
        : origin === "generated"
          ? "(b) Criteria appear to have been generated from the answer — this itself is a finding; scores should still map to the predefined catalog rubric."
          : base.rubricSource.originNote;
  }

  if (Array.isArray(s2) && s2.length > 0) {
    base.perCriterion = s2
      .map((row) => {
        const r = row as Record<string, unknown>;
        return {
          criterion: String(r.criterion ?? ""),
          score0to10: Math.round(clampNum(Number(r.score0to10), 0, 10)),
          explanation: String(r.explanation ?? ""),
        };
      })
      .filter((r) => r.criterion);
  }

  if (Array.isArray(s3) && s3.length > 0) {
    base.evidence = s3.map((row) => {
      const r = row as Record<string, unknown>;
      const quote = typeof r.quote === "string" && r.quote.trim() ? r.quote.trim() : null;
      return {
        criterion: String(r.criterion ?? ""),
        role: r.role === "lowest" ? ("lowest" as const) : ("highest" as const),
        quote,
        note: String(r.note ?? (quote ? "AI-selected quote" : "no clear textual evidence exists for this criterion")),
      };
    });
  }

  if (Array.isArray(s4) && s4.length > 0) {
    base.selfVerification = s4.map((row) => {
      const r = row as Record<string, unknown>;
      const matches = String(r.matchesCriterion ?? "NO").toUpperCase() === "YES" ? "YES" : "NO";
      return {
        criterion: String(r.criterion ?? ""),
        quote: base.evidence.find((e) => e.criterion === r.criterion)?.quote ?? null,
        matchesCriterion: matches as "YES" | "NO",
        resolution:
          typeof r.resolution === "string"
            ? r.resolution
            : matches === "YES"
              ? "YES — quote demonstrates this specific criterion."
              : "NO — no clear textual evidence exists for this criterion.",
      };
    });
  }

  if (s5) {
    base.finalOutput = {
      score: typeof s5.score === "number" ? s5.score : scored.score,
      mostConvincing: typeof s5.mostConvincing === "string" ? s5.mostConvincing : base.finalOutput.mostConvincing,
      weakest: typeof s5.weakest === "string" ? s5.weakest : base.finalOutput.weakest,
      feedback: typeof s5.feedback === "string" ? s5.feedback : scored.feedback,
    };
  }

  if (s6) {
    base.frameworkCheck = {
      framework: typeof s6.framework === "string" ? s6.framework : module.framework,
      justification:
        typeof s6.justification === "string"
          ? s6.justification
          : base.frameworkCheck.justification,
    };
  }

  base.auditText = formatDiagnosticsAudit(base);
  return base;
}

function clampNum(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
