import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, tenantWhere } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { resolveStudentIdFromSession } from "@/lib/assessment/resolve-student";

const MODULE_TITLES: Record<string, string> = {
  M01: "Strategic Communication",
  M02: "Critical Thinking & Problem-Solving",
  M03: "Teamwork & Conflict Resolution",
  M04: "Adaptability & Resilience",
  M08: "Ethical Context Integration",
  M11: "Interview Mastery",
  M16: "Project Management Fundamentals",
  M18: "AI in the Workplace",
  M19: "Cybersecurity Awareness",
  M30: "SQL & Statistics",
  M37: "Programming Logic (JavaScript)",
  M38: "Software Quality (Code Review)",
  M41: "Career Adaptability",
  M46: "Career Plan & Motivation",
  M47: "Intercultural Awareness",
};

function moduleTitle(code: string): string {
  const base = MODULE_TITLES[code];
  if (base) return `${base} (${code})`;
  return code;
}

export const GET = guard({ tier: "read", roles: ["student", "faculty", "admin"] }, async (req, ctx) => {
  const url = new URL(req.url);
  const resolved = await resolveStudentIdFromSession(ctx.session, url.searchParams.get("studentId") ?? undefined);
  if (!resolved.ok) return apiError(resolved.message, resolved.status);

  const student = await db.student.findFirst({
    where: { id: resolved.studentId, ...tenantWhere(ctx) },
    select: { id: true },
  });
  if (!student) return apiError("Student not found", 404);

  const [responses, profile] = await Promise.all([
    db.assessmentResponse.findMany({
      where: { studentId: resolved.studentId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.employabilityProfile.findUnique({ where: { studentId: resolved.studentId } }),
  ]);

  const latestByModule = new Map<string, typeof responses[0]>();
  for (const r of responses) {
    if (!latestByModule.has(r.moduleCode)) latestByModule.set(r.moduleCode, r);
  }
  const latest = Array.from(latestByModule.values());

  const totalCompleted = latest.length;
  const passed = latest.filter(r => r.passed).length;
  const avgScore = totalCompleted > 0 ? Math.round(latest.reduce((s, r) => s + r.score, 0) / totalCompleted) : 0;

  const dimScores: Record<string, number[]> = {};
  for (const r of latest) {
    if (!dimScores[r.dimension]) dimScores[r.dimension] = [];
    dimScores[r.dimension].push(r.score);
  }
  const radarData = Object.entries(dimScores).map(([dim, scores]) => ({
    dimension: dim,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  const recent = responses.slice(0, 5).map(r => ({
    id: r.id,
    moduleCode: r.moduleCode,
    title: moduleTitle(r.moduleCode),
    dimension: r.dimension,
    score: r.score,
    band: r.band,
    passed: r.passed,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({
    data: {
      stats: {
        totalCompleted,
        passed,
        failed: totalCompleted - passed,
        avgScore,
        composite: profile?.composite ?? 0,
        band: profile?.band ?? null,
        profilePassed: profile?.passed ?? false,
      },
      radarData,
      recent,
      computedAt: new Date().toISOString(),
    },
  });
});
