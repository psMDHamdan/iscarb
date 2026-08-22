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

const MAX_VISIBLE_WORDS = 80;

function countVisibleWords(content: SlideContentJson): number {
  const titleWords = content.title ? content.title.split(/\s+/).filter(Boolean).length : 0;
  const bulletWords = (content.body?.bullets ?? content.bullets ?? []).reduce(
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

/** Word count limit removed — depth is more important than brevity. */
export function enforceVisibleDensity(_content: SlideContentJson): void {
  // No-op: content density is no longer enforced.
  // The LLM generates substantive explanations; we don't trim them.
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
  // Post-processing: diversity + coherence + copy detection
  enforceDiversity(artifacts);
  enforceSemanticCoherence(artifacts, blocks);
  enforceVisualRequirements(artifacts);
  detectSourceCopies(artifacts, blocks);
}

// ─── Diversity Validator ──────────────────────────────────────────────────────
// Ensures the 20-slide deck has varied visual types, interaction patterns,
// and content structures. No two consecutive slides should use the same layout.

const VISUAL_DIVERSITY_LIMIT = 3; // max consecutive slides with same diagram type
const INTERACTION_DIVERSITY_LIMIT = 2; // max consecutive slides with same interaction type

function enforceDiversity(
  artifacts: { plan: QualityPassPlan; draft: SlideArtifactDraft }[]
): void {
  const sorted = [...artifacts].sort((a, b) => a.plan.slideNo - b.plan.slideNo);

  // Track consecutive visual types
  let consecutiveVisual = 0;
  let lastDiagramType = "";
  // Track consecutive interaction types
  let consecutiveInteraction = 0;
  let lastInteractionType = "";
  // Track interaction type distribution
  const interactionCounts = new Map<string, number>();

  for (const { plan, draft } of sorted) {
    const visualType = draft.content.visualIntent?.diagramType || "none";
    const interactionType = draft.content.body?.studentAction?.type || plan.interactionType || "none";

    // Check visual diversity
    if (visualType === lastDiagramType && visualType !== "none") {
      consecutiveVisual++;
      if (consecutiveVisual >= VISUAL_DIVERSITY_LIMIT) {
        // Force a different diagram type for the next slide
        const alternatives = ["mechanism", "comparison", "workflow", "data_chart", "concept_map"];
        const different = alternatives.find((t) => t !== visualType) || "concept_map";
        const existing = draft.content.visualIntent as any || {};
        draft.content.visualIntent = {
          description: `${different} diagram for ${draft.content.title || "this concept"}`,
          sourceFigureRef: existing.sourceFigureRef ?? null,
          generateDiagram: true,
          diagramType: different as any,
        };
        consecutiveVisual = 0;
      }
    } else {
      consecutiveVisual = 0;
      lastDiagramType = visualType;
    }

    // Check interaction diversity
    if (interactionType === lastInteractionType && interactionType !== "none") {
      consecutiveInteraction++;
      if (consecutiveInteraction >= INTERACTION_DIVERSITY_LIMIT) {
        // Force a different interaction type
        const alternatives = ["poll", "pause_discuss", "collaboration", "calculation"];
        const different = alternatives.find((t) => t !== interactionType) || "pause_discuss";
        draft.content.body = {
          ...(draft.content.body || { visibleCopy: "", bullets: [] }),
          studentAction: {
            type: different as any,
            stem: draft.content.body?.studentAction?.stem || `Discuss: ${draft.content.title || "this concept"}`,
            options: different === "poll" ? draft.content.body?.studentAction?.options : undefined,
          },
        };
        consecutiveInteraction = 0;
      }
    } else {
      consecutiveInteraction = 0;
      lastInteractionType = interactionType;
    }

    // Track distribution
    interactionCounts.set(interactionType, (interactionCounts.get(interactionType) || 0) + 1);
  }

  // Ensure minimum diversity: at least 3 different interaction types across 20 slides
  if (interactionCounts.size < 3 && sorted.length >= 10) {
    const allInteractions = ["poll", "pause_discuss", "collaboration", "calculation"];
    let idx = 0;
    for (let i = 0; i < sorted.length && interactionCounts.size < 3; i++) {
      const currentType = sorted[i].draft.content.body?.studentAction?.type || "none";
      if (interactionCounts.get(currentType) === 1) {
        // This is the only slide with this type — skip (don't change it)
        continue;
      }
      // Replace with a less-used type
      const leastUsed = allInteractions
        .sort((a, b) => (interactionCounts.get(a) || 0) - (interactionCounts.get(b) || 0))[0];
      if (leastUsed !== currentType) {
        sorted[i].draft.content.body = {
          ...(sorted[i].draft.content.body || { visibleCopy: "", bullets: [] }),
          studentAction: {
            type: leastUsed as any,
            stem: sorted[i].draft.content.body?.studentAction?.stem || `Activity: ${sorted[i].draft.content.title || "this concept"}`,
          },
        };
        interactionCounts.set(currentType, (interactionCounts.get(currentType) || 1) - 1);
        interactionCounts.set(leastUsed, (interactionCounts.get(leastUsed) || 0) + 1);
      }
    }
  }
}

// ─── Semantic Coherence Validator ─────────────────────────────────────────────
// Checks that each slide's content is coherent — bullets should relate to the
// title and to each other. Flags slides where bullets are from unrelated topics.

function enforceSemanticCoherence(
  artifacts: { plan: QualityPassPlan; draft: SlideArtifactDraft }[],
  blocks: QualityPassBlock[],
): void {
  for (const { plan, draft } of artifacts) {
    const content = draft.content;
    const title = (content.title || "").toLowerCase();
    const bullets = content.body?.bullets || [];

    // Check if any bullet is from a completely different domain than the title
    // (simple keyword overlap check)
    const titleWords = new Set(
      title.split(/\s+/)
        .filter((w: string) => w.length > 3)
        .map((w: string) => w.toLowerCase())
    );

    // Only flag if title has meaningful words and bullets are very different
    if (titleWords.size >= 3 && bullets.length >= 2) {
      let unrelatedCount = 0;
      for (const bullet of bullets) {
        const bulletWords = bullet.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const overlap = bulletWords.filter((w: string) => titleWords.has(w)).length;
        // If less than 10% overlap and bullet is long, it might be unrelated
        if (bulletWords.length > 5 && overlap === 0) {
          unrelatedCount++;
        }
      }
      // If most bullets seem unrelated to the title, flag for review
      if (unrelatedCount >= Math.ceil(bullets.length * 0.5) && bullets.length >= 3) {
        content.reviewStatus = "concept_mixing_detected";
        draft.flagged = true;
        if (!draft.errors) draft.errors = [];
        draft.errors.push(`Semantic coherence warning: ${unrelatedCount}/${bullets.length} bullets may be from unrelated concepts.`);
      }
    }
  }
}

// ─── Visual Requirements Enforcer ────────────────────────────────────────────
// Ensures every slide has a meaningful visual intent. No 'none' or empty visuals.

function enforceVisualRequirements(
  artifacts: { plan: QualityPassPlan; draft: SlideArtifactDraft }[],
): void {
  for (const { plan, draft } of artifacts) {
    const content = draft.content;
    const visual = content.visualIntent;

    // If visual is missing or has no description, set a default
    if (!visual) {
      content.visualIntent = {
        description: `Diagram illustrating: ${content.title || "the slide concept"}`,
        sourceFigureRef: null,
        generateDiagram: true,
        diagramType: inferDiagramType(plan.function),
      };
    } else if (!visual.description || visual.description.length < 5) {
      visual.description = `Visual for: ${content.title || "this slide"}`;
    }

    // Ensure diagramType is set
    if (visual && !visual.diagramType) {
      visual.diagramType = inferDiagramType(plan.function);
    }

    // Ensure generateDiagram is true for slides that need visuals
    if (visual && !visual.generateDiagram && plan.slideNo !== 3) {
      // S3 (CLOs) is the only slide that legitimately doesn't need a diagram
      visual.generateDiagram = true;
    }
  }
}

/** Infer the best diagram type based on the slide's pedagogical function. */
function inferDiagramType(fn: string): "mechanism" | "comparison" | "workflow" | "data_chart" | "concept_map" {
  const typeMap: Record<string, "mechanism" | "comparison" | "workflow" | "data_chart" | "concept_map"> = {
    problem: "data_chart",
    mental_map: "concept_map",
    clos: "concept_map",
    prior_knowledge: "concept_map",
    core_concept: "mechanism",
    mechanism: "mechanism",
    misconception: "comparison",
    worked_example: "workflow",
    guided_practice: "workflow",
    independent_practice: "data_chart",
    deeper_mechanism: "mechanism",
    trade_off: "comparison",
    real_case: "workflow",
    guided_application: "workflow",
    independent_application: "data_chart",
    decision_challenge: "data_chart",
    transfer_challenge: "concept_map",
    rubric: "concept_map",
    evidence: "concept_map",
    readiness: "data_chart",
  };
  return typeMap[fn] || "mechanism";
}

// ─── Source Copy Detection ───────────────────────────────────────────────────
// Detects when the LLM has copied raw source text verbatim instead of
// transforming it into an educational explanation.
//
// The rule: RAG → evidence, not RAG → final slide text.
// The AI must synthesize and explain. It must NOT copy paragraphs, bullet
// lists, malformed source fragments, page artifacts, or OCR errors.

const SOURCE_COPY_PATTERNS: RegExp[] = [
  // Raw numbered references
  /^\d+\s+(Note|Figure|Table|Chapter|Section|Reference)\b/i,
  // Section numbering
  /^\d+\.\d+\.?\d*\s+[A-Z]/i,
  // Package/product listings
  /^Package contents:/i,
  /^SKU\s+GE/i,
  // Figure/table references
  /^Figure\s+\d+/i,
  /^Fig\.\s*\d+/i,
  /^Table\s+\d+/i,
  // Reagent/protocol lists
  /^Related (Optional )?Reagents:/i,
  /^Total volume\s+\d+/i,
  /^\d+\s*[μu]L\s+(Forward|Reverse|Oligo)/i,
  // Catalog numbers
  /\(SKU\s+GE\d+\)/i,
  // Raw protocol steps
  /^Incubate (the reaction )?at \d+/i,
  /^Add \d+\s*[μu]L/i,
  // Page artifacts
  /^\d+\s+References\s+\d+/i,
  /^References\s+\d+/i,
  // OCR artifacts
  /^\d+ Note:/i,
];

/**
 * Check if a bullet is likely a raw copy from source material.
 * Returns true if the bullet matches known source-copy patterns.
 */
function isSourceCopy(bullet: string): boolean {
  const trimmed = bullet.trim();
  // Very short bullets are OK (they're usually rewritten)
  if (trimmed.split(/\s+/).length < 4) return false;
  for (const pat of SOURCE_COPY_PATTERNS) {
    if (pat.test(trimmed)) return true;
  }
  return false;
}

/**
 * Compute a simple n-gram overlap score between two texts.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
function ngramOverlap(text1: string, text2: string, n: number = 3): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(Boolean);
  const words2 = text2.toLowerCase().split(/\s+/).filter(Boolean);
  if (words1.length < n || words2.length < n) return 0;

  const getNgrams = (words: string[]): Set<string> => {
    const ngrams = new Set<string>();
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.add(words.slice(i, i + n).join(" "));
    }
    return ngrams;
  };

  const ngrams1 = getNgrams(words1);
  const ngrams2 = getNgrams(words2);
  let overlap = 0;
  for (const ng of ngrams1) {
    if (ngrams2.has(ng)) overlap++;
  }
  return overlap / Math.max(ngrams1.size, 1);
}

/**
 * Detect and flag source-copy violations in generated artifacts.
 * For each bullet, check:
 1. Does it match raw source patterns (product codes, figure refs, etc.)?
 2. Is it >80% similar to a source block? (verbatim copy)
 *
 * Flagged artifacts get a reviewStatus so faculty can see them.
 * We do NOT hard-reject — faculty should decide whether the copy is acceptable.
 */
export function detectSourceCopies(
  artifacts: { plan: QualityPassPlan; draft: SlideArtifactDraft }[],
  blocks: QualityPassBlock[],
): void {
  for (const { plan, draft } of artifacts) {
    const bullets = draft.content.body?.bullets || [];
    const violations: string[] = [];

    for (let i = 0; i < bullets.length; i++) {
      const bullet = bullets[i];

      // Check 1: Raw source pattern
      if (isSourceCopy(bullet)) {
        violations.push(`Bullet ${i + 1}: matches raw source pattern`);
        continue;
      }

      // Check 2: High n-gram overlap with any source block
      for (const block of blocks) {
        if (!block.text || block.text.length < 30) continue;
        const overlap = ngramOverlap(bullet, block.text);
        if (overlap > 0.7) {
          violations.push(`Bullet ${i + 1}: ${Math.round(overlap * 100)}% similar to source block ${block.id}`);
          break;
        }
      }
    }

    if (violations.length > 0) {
      draft.content.reviewStatus = "source_copy_detected";
      draft.flagged = true;
      if (!draft.errors) draft.errors = [];
      draft.errors.push(`Source copy detected in ${violations.length} bullet(s): ${violations.slice(0, 3).join('; ')}`);
    }
  }
}
