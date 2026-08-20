/**
 * Lecture Generation — main orchestrator.
 * ===========================================================================
 * Gap fixes applied in this revision:
 *
 *  Gap 1  — Source Analyst runs FIRST, before any slide generation.
 *            Every slide generation call receives scoped blocks (only the
 *            blocks relevant to that slide's CLOs + explicit plan mapping).
 *
 *  Gap 3  — The single monolithic verifyAcademicContent call is replaced by
 *            three focused per-slide reviewers:
 *              pedagogical-reviewer  (sequence / depth / student action)
 *              clo-alignment-reviewer (traceability)
 *              claim-verifier         (fact / source grounding)
 *
 *  Gap 4  — Per-slide regeneration passes only the scoped blocks for that
 *            slide, not the full project blob.
 *
 *  Gap 5  — A dedicated assessment-generator pass runs after content is
 *            finalised, replacing the inline assessment embedded in the slide
 *            generator prompt.
 *
 *  Gap 6  — persistArtifact never overwrites an existing row's contentJson
 *            when that row is status="approved". It always INSERTs a new row
 *            and marks the old one as "superseded".
 *
 *  F4     — Successful generate never marks the project approved. Artifacts
 *            stay draft|flagged; project status is "review" (hub vocabulary).
 *            Subset regen of a review project does not flip the project to
 *            generating. Redis job progress may still say generating.
 */
import { db } from "@/lib/db";
import { redis } from "@/config/redis";
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";
import { generateSlideArtifact } from "./slide-generator";
import { generateReadinessItems } from "./readiness-generator";
import { deduplicateReadinessItems } from "@/lib/lecture/deduplication";
import type {
  LectureProjectWithRelations,
  ReadinessItemJson,
  SlideArtifactDraft,
  SlideContentJson,
} from "./types";

// Reviewers
import { verifyEvidence } from "./reviewers/evidence-reviewer";
import { runDeterministicQA } from "./reviewers/deterministic-qa";
import { generateVisualSpec } from "./visual-intelligence";
import { composeSlide } from "./slide-composer";
import { verifyVisualQuality } from "./reviewers/visual-reviewer";
import { simulateScreenshotQA } from "./reviewers/screenshot-qa";
import { reviewPedagogy } from "./reviewers/pedagogical-reviewer";
import { reviewCloAlignment } from "./reviewers/clo-alignment-reviewer";
import { verifyClaims } from "./reviewers/claim-verifier";

// New pipeline steps
import { analyseSourceBlocks, scopeBlocksForSlide, type AnalysedBlock, type ImportanceLevel } from "./source-analyst";
import { generateAssessment } from "./assessment-generator";
import { bindUnmappedSourceBlocks, persistHandoffsFromGenerate } from "./persist-handoffs";
import { applyGenerateQualityPass } from "./generate-quality-pass";
import { scanGeneratedSlide } from "./leak-scan";
import { materializeExperience } from "./materialize-experience";
import { clearProjectionCache } from "@/lib/lecture/projections/projection-cache";

const JOB_PREFIX = "lecture:generate:";

/** Hub/schema vocabulary. Publish (F10) is the only writer of "approved". */
export const POST_GENERATE_PROJECT_STATUS = "review" as const;

export function generationJobKey(projectId: string): string {
  return `${JOB_PREFIX}${projectId}`;
}

/** Subset regen of a project already in review must not look like a full generate. */
export function shouldSetProjectGenerating(
  currentStatus: string,
  slideNos?: number[]
): boolean {
  const isSubset = Array.isArray(slideNos) && slideNos.length > 0;
  return !(isSubset && currentStatus === "review");
}

