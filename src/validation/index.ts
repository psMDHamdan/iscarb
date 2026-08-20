/**
 * iSCARB Input Validation — Zod schemas for API inputs
 * ===========================================================================
 * Masterplan Section 14.2.5: Input validation testing.
 * All API inputs validated with Zod for type safety and security.
 * ===========================================================================
 */
import { z } from "zod";

// ─── Assessment Schemas ────────────────────────────────────────────────────

export const assessmentSubmissionSchema = z.object({
  assessmentId: z.string().uuid(),
  studentId: z.string().uuid(),
  submissionToken: z.string().uuid(),
  responses: z.array(
    z.object({
      questionId: z.string().uuid(),
      questionIndex: z.number().int().min(0),
      sequenceNumber: z.number().int().min(0),
      answer: z.string().max(1_000_000), // 1MB max per masterplan
      answerType: z.enum(["text", "file", "code"]),
    })
  ),
});

export const assessmentCreateSchema = z.object({
  title: z.string().min(1).max(500),
  titleAr: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  courseId: z.string().uuid(),
  timeLimitMinutes: z.number().int().min(1).max(480).optional(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
  passingScore: z.number().min(0).max(100).optional(),
});

// ─── User Schemas ──────────────────────────────────────────────────────────

export const userCreateSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(255),
  role: z.enum(["student", "faculty", "dean", "admin", "recruiter"]),
  universityId: z.string().uuid().optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(["student", "faculty", "dean", "admin", "recruiter"]).optional(),
  universityId: z.string().uuid().optional(),
});

// ─── Auth Schemas ──────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
  universityCode: z.string().min(2).max(10),
});

// ─── Portfolio Schemas ─────────────────────────────────────────────────────

export const portfolioUpdateSchema = z.object({
  visibility: z.enum(["public", "private", "draft"]).optional(),
  bio: z.string().max(2000).optional(),
  skillsJson: z.string().optional(), // JSON array
});

// ─── Report Schemas ────────────────────────────────────────────────────────

export const reportRequestSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["dashboard", "custom", "scheduled", "adhoc"]),
  category: z.enum(["academics", "recruitment", "analytics", "compliance", "performance"]),
  filters: z.string().optional(), // JSON
  metrics: z.string().optional(), // JSON array
  outputFormat: z.enum(["json", "csv", "pdf", "xlsx"]).optional(),
});

// ─── Consent Schemas ───────────────────────────────────────────────────────

export const consentUpdateSchema = z.object({
  discoverable: z.boolean(),
  purpose: z.string().min(1).max(500),
  scope: z.enum(["full", "limited", "none"]),
});

// ─── Generic Validation Helper ─────────────────────────────────────────────

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: string[];
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
  };
}
