import "server-only";
import { db } from "@/lib/db";

/**
 * Minimum live (non-seed) AssessmentResponse rows required before a percentile
 * is shown. Below this, computePercentile() returns null and the UI hides the line.
 *
 * Default: 5 (current hardcoded behavior). Raise toward 20–30 once real-candidate
 * volume accumulates — that decision belongs in ops/config (env), not a code redeploy.
 * Set ASSESSMENT_PERCENTILE_MIN_SAMPLE in the environment / deployment config.
 */
const DEFAULT_MIN_SAMPLE = 5;

/** Exported for tests — parses env with safe fallback to DEFAULT_MIN_SAMPLE. */
export function resolvePercentileMinSample(
  envValue: string | undefined = process.env.ASSESSMENT_PERCENTILE_MIN_SAMPLE,
): number {
  if (envValue == null || envValue.trim() === "") return DEFAULT_MIN_SAMPLE;
  const n = Number.parseInt(envValue, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MIN_SAMPLE;
  return n;
}

/**
 * Compute the percentile rank of `score` among all isCurrent=true responses
 * for `moduleCode`, excluding seed/demo fixtures (`source = "seed"`).
 *
 * Same integrity bar as profile/report: never let seed rows inflate peer rank.
 *
 * Returns the percentage of historical records whose score is strictly LESS
 * than the given score (i.e. the candidate beat that percentage of others).
 *
 * Returns null when fewer than MIN_SAMPLE live (non-seed) records exist.
 */
export async function computePercentile(
  moduleCode: string,
  score: number,
): Promise<number | null> {
  const minSample = resolvePercentileMinSample();

  const liveWhere = {
    moduleCode,
    isCurrent: true,
    NOT: { source: { equals: "seed", mode: "insensitive" as const } },
  };

  const total = await db.assessmentResponse.count({
    where: liveWhere,
  });

  if (total < minSample) return null;

  const below = await db.assessmentResponse.count({
    where: { ...liveWhere, score: { lt: score } },
  });

  return Math.round((below / total) * 100);
}

/**
 * Overall percentile of a candidate's composite score against the rest of the
 * cohort (one latest profile per student). The candidate's own row is excluded
 * so "better than X%" means strictly better than the OTHER candidates.
 *
 * Same integrity bar as computePercentile: returns null below the minimum
 * live-sample threshold (the UI hides the percentile line then).
 */
export async function computeOverallPercentile(
  composite: number,
  excludeStudentId?: string,
): Promise<number | null> {
  const minSample = resolvePercentileMinSample();
  const baseWhere = {
    composite: { not: null as const },
    ...(excludeStudentId ? { NOT: { studentId: excludeStudentId } } : {}),
  };
  const total = await db.employabilityProfile.count({ where: baseWhere });
  if (total < minSample) return null;
  const below = await db.employabilityProfile.count({
    where: { ...baseWhere, composite: { lt: composite } },
  });
  return Math.round((below / total) * 100);
}