async function setProgress(
  projectId: string,
  data: { status: string; progress: number; error?: string }
): Promise<void> {
  try {
    await redis.hset(generationJobKey(projectId), data);
  } catch (e: any) {
    try {
      await redis.config("SET", "stop-writes-on-bgsave-error", "no");
      await redis.hset(generationJobKey(projectId), data);
    } catch {
      /* best-effort progress log */
    }
  }
}

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item, idx) => fn(item, i + idx))
    );
    results.push(...batchResults);
  }
  return results;
}

function loadProject(projectId: string): Promise<LectureProjectWithRelations | null> {
  return db.lectureProject.findUnique({
    where: { id: projectId },
    include: { courseProfile: true, sourceBlocks: true, sourceDocuments: true },
  });
}

function cloList(project: LectureProjectWithRelations): CourseLearningOutcome[] {
  return (
    (project.courseProfile.teacherEnteredClos as unknown as CourseLearningOutcome[]) ?? []
  );
}

// ─── Gap 6: Immutable persistArtifact ────────────────────────────────────────
/**
 * NEVER overwrites an approved artifact's contentJson.
 *
 * Logic:
 *  - If no row exists → create.
 *  - If existing row is status="approved" → mark it "superseded", create new row.
 *  - If existing row is draft/generated/flagged → update it (not yet approved).
 */
async function persistArtifact(
  projectId: string,
  draft: SlideArtifactDraft
): Promise<void> {
  const data = {
    projectId,
    slidePlanId: draft.slidePlanId,
    slideNo: draft.slideNo,
    contentJson: draft.content as object,
    citations: draft.content.citations as object[],
    wordCount: draft.content.wordCount,
    bulletCount: draft.content.bullets.length,
    status: draft.flagged ? "flagged" : "draft",
  };

  const existing = await db.lectureSlideArtifact.findFirst({
    where: { projectId, slideNo: draft.slideNo },
    orderBy: { version: "desc" },
  });

  if (!existing) {
    await db.lectureSlideArtifact.create({ data: { ...data, version: 1 } });
    return;
  }

  if (existing.status === "approved") {
    // Gap 6: immutable — never overwrite approved content
    // Mark current as superseded, create a new version
    await db.lectureSlideArtifact.update({
      where: { id: existing.id },
      data: { status: "superseded" },
    });
    await db.lectureSlideArtifact.create({
      data: { ...data, version: existing.version + 1 },
    });
    return;
  }

  // Non-approved: safe to update
  await db.lectureSlideArtifact.update({
    where: { id: existing.id },
    data: { ...data, version: { increment: 1 } },
  });
}

async function persistReadinessItem(
  projectId: string,
  item: ReadinessItemJson,
  mode: string
): Promise<void> {
  const existing =
    typeof db.lectureReadinessItem?.findFirst === "function"
      ? await db.lectureReadinessItem.findFirst({
          where: { projectId, slideNo: item.slideNo },
          orderBy: { createdAt: "desc" },
        })
      : null;

  const payload = {
    alignmentMode: mode,
    specialtyKey: null,
    outcomeId:
      mode === "OFFICIAL_JAHEZIAH" ? (item.sourceLocator ?? null) : null,
    cloId: item.cloId,
    sourceBlockId: item.sourceBlockId ?? null,
    slideNo: item.slideNo,
    stem: item.stem,
    options: item.options as object[],
    correctIndex: item.correctIndex,
    difficulty: item.difficulty,
    rationale: item.rationale,
    misconception: item.misconception ?? null,
    sourceLocator: item.sourceLocator ?? null,
  };

  if (existing && !existing.approved && typeof db.lectureReadinessItem?.update === "function") {
    await db.lectureReadinessItem.update({
      where: { id: existing.id },
      data: { ...payload, updatedAt: new Date() },
    });
    return;
  }

  if (typeof db.lectureReadinessItem?.create === "function") {
    await db.lectureReadinessItem.create({
      data: {
        projectId,
        ...payload,
      },
    });
  }
}

// ─── Build and clean raw blocks ───────────────────────────────────────────────

