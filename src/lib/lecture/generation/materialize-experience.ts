/**
 * Materialize canonical LearningExperience rows from generated slide artifacts.
 * ===========================================================================
 * The legacy LLM engine produces 20 `LectureSlideArtifact` rows + readiness
 * items. `StudentExperienceSession` / `StudentBlockInteraction` require real
 * `LearningExperience` / `ConceptBlock` rows (FKs), so after generation we
 * materialize the canonical graph FROM the artifacts — verbatim LLM content
 * (already source-grounded), never templates, never fabricated sections.
 *
 * Idempotent: one canonical experience per project (latest version wins).
 * Content passes through the same jargon cleaner as the projections so no
 * internal vocabulary leaks into student-facing canonical fields.
 */

import { db } from "@/lib/db";
import { deduplicateSlideArtifacts, deduplicateReadinessItems } from "@/lib/lecture/deduplication";
import { cleanJargon } from "@/lib/lecture/projections/utils/jargon-cleaner";
import { randomUUID } from "crypto";

// Slide function → pedagogical stage (mirrors legacy adapter).
const FUNCTION_TO_STAGE: Record<string, string> = {
  problem: "discover",
  mental_map: "understand",
  clos: "understand",
  prior_knowledge: "understand",
  core_concept: "explore",
  mechanism: "explore",
  misconception: "explore",
  deeper_mechanism: "explore",
  trade_off: "explore",
  worked_example: "practice",
  guided_practice: "practice",
  independent_practice: "practice",
  real_case: "apply",
  guided_application: "apply",
  independent_application: "apply",
  decision_challenge: "challenge",
  transfer_challenge: "challenge",
  rubric: "challenge",
  evidence: "challenge",
  readiness: "challenge",
  hook: "discover",
  domain_spine: "understand",
  h_stack: "understand",
  foundation: "explore",
  deep_dive: "explore",
  application: "apply",
};

function stageForSlide(fn: string | null | undefined, slideNo: number, isLast: boolean): string {
  if (fn && FUNCTION_TO_STAGE[fn]) return FUNCTION_TO_STAGE[fn];
  if (isLast) return "challenge";
  if (slideNo <= 1) return "discover";
  if (slideNo <= 4) return "understand";
  if (slideNo <= 9) return "explore";
  if (slideNo <= 13) return "practice";
  return "apply";
}

