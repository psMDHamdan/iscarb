/**
 * Legacy Student UX Adapter (fallback projection)
 * ===============================================
 * Projects the OLD lecture data model (LecturePackageVersion → slide plans +
 * slide artifacts + readiness items + course profile) into the new
 * StudentExperienceViewModel so that lectures generated BEFORE the
 * LearningExperience pipeline still render as a full learning experience.
 *
 * This is a deterministic, DB-backed projection — no LLM involved. It reuses
 * the same deduplication helpers as the packages API (newest artifact/item per
 * slide) and the same jargon cleaner as the canonical StudentUxAdapter, so the
 * student never sees internal generation terminology.
 */

import { db } from "@/lib/db";
import { deduplicateSlideArtifacts, deduplicateReadinessItems } from "@/lib/lecture/deduplication";
import { cleanJargon, cleanObjectJargon } from "@/lib/lecture/projections/utils/jargon-cleaner";
import { getAcademicVisualForSlide } from "@/lib/lecture/academic-visuals";
import { resolveSlideImageUrl } from "@/lib/lecture/visual-image";
import type {
  StudentExperienceViewModel,
  StudentConceptViewModel,
  StudentStageNavViewModel,
  PedagogicalPhase,
  StudentFinalChallengeViewModel,
} from "./types";

// -----------------------------------------------------------------------------
// Stage mapping (slide function → pedagogical stage)
// -----------------------------------------------------------------------------

const PEDAGOGICAL_STAGES_ORDER: PedagogicalPhase[] = [
  "DISCOVER",
  "UNDERSTAND",
  "EXPLORE",
  "PRACTICE",
  "APPLY",
  "CHALLENGE",
  "MASTER",
];

const FUNCTION_TO_STAGE: Record<string, PedagogicalPhase> = {
  problem: "DISCOVER",
  mental_map: "UNDERSTAND",
  clos: "UNDERSTAND",
  prior_knowledge: "UNDERSTAND",
  core_concept: "EXPLORE",
  mechanism: "EXPLORE",
  misconception: "EXPLORE",
  deeper_mechanism: "EXPLORE",
  trade_off: "EXPLORE",
  worked_example: "PRACTICE",
  guided_practice: "PRACTICE",
  independent_practice: "PRACTICE",
  real_case: "APPLY",
  guided_application: "APPLY",
  independent_application: "APPLY",
  decision_challenge: "CHALLENGE",
  transfer_challenge: "CHALLENGE",
  rubric: "CHALLENGE",
  evidence: "CHALLENGE",
  readiness: "CHALLENGE",
  // older vocabulary
  hook: "DISCOVER",
  domain_spine: "UNDERSTAND",
  h_stack: "UNDERSTAND",
  foundation: "EXPLORE",
  deep_dive: "EXPLORE",
  application: "APPLY",
};

function stageForSlide(fn: string | null | undefined, slideNo: number, isLast: boolean): PedagogicalPhase {
  if (fn && FUNCTION_TO_STAGE[fn]) return FUNCTION_TO_STAGE[fn];
  // Last slide is always the final gate.
  if (isLast) return "CHALLENGE";
  if (slideNo <= 1) return "DISCOVER";
  if (slideNo <= 4) return "UNDERSTAND";
  if (slideNo <= 9) return "EXPLORE";
  if (slideNo <= 13) return "PRACTICE";
  return "APPLY";
}

// -----------------------------------------------------------------------------
// Interaction → student activity verb
// -----------------------------------------------------------------------------

const INTERACTION_VERB: Record<string, string> = {
  poll: "Predict",
  pause_discuss: "Discuss",
  collaboration: "Collaborate",
  worked_example: "Work Through",
  practice: "Practice",
};

// -----------------------------------------------------------------------------
// Content helpers
// -----------------------------------------------------------------------------