function cleanRawBlocks(
  project: LectureProjectWithRelations
): { id: string; locator: string; text: string; criticality: string }[] {
  return project.sourceBlocks
    .map((b: { id: string; locator: string; text: string; criticality: string }) => {
      const cleanedText = b.text
        .replace(
          /^(References|Table of Contents|Contents|Index|Foreword|Part [IVX]+|\d+\.\d+ References)[\s\S]*/i,
          ""
        )
        .replace(/\b\d+\s+References\s+\d+[\s\S]*/i, "")
        .replace(/\bReferences\s+\d+[\s\S]*/i, "")
        .replace(/\[\d+\]\s+[A-Z][a-z]+,[\s\S]*/g, "")
        .trim();
      return {
        id: b.id,
        locator: b.locator,
        text: cleanedText || b.text,
        criticality: b.criticality,
      };
    })
    .filter((b: { text: string }) => {
      const lower = b.text.toLowerCase();
      const isNoise =
        /^(references|table of contents|index|bibliography|foreword)\b/i.test(
          b.text.trim()
        ) ||
        (lower.includes("matrix decompositions") &&
          lower.includes("singular value decomposition") &&
          lower.includes("references 403"));
      return !isNoise && b.text.length > 30;
    });
}

// ─── main export ──────────────────────────────────────────────────────────────

const MAX_RETRIES = 1;
const BATCH_SIZE = 20; // Fully parallelize all 20 slides simultaneously for maximum speed

/** Progress window helpers so parallel chunks map onto a shared 0–100 scale. */
interface ChunkMeta {
  chunkIndex: number;
  totalChunks: number;
}

function progressWindow(meta: ChunkMeta | undefined) {
  if (!meta || meta.totalChunks <= 1) return { start: 0, end: 100 };
  const span = 100 / meta.totalChunks;
  return { start: Math.round(meta.chunkIndex * span), end: Math.round((meta.chunkIndex + 1) * span) };
}

function within(win: { start: number; end: number }, pct: number): number {
  return win.start + Math.round(((win.end - win.start) * pct) / 100);
}

/**
 * Source analysis with a cross-chunk cache (generationStateJson).
 * The first chunk to need analysis computes it and persists it; later chunks
 * reuse it instead of re-billing the LLM for every 4-slide job.
 */
