/**
 * Review & Approval — shared pure logic (TASK-07).
 * ===========================================================================
 * Versioned decision actions, content hashing, the AC-09 regeneration guard,
 * the pre-publish checklist, and the source-version diff. All functions are
 * deterministic and DB-free so they are trivially unit-testable.
 */
import { createHash } from "crypto";

export type DecisionAction =
  | "approve"
  | "reject"
  | "omit"
  | "waive"
  | "regenerate"
  | "edit";

export type DecisionSeverity = "error" | "warning";

export interface DecisionItem {
  type: "artifact" | "alignment" | "claim" | "coverage";
  id: string;
  slideNo?: number;
  message: string;
  severity: DecisionSeverity;
  actions: DecisionAction[];
}

/** SHA-256 of canonical JSON — used for beforeHash / afterHash / manifest. */
export function contentHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/**
 * AC-09 — never regenerate a slide that carries a faculty edit.
 * A manually-edited artifact is `approved` with an `edit` decision; skip it.
 */
export function shouldRegenerate(
  artifact: { status: string },
  hasEditDecision: boolean
): boolean {
  if (artifact.status === "approved" && hasEditDecision) return false;
  return true;
}

export const REQUIRED_SLIDE_COUNT = 20;

export interface PublishBlockerCounts {
  failedErrorGates: number;
  unapprovedSlides: number;
  unapprovedReadinessItems: number;
  currentSlideCount?: number;
  requiredSlideCount?: number;
}

export interface PublishCheckResult {
  blockers: string[];
  counts: PublishBlockerCounts;
}

/**
 * Current slide = latest non-superseded artifact per slideNo.
 * Gap 6 regen marks the previous approved row superseded and inserts a new
 * draft; publish must ignore those historical rows (F10).
 */
export function latestCurrentArtifacts<
  T extends { slideNo: number; status: string; version: number },
>(artifacts: T[]): T[] {
  const bySlide = new Map<number, T>();
  const sorted = [...artifacts].sort((a, b) => b.version - a.version);
  for (const a of sorted) {
    if (a.status === "superseded") continue;
    if (!bySlide.has(a.slideNo)) bySlide.set(a.slideNo, a);
  }
  return [...bySlide.values()].sort((a, b) => a.slideNo - b.slideNo);
}

/** Newest readiness item per slide — regen always inserts, never updates. */
export function latestReadinessBySlide<
  T extends { slideNo: number; createdAt: Date },
>(items: T[]): T[] {
  const bySlide = new Map<number, T>();
  for (const item of items) {
    const current = bySlide.get(item.slideNo);
    if (!current || item.createdAt > current.createdAt) bySlide.set(item.slideNo, item);
  }
  return [...bySlide.values()].sort((a, b) => a.slideNo - b.slideNo);
}

/** Published package snapshot — only the artifact ids frozen on the version. */
export function snapshotArtifactsById<T extends { id: string }>(
  artifacts: T[],
  approvedIds: unknown,
): T[] {
  if (!Array.isArray(approvedIds) || approvedIds.length === 0) return [];
  const byId = new Map(artifacts.map((a) => [a.id, a]));
  const out: T[] = [];
  for (const id of approvedIds) {
    if (typeof id !== "string") continue;
    const row = byId.get(id);
    if (row) out.push(row);
  }
  return out;
}

/** Readiness rows for snapshot slides, not newer than publish time. */
export function snapshotReadinessItems<
  T extends { slideNo: number; createdAt?: Date | string | null },
>(
  items: T[],
  slideNos: number[],
  approvedAt: Date | string | null | undefined,
): T[] {
  const allowed = new Set(slideNos);
  const cutoff = approvedAt ? new Date(approvedAt) : null;
  const eligible = items.filter((item) => {
    if (!allowed.has(item.slideNo)) return false;
    if (!cutoff || item.createdAt == null) return true;
    return new Date(item.createdAt) <= cutoff;
  });
  const withDates = eligible.map((item) => ({
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(0),
  }));
  return latestReadinessBySlide(withDates) as T[];
}

export function resolvePackageSnapshot<
  A extends { id: string; slideNo: number },
  R extends { slideNo: number; createdAt?: Date | string | null },
