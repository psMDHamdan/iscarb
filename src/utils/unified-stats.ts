/**
 * Single source of truth for cohort-readiness statistics.
 *
 * Before this module, every surface invented its own numbers: the overview API
 * never returned cohort average / top-decile / at-risk, so HomeView fell back to
 * hard-coded constants (71 / 88 / 2 …) while ReadinessView showed the real,
 * separately-computed values — so the same student saw different "cohort
 * average" figures on different pages. These helpers are PURE (no DB, no
 * server-only imports) so the overview and readiness routes can share the exact
 * same math, and so the math is unit-tested without a generated Prisma client.
 *
 * Note on scope: a page may legitimately apply these over different populations
 * (the whole tenant on the home dashboard vs. a single cohort on the readiness
 * scale). What this module guarantees is that the *computation* is identical
 * everywhere — no page fabricates a number.
 */

/** A student scoring below this is flagged "at risk" (matches the UI label "<55"). */
export const AT_RISK_THRESHOLD = 55;

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Linear-interpolated percentile of a sorted-ascending array (0 if empty). */
export function percentileOf(sortedAsc: number[], p: number): number {
  if (!sortedAsc.length) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const rank = (p / 100) * (sortedAsc.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  const frac = rank - lo;
  return Math.round(sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * frac);
}

export interface CohortReadiness {
  /** Number of students in the population. */
  studentsTracked: number;
  /** Mean readiness (rounded). Reported as both avgReadiness and cohortAverage. */
  cohortAverage: number;
  /** 90th-percentile readiness threshold (the "top decile" bar). */
  topDecileReadiness: number;
  /** Count of students below AT_RISK_THRESHOLD. */
  atRiskCount: number;
}

/**
 * Derive the shared cohort-readiness figures from a list of readiness scores.
 * Does not mutate its input.
 */
export function cohortReadiness(scores: number[]): CohortReadiness {
  const sorted = [...scores].sort((a, b) => a - b);
  return {
    studentsTracked: scores.length,
    cohortAverage: Math.round(mean(scores)),
    topDecileReadiness: percentileOf(sorted, 90),
    atRiskCount: scores.filter((s) => s < AT_RISK_THRESHOLD).length,
  };
}
