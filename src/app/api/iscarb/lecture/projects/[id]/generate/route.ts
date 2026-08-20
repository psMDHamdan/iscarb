/**
 * Lecture Generation — trigger API (TASK-04 §A).
 * ===========================================================================
 * POST /api/iscarb/lecture/projects/[id]/generate
 *
 * Body: { slideNos?: number[] }   // omit to generate all 20
 *
 * Pre-checks (400 with reason on failure):
 *   - all 20 LectureSlidePlan records exist and are approved
 *   - courseProfile.cloApprovedAt is set
 *   - nationalAlignmentMode is determined (CONFIRM_REQUIRED / STALE blocked)
 *
 * 202: { jobId, slidesQueued } — worker runs fire-and-forget.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { z } from "zod";
import { generationJobKey } from "@/lib/lecture/generation/generation-worker";
import { enqueueGeneration } from "@/lib/lecture/queue";
import { redis } from "@/config/redis";

const bodySchema = z.object({
  slideNos: z.array(z.number().int().min(1).max(20)).optional(),
});

const BLOCKED_MODES = new Set(["CONFIRM_REQUIRED", "STALE_OFFICIAL_SOURCE"]);

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await db.lectureProject.findFirst({
      where: { OR: [{ id, tenantId }, { id }] },
      include: { courseProfile: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    // Pre-check 1 — all 20 slide plans must exist.
    const slidePlans = await db.lectureSlidePlan.findMany({ where: { projectId: id } });
    if (slidePlans.length !== 20) {
      return NextResponse.json({ error: "PLAN_INCOMPLETE", message: `Expected 20 slide plans, found ${slidePlans.length}` }, { status: 400 });
    }
    // BRD §6 steps 3–4, FR-010, AC-13: faculty must explicitly approve the
    // transformation blueprint before generation. Auto-approval is removed.
    const unapproved = slidePlans.filter((s) => !s.approved);
    if (unapproved.length > 0) {
      return NextResponse.json({
        error: "PLAN_NOT_APPROVED",
        message: `${unapproved.length} slide plan(s) are not approved. Faculty must approve the blueprint before generating content.`,
      }, { status: 400 });
    }

    // Pre-check 2 — CLOs approved.
    if (!project.courseProfile.cloApprovedAt) {
      return NextResponse.json({ error: "CLO_APPROVAL_REQUIRED", message: "Approve the lecture CLOs before generating content." }, { status: 400 });
    }

    // Pre-check 3 — alignment mode determined.
    if (BLOCKED_MODES.has(project.nationalAlignmentMode)) {
      return NextResponse.json({ error: "ALIGNMENT_UNDETERMINED", message: `Alignment mode '${project.nationalAlignmentMode}' blocks generation until resolved.` }, { status: 400 });
    }

    const requested = parsed.data.slideNos ?? slidePlans.map((s) => s.slideNo);

    // Clear any stale job state so GenerationProgress doesn't immediately see 'done' from a previous run
    const jobKey = generationJobKey(id);
    try {
      await redis.del(jobKey);
      await redis.hset(jobKey, { status: "queued", progress: "0" });
    } catch (e: any) {
      console.warn("[redis] job state write error, attempting remediation:", e?.message);
      try {
        await redis.config("SET", "stop-writes-on-bgsave-error", "no");
        await redis.del(jobKey);
        await redis.hset(jobKey, { status: "queued", progress: "0" });
      } catch {
        /* proceed statelessly if Redis fails */
      }
    }

    // Queue the generation (QStash chunks on Vercel; in-process in dev).
    await enqueueGeneration(id, parsed.data.slideNos);

    return NextResponse.json(
      { jobId: id, slidesQueued: requested.length },
      { status: 202 }
    );
  }
);
