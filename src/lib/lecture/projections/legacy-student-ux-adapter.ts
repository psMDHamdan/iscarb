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
import { getAcademicAnalogyForSlide } from "@/lib/lecture/academic-analogies";
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
  studentAction?: string;
  learningActivity?: string | { text?: string } | null;
  learningObjective?: string;
  visibleContent?: string[];
  visualIntent?: string;
  citations?: Array<{ text?: string; locator?: string; sourceBlockId?: string }>;

  // Faculty-authored overrides for the student-facing view. When present, these
  // win over generated content so faculty can control exactly what students see.
  studentCoreInsight?: string;
  studentAnalogy?: string;
  studentFramework?: string;
  studentMechanismExplanation?: string;
  studentScenario?: string;
  studentApplication?: string;

  // Generated content fields from the slide generator
  analogy?: string;
  mentalModel?: string;
  conceptIds?: string[];
}

function asContent(raw: unknown): ContentShape {
  const c = (raw ?? {}) as ContentShape;
  return c;
}

/** Placeholder strings the old generator sometimes wrote instead of real content. */
const PLACEHOLDER_RE =
  /^(Derived strictly from the source blocks|Simplified explanation prioritizing|Teach .* through source-grounded content|Student can explain and apply the concept from)/i;

function isPlaceholder(text: string): boolean {
  return PLACEHOLDER_RE.test(text.trim());
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
  const bullets = (c.visibleContent ?? c.bullets ?? [])
    .map((b) => cleanJargon(b))
    .map(stripBulletLabel)
    .filter((b) => b.length > 0);
  return bullets.slice(0, max);
}

