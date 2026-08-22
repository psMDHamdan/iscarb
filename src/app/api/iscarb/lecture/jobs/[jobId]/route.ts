/**
 * Lecture Planning — parse / generate job status.
 * ===========================================================================
 * GET /api/iscarb/lecture/jobs/[jobId]
 *
 * Returns live parse/generate progress published to Redis by the worker,
 * falling back to database status when Redis is unavailable (e.g. Vercel).
 * 404 when the job (or its source document / project) no longer exists.
 *
 * All Redis calls are wrapped in try/catch so the endpoint never throws
 * 500 because of a missing Redis instance.
 */
import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { redis } from "@/config/redis";
import { jobKey } from "@/lib/lecture/ingestion/parse-worker";

/**
 * Safe Redis HGETALL — returns the hash fields or an empty object.
 * Never throws even if Redis is unreachable or unconfigured.
 */
async function safeHgetall(key: string): Promise<Record<string, string>> {
  try {
    const raw = await redis.hgetall(key);
    return raw && Object.keys(raw).length > 0 ? raw : {};
  } catch {
    return {};
  }
}

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: any,
    { params }: { params: Promise<{ jobId: string }> }
  ) => {
    const { jobId } = await params;
    const tenantId = ctx.session.universityId || "default";

    // ── 1. Check generate job hash in Redis ─────────────────────────
    const generateRaw = await safeHgetall(`lecture:generate:${jobId}`);
    if (Object.keys(generateRaw).length > 0) {
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

    // ── 2. Check plan job hash in Redis ─────────────────────────────
    const planRaw = await safeHgetall(`lecture:plan:${jobId}`);
    if (Object.keys(planRaw).length > 0) {
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

    // ── 3. Try to find a source document in the DB ──────────────────
    let document = await db.lectureSourceDocument.findUnique({ where: { id: jobId } });
    if (!document) {
      document = await db.lectureSourceDocument.findFirst({
        where: { projectId: jobId },
        orderBy: { createdAt: "desc" },
      });
    }

    // ── 3b. If no document, check if jobId is a project ID ──────────
    if (!document) {
      const project = await db.lectureProject.findUnique({ where: { id: jobId } });
      if (project) {
        // Ensure tenant isolation
        if (
          project.tenantId &&
          project.tenantId !== tenantId &&
          tenantId !== "default" &&
          project.tenantId !== "default"
        ) {
          return NextResponse.json({ error: "Unauthorized tenant access" }, { status: 403 });
        }

        const genStatus = project.status ?? "draft";
        const doneStatuses = new Set(["approved", "planning", "review"]);
        const failedStatuses = new Set(["failed"]);
        const progressPct = doneStatuses.has(genStatus) ? 100 : genStatus === "generating" ? 50 : 0;
        const jobStatus = doneStatuses.has(genStatus)
          ? "done"
          : failedStatuses.has(genStatus)
          ? "failed"
          : genStatus === "generating"
          ? "running"
          : "queued";
        return NextResponse.json({
          jobId,
          projectId: project.id,
          progress: {
            status: jobStatus,
            progress: progressPct,
            error: failedStatuses.has(genStatus) ? "Generation failed — check server logs" : null,
          },
        });
      }

      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // ── 4. Ensure tenant isolation for the document ─────────────────
    const projectRow = await db.lectureProject.findUnique({
      where: { id: document.projectId },
      select: { tenantId: true },
    });
    if (
      projectRow?.tenantId &&
      projectRow.tenantId !== tenantId &&
      tenantId !== "default" &&
      projectRow.tenantId !== "default"
    ) {
      return NextResponse.json({ error: "Unauthorized tenant access" }, { status: 403 });
    }

    // ── 5. Check parse worker status in Redis (safe) ────────────────
    const raw = await safeHgetall(jobKey(jobId));
    const progress =
      Object.keys(raw).length > 0
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
