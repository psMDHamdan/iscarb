/**
 * iSCARB — Activity Streak engine (pure, DB-free, unit-tested).
 * ===========================================================================
 * Before this existed, `StudentAgent.streakDays` was written ONCE in the seed
 * to a random number (`Math.floor(Math.random()*14)+1`) and never updated, so
 * the "7-day streak" / "30-day streak" badges were awarded against noise, not
 * real behaviour, and the dashboard could not honestly show momentum.
 *
 * This module is the deterministic core that the central Activity Router calls
 * on every recorded achievement / activity signal. It answers one question:
 * "given the student's previous streak + the day of their last activity, and
 * the day of THIS activity, what is the new streak?" — with calendar-day logic
 * in a fixed timezone so two activities on the same local day don't double-count
 * and a one-day gap continues the streak while a longer gap resets it.
 *
 * PURITY RULE: no imports. Safe in the browser, the server, and tests. The
 * server-only DB read/write wrapper lives in `activity-router.ts`.
 * ===========================================================================
 */

/** Riyadh is UTC+3 with no DST — the platform's canonical "day" boundary. */
export const RIYADH_UTC_OFFSET_MIN = 180;

export interface StreakState {
  /** The student's current streak length in consecutive active days. */
  streakDays: number;
  /** ISO timestamp of the last activity that advanced the streak (or null). */
  lastActivityDate: string | null;
}

export type StreakEvent = "started" | "continued" | "same-day" | "reset";

export interface StreakUpdate {
  /** The new streak length. */
  streakDays: number;
  /** ISO timestamp to persist as the new last-activity marker (this activity). */
  lastActivityDate: string;
  /** True when `streakDays` actually changed (false on a same-day repeat). */
  changed: boolean;
  /** What happened, for logging / UI copy. */
  event: StreakEvent;
}

/**
 * The integer "day number" for an instant in a fixed timezone offset. Two
 * instants share a day number iff they fall on the same local calendar day.
 * Floor division by 86_400_000 ms after shifting by the offset.
 */
export function dayNumber(date: Date, offsetMinutes = RIYADH_UTC_OFFSET_MIN): number {
  const shifted = date.getTime() + offsetMinutes * 60_000;
  return Math.floor(shifted / 86_400_000);
}

/**
 * Whole-day gap between two instants in the given timezone (b − a). 0 = same
 * local day, 1 = consecutive days, ≥2 = a gap.
 */
export function dayGap(a: Date, b: Date, offsetMinutes = RIYADH_UTC_OFFSET_MIN): number {
  return dayNumber(b, offsetMinutes) - dayNumber(a, offsetMinutes);
}

/**
 * Compute the new streak from the previous state and the moment of a new
 * activity. Deterministic:
 *   - no prior activity                  → streak starts at 1 ("started")
 *   - same local day as last activity    → unchanged ("same-day")
 *   - exactly the next local day         → +1 ("continued")
 *   - a gap of ≥2 local days             → reset to 1 ("reset")
 *
 * A previous streak of 0 with a recorded lastActivityDate is treated as a
 * fresh start (defensive — should not happen, but never returns < 1 for an
 * actual activity).
 */
export function computeStreak(
  prev: StreakState,
  now: Date,
  offsetMinutes = RIYADH_UTC_OFFSET_MIN,
): StreakUpdate {
  const nowIso = now.toISOString();

  if (!prev.lastActivityDate) {
    return { streakDays: 1, lastActivityDate: nowIso, changed: true, event: "started" };
  }

  const last = new Date(prev.lastActivityDate);
  if (Number.isNaN(last.getTime())) {
    return { streakDays: 1, lastActivityDate: nowIso, changed: true, event: "started" };
  }

  const gap = dayGap(last, now, offsetMinutes);

  // Activity logged "in the past" relative to the marker (clock skew / backfill):
  // keep the streak and the later marker, but don't advance.
  if (gap <= 0) {
    const keep = Math.max(prev.streakDays, 1);
    return {
      streakDays: keep,
      lastActivityDate: gap === 0 ? prev.lastActivityDate : prev.lastActivityDate,
      changed: keep !== prev.streakDays,
      event: "same-day",
    };
  }

  if (gap === 1) {
    const next = Math.max(prev.streakDays, 0) + 1;
    return { streakDays: next, lastActivityDate: nowIso, changed: true, event: "continued" };
  }

  // gap >= 2 → streak broke.
  return { streakDays: 1, lastActivityDate: nowIso, changed: prev.streakDays !== 1, event: "reset" };
}

/**
 * UI helper: a streak's visual "tier" for styling and copy. Pure so the hero
 * card and any future surface agree.
 */
export type StreakTier = "none" | "building" | "hot" | "blazing";

export function streakTier(streakDays: number): StreakTier {
  if (streakDays <= 0) return "none";
  if (streakDays < 3) return "building";
  if (streakDays < 7) return "hot";
  return "blazing";
}