interface ContentShape {
  title?: string;
  bullets?: string[];
  claims?: unknown;
  mastery?: string;
  purpose?: string;
  feedback?: string;
  bloomLevel?: string;
  academicTruth?: string;
  teachingExplanation?: string;
  // New SlideContentJson body structure (from slide-generator.ts)
  body?: {
    visibleCopy?: string;
    bullets?: string[];
    studentAction?: {
      type?: string;
      stem?: string;
      options?: string[];
      correctIndex?: number;
      rationale?: string;
    };
  };
  // Legacy flat field (older artifacts stored action as a string)
  studentAction?: string | { type?: string; stem?: string; options?: string[] };
  learningActivity?: string | { text?: string; hints?: string[] } | null;
  learningObjective?: string;
  visibleContent?: string[];
  visualIntent?: string | { description?: string; diagramType?: string };
  visualSpec?: {
    fetchedImageUrl?: string;
    imageUrl?: string;
    title?: string;
    caption?: string;
    learningMessage?: string;
    purpose?: string;
    visualType?: string;
    svgCode?: string;
    elements?: Array<string | { label?: string; id?: string }>;
  };
  notes?: {
    instructorNotes?: string;
    timingMinutes?: number;
    facilitationMoves?: string[];
    answers?: string;
  };
  citations?: Array<{ text?: string; locator?: string; sourceBlockId?: string }>;
  sourceCoverage?: { mappedBlockIds?: string[]; omissionReason?: string | null };

  // Faculty-authored overrides — win over generated content
  studentCoreInsight?: string;
  studentAnalogy?: string;
  studentFramework?: string;
  studentMechanismExplanation?: string;
  studentScenario?: string;
  studentApplication?: string;

  // Generated content fields
  analogy?: string;
  mentalModel?: string;
  conceptIds?: string[];

  // Review / QA status fields
  reviewStatus?: string;
  flaggedForReview?: boolean;
  wordCount?: number;
}

function asContent(raw: unknown): ContentShape {
  const c = (raw ?? {}) as ContentShape;
  return c;
}

/** Placeholder strings the old generator sometimes wrote instead of real content. */
const PLACEHOLDER_RE =
  /^(Derived strictly from the source blocks|Simplified explanation prioritizing|Teach .* through source-grounded content|Student can explain and apply the concept from|Error loading generated content)/i;

function isPlaceholder(text: string): boolean {
  return PLACEHOLDER_RE.test(text.trim());
}

/**
 * Detect raw source text fragments that should never reach students.
 * These are extracted PDF/DOCX text that leaked through without transformation.
 */
const SOURCE_FRAGMENT_RE =
  /^(\d+\s+)?(Note:|Page|Chapter|Section|Figure|Table|ISBN|DOI|References?|Bibliography|Appendix|Table of Contents|\.{3,}|p\.?\s*\d|pp\.?\s*\d)/i;

const SOURCE_NOISE_RE =
  /(\.\.\.\s*\d+|\bSKU\b|\bGE\d+|\bp[A-Z]\d|\bvector\b.*\bSKU\b|\bdonor vector\b|\bpROSA|\bpCas-Guide|\bpT7-|\b(DNR|SKU)\b|\bcmt\w{20,}\b|[\s(][a-z0-9]{24,}[)\s]|\d{4,}\s+[A-Za-z].{0,60}\.{4,}\s*\d)/i;

function isSourceFragment(text: string): boolean {
  const t = text.trim();
  if (t.length < 5) return false;
  // Very long text with lots of dots/numbers = likely raw OCR extraction
  if (t.length > 200 && /\d{2,}/.test(t) && /[.]{3,}/.test(t)) return true;
  // Trailing dot-leader + page number (table of contents / OCR layout lines)
  if (/[A-Za-z].{0,60}\.{4,}\s*\d{1,3}\s*$/.test(t)) return true;
  // Ends in a long dot-run with no page number — OCR layout line
  if (/[A-Za-z].{0,80}\.{5,}\s*$/.test(t)) return true;
  // Product codes, page references, catalog entries
  if (SOURCE_FRAGMENT_RE.test(t)) return true;
  if (SOURCE_NOISE_RE.test(t)) return true;
  // Text that is mostly numbers and punctuation (not a teaching sentence)
  const alphaRatio = t.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '').length / t.length;
  if (alphaRatio < 0.4 && t.length > 30) return true;
  return false;
}

function firstNonEmpty(...vals: Array<string | undefined | null>): string {
  for (const v of vals) {
    const t = cleanJargon(v);
    if (t && t.length > 0 && !isPlaceholder(t)) return t;
  }
  return "";
}

/** Strip the bullet label prefixes the old generator used (Core Principle: / Key Requirement: / Application Context:). */
function stripBulletLabel(b: string): string {
  return b.replace(/^(Core Principle|Key Requirement|Application Context)\s*:\s*/i, "").trim();
}

