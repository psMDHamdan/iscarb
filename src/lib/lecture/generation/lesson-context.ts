/**
 * SVC-06 — Canonical Lesson Context
 * ===========================================================================
 * The SINGLE SOURCE OF TRUTH for what was taught in a lesson.
 *
 * Every downstream component (slides, quizzes, assessments) MUST reference
 * this context. No component may generate content independently.
 *
 * Core constraint:
 *   ASSESSMENT QUESTION → CONCEPT ID → TAUGHT LESSON CONCEPT
 *   If this chain cannot be proven, the question is REJECTED.
 */

import { db } from "@/lib/db";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TaughtConcept {
  id: string;
  name: string;
  definition: string;
  importance: "critical" | "major" | "supporting";
  sourceEvidenceIds: string[];
  misconceptions: string[];
  examples: string[];
  relationships: string[];
  slideNo: number; // Which slide taught this concept
}

export interface LessonContext {
  lessonId: string;
  projectId: string;
  title: string;
  subject: string;
  studentSpecialization: string;
  studentLevel: string;
  learningObjectives: string[];
  prerequisiteKnowledge: string[];
  concepts: TaughtConcept[];
  taughtConceptIds: string[];
  practicalApplications: string[];
  vocabulary: string[];
  sourceEvidence: Array<{
    id: string;
    text: string;
    section: string;
    concepts: string[];
  }>;
  version: number;
  generatedAt: Date;
  contentHash: string;
}

export interface AssessmentQuestion {
  questionId: string;
  lessonId: string;
  lessonVersion: number;
  conceptIdsTested: string[];
  learningObjectiveIds: string[];
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  rationale: string;
  specialization: string;
  generatedAt: Date;
  contentHash: string;
}

export interface StudentMastery {
  studentId: string;
  lessonId: string;
  conceptId: string;
  correctCount: number;
  incorrectCount: number;
  lastAttemptAt: Date;
  mastered: boolean;
  masteredAt?: Date;
}

// ─── Build LessonContext from generated artifacts ────────────────────────────

/**
 * Build a canonical LessonContext from the generated lecture artifacts.
 * This is called ONCE after generation completes.
 */
export async function buildLessonContext(
  projectId: string,
  slideArtifacts: Array<{
    slideNo: number;
    contentJson: any;
  }>
): Promise<LessonContext> {
  // Load project metadata
  const project = await db.lectureProject.findUnique({
    where: { id: projectId },
    include: { courseProfile: true, sourceBlocks: true },
  });

  if (!project) throw new Error(`Project not found: ${projectId}`);

  const courseProfile = project.courseProfile;
  const clos = (courseProfile.teacherEnteredClos as any[]) || [];

  // Extract taught concepts from slide artifacts
  const taughtConcepts: TaughtConcept[] = [];
  const allEvidenceIds: string[] = [];

  for (const artifact of slideArtifacts) {
    const content = artifact.contentJson;
    if (!content) continue;

    // Extract concept from slide title + bullets
    const conceptName = content.title || "";
    const definition = content.body?.visibleCopy || "";
    const examples = (content.body?.bullets || []).slice(0, 3);

    // Extract student experience concepts
    const se = content.studentExperience;
    const misconceptions = (se?.commonPitfalls || []).map((p: any) => p.misconception || "");
    const applications = se?.realWorld?.application ? [se.realWorld.application] : [];

    // Extract source evidence IDs
    const evidenceIds = content.sourceCoverage?.mappedBlockIds || [];
    allEvidenceIds.push(...evidenceIds);

    if (conceptName) {
      taughtConcepts.push({
        id: `concept-${projectId}-s${artifact.slideNo}`,
        name: conceptName,
        definition,
        importance: artifact.slideNo <= 7 ? "critical" : artifact.slideNo <= 14 ? "major" : "supporting",
        sourceEvidenceIds: evidenceIds,
        misconceptions: misconceptions.filter(Boolean),
        examples: examples.filter(Boolean),
        relationships: [],
        slideNo: artifact.slideNo,
      });
    }
  }

  // Load source blocks for evidence
  const sourceBlocks = await db.lectureSourceBlock.findMany({
    where: { projectId },
    select: { id: true, text: true, locator: true },
  });

  const sourceEvidence = sourceBlocks
    .filter((b: { id: string; text: string; locator: string | null }) => allEvidenceIds.includes(b.id))
    .map((b: { id: string; text: string; locator: string | null }) => ({
      id: b.id,
      text: b.text.slice(0, 500),
      section: b.locator || "",
      concepts: [] as string[],
    }));

  // Build content hash for staleness detection
  const contentHash = generateContentHash(taughtConcepts);

  return {
    lessonId: projectId,
    projectId,
    title: courseProfile.title || "Lecture",
    subject: courseProfile.specialty || "",
    studentSpecialization: "",
    studentLevel: "intermediate",
    learningObjectives: clos.map((c: any) => c.text || ""),
    prerequisiteKnowledge: [],
    concepts: taughtConcepts,
    taughtConceptIds: taughtConcepts.map((c) => c.id),
    practicalApplications: taughtConcepts.flatMap((c) => c.examples),
    vocabulary: [],
    sourceEvidence,
    version: 1,
    generatedAt: new Date(),
    contentHash,
  };
}

// ─── Assessment Validation Gate ──────────────────────────────────────────────

/**
 * Validate that an assessment question tests a TAUGHT concept.
 * This is the CRITICAL constraint:
 *   question.conceptIdsTested ⊆ lesson.taughtConceptIds
 *
 * If this fails, the question is REJECTED.
 */
