export type HubStage = "complete" | "active" | "pending" | "locked";

export function alignmentStageState(s?: {
  readinessApproved?: number;
  readinessTotal?: number;
}): HubStage {
  const approved = s?.readinessApproved ?? 0;
  const total = s?.readinessTotal ?? 0;
  return total > 0 && approved === total ? "complete" : "pending";
}

export function alignmentStageDetail(
  s: { readinessApproved?: number; readinessTotal?: number } | undefined,
  ar = false,
): string | undefined {
  if (!s) return undefined;
  const approved = s.readinessApproved ?? 0;
  const total = s.readinessTotal ?? 0;
  return `${approved}/${total} ${ar ? "معتمد" : "approved"}`;
}

export function jaheziahStageState(s?: { jaheziahDecided?: boolean }): HubStage {
  return s?.jaheziahDecided ? "complete" : "pending";
}

export function jaheziahStageDetail(
  s: { jaheziahDecided?: boolean; jaheziahMode?: string | null } | undefined,
  ar = false,
): string | undefined {
  if (!s) return undefined;
  if (!s.jaheziahDecided) {
    return ar ? "لم يُحسم" : "Not decided";
  }
  if (s.jaheziahMode === "OFFICIAL_JAHEZIAH") {
    return ar ? "رسمي" : "Official";
  }
  return ar ? "جاهزية المقرر" : "Course readiness";
}
