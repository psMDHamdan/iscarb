/**
 * Deduplication utilities for iSCARB Lecture Engine (Feature F1, Milestone 1).
 *
 * Provides pure, deterministic deduplication and sorting for:
 * 1. Slide Artifacts: unique by slideNo (prioritizes approved status, highest version, latest timestamp).
 * 2. Readiness Items: unique by slideNo (prioritizes approved status, latest timestamp).
 */

export interface SlideArtifactCandidate {
  slideNo: number | string;
  status?: string | null;
  approved?: boolean | null;
  version?: number | string | null;
  createdAt?: string | number | Date | null;
  updatedAt?: string | number | Date | null;
  id?: string | number | null;
  [key: string]: any;
}

export interface ReadinessItemCandidate {
  slideNo: number | string;
  status?: string | null;
  approved?: boolean | null;
  createdAt?: string | number | Date | null;
  updatedAt?: string | number | Date | null;
  id?: string | number | null;
  [key: string]: any;
}

/**
 * Safely parse a Date, string, number, or nullish value into unix timestamp in milliseconds.
 * Returns 0 if missing or invalid.
 */
export function parseTimestamp(val: string | number | Date | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (val instanceof Date) {
    const t = val.getTime();
    return Number.isFinite(t) && t > 0 ? t : 0;
  }
  if (typeof val === "number") {
    return Number.isFinite(val) && val > 0 ? val : 0;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return 0;
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

/**
 * Get effective latest timestamp (updatedAt prioritized over createdAt).
 */
export function getEffectiveTimestamp(item: {
  updatedAt?: string | number | Date | null;
  createdAt?: string | number | Date | null;
}): number {
  const updatedTs = parseTimestamp(item.updatedAt);
  if (updatedTs > 0) return updatedTs;
  return parseTimestamp(item.createdAt);
}

/**
 * Check if a candidate is considered approved.
 */
export function isApproved(item: { status?: string | null; approved?: boolean | null }): boolean {
  if (item.approved === true) return true;
  if (typeof item.status === "string" && item.status.trim().toLowerCase() === "approved") return true;
  return false;
}

/**
 * Compare two slide artifacts for the same slideNo and return the preferred one.
 */
function pickBetterSlideArtifact<T extends SlideArtifactCandidate>(a: T, b: T): T {
  const aApproved = isApproved(a);
  const bApproved = isApproved(b);

  // 1. Approval status
  if (aApproved && !bApproved) return a;
  if (!aApproved && bApproved) return b;

  // 2. Version (default 1 if missing/invalid)
  const aVer =
    typeof a.version === "number" && !isNaN(a.version)
      ? a.version
      : typeof a.version === "string" && !isNaN(Number(a.version))
      ? Number(a.version)
      : 1;
  const bVer =
    typeof b.version === "number" && !isNaN(b.version)
      ? b.version
      : typeof b.version === "string" && !isNaN(Number(b.version))
      ? Number(b.version)
      : 1;
  if (aVer > bVer) return a;
  if (bVer > aVer) return b;

  // 3. Latest timestamp (updatedAt ?? createdAt)
  const aTs = getEffectiveTimestamp(a);
  const bTs = getEffectiveTimestamp(b);
  if (aTs > bTs) return a;
  if (bTs > aTs) return b;

  // 4. Deterministic tie-breaker on ID
  const aId = a.id !== undefined && a.id !== null ? String(a.id) : "";
  const bId = b.id !== undefined && b.id !== null ? String(b.id) : "";
  if (bId.localeCompare(aId) > 0) return b;
  return a;
}

/**
 * Deduplicate slide artifacts.
 *
 * Rules per slideNo:
 * 1. Status 'approved' takes highest priority.
 * 2. Version takes second priority (higher version preferred).
 * 3. Latest timestamp (updatedAt ?? createdAt) takes third priority.
 * 4. Deterministic tie-breaker on ID.
 *
 * Return value is sorted ascending by slideNo.
 */
export function deduplicateSlideArtifacts<T extends SlideArtifactCandidate>(
  artifacts: T[] | null | undefined
): T[] {
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    return [];
  }

  const groups = new Map<number, T[]>();

  for (let i = 0; i < artifacts.length; i++) {
    const art = artifacts[i];
    if (art === null || art === undefined) continue;
    let slideNo: number;
    if (art.slideNo === null) {
      continue;
    } else if (art.slideNo !== undefined) {
      if (typeof art.slideNo === "string" && art.slideNo.trim() === "") continue;
      slideNo = typeof art.slideNo === "number" ? art.slideNo : Number(art.slideNo);
      if (isNaN(slideNo)) continue;
    } else {
      slideNo = i + 1;
    }

    if (!groups.has(slideNo)) {
      groups.set(slideNo, []);
    }
    groups.get(slideNo)!.push(art);
  }

  const result: T[] = [];

  groups.forEach((group) => {
    if (group.length === 1) {
      result.push(group[0]);
      return;
    }

    let best = group[0];
    for (let i = 1; i < group.length; i++) {
      best = pickBetterSlideArtifact(best, group[i]);
    }
    result.push(best);
  });

  return result.sort((a, b) => {
    const numA = typeof a.slideNo === "number" ? a.slideNo : Number(a.slideNo);
    const numB = typeof b.slideNo === "number" ? b.slideNo : Number(b.slideNo);
    return numA - numB;
  });
}

/**
 * Compare two readiness items for the same slideNo and return the preferred one.
 */
function pickBetterReadinessItem<T extends ReadinessItemCandidate>(a: T, b: T): T {
  const aApproved = isApproved(a);
  const bApproved = isApproved(b);

  // 1. Approval status
  if (aApproved && !bApproved) return a;
  if (!aApproved && bApproved) return b;

  // 2. Latest timestamp (updatedAt ?? createdAt)
  const aTs = getEffectiveTimestamp(a);
  const bTs = getEffectiveTimestamp(b);
  if (aTs > bTs) return a;
  if (bTs > aTs) return b;

  // 3. Deterministic tie-breaker on ID
  const aId = a.id !== undefined && a.id !== null ? String(a.id) : "";
  const bId = b.id !== undefined && b.id !== null ? String(b.id) : "";
  if (bId.localeCompare(aId) > 0) return b;
  return a;
}

/**
 * Deduplicate readiness items.
 *
 * Rules per slideNo:
 * 1. Status 'approved' takes highest priority.
 * 2. Latest timestamp (updatedAt ?? createdAt) takes second priority.
 * 3. Deterministic tie-breaker on ID.
 *
 * Return value is sorted ascending by slideNo.
 */
export function deduplicateReadinessItems<T extends ReadinessItemCandidate>(
  items: T[] | null | undefined
): T[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const groups = new Map<number, T[]>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item === null || item === undefined) continue;
    let slideNo: number;
    if (item.slideNo === null) {
      continue;
    } else if (item.slideNo !== undefined) {
      if (typeof item.slideNo === "string" && item.slideNo.trim() === "") continue;
      slideNo = typeof item.slideNo === "number" ? item.slideNo : Number(item.slideNo);
      if (isNaN(slideNo)) continue;
    } else {
      slideNo = i + 1;
    }

    if (!groups.has(slideNo)) {
      groups.set(slideNo, []);
    }
    groups.get(slideNo)!.push(item);
  }

  const result: T[] = [];

  groups.forEach((group) => {
    if (group.length === 1) {
      result.push(group[0]);
      return;
    }

    let best = group[0];
    for (let i = 1; i < group.length; i++) {
      best = pickBetterReadinessItem(best, group[i]);
    }
    result.push(best);
  });

  return result.sort((a, b) => {
    const numA = typeof a.slideNo === "number" ? a.slideNo : Number(a.slideNo);
    const numB = typeof b.slideNo === "number" ? b.slideNo : Number(b.slideNo);
    return numA - numB;
  });
}
