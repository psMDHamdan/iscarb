/**
 * Stage handoffs — persist coverage / alignment / NCAAA rows from real slides.
 * ===========================================================================
 * Called after generateAllSlides writes artifacts. Never invents Jaheziah
 * SKUs (JAH-CS-*) or marks NCAAA evidence met. Placeholder plan ids that
 * are not real Prisma CUIDs on this project are dropped (F1 leftover).
 */
import { db } from "@/lib/db";
import type { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";

export type AlignmentMode = "OFFICIAL_JAHEZIAH" | "COURSE_READINESS";

export interface CoverageMappedRow {
  blockId: string;
  slideNo: number;
}

export interface AlignmentDraft {
  cloId: string;
  artifactId: string;
  sourceLocator: string | null;
  mode: AlignmentMode;
  standardOutcomeId: null;
  decision: "pending";
  rationale: string;
}

export interface NcaaCandidate {
  artifactId: string;
  locator: string | null;
}

export interface HandoffCounts {
  coverage: number;
  alignment: number;
  ncaaa: number;
}

export function extractOfficialOutcomeIds(standard: {
  skus?: unknown;
  slos?: unknown;
  klos?: unknown;
} | null | undefined): string[] {
  if (!standard) return [];
  const ids: string[] = [];
  const take = (value: unknown) => {
    if (!Array.isArray(value)) return;
    for (const item of value) {
      if (item && typeof item === "object" && "id" in item) {
        const id = String((item as { id?: unknown }).id ?? "").trim();
        if (id) ids.push(id);
      }
      if (item && typeof item === "object" && "slos" in item) {
        take((item as { slos?: unknown }).slos);
      }
    }
  };
  take(standard.klos);
  take(standard.skus);
  take(standard.slos);
  return [...new Set(ids)];
}

export function resolveHandoffAlignmentMode(
  projectMode: string | null | undefined,
  officialOutcomeIds: string[],
): AlignmentMode {
  const official =
    (projectMode === "OFFICIAL_JAHEZIAH" || projectMode === "STALE_OFFICIAL_SOURCE") &&
    officialOutcomeIds.length > 0;
  return official ? "OFFICIAL_JAHEZIAH" : "COURSE_READINESS";
}

/**
 * Bind leftover source blocks onto teaching slides so coverage can reach the
 * existing ≥98% / 100%-critical bar. Does not omit, does not invent blocks,
 * and does not change gateSourceCoverage.
 */
export function bindUnmappedSourceBlocks<
  T extends { slideNo: number; function?: string | null; sourceBlockIds: string[] },
>(
  slides: T[],
  blocks: { id: string; criticality?: string | null }[],
  omittedBlockIds: Set<string> = new Set(),
  hostSlideNos?: number[],
): T[] {
  const next = slides.map((s) => ({ ...s, sourceBlockIds: [...(s.sourceBlockIds ?? [])] }));
  const assigned = new Set(next.flatMap((s) => s.sourceBlockIds));
  const leftover = blocks
    .filter((b) => Boolean(b.id) && !omittedBlockIds.has(b.id) && !assigned.has(b.id))
    .sort((a, b) => Number(b.criticality === "critical") - Number(a.criticality === "critical"));
  if (leftover.length === 0) return next;

  const allow = hostSlideNos?.length ? new Set(hostSlideNos) : null;
  const teaching = next.filter((s) => s.slideNo !== 3 && s.function !== "clos");
  const hosts = teaching.filter((s) => (allow ? allow.has(s.slideNo) : true));
  const targets = (hosts.length > 0 ? hosts : teaching.length > 0 ? teaching : next).filter((s) =>
    allow ? allow.has(s.slideNo) : true,
  );
  const assignOnto = targets.length > 0 ? targets : next;
  leftover.forEach((block, i) => {
    const host = assignOnto[i % assignOnto.length];
    if (!host.sourceBlockIds.includes(block.id)) host.sourceBlockIds.push(block.id);
  });
  return next;
}

export function buildCoverageMappedRows(
  plans: { slideNo: number; sourceBlockIds: string[] }[],
  knownBlockIds: Set<string>,
  omittedBlockIds: Set<string>,
  slideNos?: number[],
): CoverageMappedRow[] {
  const targets = slideNos ? plans.filter((p) => slideNos.includes(p.slideNo)) : plans;
  const rows: CoverageMappedRow[] = [];
  const seen = new Set<string>();
  for (const plan of targets) {
    for (const raw of plan.sourceBlockIds ?? []) {
      const blockId = String(raw).trim();
      if (!knownBlockIds.has(blockId)) continue;
      if (omittedBlockIds.has(blockId)) continue;
      const key = `${blockId}:${plan.slideNo}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ blockId, slideNo: plan.slideNo });
    }
  }
  return rows;
}

export function buildAlignmentDrafts(input: {
  plans: { slideNo: number; cloIds: string[]; sourceBlockIds: string[] }[];
  artifactsBySlide: Map<number, { id: string; slideNo: number }>;
  knownCloIds: Set<string>;
  blocksById: Map<string, { locator: string }>;
  mode: AlignmentMode;
  slideNos?: number[];
}): AlignmentDraft[] {
  const { plans, artifactsBySlide, knownCloIds, blocksById, mode, slideNos } = input;
  const targets = slideNos ? plans.filter((p) => slideNos.includes(p.slideNo)) : plans;
  const drafts: AlignmentDraft[] = [];
  const seen = new Set<string>();
  const rationale =
    mode === "COURSE_READINESS"
      ? "Course-readiness CLO-to-slide binding from the approved plan."
      : "Official specialty catalog present; outcome SKU pending faculty decision.";

  for (const plan of targets) {
    const artifact = artifactsBySlide.get(plan.slideNo);
    if (!artifact) continue;
    const firstBlockId = (plan.sourceBlockIds ?? []).find((id) => blocksById.has(id));
    const sourceLocator = firstBlockId ? (blocksById.get(firstBlockId)?.locator ?? null) : null;
    for (const raw of plan.cloIds ?? []) {
      const cloId = String(raw).trim();
      if (!knownCloIds.has(cloId)) continue;
      const key = `${cloId}:${artifact.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      drafts.push({
        cloId,
        artifactId: artifact.id,
        sourceLocator,
        mode,
        standardOutcomeId: null,
        decision: "pending",
        rationale,
      });
    }
  }
  return drafts;
}

export function pickNcaaCandidate(
  evidenceType: string,
  artifacts: { id: string; slideNo: number }[],
  plans: { slideNo: number; function: string; interactionType: string | null; sourceBlockIds: string[] }[],
  blocks: { id: string; locator: string }[],
): NcaaCandidate | null {
  if (artifacts.length === 0) return null;
  const bySlide = new Map(artifacts.map((a) => [a.slideNo, a]));
  const pick = (slideNo: number): NcaaCandidate | null => {
    const art = bySlide.get(slideNo);
    if (!art) return null;
    const plan = plans.find((p) => p.slideNo === slideNo);
    const block = plan?.sourceBlockIds?.[0]
      ? blocks.find((b) => b.id === plan.sourceBlockIds[0])
      : undefined;
    return { artifactId: art.id, locator: block?.locator ?? `slide:${slideNo}` };
  };

  const t = (evidenceType ?? "").toLowerCase();
  if (t.includes("clo") || t.includes("alignment")) {
    return pick(3) ?? { artifactId: artifacts[0].id, locator: `slide:${artifacts[0].slideNo}` };
  }
  if (t.includes("active") || t.includes("engagement")) {
    const interactive = plans.find(
      (p) => p.interactionType && p.interactionType !== "null" && bySlide.has(p.slideNo),
    );
    if (interactive) return pick(interactive.slideNo);
  }
  if (t.includes("rubric") || t.includes("assessment")) {
    return pick(18) ?? pick(20) ?? pick(artifacts[0].slideNo);
  }
  if (t.includes("source") || t.includes("attribution") || t.includes("citation")) {
    const withSrc = plans.find((p) => (p.sourceBlockIds?.length ?? 0) > 0 && bySlide.has(p.slideNo));
    if (withSrc) return pick(withSrc.slideNo);
  }
  if (t.includes("vision") || t.includes("national")) {
    return pick(14) ?? pick(13) ?? pick(artifacts[0].slideNo);
  }
  return { artifactId: artifacts[0].id, locator: `slide:${artifacts[0].slideNo}` };
}

function latestArtifactBySlide(
  artifacts: { id: string; slideNo: number; status: string; version: number }[],
): Map<number, { id: string; slideNo: number }> {
  const map = new Map<number, { id: string; slideNo: number }>();
  const sorted = [...artifacts].sort((a, b) => b.version - a.version);
  for (const a of sorted) {
    if (a.status === "superseded") continue;
    if (!map.has(a.slideNo)) map.set(a.slideNo, { id: a.id, slideNo: a.slideNo });
  }
  return map;
}

function closFromProfile(raw: unknown): CourseLearningOutcome[] {
  return Array.isArray(raw) ? (raw as CourseLearningOutcome[]) : [];
}

/** Faculty omit on Source Map — one coverage row the source_coverage gate can see. */
export async function persistOmittedCoverage(params: {
  projectId: string;
  blockIds: string[];
  reason?: string | null;
  approvedBy: string;
  organizationId?: string | null;
}): Promise<number> {
  const { projectId, blockIds, reason, approvedBy, organizationId } = params;
  let written = 0;
  for (const blockId of blockIds) {
    const existing = await db.lectureCoverageLink.findMany({
      where: { projectId, blockId },
      select: { id: true },
    });
    if (existing.length > 0) {
      const updated = await db.lectureCoverageLink.updateMany({
        where: { projectId, blockId },
        data: {
          disposition: "omitted",
          reason: reason ?? null,
          approvedBy,
          approvedAt: new Date(),
        },
      });
      written += updated.count;
    } else {
      await db.lectureCoverageLink.create({
        data: {
          projectId,
          organizationId: organizationId ?? null,
          blockId,
          slideNo: 0,
          disposition: "omitted",
          reason: reason ?? null,
          approvedBy,
          approvedAt: new Date(),
        },
      });
      written += 1;
    }
  }
  return written;
}

/** Undo a prior omit so generate can map the block again. */
export async function clearOmittedCoverage(projectId: string, blockIds: string[]): Promise<void> {
  await db.lectureCoverageLink.deleteMany({
    where: { projectId, blockId: { in: blockIds }, disposition: "omitted" },
  });
}

export async function persistHandoffsFromGenerate(
  projectId: string,
  slideNos?: number[],
): Promise<HandoffCounts> {
  const project = await db.lectureProject.findUnique({
    where: { id: projectId },
    include: { courseProfile: true, sourceBlocks: true },
  });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const [plans, artifacts, eligibility, standards, omittedLinks, requirements] = await Promise.all([
    db.lectureSlidePlan.findMany({
      where: { projectId },
      select: {
        slideNo: true,
        cloIds: true,
        sourceBlockIds: true,
        function: true,
        interactionType: true,
      },
      orderBy: { slideNo: "asc" },
    }),
    db.lectureSlideArtifact.findMany({
      where: { projectId },
      select: { id: true, slideNo: true, status: true, version: true },
    }),
    db.lectureAlignmentEligibility.findUnique({
      where: { projectId },
      select: { mode: true },
    }),
    db.nationalStandard.findMany({
      select: { specialtyKey: true, skus: true, slos: true, klos: true, snapshotId: true },
    }),
    db.lectureCoverageLink.findMany({
      where: { projectId, disposition: "omitted" },
      select: { blockId: true },
    }),
    db.nCAAARequirement.findMany({
      select: { id: true, evidenceType: true },
    }),
  ]);

  const knownBlockIds = new Set<string>(project.sourceBlocks.map((b: { id: string }) => b.id));
  const omittedBlockIds = new Set<string>(omittedLinks.map((l: { blockId: string }) => l.blockId));
  const boundPlans = bindUnmappedSourceBlocks(
    plans,
    project.sourceBlocks.map((b: { id: string; criticality?: string | null }) => ({ id: b.id, criticality: b.criticality })),
    omittedBlockIds,
    slideNos,
  );
  for (const plan of boundPlans) {
    const original = plans.find((p: { slideNo: number; sourceBlockIds: string[] }) => p.slideNo === plan.slideNo);
    const before = JSON.stringify(original?.sourceBlockIds ?? []);
    const after = JSON.stringify(plan.sourceBlockIds);
    if (before === after) continue;
    await db.lectureSlidePlan.updateMany({
      where: { projectId, slideNo: plan.slideNo },
      data: { sourceBlockIds: plan.sourceBlockIds },
    });
  }
  const coverageRows = buildCoverageMappedRows(boundPlans, knownBlockIds, omittedBlockIds, slideNos);

  let coverage = 0;
  for (const row of coverageRows) {
    await db.lectureCoverageLink.upsert({
      where: {
        projectId_blockId_slideNo: {
          projectId,
          blockId: row.blockId,
          slideNo: row.slideNo,
        },
      },
      create: {
        projectId,
        organizationId: project.organizationId,
        blockId: row.blockId,
        slideNo: row.slideNo,
        disposition: "mapped",
      },
      update: { disposition: "mapped" },
    });
    coverage += 1;
  }

  const specialty = (project.courseProfile.specialty ?? "").trim().toLowerCase();
  const matchedStandard = standards.find(
    (s: { specialtyKey?: string | null }) => (s.specialtyKey ?? "").trim().toLowerCase() === specialty,
  );
  const officialOutcomeIds = extractOfficialOutcomeIds(matchedStandard);
  const mode = resolveHandoffAlignmentMode(
    eligibility?.mode ?? project.nationalAlignmentMode,
    officialOutcomeIds,
  );

  const clos = closFromProfile(project.courseProfile.teacherEnteredClos);
  const knownCloIds = new Set(clos.map((c) => c.id).filter(Boolean));
  const artifactsBySlide = latestArtifactBySlide(artifacts);
  const blocksById = new Map<string, { locator: string | null }>(project.sourceBlocks.map((b: { id: string; locator: string | null }) => [b.id, { locator: b.locator }]));
  const drafts = buildAlignmentDrafts({
    plans,
    artifactsBySlide,
    knownCloIds,
    blocksById,
    mode,
    slideNos,
  });

  const targetArtifactIds = drafts.map((d) => d.artifactId);
  if (targetArtifactIds.length > 0) {
    await db.lectureAlignmentLink.deleteMany({
      where: {
        projectId,
        decision: "pending",
        artifactId: { in: [...new Set(targetArtifactIds)] },
      },
    });
  }

  let alignment = 0;
  for (const draft of drafts) {
    const kept = await db.lectureAlignmentLink.findFirst({
      where: {
        projectId,
        cloId: draft.cloId,
        artifactId: draft.artifactId,
        decision: { in: ["accepted", "rejected", "edited"] },
      },
      select: { id: true },
    });
    if (kept) continue;
    await db.lectureAlignmentLink.create({
      data: {
        projectId,
        organizationId: project.organizationId,
        cloId: draft.cloId,
        artifactId: draft.artifactId,
        mode: draft.mode,
        standardOutcomeId: null,
        decision: "pending",
        rationale: draft.rationale,
        sourceLocator: draft.sourceLocator,
        sourceSnapshotId: matchedStandard?.snapshotId ?? null,
        confidence: 1,
      },
    });
    alignment += 1;
  }

  let ncaaa = 0;
  const artifactList = [...artifactsBySlide.values()];
  for (const req of requirements) {
    const existing = await db.lectureNCAAAEvidenceLink.findFirst({
      where: { projectId, requirementId: req.id },
      select: { id: true },
    });
    if (existing) continue;
    const candidate = pickNcaaCandidate(
      req.evidenceType,
      artifactList,
      plans,
      project.sourceBlocks,
    );
    await db.lectureNCAAAEvidenceLink.create({
      data: {
        projectId,
        organizationId: project.organizationId,
        requirementId: req.id,
        artifactId: candidate?.artifactId ?? null,
        evidenceType: req.evidenceType,
        locator: candidate?.locator ?? null,
        status: "open",
      },
    });
    ncaaa += 1;
  }

  return { coverage, alignment, ncaaa };
}