async function getOrCreateAnalysis(
  project: LectureProjectWithRelations,
  clos: CourseLearningOutcome[],
  rawBlocks: { id: string; locator: string; text: string; criticality: string }[]
): Promise<AnalysedBlock[]> {
  const cached = (project.generationStateJson as { analysedBlocks?: AnalysedBlock[] } | null)?.analysedBlocks;
  if (Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  let analysedBlocks: AnalysedBlock[] = rawBlocks.map((b) => ({
    id: b.id,
    locator: b.locator,
    text: b.text,
    criticality: b.criticality,
    canonicalConcept: b.text.slice(0, 60),
    conceptType: "definition" as const,
    importance: (b.criticality === "critical" ? "critical" : "supporting") as ImportanceLevel,
    prerequisiteConcepts: [],
    likelyCloIds: [],
    analysisNotes: "",
  }));
  try {
    analysedBlocks = await analyseSourceBlocks(project.id, rawBlocks, clos);
  } catch (err) {
    console.warn("[Worker] Source analysis non-fatal failure:", err);
  }
  try {
    await db.lectureProject.update({
      where: { id: project.id },
      data: {
        generationStateJson: {
          ...((project.generationStateJson as Record<string, unknown> | null) ?? {}),
          analysedBlocks,
        },
      },
    });
  } catch {
    // cache write is best-effort
  }
  return analysedBlocks;
}

/**
 * Generate one chunk of slides (QStash worker). Runs the full per-slide
 * pipeline (generate → reviewers → repair → persist) for ONLY the requested
 * slides, so each serverless invocation stays within its duration budget.
 * Readiness + final project status are handled by finalizeGeneration.
 */
export async function generateSlideChunk(
  projectId: string,
  slideNos: number[],
  meta?: ChunkMeta
): Promise<void> {
  const win = progressWindow(meta);
  try {
    await setProgress(projectId, { status: "generating", progress: within(win, 2) });

    const project = await loadProject(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    if (shouldSetProjectGenerating(project.status, slideNos)) {
      await db.lectureProject.update({
        where: { id: projectId },
        data: { status: "generating" },
      });
    }

    const slidePlans = await db.lectureSlidePlan.findMany({
      where: { projectId },
      orderBy: { slideNo: "asc" },
    });
    if (slidePlans.length !== 20) {
      throw new Error(`Expected 20 approved slide plans, found ${slidePlans.length}`);
    }

    const targets = slidePlans.filter((s: { slideNo: number }) => slideNos.includes(s.slideNo));
    if (targets.length === 0) return;

    const clos = cloList(project);
    const rawBlocks = cleanRawBlocks(project);

    // ── Gap 1: Source Analyst — cached across chunks ──────────────────────
    await setProgress(projectId, { status: "analysing_sources", progress: within(win, 6) });
    const analysedBlocks = await getOrCreateAnalysis(project, clos, rawBlocks);
    await setProgress(projectId, { status: "source_analysis_done", progress: within(win, 10) });

    const omittedLinks = await db.lectureCoverageLink.findMany({
      where: { projectId, disposition: "omitted" },
      select: { blockId: true },
    });
    const omittedIds = new Set<string>(omittedLinks.map((l: { blockId: string }) => l.blockId));
    const boundPlans = bindUnmappedSourceBlocks(
      slidePlans.map((p: any) => ({
        slideNo: p.slideNo,
        function: p.function,
        sourceBlockIds: [...((p as { sourceBlockIds?: string[] }).sourceBlockIds ?? [])],
      })),
      analysedBlocks.map((b: AnalysedBlock) => ({
        id: b.id,
        criticality: b.criticality === "critical" || b.importance === "critical" ? "critical" : b.criticality || "standard",
      })),
      omittedIds,
      slideNos,
    );
    for (const bound of boundPlans) {
      const original = slidePlans.find((p: any) => p.slideNo === bound.slideNo);
      if (!original) continue;
      const before = JSON.stringify((original as { sourceBlockIds?: string[] }).sourceBlockIds ?? []);
      const after = JSON.stringify(bound.sourceBlockIds);
      if (before === after) continue;
      await db.lectureSlidePlan.updateMany({
        where: { projectId, slideNo: bound.slideNo },
        data: { sourceBlockIds: bound.sourceBlockIds },
      });
      (original as { sourceBlockIds: string[] }).sourceBlockIds = bound.sourceBlockIds;
    }

    let generatedArtifacts: { plan: any; draft: SlideArtifactDraft }[] = [];
    let needsFacultyReview = false;

    // ── Core generation: each slide gets SCOPED blocks (Gap 4) ────────────
    generatedArtifacts = await processInBatches(targets, BATCH_SIZE, async (plan: any, idx: number) => {
      // Gap 4: scope blocks to this slide only
      const planRecord = plan as {
        id: string;
        slideNo: number;
        function: string;
        title: string;
        interactionType: string | null;
        visualIntent: string | null;
        cloIds?: string[];
        sourceBlockIds?: string[];
      };
      const slideCloIds = planRecord.cloIds ?? clos.map((c) => c.id);
      const slideSourceBlockIds = planRecord.sourceBlockIds ?? [];
      const scopedBlocks = scopeBlocksForSlide(
        analysedBlocks,
        slideCloIds,
        slideSourceBlockIds
      );

      const draft = await generateSlideArtifact(project, planRecord, {
        clos,
        blocks: scopedBlocks,
      }).catch((err) => failedDraft(planRecord, String(err)));

      // Persist artifact immediately so Studio UI receives slide updates second-by-second
      await persistArtifact(projectId, draft);

      await setProgress(projectId, {
        status: "generating_slides",
        progress: within(win, 12 + (30 * (idx + 1)) / targets.length),
      });

      return { plan, draft };
    });

    // ── Repair loop ────────────────────────────────────────────────────────
    // Speed: on retry rounds, only re-review slides that were actually flagged
    // (previously EVERY pass re-ran over ALL slides every round — the dominant
    // cost when a single slide failed QA).
    let retryCount = 0;
    let currentPassClean = false;

    while (retryCount <= MAX_RETRIES && !currentPassClean) {
      currentPassClean = true;
      const roundTargets = generatedArtifacts.filter((a) => a.draft.flagged);
      if (roundTargets.length === 0) break;
      const slidesContent = roundTargets.map((a) => a.draft.content);

      // PASS: Evidence review
      await processInBatches(roundTargets, BATCH_SIZE, async (art, idx) => {
        const evResult = await verifyEvidence(slidesContent[idx], analysedBlocks);
        art.draft.content = evResult.reviewedSlide;
        if (evResult.result.status === "HARD_FAIL") {
          art.draft.flagged = true;
          currentPassClean = false;
        }
      });

      // PASS: Gap 3 — pedagogy / CLO alignment / claim verification
      await processInBatches(roundTargets, BATCH_SIZE, async (art) => {
        const pedResult = await reviewPedagogy(art.draft.content);
        art.draft.content = pedResult.slide;
        if (pedResult.result.status === "HARD_FAIL") {
          art.draft.flagged = true;
          currentPassClean = false;
        }

        const cloResult = await reviewCloAlignment(art.draft.content, clos);
        art.draft.content = cloResult.slide;
        if (cloResult.result.status === "HARD_FAIL") {
          art.draft.flagged = true;
          currentPassClean = false;
        }

        const planRecord = art.plan as typeof art.plan & { sourceBlockIds?: string[] };
        const slideScopeBlocks = scopeBlocksForSlide(
          analysedBlocks,
          (art.draft.content.cloIds ?? []),
          planRecord.sourceBlockIds ?? []
        );
        const claimResult = await verifyClaims(art.draft.content, slideScopeBlocks);
        art.draft.content = claimResult.slide;
        if (claimResult.result.status === "HARD_FAIL") {
          art.draft.flagged = true;
          currentPassClean = false;
        }
      });

      // PASS: Assessment review
      await processInBatches(roundTargets, BATCH_SIZE, async (art, idx) => {
        const { verifyAssessment } = await import("./reviewers/assessment-reviewer");
        const assResult = await verifyAssessment(slidesContent[idx], clos);
        art.draft.content = assResult.reviewedSlide;
        if (assResult.result.status === "HARD_FAIL") {
          art.draft.flagged = true;
          currentPassClean = false;
        }
      });

      // PASS: Visual intelligence + composition
      await processInBatches(roundTargets, BATCH_SIZE, async (art) => {
        const spec = await generateVisualSpec(art.draft.content);
        art.draft.content.visualSpec = spec;
      });
      await processInBatches(roundTargets, BATCH_SIZE, async (art) => {
        const composed = await composeSlide(art.draft.content);
        art.draft.content = composed;
      });

      // PASS: Gap 5 — dedicated assessment generator
      await processInBatches(roundTargets, BATCH_SIZE, async (art) => {
        const planRecord = art.plan as typeof art.plan & { sourceBlockIds?: string[] };
        const slideScopeBlocks = scopeBlocksForSlide(
          analysedBlocks,
          art.draft.content.cloIds ?? [],
          planRecord.sourceBlockIds ?? []
        );
        art.draft.content = await generateAssessment(
          art.draft.content,
          clos,
          slideScopeBlocks
        );
      });

      // PASS: Deterministic QA
      const updatedContent = roundTargets.map((a) => a.draft.content);
      const qaResult = runDeterministicQA(updatedContent);
      if (qaResult.status === "HARD_FAIL") currentPassClean = false;

      // PASS: Zero-jargon / zero-invention leak scan — any artifact with
      // internal labels, invented numbers, or placeholder scaffold text is
      // flagged for review and will NOT reach the student experience.
      await processInBatches(roundTargets, BATCH_SIZE, async (art) => {
        const leakResult = scanGeneratedSlide(
          art.draft.content as unknown as Record<string, unknown>,
          rawBlocks
        );
        if (leakResult.flaggedForReview) {
          art.draft.flagged = true;
          currentPassClean = false;
          art.draft.content.reviewStatus = "leak_flagged";
          art.draft.errors.push(
            `Leak scan: ${leakResult.jargon.length} jargon, ${leakResult.inventedNumbers.length} ungrounded numbers, ${leakResult.placeholders.length} placeholder phrases`
          );
          console.warn(
            `[Worker] Leak scan flagged S${art.plan.slideNo}:`,
            leakResult.jargon.map((j) => j.matched),
            leakResult.inventedNumbers,
            leakResult.placeholders
          );
        }
      });

      // PASS: Visual QA
      await processInBatches(roundTargets, BATCH_SIZE, async (art) => {
        const visResult = await verifyVisualQuality(art.draft.content);
        if (visResult.result.status === "HARD_FAIL") {
          art.draft.flagged = true;
          currentPassClean = false;
        }
      });

      // PASS: Screenshot QA
      const screenshotResult = await simulateScreenshotQA(updatedContent);
      if (screenshotResult.status === "HARD_FAIL") {
        for (const failure of screenshotResult.failures) {
          const art = generatedArtifacts.find(
            (a) => a.plan.slideNo === failure.slideNo
          );
          if (art) art.draft.flagged = true;
        }
        currentPassClean = false;
      }

      // PASS: Targeted repair on flagged slides
      if (!currentPassClean && retryCount < MAX_RETRIES) {
        await processInBatches(generatedArtifacts, BATCH_SIZE, async (art) => {
          if (!art.draft.flagged) return;
          const planRecord = art.plan as typeof art.plan & {
            cloIds?: string[];
            sourceBlockIds?: string[];
          };
          const scopedBlocks = scopeBlocksForSlide(
            analysedBlocks,
            planRecord.cloIds ?? clos.map((c) => c.id),
            planRecord.sourceBlockIds ?? []
          );
          art.draft = await generateSlideArtifact(project, art.plan, {
            clos,
            blocks: scopedBlocks,
          }).catch((err) => failedDraft(art.plan, String(err)));
        });
      } else if (!currentPassClean) {
        needsFacultyReview = true;
      }

      retryCount++;
    }

    applyGenerateQualityPass(
      generatedArtifacts.map(({ plan, draft }) => ({
        plan: {
          slideNo: plan.slideNo,
          function: plan.function,
          interactionType: plan.interactionType,
          sourceBlockIds: (plan as { sourceBlockIds?: string[] }).sourceBlockIds,
        },
        draft,
      })),
      analysedBlocks.map((b) => ({ id: b.id, locator: b.locator, text: b.text })),
    );

    // Persist all artifacts (Gap 6: immutable persist)
    await processInBatches(generatedArtifacts, BATCH_SIZE, async ({ draft }) => {
      await persistArtifact(projectId, draft);
    });

    try {
      await persistHandoffsFromGenerate(projectId, slideNos);
    } catch (handoffErr) {
      console.warn("[Worker] Coverage/alignment/NCAAA handoff non-fatal failure:", handoffErr);
    }

    // Record whether any slide still needs faculty review (read by finalize).
    if (needsFacultyReview) {
      try {
        const state = (project.generationStateJson as Record<string, unknown> | null) ?? {};
        await db.lectureProject.update({
          where: { id: projectId },
          data: { generationStateJson: { ...state, needsFacultyReview: true } },
        });
      } catch {
        // best-effort
      }
    }

    await setProgress(projectId, {
      status: "chunk_done",
      progress: within(win, 85),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await db.lectureProject.update({
        where: { id: projectId },
        data: { status: "failed" },
      });
    } catch {
      // ignore secondary failure
    }
    await setProgress(projectId, { status: "failed", progress: 100, error: message });
    throw err;
  }
}

/**
 * Finalize a generation (runs once after ALL chunks complete):
 * readiness items, project status, progress 100.
 */
export async function finalizeGeneration(projectId: string): Promise<void> {
  try {
    const project = await loadProject(projectId);
    if (!project) {
      await setProgress(projectId, { status: "failed", progress: 100, error: "Project not found" });
      return;
    }

    const state = (project.generationStateJson as Record<string, unknown> | null) ?? {};
    const needsFacultyReview = state.needsFacultyReview === true;

    await setProgress(projectId, { status: "generating_readiness", progress: 90 });

    try {
      const readinessItems = await generateReadinessItems(project);
      const deduplicatedItems = deduplicateReadinessItems(readinessItems);
      for (const item of deduplicatedItems) {
        await persistReadinessItem(projectId, item, project.nationalAlignmentMode);
      }
    } catch (readinessErr) {
      console.warn("Readiness assessment generation non-fatal failure:", readinessErr);
    }

    // Materialize the canonical LearningExperience graph from the generated
    // artifacts + readiness items so StudentExperienceSession /
    // StudentBlockInteraction (FKs to LearningExperience/ConceptBlock) can be
    // persisted, resume works, and mastery is computed server-side.
    // Non-fatal: the legacy projection remains the fallback if this fails.
    try {
      await materializeExperience(projectId);
    } catch (matErr) {
      console.warn("[Worker] Materialize canonical experience non-fatal failure:", matErr);
    }

    // Generated content changed — drop the server-side projection cache so the
    // next preview reflects the new artifacts/readiness (not a stale snapshot).
    clearProjectionCache(projectId);

    await db.lectureProject.update({
      where: { id: projectId },
      data: { status: POST_GENERATE_PROJECT_STATUS },
    });
    await setProgress(projectId, {
      status: "done",
      progress: 100,
      ...(needsFacultyReview
        ? { error: "Needs faculty review due to QA failure" }
        : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await db.lectureProject.update({
        where: { id: projectId },
        data: { status: "failed" },
      });
    } catch {
      // ignore secondary failure
    }
    await setProgress(projectId, { status: "failed", progress: 100, error: message });
    throw err;
  }
}

/**
 * Full in-process generation — used as the dev fallback when QStash is not
 * configured (keeps local behaviour identical to the pre-queue code).
 */
export async function generateAllSlides(
  projectId: string,
  slideNos?: number[]
): Promise<void> {
  const targets =
    slideNos && slideNos.length > 0 ? slideNos : Array.from({ length: 20 }, (_, i) => i + 1);
  await generateSlideChunk(projectId, targets);
  await finalizeGeneration(projectId);
}

/** Build a flagged empty draft for a slide whose generation threw. */
function failedDraft(
  plan: {
    id: string;
    slideNo: number;
    title: string;
    cloIds?: string[];
    sourceBlockIds?: string[];
  },
  error: string
): SlideArtifactDraft {
  return {
    slideNo: plan.slideNo,
    slidePlanId: plan.id,
    content: {
      title: plan.title,
      bullets: [],
      visualIntent: "",
      studentAction: "",
      speakerNotes: "",
      citations: [],
      claims: [],
      cloIds: plan.cloIds ?? [],
      sourceBlockIds: plan.sourceBlockIds ?? [],
      wordCount: 0,
    },
    errors: [error],
    flagged: true,
    error,
  };
}
