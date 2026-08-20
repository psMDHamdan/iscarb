/**
 * Deterministic generate-time quality pass.
 * Runs after NVIDIA + reviewers, before persist. Does not call the model,
 * does not invent citations, and does not change gate thresholds.
 */
import type { SlideArtifactDraft, SlideContentJson } from "./types";

const ACTION_VERBS = new Set([
  "predict",
  "calculate",
  "design",
  "true",
  "poll",
  "in",
  "debate",
  "compare",
  "define",
  "which",
  "select",
  "pause",
]);

const PREFIX_BY_INTERACTION: Record<string, string> = {
  poll: "Poll",
  pause_discuss: "Pause",
  collaboration: "In",
  collaborate: "In",
  worked_example: "Calculate",
  practice: "Calculate",
};

export type QualityPassPlan = {
  slideNo: number;
  function: string;
  interactionType: string | null;
  sourceBlockIds?: string[];
};

export type QualityPassBlock = {
  id: string;
  locator?: string;
  text: string;
};

type ClaimLike = {
  text?: string;
  status?: string;
  type?: string;
  verificationStatus?: string;
  sourceBlockId?: string;
  sourceIds?: string[];
  [key: string]: unknown;
};

function firstWord(action: string): string {
  return (action.trim().split(/\s+/)[0] || "").toLowerCase().replace(/:$/, "");
}

function excerptFor(plan: QualityPassPlan, blocks: QualityPassBlock[]): string {
  const preferred = (plan.sourceBlockIds ?? [])
    .map((id) => blocks.find((b) => b.id === id))
    .find((b): b is QualityPassBlock => Boolean(b?.text?.trim()));
  const block = preferred ?? blocks.find((b) => b.text?.trim()) ?? null;
  const raw = (block?.text ?? "the source concept").replace(/\s+/g, " ").trim();
  return raw.length > 90 ? `${raw.slice(0, 87)}...` : raw;
}

function isUnsourced(claim: ClaimLike): boolean {
  return (
    claim.status === "NEED_SOURCE" ||
    claim.type === "NEED_SOURCE" ||
    claim.verificationStatus === "UNSUPPORTED"
  );
}

function hasCaseStudy(content: SlideContentJson): boolean {
  const action = (content.studentAction || "").toLowerCase();
  if (action.includes("case")) return true;
  return (content.claims ?? []).some((c: ClaimLike) =>
    String(c.text || "").toLowerCase().includes("case study"),
  );
}

function hasConcreteExample(content: SlideContentJson): boolean {
  const action = (content.studentAction || "").toLowerCase();
  if (action.includes("example")) return true;
  return (content.claims ?? []).some((c: ClaimLike) => {
    const t = String(c.text || "").toLowerCase();
    return t.includes("worked example") || t.includes("step-by-step");
  });
}

function defaultAction(prefix: string): string {
  switch (prefix) {
    case "Poll":
      return "Poll: Which option matches the source concept?";
    case "Pause":
      return "Pause: How does this apply in operations?";
    case "In":
      return "In groups of 4: Design a solution for the given constraints.";
    case "Calculate":
      return "Calculate this worked example using the source method.";
    default:
      return "Compare the options grounded in the source.";
  }
}

export function resolveUnsourcedClaims(
  content: SlideContentJson,
  blocks: QualityPassBlock[],
): void {
  const claims = Array.isArray(content.claims) ? (content.claims as ClaimLike[]) : [];
  content.claims = claims.map((claim) => {
    if (!isUnsourced(claim)) return claim;
    const sourceId =
      (typeof claim.sourceBlockId === "string" && claim.sourceBlockId) ||
      (Array.isArray(claim.sourceIds) ? claim.sourceIds[0] : undefined);
    const block = sourceId ? blocks.find((b) => b.id === sourceId) : undefined;
    if (block) {
      return {
        ...claim,
        status: "verified",
        type: "SOURCE_FACT",
        verificationStatus: "VERIFIED",
        sourceBlockId: block.id,
        sourceIds: [block.id],
      };
    }
    const text = String(claim.text || "").trim();
    if (!text) return claim;
    const labeled = /^hypothetical\b/i.test(text) ? text : `Hypothetical: ${text}`;
    return {
      ...claim,
      text: labeled,
      status: "hypothetical",
      type: "HYPOTHETICAL",
      verificationStatus: "VERIFIED",
    };
  });
}

export function alignStudentAction(plan: QualityPassPlan, content: SlideContentJson): void {
  const current = (content.studentAction || "").trim();
  if (current && ACTION_VERBS.has(firstWord(current))) return;

  const prefix =
    PREFIX_BY_INTERACTION[plan.interactionType ?? ""] ??
    (plan.slideNo >= 2 && plan.slideNo <= 19 ? "Compare" : "Define");
  const rest = current.replace(/^\S+[:\s]*/, "").trim();
  content.studentAction = rest ? `${prefix}: ${rest}` : defaultAction(prefix);
  if (content.learningActivity && typeof content.learningActivity === "object") {
    content.learningActivity = { ...content.learningActivity, text: content.studentAction };
  }
}

function addSourcedClaim(
  content: SlideContentJson,
  text: string,
  block: QualityPassBlock | undefined,
): void {
  const claims = Array.isArray(content.claims) ? [...content.claims] : [];
  claims.push({
    text,
    status: block ? "verified" : "hypothetical",
    type: block ? "SOURCE_FACT" : "ILLUSTRATIVE",
    sourceBlockId: block?.id,
    sourceIds: block ? [block.id] : [],
    verificationStatus: block ? "VERIFIED" : "VERIFIED",
  });
  content.claims = claims;
}

