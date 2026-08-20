/**
 * Lecture Model Runs — cost ledger (NFR-03).
 * ===========================================================================
 * GET /api/iscarb/lecture/projects/[id]/model-runs
 *
 * Returns the per-model-call cost ledger for a project: totals (runs, tokens,
 * cost), a by-kind and by-model breakdown, and the most recent runs. Read-only
 * and tenant-scoped like every other lecture route.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await db.lectureProject.findFirst({ where: { id, tenantId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const runs = await db.lectureModelRun.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });

    const totalTokens = runs.reduce((n, r) => n + r.promptTokens + r.completionTokens, 0);
    const totalCost = runs.reduce((n, r) => n + (r.costUsd ?? 0), 0);
    const avgLatencyMs = runs.length ? Math.round(runs.reduce((n, r) => n + r.latencyMs, 0) / runs.length) : 0;

    const byKind: Record<string, { runs: number; costUsd: number }> = {};
    for (const r of runs) {
      byKind[r.kind] = byKind[r.kind] ?? { runs: 0, costUsd: 0 };
      byKind[r.kind].runs += 1;
      byKind[r.kind].costUsd += r.costUsd ?? 0;
    }
    const byModel: Record<string, { runs: number; costUsd: number }> = {};
    for (const r of runs) {
      byModel[r.model] = byModel[r.model] ?? { runs: 0, costUsd: 0 };
      byModel[r.model].runs += 1;
      byModel[r.model].costUsd += r.costUsd ?? 0;
    }

    return NextResponse.json({
      projectId: id,
      totals: { runs: runs.length, totalTokens, totalCostUsd: Math.round(totalCost * 10000) / 10000, avgLatencyMs },
      byKind,
      byModel,
      runs: runs.slice(0, 100).map((r) => ({
        id: r.id,
        kind: r.kind,
        model: r.model,
        promptTokens: r.promptTokens,
        completionTokens: r.completionTokens,
        latencyMs: r.latencyMs,
        costUsd: r.costUsd,
        outputHash: r.outputHash,
        artifactId: r.artifactId,
        createdAt: r.createdAt,
      })),
    });
  }
);
