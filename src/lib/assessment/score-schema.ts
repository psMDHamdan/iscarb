import { z } from "zod";

export const MIN_RESPONSE_LENGTH = 10;
export const MAX_RESPONSE_LENGTH = 50_000;
export const MAX_PROMPT_LENGTH = 10_000;

/**
 * Candidate may send identity + selectedIndex and/or the selected option text.
 * Scoring-relevant fields (moduleDef, rubric, scenario, choices, etc.) are
 * stripped — anything extra in the JSON is ignored.
 */
export const scoreRequestSchema = z.object({
  specialization: z.string().trim().min(1, "specialization is required"),
  moduleCode: z.string().trim().min(1, "moduleCode is required"),
  response: z.string().max(MAX_RESPONSE_LENGTH).optional().default(""),
  selectedIndex: z.number().int().min(0).max(3).optional(),
  studentId: z.string().trim().min(1).optional(),
  attemptId: z.string().trim().min(1).optional(),
  validate: z.boolean().optional(),
  prompt: z.string().max(MAX_PROMPT_LENGTH).optional(),
  courseId: z.string().trim().min(1).optional(),
  unitId: z.string().trim().min(1).optional(),
});

export type ScoreRequestBody = z.infer<typeof scoreRequestSchema>;

/** Fields that must never influence scoring if a client still sends them. */
export const CLIENT_SCORING_INFLUENCE_KEYS = [
  "moduleDef",
  "rubric",
  "fewShot",
  "few_shot",
  "scenario",
  "instructions",
  "choices",
  "questionType",
  "passThreshold",
  "correctAnswer",
  "correct_answer",
  "isCorrect",
  "anchors",
] as const;