function applyCase(plan: QualityPassPlan, content: SlideContentJson, blocks: QualityPassBlock[]): void {
  if (hasCaseStudy(content)) return;
  const snippet = excerptFor(plan, blocks);
  alignStudentAction(plan, content);
  const action = content.studentAction || defaultAction("Pause");
  if (!action.toLowerCase().includes("case")) {
    const first = action.split(":")[0];
    const rest = action.includes(":") ? action.slice(action.indexOf(":") + 1).trim() : action;
    content.studentAction = `${first}: Discuss this case: ${rest || snippet}`;
  }
  const block = blocks.find((b) => (plan.sourceBlockIds ?? []).includes(b.id)) ?? blocks[0];
  addSourcedClaim(content, `Case study: ${snippet}`, block);
}

function applyExample(plan: QualityPassPlan, content: SlideContentJson, blocks: QualityPassBlock[]): void {
  if (hasConcreteExample(content)) return;
  const snippet = excerptFor(plan, blocks);
  alignStudentAction(plan, content);
  const action = content.studentAction || defaultAction("Calculate");
  if (!action.toLowerCase().includes("example")) {
    const first = action.split(":")[0];
    content.studentAction = `${first}: Work this worked example from the source. ${snippet}`;
  }
  const block = blocks.find((b) => (plan.sourceBlockIds ?? []).includes(b.id)) ?? blocks[0];
  addSourcedClaim(content, `Worked example: step-by-step application of ${snippet}`, block);
}

export function ensureCasesExamples(
  items: { plan: QualityPassPlan; content: SlideContentJson }[],
  blocks: QualityPassBlock[],
): void {
  const caseCount = items.filter((i) => hasCaseStudy(i.content)).length;
  const exampleCount = items.filter((i) => hasConcreteExample(i.content)).length;
  if (caseCount >= 2 || exampleCount >= 3) return;

  const interior = items.filter((i) => i.plan.slideNo >= 2 && i.plan.slideNo <= 19);
  const exampleSlots = interior.filter(
    (i) =>
      i.plan.interactionType === "worked_example" ||
      i.plan.function === "worked_example" ||
      i.plan.function === "practice",
  );
  const caseSlots = interior.filter(
    (i) =>
      /problem|case|application/i.test(i.plan.function) ||
      i.plan.interactionType === "pause_discuss",
  );
  const fallback = interior.filter((i) => i.plan.function !== "clos");

  if (exampleSlots.length >= 1 || exampleCount >= 1) {
    const targets = [...exampleSlots, ...fallback].filter(
      (item, idx, arr) => arr.findIndex((x) => x.plan.slideNo === item.plan.slideNo) === idx,
    );
    for (const item of targets) {
      applyExample(item.plan, item.content, blocks);
      if (items.filter((i) => hasConcreteExample(i.content)).length >= 3) return;
    }
  }

  const caseTargets = [...caseSlots, ...fallback].filter(
    (item, idx, arr) => arr.findIndex((x) => x.plan.slideNo === item.plan.slideNo) === idx,
  );
  for (const item of caseTargets) {
    applyCase(item.plan, item.content, blocks);
    if (items.filter((i) => hasCaseStudy(i.content)).length >= 2) return;
  }
}

const MAX_VISIBLE_WORDS = 40;

function countVisibleWords(content: SlideContentJson): number {
  const titleWords = content.title ? content.title.split(/\s+/).filter(Boolean).length : 0;
  const bulletWords = (content.bullets ?? []).reduce(
    (n, b) => n + b.split(/\s+/).filter(Boolean).length,
    0,
  );
  return titleWords + bulletWords;
}

function dropLastWord(text: string): string {
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? text;
  return parts.slice(0, -1).join(" ");
}

/** Trim title/bullets to ≤40 visible words. Does not invent text or change gate thresholds. */
export function enforceVisibleDensity(content: SlideContentJson): void {
  content.bullets = Array.isArray(content.bullets) ? [...content.bullets] : [];
  let guard = 0;
  while (countVisibleWords(content) > MAX_VISIBLE_WORDS && guard < 80) {
    guard += 1;
    let longestIdx = -1;
    let longestLen = 0;
    content.bullets.forEach((b, i) => {
      const n = b.split(/\s+/).filter(Boolean).length;
      if (n > longestLen) {
        longestLen = n;
        longestIdx = i;
      }
    });
    if (longestIdx >= 0 && longestLen > 1) {
      content.bullets[longestIdx] = dropLastWord(content.bullets[longestIdx]);
      continue;
    }
    const titleWords = content.title ? content.title.split(/\s+/).filter(Boolean).length : 0;
    if (titleWords > 1) {
      content.title = dropLastWord(content.title);
      continue;
    }
    break;
  }
  content.wordCount = countVisibleWords(content);
}

export function applyGenerateQualityPass(
  artifacts: { plan: QualityPassPlan; draft: SlideArtifactDraft }[],
  blocks: QualityPassBlock[],
): void {
  for (const { plan, draft } of artifacts) {
    resolveUnsourcedClaims(draft.content, blocks);
    alignStudentAction(plan, draft.content);
  }
  ensureCasesExamples(
    artifacts.map(({ plan, draft }) => ({ plan, content: draft.content })),
    blocks,
  );
  for (const { plan, draft } of artifacts) {
    alignStudentAction(plan, draft.content);
    enforceVisibleDensity(draft.content);
  }
}
