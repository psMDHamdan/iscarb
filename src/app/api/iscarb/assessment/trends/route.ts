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

  const rows = await db.assessmentSnapshot.findMany({
    where: { studentId: resolved.studentId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    data: rows.map(r => {
      let parsed = null;
      try {
        parsed = JSON.parse(r.dataJson);
      } catch {
        // ignore
      }
      return {
        id: r.id,
        createdAt: r.createdAt,
        composite: parsed?.composite ?? 0,
        band: parsed?.band ?? "weak",
        dimensions: parsed?.dimensions ?? [],
      };
    }),
  });
});
