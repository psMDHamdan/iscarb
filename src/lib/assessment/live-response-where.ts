/**
 * Shared Prisma where-clause for AssessmentResponse rows that may contribute
 * to employer-facing / HR score artifacts (profile composite, PDF report).
 *
 * Matches percentile.ts: isCurrent=true and source ≠ seed (case-insensitive).
 */
export function liveCurrentResponseWhere(studentId: string) {
  return {
    studentId,
    isCurrent: true,
    NOT: { source: { equals: "seed", mode: "insensitive" as const } },
  };
}

export type LiveResponseWhere = ReturnType<typeof liveCurrentResponseWhere>;

/**
 * Report the seed-exclusion property of the where-clause that was actually
 * executed. Audit fields must describe the query that produced the rows, so
 * callers derive `excludedSeed` from here instead of asserting a literal.
 */
export function excludesSeedSource(where: LiveResponseWhere): boolean {
  return where.NOT?.source?.equals?.toLowerCase() === "seed";
}
