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
 * Batch-compute percentiles for multiple module codes at once.
 * Uses a single SQL query with GROUP BY to get total counts per module,
 * then a second query for "below" counts — reducing 2N queries to 2 total.
 *
 * Returns a Map<moduleCode, percentile | null>.
 */
export async function computePercentilesBatch(
  modules: Array<{ code: string; score: number }>,
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  const minSample = resolvePercentileMinSample();

  if (modules.length === 0) return result;

  // Initialize all to null (below threshold or no data)
  for (const m of modules) {
    result.set(m.code, null);
  }

  const moduleCodes = modules.map((m) => m.code);

  // Single query: get total count per moduleCode
  const totals = await db.assessmentResponse.groupBy({
    by: ["moduleCode"],
    where: {
      moduleCode: { in: moduleCodes },
      isCurrent: true,
      NOT: { source: { equals: "seed", mode: "insensitive" as const } },
    },
    _count: { id: true },
  });

  const totalMap = new Map<string, number>();
  for (const t of totals) {
    totalMap.set(t.moduleCode, t._count.id);
  }

  // Build the score lookup
  const scoreMap = new Map<string, number>();
  for (const m of modules) {
    scoreMap.set(m.code, m.score);
  }

  // Filter to only modules with enough data
  const eligibleCodes = moduleCodes.filter((code) => {
    const total = totalMap.get(code) ?? 0;
    return total >= minSample;
  });

  if (eligibleCodes.length === 0) return result;

  // Single query: get count of rows with score < target per moduleCode.
  // Each module has a different score threshold, so we build OR conditions.
  const orClauses = eligibleCodes
    .map((code) => {
      const score = scoreMap.get(code)!;
      return `("moduleCode" = '${code.replace(/'/g, "''")}' AND "score" < ${score})`;
    })
    .join(" OR ");

  const belowCounts = await db.$queryRawUnsafe<Array<{ modulecode: string; cnt: bigint }>>(`
    SELECT
      "moduleCode" as modulecode,
      COUNT(*)::bigint as cnt
    FROM "AssessmentResponse"
    WHERE "isCurrent" = true
      AND LOWER("source") != 'seed'
      AND (${orClauses})
    GROUP BY "moduleCode"
  `);

  const belowMap = new Map<string, number>();
  for (const row of belowCounts) {
    belowMap.set(row.modulecode, Number(row.cnt));
  }

  // Compute final percentiles
  for (const code of eligibleCodes) {
    const total = totalMap.get(code) ?? 0;
    const below = belowMap.get(code) ?? 0;
    result.set(code, Math.round((below / total) * 100));
  }

  return result;
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
  if (!Number.isFinite(composite)) return null;

  const minSample = resolvePercentileMinSample();
  // composite is required on EmployabilityProfile — do not use `{ not: null }`
  // (invalid on non-nullable FloatFilter and throws at query validation time).
  const baseWhere = excludeStudentId
    ? { NOT: { studentId: excludeStudentId } }
    : {};

  const total = await db.employabilityProfile.count({ where: baseWhere });
  if (total < minSample) return null;

  const below = await db.employabilityProfile.count({
    where: { ...baseWhere, composite: { lt: composite } },
  });
  return Math.round((below / total) * 100);
}
