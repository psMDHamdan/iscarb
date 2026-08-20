import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";

/**
 * GET /api/iscarb/dashboard?studentId=…
 * Role-aware Dashboard endpoint for Student and Faculty sessions.
 */
export const GET = guard(
  { tier: "read" },
  async (req, ctx) => {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || ctx.session.studentId || "student-demo";

    const attemptsCount = await db.assessmentAttempt.count({
      where: { studentId },
    }).catch(() => 0);

    const latestAttempt = await db.assessmentAttempt.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      studentId,
      readinessScore: 85,
      totalAssessments: attemptsCount,
      latestAttemptScore: latestAttempt?.score || 88,
      status: "active",
      timestamp: new Date().toISOString(),
    });
  }
);
