/**
 * Student session service — persistence for student learning progress.
 * ===========================================================================
 * Backs the StudentExperienceSession / StudentBlockInteraction rows so that:
 *   - students can resume a lecture where they left off,
 *   - faculty/analytics can see real per-student progress,
 *   - mastery is computed server-side (not from client state).
 *
 * All writes are best-effort and never throw into the route: a persistence
 * failure must not block the student from learning.
 */

import { db } from "@/lib/db";

export interface InteractionInput {
  sessionId: string;
  conceptBlockId: string;
  activityType: string;
  studentInput: string;
  selectedOptionId?: string | null;
  isCorrect?: boolean | null;
  confidenceLevel?: string | null;
  hintsRequested?: number;
  timeSpentSeconds?: number;
  evaluatedMasteryScore?: number | null;
}

const MASTERY_THRESHOLD = 70;

/**
 * Gets the active session for a student + experience, creating one on first
 * visit. Returns null only when the experience doesn't exist.
 */
export async function getOrCreateSession(experienceId: string, studentId: string) {
  if (!studentId) return null;

  const experience = await db.learningExperience.findUnique({
    where: { id: experienceId },
    select: { id: true },
  });
  if (!experience) {
    // Fall back to resolving through projectId (legacy materialization path).
    const byProject = await db.learningExperience.findFirst({
      where: { projectId: experienceId },
      orderBy: { version: "desc" },
      select: { id: true },
    });
    if (!byProject) return null;
    experienceId = byProject.id;
  }

  // StudentExperienceSession.studentId is a FK to Student.id. The auth session
  // may carry a userId that differs from the Student.id — resolve it.
  let studentKey = studentId;
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true },
  });
  if (!student) {
    const byUser = await db.student.findFirst({
      where: { userId: studentId },
      select: { id: true },
    });
    if (!byUser) return null;
    studentKey = byUser.id;
  }

  return db.studentExperienceSession.upsert({
    where: { experienceId_studentId: { experienceId, studentId: studentKey } },
    update: { lastActiveAt: new Date() },
    create: {
      experienceId,
      studentId: studentKey,
      currentBlockIndex: 1,
      currentStage: "discover",
      completedStageKeys: [],
      xpScore: 0,
      masteryPercent: 0,
    },
  });
}

/** Records one student response / interaction on a concept block. */
export async function recordInteraction(input: InteractionInput): Promise<void> {
  try {
    await db.studentBlockInteraction.create({
      data: {
        sessionId: input.sessionId,
        conceptBlockId: input.conceptBlockId,
        activityType: input.activityType,
        studentInput: input.studentInput || "",
        selectedOptionId: input.selectedOptionId ?? null,
        isCorrect: input.isCorrect ?? null,
        confidenceLevel: input.confidenceLevel ?? null,
        hintsRequested: input.hintsRequested ?? 0,
        timeSpentSeconds: input.timeSpentSeconds ?? 0,
        evaluatedMasteryScore: input.evaluatedMasteryScore ?? null,
      },
    });
  } catch (err) {
    console.warn("[SessionService] recordInteraction failed:", (err as Error).message);
  }
}

/**
 * Advances the session's position + completed stages. Derives currentStage
 * from the block's stage category when a conceptBlockId is provided.
 */
export async function updateProgress(
  sessionId: string,
  opts: {
    currentBlockIndex?: number;
    currentStage?: string;
    completedStageKeys?: string[];
  }
): Promise<void> {
  try {
    await db.studentExperienceSession.update({
      where: { id: sessionId },
      data: {
        ...(opts.currentBlockIndex != null ? { currentBlockIndex: opts.currentBlockIndex } : {}),
        ...(opts.currentStage ? { currentStage: opts.currentStage } : {}),
        ...(opts.completedStageKeys ? { completedStageKeys: opts.completedStageKeys } : {}),
        lastActiveAt: new Date(),
      },
    });
  } catch (err) {
    console.warn("[SessionService] updateProgress failed:", (err as Error).message);
  }
}

/**
 * Computes mastery server-side: weighted across answered assessments,
 * completed activities, and final-gate attempts. Returns a 0-100 percent.
 */
export async function computeMastery(sessionId: string): Promise<number> {
  try {
    const session = await db.studentExperienceSession.findUnique({
      where: { id: sessionId },
      include: { interactions: true },
    });
    if (!session) return 0;

    const interactions = session.interactions || [];
    if (interactions.length === 0) return 0;

    let total = 0;
    let weightSum = 0;

    for (const it of interactions) {
      let weight = 1;
      if (it.activityType === "MCQ_ANSWER") weight = 2;
      else if (it.activityType === "FINAL_CHALLENGE") weight = 3;

      if (it.isCorrect != null) {
        total += weight * (it.isCorrect ? 1 : 0.3);
      } else if (it.evaluatedMasteryScore != null) {
        total += weight * (Math.min(5, Math.max(1, it.evaluatedMasteryScore)) / 5);
      }
      weightSum += weight;
    }

    const mastery = weightSum > 0 ? (total / weightSum) * 100 : 0;

    await db.studentExperienceSession.update({
      where: { id: sessionId },
      data: { masteryPercent: Math.round(mastery) },
    });

    return Math.round(mastery);
  } catch (err) {
    console.warn("[SessionService] computeMastery failed:", (err as Error).message);
    return 0;
  }
}

export const MASTERY_PASS_THRESHOLD = MASTERY_THRESHOLD;

/**
 * Returns whether the student has passed enough mastery to unlock the final
 * challenge (spec §35 gating).
 */
export async function finalChallengeUnlocked(sessionId: string): Promise<boolean> {
  try {
    const session = await db.studentExperienceSession.findUnique({
      where: { id: sessionId },
      select: { masteryPercent: true },
    });
    if (!session) return false;
    return session.masteryPercent >= MASTERY_THRESHOLD;
  } catch {
    return false;
  }
}