function takeBullets(c: ContentShape, max = 6): string[] {
  // New generator stores bullets in body.bullets; visibleCopy is a separate
  // summary sentence that also serves as bullet[0] when no other bullets exist.
  const sources = [
    ...(c.visibleContent ?? []),
    ...(c.body?.bullets ?? []),
    ...(c.bullets ?? []),
  ];
  const bullets = sources
    .map((b) => cleanJargon(b))
    .map(stripBulletLabel)
    .filter((b) => b.length > 0 && !isSourceFragment(b) && !isPlaceholder(b));

  // If all bullets were filtered out, try to extract meaningful sentences from
  // body.visibleCopy, teachingExplanation, academicTruth, or learningObjective.
  if (bullets.length === 0) {
    const candidates = [
      c.body?.visibleCopy,
      c.teachingExplanation,
      c.academicTruth,
      c.learningObjective,
    ].filter(Boolean) as string[];
    for (const candidate of candidates) {
      if (isSourceFragment(candidate) || isPlaceholder(candidate)) continue;
      const sentences = candidate
        .split(/(?<=[.!?])\s+/)
        .map((s) => cleanJargon(s).trim())
        .filter((s) => s.length > 15 && !isSourceFragment(s) && !isPlaceholder(s));
      if (sentences.length > 0) return sentences.slice(0, max);
      // If it didn't split, use the whole thing
      const cleaned = cleanJargon(candidate).trim();
      if (cleaned.length > 15) return [cleaned].slice(0, max);
    }
  }

  return bullets.slice(0, max);
}

/** learningActivity — supports new body.studentAction.stem, legacy flat string, and older {text} object. */
function activityText(c: ContentShape): string {
  // New format: body.studentAction.stem
  if (c.body?.studentAction?.stem) {
    const s = cleanJargon(c.body.studentAction.stem);
    if (s && !isPlaceholder(s)) return s;
  }
  // Older flat string or object
  if (typeof c.studentAction === "string") return firstNonEmpty(c.studentAction);
  if (c.studentAction && typeof c.studentAction === "object" && "stem" in c.studentAction) {
    return firstNonEmpty((c.studentAction as { stem?: string }).stem);
  }
  // Even older learningActivity field
  const la = c.learningActivity;
  if (typeof la === "string") return firstNonEmpty(la);
  if (la && typeof la === "object" && typeof la.text === "string") return firstNonEmpty(la.text);
  return "";
}

function deriveBloom(fn: string | null | undefined, fallback: string | null | undefined): string {
  const known = ["remember", "understand", "apply", "analyze", "evaluate", "create"];
  const f = (fallback || "").toLowerCase();
  if (known.some((k) => f.includes(k))) return f;
  switch (fn) {
    case "problem":
    case "prior_knowledge":
    case "clos":
      return "understand";
    case "worked_example":
    case "guided_practice":
    case "guided_application":
      return "apply";
    case "independent_practice":
    case "real_case":
      return "apply";
    case "decision_challenge":
    case "transfer_challenge":
    case "readiness":
      return "analyze";
    case "rubric":
    case "evidence":
      return "evaluate";
    default:
      return "understand";
  }
}

// -----------------------------------------------------------------------------
// Main projection
// -----------------------------------------------------------------------------

export interface LegacyProjectionInput {
  /** LecturePackageVersion id or LectureProject id */
  id: string;
  tenantId: string;
}

