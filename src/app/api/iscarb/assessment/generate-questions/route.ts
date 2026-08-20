// app/api/iscarb/assessment/generate-questions/route.ts
// AI Question Generation Endpoint — Faculty only

import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import { aiQuestionGeneration } from "@/lib/assessment/ai-question-generation.service";

/**
 * POST /api/iscarb/assessment/generate-questions
 * Body: { courseId, courseName, courseCode, specialization, clos, assessmentType,
 *         questionCount, difficulty, questionTypes, language, contentChunks }
 *
 * Faculty-only. Generates AI-powered assessment questions aligned to CLOs.
 */
export const POST = guard({ tier: "ai", roles: ["faculty", "admin"] }, async (req, ctx) => {
  const body = await parseJSON(req);
  if (!body) return jsonErrorResponse("Invalid request body");

  const {
    courseId,
    courseName,
    courseCode,
    specialization,
    clos,
    assessmentType,
    questionCount,
    difficulty,
    questionTypes,
    language,
    contentChunks,
  } = body as Record<string, unknown>;

  // Validation
  if (!courseId || !clos || !assessmentType || !questionTypes) {
    return NextResponse.json(
      { error: "Missing required fields: courseId, clos, assessmentType, questionTypes" },
      { status: 400 }
    );
  }

  // Generate questions
  const result = await aiQuestionGeneration.generateAssessment({
    courseId: courseId as string,
    courseName: (courseName as string) || (courseId as string),
    courseCode: (courseCode as string) || (courseId as string),
    specialization: (specialization as string) || "General",
    clos: clos as Parameters<typeof aiQuestionGeneration.generateAssessment>[0]["clos"],
    assessmentType: assessmentType as Parameters<typeof aiQuestionGeneration.generateAssessment>[0]["assessmentType"],
    questionCount: (questionCount as number) || 10,
    difficulty: (difficulty as "easy" | "medium" | "hard") || "medium",
    questionTypes: questionTypes as Parameters<typeof aiQuestionGeneration.generateAssessment>[0]["questionTypes"],
    language: (language as "en" | "ar") || "en",
    contentChunks: (contentChunks as Parameters<typeof aiQuestionGeneration.generateAssessment>[0]["contentChunks"]) || [],
    facultyId: ctx.session.userId,
  });

  // Persist the generated questions for faculty review
  await aiQuestionGeneration.persistQuestions(
    result.questions,
    courseId as string,
    ctx.session.userId,
    assessmentType as Parameters<typeof aiQuestionGeneration.generateAssessment>[0]["assessmentType"],
  );

  return NextResponse.json({
    success: true,
    data: result,
  });
});
