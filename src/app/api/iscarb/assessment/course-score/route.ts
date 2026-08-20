import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import { courseScoring } from "@/lib/assessment/course-scoring.service";

/**
 * POST /api/iscarb/assessment/course-score
 * Body: {
 *   assessmentId: string,     // the assessment being scored
 *   courseId: string,          // which course this is for
 *   courseName: string,       // course display name
 *   assessmentType: string,   // quiz | exam | assignment | coding | viva
 *   studentResponse: string,  // the student's answer text
 *   questionContext: string,   // the question/task that was asked
 *   rubric: CourseRubricCriterion[],
 *   clos: { id, text, bloomLevel }[],
 *   passThreshold?: number,
 * }
 *
 * Scores a student's course-based assessment response using AI,
 * updates CLO mastery, and persists the result.
 */
export const POST = guard({ tier: "ai", roles: ["student", "faculty", "admin"] }, async (req, ctx) => {
  const body = await parseJSON(req);
  if (!body) return jsonErrorResponse("Invalid request body");

  const {
    assessmentId,
    courseId,
    courseName,
    assessmentType,
    studentResponse,
    questionContext,
    rubric,
    clos,
    passThreshold,
  } = body as Record<string, unknown>;

  // Validation
  if (!assessmentId || !courseId || !studentResponse || !questionContext) {
    return NextResponse.json(
      { error: "Missing required fields: assessmentId, courseId, studentResponse, questionContext" },
      { status: 400 }
    );
  }

  const studentId = ctx.session.studentId || ctx.session.userId;

  // Score the response
  const scored = await courseScoring.scoreResponse(
    {
      assessmentId: assessmentId as string,
      courseId: courseId as string,
      courseName: (courseName as string) || "Unknown Course",
      assessmentType: (assessmentType as "quiz" | "exam" | "assignment" | "coding" | "viva") || "assignment",
      rubric: (rubric as Parameters<typeof courseScoring.scoreResponse>[0]["rubric"]) || [],
      clos: (clos as Parameters<typeof courseScoring.scoreResponse>[0]["clos"]) || [],
      passThreshold: (passThreshold as number) || 60,
    },
    studentResponse as string,
    questionContext as string,
    studentId,
  );

  // Update CLO mastery in database
  if (scored.cloMastery.length > 0) {
    await courseScoring.updateCLOMastery(studentId, courseId as string, scored.cloMastery);
  }

  // Persist the scored response
  await db.assessmentResponse.create({
    data: {
      studentId,
      moduleCode: assessmentId as string,
      dimension: "course_assessment",
      specialization: (courseName as string) || "course",
      rawResponse: studentResponse as string,
      score: scored.score,
      band: scored.band,
      passed: scored.passed,
      perCriterion: scored.perCriterion as unknown as Record<string, unknown>,
      feedback: scored.feedback,
      strengths: scored.strengths,
      improvements: scored.improvements,
      model: scored.model || "openai/gpt-oss-20b",
      source: scored.source,
      latencyMs: scored.latencyMs,
    },
  });

  return NextResponse.json({
    success: true,
    data: scored,
  });
});