export async function projectLegacyStudentExperience({
  id,
  tenantId,
}: LegacyProjectionInput): Promise<StudentExperienceViewModel | null> {
  // 1. Resolve the package version (by id, else latest for the project).
  let version = await db.lecturePackageVersion.findUnique({
    where: { id },
    include: { project: { include: { courseProfile: true } } },
  });

  if (!version) {
    version = await db.lecturePackageVersion.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      include: { project: { include: { courseProfile: true } } },
    });
  }

  let project = version?.project ?? null;
  if (!project) {
    const cleanId = id.replace(/^PREVIEW_/, "");
    project = await db.lectureProject.findFirst({
      where: { OR: [{ id: cleanId }, { id }] },
      include: { courseProfile: true },
    });
  }

  if (!project) return null;
  if (project.tenantId !== tenantId && tenantId !== "default") return null;

  const projectId = project.id;

  const blueprint = await db.learningBlueprint.findFirst({
    where: { experienceId: projectId },
  });

  // 2. Load plans + artifacts + readiness items + learning units.
  const [plans, allArtifacts, allItems] = await Promise.all([
    db.lectureSlidePlan.findMany({ where: { projectId }, orderBy: { slideNo: "asc" } }),
    db.lectureSlideArtifact.findMany({ where: { projectId }, orderBy: { slideNo: "asc" } }),
    db.lectureReadinessItem.findMany({ where: { projectId }, orderBy: { slideNo: "asc" } }),
  ]);

  if (allArtifacts.length === 0) return null;

  const artifacts = deduplicateSlideArtifacts(allArtifacts);
  const readinessItems = deduplicateReadinessItems(allItems);

  const planBySlide = new Map<number, { function: string | null; interactionType: string | null }>();
  for (const p of plans) planBySlide.set(Number(p.slideNo), { function: p.function, interactionType: p.interactionType });

  const readinessBySlide = new Map<number, (typeof readinessItems)[number]>();
  for (const item of readinessItems) readinessBySlide.set(Number(item.slideNo), item);

  const sorted = [...artifacts].sort((a, b) => Number(a.slideNo) - Number(b.slideNo));
  const lastSlideNo = sorted.length > 0 ? Number(sorted[sorted.length - 1].slideNo) : 20;

  // 3. Build one StudentConceptViewModel per artifact.
  const concepts: Record<string, StudentConceptViewModel> = {};
  const conceptOrder: { id: string; orderIndex: number; title: string; bloomLevel: string; estimatedMinutes: number; stage: PedagogicalPhase }[] = [];

  for (const artifact of sorted) {
    const c = asContent(artifact.contentJson);
    const slideNo = Number(artifact.slideNo);
    const artifactId = String(artifact.id);
    const plan = planBySlide.get(slideNo);
    const fn = plan?.function ?? null;
    const interaction = plan?.interactionType ?? null;
    const isLast = slideNo === lastSlideNo;
    const stage = stageForSlide(fn, slideNo, isLast);

    const bullets = takeBullets(c);
    const title = cleanJargon(c.title) || `Concept ${artifact.slideNo}`;

    // ── studentExperience: inline teaching data from the new generator ──
    const rawJson = (artifact.contentJson ?? {}) as Record<string, unknown>;
    const se = rawJson.studentExperience && typeof rawJson.studentExperience === "object"
      ? (rawJson.studentExperience as Record<string, unknown>)
      : null;
    const seCore = se?.coreContent && typeof se.coreContent === "object"
      ? (se.coreContent as Record<string, unknown>)
      : null;
    const seInteractive = se?.interactive && typeof se.interactive === "object"
      ? (se.interactive as Record<string, unknown>)
      : null;
    const seRealWorld = se?.realWorld && typeof se.realWorld === "object"
      ? (se.realWorld as Record<string, unknown>)
      : null;
    const sePitfalls = Array.isArray(se?.commonPitfalls) ? (se!.commonPitfalls as Array<Record<string, unknown>>) : [];

    // ── Core Insight: prefer the richest available signal ──
    // Priority: studentExperience.hook > studentExperience.headline > faculty override >
    //           body.visibleCopy > teachingExplanation > academicTruth > bullets[0]
    const extractFirstSentence = (text?: string | null): string => {
      if (!text) return "";
      const cleaned = cleanJargon(text);
      const match = cleaned.match(/^[^.!?\n]+[.!?]/);
      return match ? match[0].trim() : cleaned;
    };

    const bodyVisibleCopy = (() => {
      const v = c.body?.visibleCopy;
      if (!v || isPlaceholder(v) || isSourceFragment(v)) return "";
      return cleanJargon(v);
    })();

    // Prefer studentExperience fields when available
    const seHook = typeof se?.hook === "string" ? cleanJargon(se.hook) : "";
    const seExplanation = typeof seCore?.explanation === "string" ? cleanJargon(seCore.explanation as string) : "";
    const seAnalogy = typeof seCore?.analogy === "string" ? cleanJargon(seCore.analogy as string) : "";
    const seSteps = Array.isArray(seCore?.steps)
      ? (seCore.steps as unknown[]).map((s) => cleanJargon(String(s))).filter(Boolean)
      : [];
    const seHeadline = typeof se?.headline === "string" ? cleanJargon(se.headline) : "";

    const coreInsight = firstNonEmpty(
      seHook,
      seExplanation,
      c.studentCoreInsight,
      bodyVisibleCopy,
      extractFirstSentence((c as Record<string, unknown>).teachingExplanation as string),
      (c as Record<string, unknown>).academicTruth as string,
      c.learningObjective,
      bullets[0],
      (c as Record<string, unknown>).mastery as string,
    ) || cleanJargon(title);

    // ── Explanation: prefer studentExperience > teachingExplanation > body.visibleCopy ──
    const explanation = firstNonEmpty(
      seExplanation,
      (c as Record<string, unknown>).studentMechanismExplanation as string,
      (c as Record<string, unknown>).teachingExplanation as string,
      (c as Record<string, unknown>).academicTruth as string,
      bodyVisibleCopy,
      (c as Record<string, unknown>).feedback as string,
      coreInsight,
    ) || (bullets.length > 1 ? bullets.join(". ") : coreInsight);

    // ── Analogy: studentExperience > faculty override > generated analogy ──
    const analogy = firstNonEmpty(
      seAnalogy,
      c.studentAnalogy,
      c.analogy,
      c.mentalModel,
    );

    // ── Mechanism steps: studentExperience > bullets ──
    const mechanismStepsFromSE = seSteps.length > 0 ? seSteps : undefined;

    // ── Scenario / real-world transfer: studentExperience > bullets fallback ──
    const seRWApp = typeof seRealWorld?.application === "string" ? cleanJargon(seRealWorld.application as string) : "";
    const seRWScn = typeof seRealWorld?.scenario === "string" ? cleanJargon(seRealWorld.scenario as string) : "";
    const scenario = firstNonEmpty(
      seRWScn,
      c.studentScenario,
      c.studentApplication,
      (c as Record<string, unknown>).mastery as string,
    );
    const application = firstNonEmpty(
      seRWApp,
      c.studentApplication,
      c.learningObjective,
    );

    // ── studentAction / interactive: read from body.studentAction (new) or flat field (old) ──
    const rawAction = c.body?.studentAction;
    const actionStem = activityText(c);
    const actionOptions: string[] = Array.isArray(rawAction?.options) ? rawAction.options : [];
    const actionType = rawAction?.type || (typeof c.studentAction === "object" && c.studentAction && "type" in c.studentAction ? (c.studentAction as any).type : null) || (interaction ?? "pause_discuss");

    // Source citation
    const citation = Array.isArray(c.citations) ? c.citations[0] : undefined;
    const sourceCitation = citation?.text
      ? {
        sourceKey: citation.sourceBlockId || "Source Document",
        citationText: `Source: ${cleanJargon(citation.text)}`,
      }
      : undefined;

    // Visual mapping
    const visualSpec = (c as any).visualSpec;
    const matchedVisual = getAcademicVisualForSlide(
      slideNo,
      title,
      `${coreInsight} ${explanation} ${bullets.join(" ")}`
    );
    const isStrongMatch = matchedVisual.id.startsWith("match-");

    const storedRaw = resolveSlideImageUrl(visualSpec, undefined) || undefined;
    const storedIsBad =
      !!storedRaw &&
      (storedRaw.endsWith(".pdf") ||
        storedRaw.endsWith(".djvu") ||
        storedRaw.endsWith(".ogg") ||
        storedRaw.endsWith(".webm") ||
        storedRaw.toLowerCase().includes("flag") ||
        storedRaw.toLowerCase().includes("oklahoma") ||
        storedRaw.toLowerCase().includes("poster"));
    const storedIsLocalUpload =
      !!storedRaw &&
      (!/^https?:\/\//.test(storedRaw) || Boolean(visualSpec?.facultyUploadedUrl));

    const visualTitle =
      isStrongMatch && !storedIsLocalUpload
        ? cleanJargon(matchedVisual.title)
        : cleanJargon(visualSpec?.title || visualSpec?.purpose || "Instructional Model");
    const visualCaption =
      isStrongMatch && !storedIsLocalUpload
        ? cleanJargon(matchedVisual.caption)
        : cleanJargon(visualSpec?.caption || visualSpec?.learningMessage);
    const visualType = (visualSpec?.visualType || (slideNo === 1 ? "DATA_SCALE" : slideNo === 2 ? "ARCHITECTURE" : slideNo % 2 === 0 ? "PROCESS" : "CONCEPT_MODEL")).toUpperCase();

    const diagramElements: string[] = visualSpec?.elements && Array.isArray(visualSpec.elements) && visualSpec.elements.length > 0
      ? visualSpec.elements.map((el: any) => typeof el === "string" ? el : el.label || el.id || "Node")
      : (bullets.length > 0 ? bullets.slice(0, 4) : [title, "Target Binding", "Catalytic Cleavage", "Cellular Repair"]);

    const renderedSvg = `
      <div class="p-6 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-slate-100 rounded-xl border border-slate-700/60 shadow-lg">
        <div class="flex items-center gap-2 px-3 py-1 bg-teal-950/80 border border-teal-500/30 rounded-full text-[11px] uppercase tracking-widest font-bold text-teal-300">
          <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          ${visualType}
        </div>
        <div class="text-sm font-bold text-slate-200 text-center max-w-lg">${visualTitle}</div>
        <div class="flex flex-wrap items-center justify-center gap-2.5 my-2 max-w-2xl">
          ${diagramElements.map((el: string, idx: number) => `
            <div class="flex items-center gap-2">
              <div class="px-3.5 py-2.5 bg-slate-800/90 border ${idx === 0 ? 'border-teal-500/50 bg-teal-950/30 text-teal-200' : 'border-slate-700 text-slate-200'} rounded-lg text-xs font-semibold shadow-md flex items-center gap-2">
                <span class="w-4 h-4 rounded-full ${idx === 0 ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-slate-300'} flex items-center justify-center text-[9px] font-bold">${idx + 1}</span>
                <span>${el.length > 60 ? el.slice(0, 57) + '...' : el}</span>
              </div>
              ${idx < diagramElements.length - 1 ? '<span class="text-teal-400 font-extrabold text-sm">→</span>' : ''}
            </div>
          `).join('')}
        </div>
        ${visualCaption ? `<p class="text-xs text-slate-400 italic text-center max-w-xl border-t border-slate-800 pt-3">${visualCaption}</p>` : ''}
      </div>`;

    let rawImg: string | undefined;
    if (visualSpec?.facultyUploadedUrl) {
      rawImg = visualSpec.facultyUploadedUrl;
    } else if (storedIsLocalUpload) {
      rawImg = storedRaw;
    } else if (isStrongMatch) {
      rawImg = matchedVisual.imageUrl;
    } else if (storedRaw && !storedIsBad) {
      rawImg = storedRaw;
    } else {
      rawImg = matchedVisual.imageUrl;
    }
    if (!rawImg) rawImg = matchedVisual.imageUrl;

    const visual = {
      id: `vis-${artifactId}`,
      title: visualTitle,
      type: visualType.toLowerCase(),
      visualType: visualType.toLowerCase(),
      caption: visualCaption,
      imageUrl: rawImg,
      svgCode: visualSpec?.svgCode || renderedSvg,
    };

    // Prefer studentExperience mechanism steps (from studentExperience.coreContent.steps)
    const mechanismSteps: string[] | undefined = (() => {
      if (mechanismStepsFromSE && mechanismStepsFromSE.length > 1) return mechanismStepsFromSE;
      if (bullets.length >= 2 && bullets.every((b) => b.length > 10)) return bullets;
      const rawTeachingExplanation = (c as Record<string, unknown>).teachingExplanation as string | undefined;
      if (rawTeachingExplanation && rawTeachingExplanation.length > 60) {
        const sentences = rawTeachingExplanation
          .split(/(?<=[.!?])\s+/)
          .map((s: string) => cleanJargon(s).trim())
          .filter((s: string) => s.length > 15);
        if (sentences.length >= 2) return sentences.slice(0, 5);
      }
      if (c.learningObjective && c.learningObjective.length > 40) {
        const parts = c.learningObjective.split(/[,;]\s*/).map((s: string) => cleanJargon(s).trim()).filter((s: string) => s.length > 10);
        if (parts.length >= 2) return parts.slice(0, 4);
      }
      return bullets.length > 0 ? bullets : undefined;
    })();

    const conceptBloom = deriveBloom(fn, c.bloomLevel);

    // Flag artifacts that failed QA / generation (fallback placeholder,
    // leak-flagged, or awaiting faculty review) so the UI can show a banner.
    const artifactStatus = String((artifact as { status?: unknown }).status ?? "").toUpperCase();
    const flaggedForReview =
      artifactStatus === "FLAGGED" ||
      artifactStatus === "NEEDS_FACULTY_REVIEW" ||
      (c as { reviewStatus?: string }).reviewStatus === "leak_flagged" ||
      artifact.flagged === true ||
      (c as { flaggedForReview?: boolean }).flaggedForReview === true;

    concepts[artifactId] = {
      id: artifactId,
      stage,
      orderIndex: slideNo,
      title,
      bloomLevel: conceptBloom,
      estimatedMinutes: 5,
      flaggedForReview,

      // ── Legacy flat fields (kept for backward compat) ──
      visibleCopy: coreInsight || bodyVisibleCopy || bullets[0] || "",
      bullets: bullets.length > 0
        ? bullets
        : (c.body?.bullets ?? [])
          .map((b: string) => cleanJargon(b))
          .map(stripBulletLabel)
          .filter((b: string) => b.length > 0 && !isSourceFragment(b))
          .slice(0, 6),
      studentAction: (() => {
        const sa = c.body?.studentAction;
        if (sa?.stem) return { type: sa.type || "pause_discuss", stem: sa.stem, options: sa.options };
        if (typeof c.studentAction === "object" && c.studentAction !== null && "stem" in c.studentAction) {
          const s = c.studentAction as { type?: string; stem?: string; options?: string[] };
          if (s.stem) return { type: s.type || "pause_discuss", stem: s.stem, options: s.options };
        }
        return undefined;
      })(),

      // ── coreContent: what ConceptContent renders in the top panels ──
      coreContent: {
        explanation: explanation || coreInsight,
        analogy: analogy || undefined,
        // steps drives the "How It Works" numbered list
        steps: mechanismSteps && mechanismSteps.length > 1 ? mechanismSteps : undefined,
      } as any,

      // ── interactive: poll / discussion prompt for the activity panel ──
      interactive: actionStem
        ? {
          type: (actionType === "poll" ? "poll" : actionType === "calculation" ? "calculation" : "reflection") as any,
          prompt: actionStem,
          options: actionOptions.length > 0 ? actionOptions : undefined,
          hints: [],
          // Reveal is instructor-only — never expose to students here
          reveal: "",
        }
        : undefined,

      // ── realWorld: bottom "In the Real World" panel ──
      realWorld: (scenario || application)
        ? {
          application: application || scenario || "",
          scenario: scenario || undefined,
          derivedLabel: "system-suggested" as const,
        }
        : undefined,

      // ── commonPitfalls: from studentExperience or empty ──
      commonPitfalls: sePitfalls.length > 0
        ? sePitfalls.map((p) => ({
            misconception: typeof p.misconception === "string" ? cleanJargon(p.misconception) : "",
            whyWrong: typeof p.whyWrong === "string" ? cleanJargon(p.whyWrong) : "",
            betterWay: typeof p.betterWay === "string" ? cleanJargon(p.betterWay) : "",
          })).filter((p) => p.misconception && p.betterWay)
        : undefined,

      // ── headline and hook: from studentExperience ──
      headline: seHeadline || coreInsight,
      hook: seHook || coreInsight,

      // ── Visual ──
      visual,
      sourceCitation,
    };

    conceptOrder.push({
      id: artifactId,
      orderIndex: slideNo,
      title,
      bloomLevel: conceptBloom,
      estimatedMinutes: 5,
      stage,
    });
  }

  // 4. Build navigation stages (in pedagogical order).
  const stages: StudentStageNavViewModel[] = [];
  for (const stageKey of PEDAGOGICAL_STAGES_ORDER) {
    const stageConcepts = conceptOrder.filter((c) => c.stage === stageKey);
    if (stageConcepts.length === 0) continue;
    stages.push({
      stageKey,
      displayName: STAGE_DISPLAY_NAMES[stageKey],
      stageNumber: stages.length + 1,
      conceptCount: stageConcepts.length,
      conceptSummaries: stageConcepts.map((c) => ({
        id: c.id,
        orderIndex: c.orderIndex,
        title: c.title,
        bloomLevel: c.bloomLevel,
        estimatedMinutes: c.estimatedMinutes,
      })),
    });
  }

  const firstStage = stages[0];
  const initialActiveConceptId = firstStage?.conceptSummaries[0]?.id ?? conceptOrder[0]?.id ?? "";
  const totalConcepts = conceptOrder.length;

  // 5. Course overview.
  const courseProfile = project.courseProfile as any;
  const courseTitle = courseProfile?.title || project.title || "Lecture";
  const clos: Array<{ text?: string; code?: string }> = courseProfile?.teacherEnteredClos ?? [];
  let learningOutcomes = (blueprint?.learningOutcomes as any[] || [])
    .map((o) => cleanJargon(o.text))
    .filter(Boolean);

  if (learningOutcomes.length === 0) {
    learningOutcomes = clos
      .map((clo) => cleanJargon(clo.text || clo.code || ""))
      .filter((t) => t.length > 0)
      .slice(0, 6);
  }

  // Prerequisites from the prior-knowledge slide (slide 4).
  const priorArtifact = sorted.find((a) => planBySlide.get(Number(a.slideNo))?.function === "prior_knowledge");
  const prerequisites = priorArtifact
    ? takeBullets(asContent(priorArtifact.contentJson), 4)
    : [];

  const hookArtifact = sorted.find((a) => planBySlide.get(Number(a.slideNo))?.function === "problem") ?? sorted[0];
  const hookContent = asContent(hookArtifact?.contentJson);
  const hookNarrative = cleanJargon(
    firstNonEmpty(
      blueprint?.narrativeArc,
      hookContent.purpose,
      hookContent.teachingExplanation,
      hookContent.academicTruth,
      hookContent.learningObjective,
      takeBullets(hookContent).join(". "),
      `Explore foundational principles, mechanisms, and real-world applications in ${courseTitle}.`
    )
  );

  // 6. Final challenge (from the last readiness item / final gate slide).
  const finalChallenge: StudentFinalChallengeViewModel | undefined = (() => {
    const gateItem = readinessBySlide.get(lastSlideNo) ?? readinessItems[readinessItems.length - 1];
    if (!gateItem) return undefined;
    const gateArtifact = sorted.find((a) => a.slideNo === gateItem.slideNo);
    const gateContent = gateArtifact ? asContent(gateArtifact.contentJson) : {};
    return {
      id: `final-${gateItem.id}`,
      title: `Final Challenge: ${cleanJargon(gateContent.title || gateItem.stem.slice(0, 60))}`,
      scenario: firstNonEmpty(takeBullets(gateContent)[0], gateContent.learningObjective, gateContent.mastery, typeof gateContent.studentAction === "string" ? gateContent.studentAction : undefined, cleanJargon(gateItem.stem)),
      prompt: cleanJargon(gateItem.stem),
      rubricCriteria: takeBullets(gateContent, 4).length > 0
        ? takeBullets(gateContent, 4)
        : [
          "Identify the core problem precisely and state it in your own words.",
          "Select the most appropriate approach and justify it with the concepts taught in this lesson.",
          "Explain the trade-offs and what could go wrong with your chosen approach.",
          "Defend your decision against the most plausible alternative.",
        ],
    };
  })();

  return cleanObjectJargon({
    experienceId: version?.id ?? `PREVIEW_${project.id}`,
    projectId,
    courseTitle,
    targetAudience: "University students",
    estimatedDurationMinutes: 50,
    overview: {
      hookNarrative,
      learningOutcomes,
      prerequisites,
    },
    navigation: {
      stages,
      totalConcepts,
      initialActiveStage: firstStage?.stageKey ?? "DISCOVER",
      initialActiveConceptId,
    },
    concepts,
    finalChallenge,
  });
}

const STAGE_DISPLAY_NAMES: Record<string, string> = {
  DISCOVER: "1. Discover the Problem",
  UNDERSTAND: "2. Core Principles",
  EXPLORE: "3. Deep Exploration",
  PRACTICE: "4. Guided Practice",
  APPLY: "5. Real-World Application",
  CHALLENGE: "6. Cognitive Challenge",
  MASTER: "7. Synthesis & Mastery",
};