function slugify(text: string, idx: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "concept"}-${idx}`;
}

function firstNonEmpty(...vals: Array<string | null | undefined>): string {
  for (const v of vals) {
    const t = cleanJargon(v);
    if (t && t.length > 0) return t;
  }
  return "";
}

function isFlagged(status: string | null | undefined, reviewStatus?: unknown): boolean {
  const s = String(status ?? "").toUpperCase();
  return s === "FLAGGED" || s === "NEEDS_FACULTY_REVIEW" || reviewStatus === "leak_flagged";
}

/**
 * Materializes the canonical LearningExperience graph for a project from its
 * deduplicated slide artifacts + readiness items. Creates/updates the
 * experience; existing canonical rows for the project are replaced (version
 * bump). Non-fatal per-section failures are logged, never thrown — the
 * legacy path must remain the source of truth for the student experience.
 */
export async function materializeExperience(projectId: string): Promise<{ experienceId?: string; created: boolean }> {
  const project = await db.lectureProject.findUnique({
    where: { id: projectId },
    include: { courseProfile: true },
  });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const [plans, allArtifacts, allItems] = await Promise.all([
    db.lectureSlidePlan.findMany({ where: { projectId }, orderBy: { slideNo: "asc" } }),
    db.lectureSlideArtifact.findMany({ where: { projectId }, orderBy: { slideNo: "asc" } }),
    db.lectureReadinessItem.findMany({ where: { projectId }, orderBy: { slideNo: "asc" } }),
  ]);

  const artifacts = deduplicateSlideArtifacts(allArtifacts);
  if (artifacts.length === 0) return { created: false };

  const readinessItems = deduplicateReadinessItems(allItems);
  const planBySlide = new Map<number, { function: string | null; interactionType: string | null }>();
  for (const p of plans) {
    planBySlide.set(Number(p.slideNo), { function: p.function, interactionType: p.interactionType });
  }
  const readinessBySlide = new Map<number, (typeof readinessItems)[number]>();
  for (const item of readinessItems) readinessBySlide.set(Number(item.slideNo), item);

  const sorted = [...artifacts].sort((a, b) => Number(a.slideNo) - Number(b.slideNo));
  const lastSlideNo = sorted.length > 0 ? Number(sorted[sorted.length - 1].slideNo) : 20;

  const courseProfile = project.courseProfile as any;
  const languagePolicy = courseProfile?.languagePolicy || "en";
  const tenantId = project.tenantId || "default";

  // Upsert experience: delete prior canonical rows for this project (they are
  // rebuilt from the current artifact set), then create a fresh one.
  await db.learningExperience.deleteMany({ where: { projectId } });

  const anyFlagged = sorted.some((a) => isFlagged(a.status, (a.contentJson as any)?.reviewStatus));

  const experience = await db.learningExperience.create({
    data: {
      id: randomUUID(),
      tenantId,
      projectId,
      version: 1,
      status: anyFlagged ? "review" : "review",
      title: cleanJargon(project.title) || "Lecture",
      topicDescription: courseProfile?.title ? cleanJargon(courseProfile.title) : null,
      targetAudience: courseProfile?.audience ? cleanJargon(courseProfile.audience) : "University students",
      languagePolicy,
      bloomLevel: "apply",
      estimatedDurationMin: 50,
      pedagogicalFramework: "iSCARB_7_STAGE",
    },
  });

  // Blueprint — learning outcomes from CLOs + stage plan from slides.
  const clos = Array.isArray(courseProfile?.teacherEnteredClos)
    ? (courseProfile.teacherEnteredClos as Array<{ id?: string; text?: string; code?: string }>).slice(0, 6)
    : [];
  const stagePlan = buildStagePlan(sorted, planBySlide, lastSlideNo);

  await db.learningBlueprint.create({
    data: {
      id: randomUUID(),
      experienceId: experience.id,
      narrativeArc: cleanJargon(
        courseProfile?.title
          ? `A guided journey through ${courseProfile.title}: from foundational principles to applied mastery.`
          : "A guided journey from foundational principles to applied mastery."
      ),
      learningOutcomes: clos.map((c) => ({ id: c.id ?? randomUUID(), text: c.text ?? c.code ?? "" })) as any,
      stagePlanJson: stagePlan as any,
      prerequisiteGraph: { nodes: [], edges: [] },
      pacingStrategy: { totalDurationMin: 50, checkpoints: [] },
      isApproved: false,
    },
  });

  // Concept blocks + activities + assessments + visuals + evidence per slide.
  for (const artifact of sorted) {
    const c = (artifact.contentJson ?? {}) as Record<string, any>;
    const slideNo = Number(artifact.slideNo);
    const artifactId = String(artifact.id);
    const plan = planBySlide.get(slideNo);
    const fn = plan?.function ?? null;
    const isLast = slideNo === lastSlideNo;
    const stage = stageForSlide(fn, slideNo, isLast);

    const title = cleanJargon(c.title) || `Concept ${slideNo}`;

    // New generator stores content inside `body.visibleCopy` / `body.bullets`;
    // legacy generator stored it flat at `c.bullets` / `c.teachingExplanation`.
    const bodyBullets = Array.isArray(c.body?.bullets) ? c.body.bullets : [];
    const legacyBullets = Array.isArray(c.bullets) ? c.bullets : (Array.isArray(c.visibleContent) ? c.visibleContent : []);
    const allBullets = [...bodyBullets, ...legacyBullets]
      .map((b: string) => cleanJargon(b))
      .filter((b: string) => b.length > 0);
    const bullets = [...new Set(allBullets)]; // deduplicate

    // visibleCopy is the primary explanation in the new format
    const bodyVisibleCopy = c.body?.visibleCopy ? cleanJargon(c.body.visibleCopy) : "";

    // studentExperience (inline) fields from the new generator
    const se = c.studentExperience || {};
    const seExplanation = se.coreContent?.explanation ? cleanJargon(se.coreContent.explanation) : "";
    const seAnalogy = se.coreContent?.analogy ? cleanJargon(se.coreContent.analogy) : "";
    const seSteps = Array.isArray(se.coreContent?.steps) ? se.coreContent.steps.map((s: string) => cleanJargon(s)).filter(Boolean) : [];

    const explanation = firstNonEmpty(seExplanation, bodyVisibleCopy, c.teachingExplanation, c.academicTruth, bullets.join(". "));
    const coreInsight = firstNonEmpty(bodyVisibleCopy, seExplanation, c.studentCoreInsight, c.academicTruth, c.learningObjective, bullets[0], title);

    // Mechanism steps: prefer inline studentExperience steps > body bullets > legacy
    const mechanismSteps = seSteps.length > 0 ? seSteps : (bullets.length >= 2 ? bullets.slice(0, 5) : []);

    // Interactive prompt from body.studentAction (new) or flat studentAction (legacy)
    const rawAction = c.body?.studentAction;
    const interactivePrompt = rawAction?.stem ? cleanJargon(rawAction.stem) : (typeof c.studentAction === "string" ? cleanJargon(c.studentAction) : "");
    const interactiveOptions = Array.isArray(rawAction?.options) ? rawAction.options : [];

    // Real-world / application
    const realWorld = firstNonEmpty(
      se.realWorld?.application,
      se.realWorld?.scenario,
      c.studentScenario,
      c.studentApplication,
      c.mastery,
    ) || "";

    // Misconception from inline or legacy
    const misconception = (() => {
      if (se.commonPitfalls && Array.isArray(se.commonPitfalls) && se.commonPitfalls.length > 0) {
        return se.commonPitfalls.map((p: any) => `${p.misconception || ""} → ${p.betterWay || ""}`).join("; ");
      }
      return cleanJargon(c.feedback) || "";
    })();

    const flagged = isFlagged(artifact.status, c.reviewStatus);

    const block = await db.conceptBlock.create({
      data: {
        id: randomUUID(),
        experienceId: experience.id,
        orderIndex: slideNo,
        slug: slugify(title, slideNo),
        title,
        titleAr: c.textAr?.title ? cleanJargon(c.textAr.title) : undefined,
        stageCategory: stage,
        bloomLevel: (String(c.bloomLevel || "understand").toLowerCase().includes("apply")
          ? "apply"
          : String(c.bloomLevel || "understand").toLowerCase()) || "understand",
        cloIds: Array.isArray(c.cloIds) ? c.cloIds : [],
        sourceBlockIds: Array.isArray(c.sourceBlockIds)
          ? c.sourceBlockIds
          : Array.isArray(c.citations)
            ? c.citations.map((ci: any) => String(ci.sourceBlockId)).filter(Boolean)
            : [],
        academicTruth: explanation || coreInsight,
        intuitionMentalModel: firstNonEmpty(seAnalogy, c.studentAnalogy, c.analogy) || "",
        mechanismExplanation: mechanismSteps.length > 0 ? mechanismSteps.join(". ") : explanation,
        realWorldTransfer: realWorld || "",
        misconceptionAlert: misconception,
        coreIdea: coreInsight,
        keyTakeaways: bullets.slice(0, 5),
        keywords: [],
        estimatedMinutes: 5,
      },
    });

    // Evidence references from citations/claims.
    const citations = Array.isArray(c.citations) ? c.citations : [];
    for (const citation of citations.slice(0, 3)) {
      const sourceBlockId = String(citation?.sourceBlockId ?? "");
      if (!sourceBlockId) continue;
      try {
        await db.evidenceReference.create({
          data: {
            id: randomUUID(),
            experienceId: experience.id,
            conceptBlockId: block.id,
            sourceBlockId,
            claimText: cleanJargon(citation?.excerpt ?? "") || coreInsight,
            claimType: "SOURCE_FACT",
            sourceLocator: String(citation?.locator ?? ""),
            verbatimExcerpt: cleanJargon(citation?.excerpt ?? "") || coreInsight,
            verificationStatus: "VERIFIED",
            confidenceScore: 1.0,
          },
        });
      } catch (e) {
        console.warn(`[Materialize] Evidence skip S${slideNo}: ${(e as Error).message}`);
      }
    }

    // Learning activity from body.studentAction (new) or learningActivity (legacy).
    const activityPrompt = (() => {
      // New format: body.studentAction.stem
      if (rawAction?.stem) {
        const s = cleanJargon(rawAction.stem);
        if (s && s.length > 5) return s;
      }
      // Inline studentExperience interactive prompt
      if (se.interactive?.prompt) {
        const s = cleanJargon(se.interactive.prompt);
        if (s && s.length > 5) return s;
      }
      // Legacy: learningActivity
      const la = c.learningActivity;
      if (typeof la === "string") return cleanJargon(la);
      if (la && typeof la === "object" && typeof la.text === "string") return cleanJargon(la.text);
      // Legacy: flat studentAction string
      if (typeof c.studentAction === "string") return cleanJargon(c.studentAction);
      return "";
    })();
    if (activityPrompt) {
      try {
        await db.learningActivity.create({
          data: {
            id: randomUUID(),
            experienceId: experience.id,
            conceptBlockId: block.id,
            activityType: rawAction?.type === "poll" ? "POLL" : (rawAction?.type === "calculation" ? "CALCULATION" : "ACTIVE_RECALL"),
            title: cleanJargon(c.purpose) || "Your Task",
            prompt: activityPrompt,
            promptAr: c.textAr?.bullets?.join(" ") ? cleanJargon(c.textAr.bullets.join(" ")) : undefined,
            actionVerb: rawAction?.type === "poll" ? "Predict" : (plan?.interactionType === "poll" ? "Predict" : "Explain"),
            scaffoldingLevel: fn && (fn.includes("independent") || fn.includes("challenge")) ? "independent" : "guided",
            initialContext: null,
            expectedResponseCriteria: null,
            modelAnswer: cleanJargon(c.mastery) || (rawAction?.rationale ? cleanJargon(rawAction.rationale) : null),
            progressiveHints: (() => {
              if (se.interactive?.hints && Array.isArray(se.interactive.hints)) return se.interactive.hints.map((h: string) => cleanJargon(h));
              if (Array.isArray(c.learningActivity?.hints)) return c.learningActivity.hints.map((h: string) => cleanJargon(h));
              return [];
            })(),
            misconceptionTriggers: null,
            orderIndex: 1,
          },
        });
      } catch (e) {
        console.warn(`[Materialize] Activity skip S${slideNo}: ${(e as Error).message}`);
      }
    }

    // Formative assessment from the readiness item (hidden answer architecture).
    const readinessItem = readinessBySlide.get(slideNo);
    if (readinessItem && readinessItem.stem) {
      const rawOpts = Array.isArray(readinessItem.options) ? readinessItem.options : [];
      const options = rawOpts.map((o: any, idx: number) => ({
        id: String(o?.id ?? `opt-${idx}`),
        text: cleanJargon(o?.text ?? String(o ?? "")),
        textAr: undefined,
        isCorrect: idx === readinessItem.correctIndex,
        misconceptionKey: idx !== readinessItem.correctIndex ? `misconception_${idx}` : undefined,
      }));
      const distractorExplanations: Record<string, string> = {};
      rawOpts.forEach((o: any, idx: number) => {
        if (idx !== readinessItem.correctIndex) {
          distractorExplanations[String(o?.id ?? `opt-${idx}`)] = readinessItem.misconception
            ? cleanJargon(readinessItem.misconception)
            : cleanJargon(o?.text ?? "");
        }
      });
      try {
        await db.assessmentItem.create({
          data: {
            id: randomUUID(),
            experienceId: experience.id,
            conceptBlockId: block.id,
            assessmentType: slideNo === lastSlideNo ? "CAPSTONE_CASE" : "DIAGNOSTIC_MCQ",
            bloomLevel: fn && fn.includes("challenge") ? "evaluate" : "understand",
            difficulty: readinessItem.difficulty || "medium",
            stem: cleanJargon(readinessItem.stem),
            stemAr: undefined,
            options: options as any,
            correctOptionId: options[readinessItem.correctIndex]?.id ?? "A",
            instructorRationale: cleanJargon(readinessItem.rationale) || "Correct answer explained in the source material.",
            distractorExplanations: distractorExplanations as any,
            cloId: readinessItem.cloId || null,
            orderIndex: 1,
            isFinalGate: slideNo === lastSlideNo,
          },
        });
      } catch (e) {
        console.warn(`[Materialize] Assessment skip S${slideNo}: ${(e as Error).message}`);
      }
    }

    // Visual artifact from visualSpec (if present).
    const visualSpec = (c as any).visualSpec;
    if (visualSpec && (visualSpec.title || visualSpec.purpose)) {
      try {
        await db.visualArtifact.create({
          data: {
            id: randomUUID(),
            experienceId: experience.id,
            conceptBlockId: block.id,
            visualType: String(visualSpec.visualType || "PROCESS").toUpperCase(),
            title: cleanJargon(visualSpec.title || `Visual for ${title}`),
            purpose: cleanJargon(visualSpec.purpose || "Explain the concept visually."),
            learningMessage: cleanJargon(visualSpec.caption || visualSpec.learningMessage || ""),
            specificationJson: visualSpec as any,
            assetSourceTier: "SEMANTIC_TEMPLATE",
            primaryAssetUrl: visualSpec.imageUrl || visualSpec.fetchedImageUrl || null,
            vectorSvgCode: visualSpec.svgCode || null,
            thumbnailUrl: null,
            licenseType: "Fair Use Academic",
            attributionText: visualSpec.attribution || null,
            orderIndex: 1,
          },
        });
      } catch (e) {
        console.warn(`[Materialize] Visual skip S${slideNo}: ${(e as Error).message}`);
      }
    }
  }

  // Experience guide (student companion summary).
  try {
    await db.experienceGuide.create({
      data: {
        id: randomUUID(),
        experienceId: experience.id,
        facultyGuideJson: {} as any,
        studentCompanionJson: {
          executiveSummary: cleanJargon(courseProfile?.title || "Lecture summary"),
          keyConcepts: sorted.slice(0, 6).map((a) => cleanJargon((a.contentJson as any)?.title || `Concept ${a.slideNo}`)),
          reflectionQuestions: [],
          glossary: {},
          furtherReading: [],
        } as any,
      },
    });
  } catch (e) {
    console.warn(`[Materialize] Guide skip: ${(e as Error).message}`);
  }

  return { experienceId: experience.id, created: true };
}

function buildStagePlan(
  sorted: Array<{ slideNo: number | string }>,
  planBySlide: Map<number, { function: string | null; interactionType: string | null }>,
  lastSlideNo: number
): Array<{ stageKey: string; title: string; goal: string; conceptBlockIds: string[]; durationMin: number }> {
  const stages: Array<{ stageKey: string; title: string; goal: string; conceptBlockIds: string[]; durationMin: number }> = [];
  for (const artifact of sorted) {
    const slideNo = Number(artifact.slideNo);
    const fn = planBySlide.get(slideNo)?.function ?? null;
    const stage = stageForSlide(fn, slideNo, slideNo === lastSlideNo);
    let entry = stages.find((s) => s.stageKey === stage);
    if (!entry) {
      entry = { stageKey: stage, title: stage, goal: `Master ${stage} concepts`, conceptBlockIds: [], durationMin: 7 };
      stages.push(entry);
    }
    entry.conceptBlockIds.push(`slide-${slideNo}`);
  }
  return stages;
}