/** learningActivity is stored as `{ text }` in older artifacts. */
function activityText(c: ContentShape): string {
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

    // ── Core Insight: prefer the richest available signal ──
    // Priority: faculty override > teachingExplanation first sentence > academicTruth > learningObjective > bullets[0]
    const extractFirstSentence = (text?: string | null): string => {
      if (!text) return "";
      const cleaned = cleanJargon(text);
      const match = cleaned.match(/^[^.!?\n]+[.!?]/);
      return match ? match[0].trim() : cleaned;
    };
    const coreInsight = firstNonEmpty(
      c.studentCoreInsight,
      extractFirstSentence(c.teachingExplanation),
      c.academicTruth,
      c.learningObjective,
      bullets[0],
      c.mastery,
      title,
    );

    // ── Explanation: prefer mechanism-first explanation ──
    const explanation = firstNonEmpty(
      c.studentMechanismExplanation,
      c.teachingExplanation,
      c.academicTruth,
      c.feedback,
      bullets.length > 1 ? bullets.join(". ") : coreInsight,
      coreInsight,
    );

    // ── Scenario: prefer concrete real-world scenario ──
    const scenario = firstNonEmpty(
      c.studentScenario,
      c.teachingExplanation,
      activityText(c),
      c.studentAction,
      `Consider how ${title} operates in a real professional setting: ${bullets[0] || coreInsight}`,
    );
    const application = firstNonEmpty(
      c.studentApplication,
      bullets[2],
      bullets[1],
      c.mastery,
      c.learningObjective,
      `Apply this concept by identifying where ${title} appears in practice.`,
    );

    // ── Common Pitfalls: extract from all slides, not just misconception slides ──
    let misconceptionAlert: StudentConceptViewModel["misconceptionAlert"];
    const readinessItem = readinessBySlide.get(slideNo);

    // Source 1: explicit misconception slide
    if (fn === "misconception") {
      const pitfallText = firstNonEmpty(bullets[0], c.title);
      if (pitfallText) {
        misconceptionAlert = {
          misconception: cleanJargon(pitfallText),
          whyItFails: firstNonEmpty(
            bullets[1],
            c.feedback,
            "This seems reasonable because it oversimplifies the actual mechanism. The correct understanding requires accounting for the constraints that limit this behavior.",
          ),
          correction: firstNonEmpty(
            bullets[2],
            c.mastery,
            explanation,
            `Instead, think step by step: trace the actual causal chain from input to output, checking each assumption against the real mechanism.`,
          ),
        };
      }
    }
    // Source 2: readiness item misconception tag
    if (!misconceptionAlert && readinessItem?.misconception) {
      misconceptionAlert = {
        misconception: cleanJargon(readinessItem.misconception),
        whyItFails: `This misconception targets a gap between intuitive reasoning and the formal mechanism taught in this concept.`,
        correction: `Revisit the core mechanism: ${firstNonEmpty(c.academicTruth, explanation, coreInsight)}. The correct model resolves this confusion.`,
      };
    }
    // Source 3: feedback field may contain misconception guidance
    if (!misconceptionAlert && c.feedback && c.feedback.length > 30) {
      misconceptionAlert = {
        misconception: firstNonEmpty(
          `Confusion about how ${title} differs from similar concepts`,
          `Assuming ${title} works without considering its key constraints`,
        ),
        whyItFails: firstNonEmpty(
          extractFirstSentence(c.feedback),
          `This oversight leads to incorrect conclusions about the mechanism.`,
        ),
        correction: firstNonEmpty(
          explanation,
          `Focus on the specific conditions that determine when this concept applies versus when it does not.`,
        ),
      };
    }

    // Activity (from learningActivity.text + studentAction + interaction type)
    const activityPrompt = firstNonEmpty(activityText(c), c.studentAction, scenario);
    const activity = activityPrompt
      ? {
          id: `act-${artifactId}`,
          type: interaction ?? "think",
          actionVerb: (interaction && INTERACTION_VERB[interaction]) || "Think",
          title: "Your Task",
          prompt: activityPrompt,
          scaffoldingLevel: fn === "independent_practice" || fn === "independent_application" || fn === "decision_challenge" ? "open" : "guided",
          progressiveHints: [
            `Start from the key idea: ${firstNonEmpty(c.academicTruth, bullets[0], title)}`,
            ...bullets.slice(1, 3).map((b) => `Consider: ${b}`),
          ].filter(Boolean),
        }
      : undefined;

    // Assessment (HIDDEN ANSWER ARCHITECTURE — no isCorrect, no correctIndex, no rationale)
    const readinessOptions: Array<{ id: string; text: string }> = [];
    if (readinessItem && readinessItem.options) {
      let rawOpts: any[] = [];
      if (Array.isArray(readinessItem.options)) {
        rawOpts = readinessItem.options;
      } else if (typeof readinessItem.options === "string") {
        try {
          const parsed = JSON.parse(readinessItem.options);
          if (Array.isArray(parsed)) rawOpts = parsed;
        } catch {
          rawOpts = [];
        }
      }
      rawOpts.forEach((o: any, idx: number) => {
        if (typeof o === "string") {
          readinessOptions.push({ id: `opt-${idx}`, text: cleanJargon(o) });
        } else if (o && typeof o === "object") {
          readinessOptions.push({
            id: String(o.id ?? `opt-${idx}`),
            text: cleanJargon(o.text ?? o.label ?? String(o)),
          });
        }
      });
    }

    const assessment =
      readinessItem && readinessItem.stem
        ? {
            id: `assess-${artifactId}`,
            stem: cleanJargon(readinessItem.stem),
            difficulty: readinessItem.difficulty || "medium",
            options: readinessOptions,
          }
        : undefined;

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

    const storedRaw = visualSpec?.fetchedImageUrl || visualSpec?.imageUrl || undefined;
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
      !/^https?:\/\//.test(storedRaw);

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
    if (storedIsLocalUpload) {
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

    const academicAnalogy = getAcademicAnalogyForSlide(
      title,
      `${coreInsight} ${explanation} ${bullets.join(" ")} ${c.purpose || ""}`
    );

    const mechanismSteps: string[] | undefined = (() => {
      if (bullets.length >= 2 && bullets.every((b) => b.length > 10)) return bullets;
      if (c.teachingExplanation && c.teachingExplanation.length > 60) {
        const sentences = c.teachingExplanation
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
      coreInsight,
      mentalModel: firstNonEmpty(
        c.studentAnalogy,
        c.analogy,
        c.mentalModel,
        `Think of ${title} like a system with inputs, processing rules, and outputs — each component depends on the others to function correctly.`
      ),
      mechanism: firstNonEmpty(
        c.studentMechanismExplanation,
        c.teachingExplanation,
        c.academicTruth,
        `This concept operates through a structured mechanism: ${title}`
      ),
      realWorldApplication: firstNonEmpty(
        c.studentScenario,
        c.teachingExplanation,
        `Consider a real scenario where ${title} is applied.`
      ),
      misconceptionAlert,
      activity,
      assessment,
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
  const learningOutcomes = clos
    .map((clo) => cleanJargon(clo.text || clo.code || ""))
    .filter((t) => t.length > 0)
    .slice(0, 6);

  // Prerequisites from the prior-knowledge slide (slide 4).
  const priorArtifact = sorted.find((a) => planBySlide.get(Number(a.slideNo))?.function === "prior_knowledge");
  const prerequisites = priorArtifact
    ? takeBullets(asContent(priorArtifact.contentJson), 4)
    : [];

  const hookArtifact = sorted.find((a) => planBySlide.get(Number(a.slideNo))?.function === "problem") ?? sorted[0];
  const hookContent = asContent(hookArtifact?.contentJson);
  const hookNarrative = cleanJargon(
    firstNonEmpty(
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
      scenario: firstNonEmpty(takeBullets(gateContent)[0], gateContent.learningObjective, gateContent.mastery, gateContent.studentAction, cleanJargon(gateItem.stem)),
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