>(input: {
  artifacts: A[];
  readiness: R[];
  approvedArtifactIds: unknown;
  approvedAt?: Date | string | null;
}): { artifacts: A[]; readiness: R[] } {
  const artifacts = snapshotArtifactsById(input.artifacts, input.approvedArtifactIds);
  const readiness = snapshotReadinessItems(
    input.readiness,
    artifacts.map((a) => a.slideNo),
    input.approvedAt,
  );
  return { artifacts, readiness };
}

export function publishInventoryFromRows(input: {
  artifacts: { slideNo: number; status: string; version: number }[];
  readiness: { slideNo: number; approved: boolean | null; createdAt: Date }[];
  requiredSlideCount?: number;
}): {
  currentArtifacts: { slideNo: number; status: string; version: number }[];
  unapprovedSlides: number;
  unapprovedReadinessItems: number;
  currentSlideCount: number;
  requiredSlideCount: number;
} {
  const requiredSlideCount = input.requiredSlideCount ?? REQUIRED_SLIDE_COUNT;
  const currentArtifacts = latestCurrentArtifacts(input.artifacts);
  const currentReadiness = latestReadinessBySlide(input.readiness);
  return {
    currentArtifacts,
    unapprovedSlides: currentArtifacts.filter((a) => a.status !== "approved").length,
    unapprovedReadinessItems: currentReadiness.filter((r) => r.approved !== true).length,
    currentSlideCount: currentArtifacts.length,
    requiredSlideCount,
  };
}

/** Pre-publish checklist — returns a human-readable blocker per failing rule. */
export function evaluatePublishChecks(input: {
  failedErrorGates: number;
  unapprovedSlides: number;
  unapprovedReadinessItems: number;
  currentSlideCount?: number;
  requiredSlideCount?: number;
}): PublishCheckResult {
  const requiredSlideCount = input.requiredSlideCount ?? REQUIRED_SLIDE_COUNT;
  const blockers: string[] = [];
  if (input.failedErrorGates > 0)
    blockers.push(`${input.failedErrorGates} error gate(s) not resolved`);
  if (
    input.currentSlideCount != null &&
    input.currentSlideCount !== requiredSlideCount
  ) {
    blockers.push(
      `expected ${requiredSlideCount} current slides, found ${input.currentSlideCount}`
    );
  }
  if (input.unapprovedSlides > 0)
    blockers.push(`${input.unapprovedSlides} slide(s) not yet approved`);
  if (input.unapprovedReadinessItems > 0)
    blockers.push(`${input.unapprovedReadinessItems} readiness item(s) not approved`);
  return {
    blockers,
    counts: {
      failedErrorGates: input.failedErrorGates,
      unapprovedSlides: input.unapprovedSlides,
      unapprovedReadinessItems: input.unapprovedReadinessItems,
      currentSlideCount: input.currentSlideCount,
      requiredSlideCount,
    },
  };
}

export interface SourceBlockRef {
  id: string;
  locator: string;
  text: string;
}

export interface CoverageLinkRef {
  id: string;
  blockId: string;
  disposition: string;
}

export interface SourceDiff {
  changed: SourceBlockRef[];
  added: SourceBlockRef[];
  removed: SourceBlockRef[];
  orphaned: CoverageLinkRef[];
}

/**
 * §D — diff a new document's blocks against the project's existing blocks.
 * Matching key is locator; text equality decides changed vs unchanged.
 */
export function diffSourceBlocks(
  oldBlocks: SourceBlockRef[],
  newBlocks: SourceBlockRef[],
  coverageLinks: CoverageLinkRef[]
): SourceDiff {
  const oldByLocator = new Map(oldBlocks.map((b) => [b.locator, b]));
  const newByLocator = new Map(newBlocks.map((b) => [b.locator, b]));

  const changed: SourceBlockRef[] = [];
  const added: SourceBlockRef[] = [];
  const removed: SourceBlockRef[] = [];

  for (const b of newBlocks) {
    const prev = oldByLocator.get(b.locator);
    if (!prev) added.push(b);
    else if (prev.text !== b.text) changed.push(b);
  }
  for (const b of oldBlocks) {
    if (!newByLocator.has(b.locator)) removed.push(b);
  }

  const removedIds = new Set(removed.map((b) => b.id));
  const orphaned = coverageLinks.filter((c) => removedIds.has(c.blockId));

  return { changed, added, removed, orphaned };
}
