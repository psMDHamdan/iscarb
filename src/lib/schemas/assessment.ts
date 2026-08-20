import { z } from "zod";

// Assessment filter schema
export const assessmentFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["all", "draft", "published", "archived"]).default("all"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  type: z.enum(["quiz", "assignment", "exam", "practice"]).optional(),
  framework: z.enum(["ISCED", "NASEM", "Custom"]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["date", "score", "title", "dueDate"]).default("date"),
});

export type AssessmentFilter = z.infer<typeof assessmentFilterSchema>;

// Assessment submission filter schema
export const submissionFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(["all", "draft", "submitted", "scored", "reviewed"]).default("all"),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(["date", "score", "title"]).default("date"),
});

export type SubmissionFilter = z.infer<typeof submissionFilterSchema>;

// Assessment query schema
export const assessmentQuerySchema = z.object({
  assessmentId: z.string().cuid().min(1),
});

export type AssessmentQuery = z.infer<typeof assessmentQuerySchema>;

// AI analysis request schema
export const aiAnalysisRequestSchema = z.object({
  assessmentId: z.string().cuid().optional(),
  submissionId: z.string().cuid().optional(),
  analysisType: z.enum(["performance", "strengths", "improvements", "career-fit"]).default("performance"),
  context: z.record(z.any()).optional(),
});

export type AiAnalysisRequest = z.infer<typeof aiAnalysisRequestSchema>;

// Validation functions
export function validateAssessmentFilter(data: unknown) {
  const result = assessmentFilterSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid filter: ${result.error.message}`);
  }
  return result.data;
}

export function validateSubmissionFilter(data: unknown) {
  const result = submissionFilterSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid filter: ${result.error.message}`);
  }
  return result.data;
}

export function validateAssessmentQuery(data: unknown) {
  const result = assessmentQuerySchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid query: ${result.error.message}`);
  }
  return result.data;
}

export function validateAiAnalysisRequest(data: unknown) {
  const result = aiAnalysisRequestSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid request: ${result.error.message}`);
  }
  return result.data;
}
