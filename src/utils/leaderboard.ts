/**
 * iSCARB — Leaderboard windows + ranking (pure, DB-free, unit-tested).
 * ===========================================================================
 * Motivation feature P2-7 ("Leaderboard أسبوعي متغيّر"): the leaderboard gets
 * tabs — "this week" / "this semester" / "all time". All-time ranks by the
 * current equity score; the windowed tabs rank by the POINTS A STUDENT EARNED
 * inside the window (the sum of their EquityEvent scoreDeltas since the window
 * start) — so a fast-rising newcomer can top "this week" even if a veteran
 * leads "all time", which is exactly what keeps a leaderboard motivating.
 *
 * This module owns the pure parts: the window definitions / start-date math and
 * the rank assignment (incl. tie handling). The route does the DB aggregation.
 * ===========================================================================
 */

export type LeaderboardWindow = "week" | "semester" | "all";

export const LEADERBOARD_WINDOWS: { key: LeaderboardWindow; labelEn: string; labelAr: string }[] = [
  { key: "week", labelEn: "This week", labelAr: "هذا الأسبوع" },
  { key: "semester", labelEn: "This semester", labelAr: "هذا الفصل" },
  { key: "all", labelEn: "All time", labelAr: "كل الوقت" },
];

/**
 * The start instant of a leaderboard window relative to `now`:
 *   - week:     the most recent Saturday 00:00 (the Saudi work-week start)
 *   - semester: ~16 weeks back (a teaching term)
 *   - all:      null (no lower bound)
 */
export function windowStart(window: LeaderboardWindow, now: Date = new Date()): Date | null {
  if (window === "all") return null;
  if (window === "semester") {
    const d = new Date(now);
    d.setDate(d.getDate() - 16 * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  // week → most recent Saturday (getDay: Sat = 6).
  const d = new Date(now);
  const day = d.getDay();
  const daysSinceSaturday = (day - 6 + 7) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface LeaderboardInput {
  studentId: string;
  name: string;
  program?: string;
  cohort?: string;
  /** The metric to rank by (equity score for all-time; window points otherwise). */
  metric: number;
  /** Optional carry-through fields. */
  extra?: Record<string, unknown>;
}

export interface LeaderboardRow extends LeaderboardInput {
  rank: number;
}

/**
 * Assign 1-based ranks by descending metric. Ties share a rank (standard
 * "1224" competition ranking), and the input order is otherwise preserved for
 * stability. Pure — does not mutate the input.
 */
export function assignRanks(rows: LeaderboardInput[]): LeaderboardRow[] {
  const sorted = [...rows].sort((a, b) => b.metric - a.metric);
  const out: LeaderboardRow[] = [];
  let lastMetric: number | null = null;
  let lastRank = 0;
  sorted.forEach((row, i) => {
    const rank = lastMetric !== null && row.metric === lastMetric ? lastRank : i + 1;
    out.push({ ...row, rank });
    lastMetric = row.metric;
    lastRank = rank;
  });
  return out;
}
