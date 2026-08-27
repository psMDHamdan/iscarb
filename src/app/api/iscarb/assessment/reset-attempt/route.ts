import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { clearLiveExamCache } from "@/lib/assessment/live-exam-generation";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("assessment-reset-attempt");

/**
 * POST /api/iscarb/assessment/reset-attempt
 *
 * Deletes all in_progress assessment attempts for the requesting student,
 * clears the in-memory live exam cache, and forces fresh AI question
 * generation on the next /modules request.
 *
 * Query params:
 *   ?specialization=<string>  — optional: reset only attempts for this specialty
 *   ?all=true                 — admin/faculty: reset ALL students' in_progress attempts
 *
 * Auth: student (own attempts) or admin/faculty (?all=true).
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ctx = await guard(req, ["student", "faculty", "admin", "dean"]);
  if (!ctx.ok) return ctx.error;

  const url = new URL(req.url);
  const specialization = url.searchParams.get("specialization")?.trim() || undefined;
  const resetAll = url.searchParams.get("all") === "true";

  try {
    if (resetAll && ["admin", "dean", "faculty"].includes(ctx.session.role)) {
      // Admin/faculty: clear ALL in_progress attempts (e.g. after a deployment)
      const where: Record<string, unknown> = { status: "in_progress" };
      if (specialization) where.specialization = specialization;

      const result = await db.assessmentAttempt.deleteMany({ where });
      clearLiveExamCache();
      log.info({ role: ctx.session.role, deleted: result.count, specialization }, "admin bulk reset");
      return NextResponse.json({
        ok: true,
        deleted: result.count,
        message: `Deleted ${result.count} in-progress attempt(s). Fresh AI generation will start on next page load.`,
      });
    }

    // Student: only reset their own attempts
    const studentId = ctx.session.studentId;
    if (!studentId) {
      return NextResponse.json({ error: "No student profile found" }, { status: 400 });
    }

    const where: Record<string, unknown> = { studentId, status: "in_progress" };
    if (specialization) where.specialization = specialization;

    const result = await db.assessmentAttempt.deleteMany({ where });
    clearLiveExamCache();
    log.info({ studentId, deleted: result.count, specialization }, "student attempt reset");
    return NextResponse.json({
      ok: true,
      deleted: result.count,
      message: `Deleted ${result.count} attempt(s). Fresh AI questions will generate on next page load.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ error: msg }, "reset-attempt failed");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
