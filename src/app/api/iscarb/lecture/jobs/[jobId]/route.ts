/**
 * Lecture Planning — parse job status.
 * ===========================================================================
 * GET /api/iscarb/lecture/jobs/[jobId]
 *
 * Returns live parse progress published to Redis by the parse worker.
 * 404 when the job (or its source document) no longer exists.
 */
import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { safeHgetall } from "@/config/redis";
import { jobKey } from "@/lib/lecture/ingestion/parse-worker";

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: any,
    { params }: { params: Promise<{ jobId: string }> }
  ) => {
    const { jobId } = await params;
    const tenantId = ctx.session.universityId || "default";

    const generateRaw = await safeHgetall(`lecture:generate:${jobId}`);
    if (generateRaw && Object.keys(generateRaw).length > 0) {
      return NextResponse.json({
        jobId,
        projectId: jobId,
        progress: {
          status: generateRaw.status ?? "generating",
          progress: generateRaw.progress ? parseInt(generateRaw.progress, 10) : 0,
          error: generateRaw.error || null,
        },
      });
    }

    const planRaw = await safeHgetall(`lecture:plan:${jobId}`);
    if (planRaw && Object.keys(planRaw).length > 0) {
      return NextResponse.json({
        jobId,
        projectId: jobId,
        progress: {
          status: planRaw.status ?? "generating",
          progress: planRaw.progress ? parseInt(planRaw.progress, 10) : 0,
          error: planRaw.error || null,
        },
      });
    }

    let document = await db.lectureSourceDocument.findUnique({ where: { id: jobId } });
    if (!document) {
      document = await db.lectureSourceDocument.findFirst({
        where: { projectId: jobId },
        orderBy: { createdAt: "desc" },
      });
    }
    if (!document) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    
    // Ensure tenant isolation
    const project = await db.lectureProject.findUnique({
      where: { id: document.projectId },
      select: { tenantId: true }
    });
    if (project?.tenantId && project.tenantId !== tenantId && tenantId !== "default" && project.tenantId !== "default") {
      return NextResponse.json({ error: "Unauthorized tenant access" }, { status: 403 });
    }

    const raw = await safeHgetall(jobKey(jobId));
    const progress = raw && Object.keys(raw).length > 0
      ? {
          status: raw.status ?? "pending",
          progress: raw.progress ? parseInt(raw.progress, 10) : 0,
          error: raw.error || null,
        }
      : {
          status: document.parseStatus === "done" ? "done" : "queued",
          progress: document.parseStatus === "done" ? 100 : 0,
          error: null,
        };

    return NextResponse.json({
      jobId,
      documentId: document.id,
      projectId: document.projectId,
      originalName: document.originalName,
      parseStatus: document.parseStatus,
      progress,
    });
  }
);
