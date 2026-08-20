// src/lib/assessment/adaptive-selection.ts
// Adaptive question selection based on student CLO mastery
// Prioritizes weakest CLOs to build balanced competency

import { db } from "@/lib/db";
import type { GeneratedQuestion } from "./ai-question-generation.service";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface AdaptiveConfig {
  studentId: string;
  courseId: string;
  targetCLOs: string[];
  questionPool: GeneratedQuestion[];
  desiredCount: number;
}

interface MasteryEntry {
  masteryScore: number;
  status: string;
}

// ─────────────────────────────────────────────────────────────
// MASTERY LOOKUP
// ─────────────────────────────────────────────────────────────

/**
 * Fetch a student's CLO mastery map from the database.
 */
async function getStudentCLOMastery(
  studentId: string,
  courseId?: string,
): Promise<Record<string, MasteryEntry>> {
  const where: Record<string, unknown> = { studentId };
  if (courseId) where.courseId = courseId;

  const records = await db.cLOMastery.findMany({ where });

  const map: Record<string, MasteryEntry> = {};
  for (const r of records) {
    map[r.cloId] = {
      masteryScore: r.masteryScore,
      status: r.status,
    };
  }
  return map;
}

// ─────────────────────────────────────────────────────────────
// ADAPTIVE SELECTION
// ─────────────────────────────────────────────────────────────

/**
 * Select questions adaptively based on the student's CLO mastery.
 * Prioritises the weakest CLOs, adjusting difficulty accordingly.
 */
export async function selectAdaptiveQuestions(config: AdaptiveConfig): Promise<GeneratedQuestion[]> {
  const { studentId, courseId, targetCLOs, questionPool, desiredCount } = config;

  const masteryMap = await getStudentCLOMastery(studentId, courseId);

  // Sort CLOs by weakest mastery first
  const sortedCLOs = [...targetCLOs].sort((a, b) => {
    const ma = masteryMap[a]?.masteryScore || 0;
    const mb = masteryMap[b]?.masteryScore || 0;
    return ma - mb;
  });

  const selected: GeneratedQuestion[] = [];

  for (const cloId of sortedCLOs) {
    const mastery = masteryMap[cloId]?.masteryScore || 0;

    // Select questions for this CLO based on mastery
    const questionsForCLO = questionPool.filter((q) => q.cloAlignment === cloId);

    if (mastery < 40) {
      // Struggling: give more easy questions + explanatory feedback
      selected.push(...questionsForCLO.filter((q) => q.difficulty === "easy").slice(0, 3));
    } else if (mastery < 70) {
      // Developing: mix of medium + some hard
      selected.push(...questionsForCLO.filter((q) => q.difficulty === "medium").slice(0, 2));
      selected.push(...questionsForCLO.filter((q) => q.difficulty === "hard").slice(0, 1));
    } else {
      // Strong: challenge with hard questions
      selected.push(...questionsForCLO.filter((q) => q.difficulty === "hard").slice(0, 2));
    }

    if (selected.length >= desiredCount) break;
  }

  return selected.slice(0, desiredCount);
}
