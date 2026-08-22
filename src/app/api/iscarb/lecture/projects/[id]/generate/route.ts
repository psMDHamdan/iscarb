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
import { checkSourceReadiness } from "@/lib/lecture/generation/source-readiness";
import { redis } from "@/config/redis";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";

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

    const scoped = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!scoped) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const project = await db.lectureProject.findFirst({
      where: { id: scoped.id },
      include: { courseProfile: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    // Legacy Pre-check removed: We no longer require 20 LectureSlidePlans.
    // The new LearningExperience engine (17-pass) generates 7 concept blocks dynamically.

    // Pre-check 2 — CLOs approved.
    if (!project.courseProfile.cloApprovedAt) {
      return NextResponse.json({ error: "CLO_APPROVAL_REQUIRED", message: "Approve the lecture CLOs before generating content." }, { status: 400 });
    }

    // Pre-check 3 — alignment mode determined.
    if (BLOCKED_MODES.has(project.nationalAlignmentMode)) {
      return NextResponse.json({ error: "ALIGNMENT_UNDETERMINED", message: `Alignment mode '${project.nationalAlignmentMode}' blocks generation until resolved.` }, { status: 400 });
    }

    // Pre-check 4 — source material hard stop (spec §12/§38). Generation is
    // source-grounded; never run the LLM without parseable source content.
    const source = await checkSourceReadiness(id);
    if (source.code !== "SOURCE_READY") {
      return NextResponse.json(
        {
          error: source.code,
          message: source.message,
          documentCount: source.documentCount,
          blockCount: source.blockCount,
        },
        { status: 400 }
      );
    }

    const requested = parsed.data.slideNos ?? [];
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

    // Queue the generation (fire-and-forget in-process).
    const { enqueueGeneration } = await import("@/lib/lecture/queue");
    enqueueGeneration(id, requested);

    return NextResponse.json(
      { jobId: id, slidesQueued: requested.length },
      { status: 202 }
    );
  }
);
