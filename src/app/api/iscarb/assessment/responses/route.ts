import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, tenantWhere } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { resolveStudentIdFromSession } from "@/lib/assessment/resolve-student";

export const GET = guard({ tier: "read", roles: ["student", "faculty", "admin"] }, async (req, ctx) => {
  const url = new URL(req.url);
  const resolved = await resolveStudentIdFromSession(ctx.session, url.searchParams.get("studentId") ?? undefined);
  if (!resolved.ok) return apiError(resolved.message, resolved.status);

  const student = await db.student.findFirst({
    where: { id: resolved.studentId, ...tenantWhere(ctx) },
    select: { id: true },
  });
  if (!student) return apiError("Student not found", 404);

  const rows = await db.assessmentResponse.findMany({
    where: { studentId: resolved.studentId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    data: rows.map(r => ({
      id: r.id,
      moduleCode: r.moduleCode,
      dimension: r.dimension,
      specialization: r.specialization,
      score: r.score,
      band: r.band,
      passed: r.passed,
      feedback: r.feedback,
      strengths: r.strengthsJson,
      improvements: r.improvementsJson,
      perCriterionJson: r.perCriterionJson,
      source: r.source,
      model: r.model,
      latencyMs: r.latencyMs,
      createdAt: r.createdAt,
      rawResponse: r.rawResponse,
    })),
  });
});