export function validateQuestionAlignment(
  question: AssessmentQuestion,
  lesson: LessonContext
): { valid: boolean; reason?: string } {
  // 1. Check concept alignment
  const taughtSet = new Set(lesson.taughtConceptIds);
  const untaughtConcepts = question.conceptIdsTested.filter((id) => !taughtSet.has(id));

  if (untaughtConcepts.length > 0) {
    return {
      valid: false,
      reason: `Question tests untaught concepts: ${untaughtConcepts.join(", ")}`,
    };
  }

  // 2. Check specialization alignment
  if (lesson.studentSpecialization && question.specialization !== lesson.studentSpecialization) {
    return {
      valid: false,
      reason: `Question specialization mismatch: ${question.specialization} vs ${lesson.studentSpecialization}`,
    };
  }

  // 3. Check lesson version (stale content detection)
  if (question.lessonVersion !== lesson.version) {
    return {
      valid: false,
      reason: `Question is from version ${question.lessonVersion}, lesson is version ${lesson.version}`,
    };
  }

  // 4. Check content hash (stale content detection)
  if (question.contentHash !== lesson.contentHash) {
    return {
      valid: false,
      reason: "Question content hash mismatch — lesson content has changed",
    };
  }

  // 5. Check question quality
  if (!question.question || question.question.length < 20) {
    return { valid: false, reason: "Question too short" };
  }

  if (!question.correctAnswer) {
    return { valid: false, reason: "No correct answer" };
  }

  if (question.options.length < 2) {
    return { valid: false, reason: "Need at least 2 options" };
  }

  // 6. Check exactly one correct answer
  const correctCount = question.options.filter(
    (opt) => opt === question.correctAnswer
  ).length;
  if (correctCount !== 1) {
    return { valid: false, reason: `Expected 1 correct answer, found ${correctCount}` };
  }

  return { valid: true };
}

// ─── Staleness Detection ────────────────────────────────────────────────────

/**
 * Detect if a question is stale (from an old lesson version or content hash).
 */
export function isQuestionStale(
  question: AssessmentQuestion,
  currentLesson: LessonContext
): boolean {
  return (
    question.lessonVersion !== currentLesson.version ||
    question.contentHash !== currentLesson.contentHash ||
    question.lessonId !== currentLesson.lessonId
  );
}

// ─── Mastery Tracking ───────────────────────────────────────────────────────

/**
 * Record a student's answer and update mastery.
 * If correct 3+ times in a row, mark as mastered.
 */
export async function recordAnswer(
  studentId: string,
  lessonId: string,
  conceptId: string,
  correct: boolean
): Promise<StudentMastery> {
  const existing = await db.studentMastery.findFirst({
    where: { studentId, lessonId, conceptId },
  });

  if (existing) {
    const newCorrect = correct ? existing.correctCount + 1 : 0;
    const newIncorrect = correct ? existing.incorrectCount : existing.incorrectCount + 1;
    const mastered = newCorrect >= 3;

    await db.studentMastery.update({
      where: { id: existing.id },
      data: {
        correctCount: newCorrect,
        incorrectCount: newIncorrect,
        mastered,
        masteredAt: mastered && !existing.masteredAt ? new Date() : existing.masteredAt,
        lastAttemptAt: new Date(),
      },
    });

    return {
      studentId,
      lessonId,
      conceptId,
      correctCount: newCorrect,
      incorrectCount: newIncorrect,
      lastAttemptAt: new Date(),
      mastered,
    };
  }

  // Create new mastery record
  const created = await db.studentMastery.create({
    data: {
      studentId,
      lessonId,
      conceptId,
      correctCount: correct ? 1 : 0,
      incorrectCount: correct ? 0 : 1,
      mastered: false,
      lastAttemptAt: new Date(),
    },
  });

  return {
    studentId,
    lessonId,
    conceptId,
    correctCount: created.correctCount,
    incorrectCount: created.incorrectCount,
    lastAttemptAt: created.lastAttemptAt,
    mastered: false,
  };
}

/**
 * Get mastered concepts for a student in a lesson.
 * Skip these when generating new questions.
 */
export async function getMasteredConcepts(
  studentId: string,
  lessonId: string
): Promise<string[]> {
  const mastered = await db.studentMastery.findMany({
    where: { studentId, lessonId, mastered: true },
    select: { conceptId: true },
  });
  return mastered.map((m: { conceptId: string }) => m.conceptId);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateContentHash(concepts: TaughtConcept[]): string {
  const content = concepts
    .map((c) => `${c.name}:${c.definition}`)
    .join("|");
  // Simple hash — in production use crypto.createHash
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ─── Get cached LessonContext ────────────────────────────────────────────────

export async function getLessonContext(projectId: string): Promise<LessonContext | null> {
  const project = await db.lectureProject.findUnique({
    where: { id: projectId },
    select: { generationStateJson: true },
  });

  const state = (project?.generationStateJson as { lessonContext?: LessonContext } | null)
    ?.lessonContext;
  return state || null;
}

export async function saveLessonContext(
  projectId: string,
  context: LessonContext
): Promise<void> {
  const project = await db.lectureProject.findUnique({
    where: { id: projectId },
    select: { generationStateJson: true },
  });

  const state = (project?.generationStateJson as Record<string, unknown>) || {};

  await db.lectureProject.update({
    where: { id: projectId },
    data: {
      generationStateJson: {
        ...state,
        lessonContext: context,
      },
    },
  });
}
