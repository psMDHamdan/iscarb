import { guard } from "@/lib/api-guard";
import { apiError, apiSuccess } from "@/lib/iscarb-api";
import { db } from "@/lib/db";
import { canonicalSpecializationLabel } from "@/lib/assessment";
import { assertStudentAccess } from "@/lib/assessment/ownership";
import { enqueueSignupJobFitGeneration } from "@/lib/assessment/jobfit-signup-enqueue";
import { enqueueSignupExamGeneration } from "@/lib/assessment/attempt-exam-generator";

/**
 * POST /api/iscarb/assessment/specialty
 * Edge-case: set Student.program when missing so the exam can start.
 * Phase 5: also enqueue signup-time Job-Fit bank generation for uncurated majors.
 */
export const POST = guard({ tier: "write", roles: ["student"] }, async (req, ctx) => {
  const studentId = ctx.session.studentId;
  if (!studentId) return apiError("Student session required", 401);

  const access = assertStudentAccess(ctx.session, studentId);
  if (!access.ok) return apiError(access.message, access.status);

  let body: { specialty?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  const specialty = canonicalSpecializationLabel(body.specialty);
  if (!specialty) return apiError("Specialty is required", 400);

  const student = await db.student.findFirst({
    where: { id: studentId },
    select: { id: true },
  });
  if (!student) return apiError("Student not found", 404);

  const updated = await db.student.update({
    where: { id: student.id },
    data: { program: specialty },
    select: { id: true, program: true },
  });

  enqueueSignupJobFitGeneration(specialty);
  // Await so the QStash job is durably queued before the response returns.
  await enqueueSignupExamGeneration(student.id, specialty);

  return apiSuccess({ specialty: updated.program });
});
