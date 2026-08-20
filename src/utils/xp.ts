/**
 * iSCARB — Instant XP + level-up + milestones (pure, DB-free, unit-tested).
 * ===========================================================================
 * Motivation features P1-5 ("XP فوري بعد كل فعل") and P2-8 ("milestone
 * celebrations"). After each action (assessment, simulation, capstone,
 * challenge, hackathon…) the UI shows "🏆 +150 XP! 200 to the next level", and
 * when a student crosses a level boundary it celebrates.
 *
 * This module is the deterministic source for BOTH: how much XP an action is
 * worth, and whether a score change crossed a level. It reuses the existing
 * gamification LEVELS so the modal and the dashboard badge never disagree.
 *
 * PURITY RULE: imports only the pure gamification level table.
 * ===========================================================================
 */

import { LEVELS, levelFor, type LevelDef } from "@/lib/gamification";

/** The action types that grant instant XP, with their bilingual labels. */
export type XpAction =
  | "assessment"
  | "simulation"
  | "capstone"
  | "challenge"
  | "hackathon"
  | "portfolio"
  | "interview"
  | "skill";

/**
 * XP awarded per action. Tuned to mirror the relative weights the gamification
 * point model already uses (a hackathon win >> a skill), so the instant reward
 * is proportional to the durable points the action will ultimately add.
 */
export const XP_PER_ACTION: Record<XpAction, number> = {
  hackathon: 200,
  capstone: 180,
  simulation: 120,
  assessment: 150,
  challenge: 120,
  interview: 100,
  portfolio: 80,
  skill: 40,
};

export const XP_ACTION_LABELS: Record<XpAction, { en: string; ar: string }> = {
  assessment: { en: "Assessment completed", ar: "أكملت تقييماً" },
  simulation: { en: "Simulation completed", ar: "أكملت محاكاة" },
  capstone: { en: "Capstone shipped", ar: "أنجزت مشروع كابستون" },
  challenge: { en: "Challenge submitted", ar: "سلّمت تحدياً" },
  hackathon: { en: "Hackathon result", ar: "نتيجة هاكاثون" },
  portfolio: { en: "Portfolio updated", ar: "حدّثت معرض أعمالك" },
  interview: { en: "Interview practiced", ar: "تدرّبت على مقابلة" },
  skill: { en: "Skill demonstrated", ar: "أثبتّ مهارة" },
};

/** XP for an action (0 for an unknown action — never throws). */
export function xpForAction(action: string): number {
  return XP_PER_ACTION[action as XpAction] ?? 0;
}

export interface LevelUp {
  from: LevelDef;
  to: LevelDef;
}

/**
 * Did a score change cross a level boundary upward? Returns the from/to levels
 * when it did, else null. Used to fire the milestone celebration.
 */
export function detectLevelUp(prevScore: number, newScore: number): LevelUp | null {
  const from = levelFor(prevScore);
  const to = levelFor(newScore);
  if (to.minScore > from.minScore) return { from, to };
  return null;
}

export interface XpAward {
  action: XpAction | null;
  /** XP this action granted. */
  gained: number;
  /** Bilingual label of the action. */
  labelEn: string;
  labelAr: string;
  /** The student's level after the action. */
  level: LevelDef;
  /** The next level + the score gap to reach it (null at the top level). */
  nextLevel: LevelDef | null;
  gapToNext: number;
  /** Set when this action crossed a level boundary. */
  leveledUp: LevelUp | null;
}

/**
 * Build the payload the "instant XP" modal renders after an action: the XP
 * gained, the action label, the current level, the gap to the next level, and
 * whether the action triggered a level-up (for the celebration). `prevScore`
 * and `newScore` are the equity scores before/after the action.
 */
export function buildXpAward(action: string, prevScore: number, newScore: number): XpAward {
  const known = (XP_PER_ACTION[action as XpAction] != null ? (action as XpAction) : null);
  const level = levelFor(newScore);
  const idx = LEVELS.findIndex((l) => l.code === level.code);
  const nextLevel = LEVELS[idx + 1] ?? null;
  const gapToNext = nextLevel ? Math.max(0, Math.round(nextLevel.minScore - newScore)) : 0;
  const labels = known ? XP_ACTION_LABELS[known] : { en: "Activity recorded", ar: "تم تسجيل النشاط" };

  return {
    action: known,
    gained: known ? XP_PER_ACTION[known] : 0,
    labelEn: labels.en,
    labelAr: labels.ar,
    level,
    nextLevel,
    gapToNext,
    leveledUp: detectLevelUp(prevScore, newScore),
  };
}
