import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { parseJSON } from "@/lib/api-helpers";
import { educationLevelCodeOrNull } from "@/lib/student-education-level";

async function resolveUniversityId(
  studentUniversityId: string | null | undefined,
  sessionUniversityId: string | null | undefined,
): Promise<string> {
  if (studentUniversityId) return studentUniversityId;
  if (sessionUniversityId) return sessionUniversityId;
  const uni = await db.university.findFirst({ select: { id: true } });
  if (uni) return uni.id;
  throw new Error("No university is configured");
}

export const POST = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (req, ctx) => {
    const body = await parseJSON<any>(req);
    if (!body || !body.studentId) {
      return apiError("Missing attempt data or studentId", 400);
    }

    try {
      let student = await db.student.findFirst({
        where: { id: body.studentId },
      });

      if (!student && ctx.session.userId) {
        student = await db.student.findFirst({ where: { userId: ctx.session.userId } });
      }

      if (!student && ctx.session.userId) {
        const user = await db.user.findUnique({
          where: { id: ctx.session.userId },
          select: { email: true, name: true },
        });
        const email = user?.email || ctx.session.email;
        if (email) {
          try {
            student = await db.student.create({
              data: {
                userId: ctx.session.userId,
                email,
                name: user?.name || email.split("@")[0],
                college: "Undeclared",
                program: "General Studies",
                cohort: new Date().getFullYear().toString(),
                educationLevelCode: await educationLevelCodeOrNull(),
              },
            });
          } catch {
            student = await db.student.findFirst({ where: { email } });
          }
        }
      }

      if (!student) {
        return apiError("Student not found", 404);
      }

      const universityId = await resolveUniversityId(
        student.universityId,
        ctx.session.universityId,
      );
      const createdBy = ctx.session.userId || student.userId || "system";

      let assessment = await db.assessment.findFirst({
        where: { title: { contains: "Employability" } },
      });

      if (!assessment) {
        assessment = await db.assessment.create({
          data: {
            title: "Core Employability Assessment",
            timeLimit: 60,
            status: "PUBLISHED",
            universityId,
            createdBy,
          },
        });
      }

      const score = Math.round(body.profile?.composite ?? 0);
      const submittedAt = body.computedAt ? new Date(body.computedAt) : new Date();
      const submissionId =
        typeof body.id === "string" && body.id.trim() ? body.id.trim() : randomUUID();

      const submission = await db.assessmentSubmission.upsert({
        where: { id: submissionId },
        create: {
          id: submissionId,
          assessmentId: assessment.id,
          studentId: student.id,
          universityId,
          status: "FINAL",
          totalScore: score,
          percentageScore: score,
          submittedAt,
          scoredAt: submittedAt,
          submissionToken: randomUUID(),
        },
        update: {
          status: "FINAL",
          totalScore: score,
          percentageScore: score,
          submittedAt,
          scoredAt: submittedAt,
        },
      });

      return NextResponse.json({ success: true, submissionId: submission.id });
    } catch (err: unknown) {
      // Log full error server-side; never expose ORM details to the browser.
      const traceId = randomUUID().slice(0, 8);
      console.error(`[save-attempt][${traceId}] Failed to save attempt:`, err);
      return apiError(`Failed to save attempt. Reference: ${traceId}`, 500);
    }
  }
);
