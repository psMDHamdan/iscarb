/**
 * Gates API — read persisted quality gate results.
 * ===========================================================================
 * GET /api/iscarb/lecture/projects/[id]/gates
 *
 * Returns the current persisted gate results for a project, read from
 * LectureGateResult. This enables the quality page to poll for live
 * updates without re-running all gates.
 *
 * Response 200:
 * {
 *   projectId: string,
 *   passCount: number,
 *   failCount: number,
 *   warnCount: number,
 *   blockers: GateResult[],
 *   warnings: GateResult[],
 *   passed: GateResult[],
 *   lastCheckedAt: string | null,
 * }
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";
import type { GateResult } from "@/lib/lecture/quality/types";

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const results = await db.lectureGateResult.findMany({
      where: { projectId: id },
      orderBy: { gateKey: "asc" },
    });

    // Map DB rows to GateResult shape
    const gateResults: GateResult[] = results.map((r: any) => ({
      gateKey: r.gateKey,
      severity: r.severity as GateResult["severity"],
      status: r.status as GateResult["status"],
      findings: (r.findings as { slideNo?: number; message?: string }[]) ?? [],
      ruleVersion: r.ruleVersion ?? "1.0",
      waiveReason: r.waiveReason ?? undefined,
    }));

    const passCount = gateResults.filter((r) => r.status === "pass").length;
    const failCount = gateResults.filter((r) => r.status === "fail").length;
    const blockers = gateResults.filter((r) => r.severity === "error" && r.status === "fail");
    const warnings = gateResults.filter((r) => r.severity === "warning" && r.status === "fail");
    const passed = gateResults.filter((r) => r.status === "pass");
    const warnCount = warnings.length;

    const lastChecked = results.length > 0
      ? results.reduce((latest: number, r: any) => {
          const checked = r.checkedAt?.getTime() ?? 0;
          return checked > latest ? checked : latest;
        }, 0)
      : null;

    return NextResponse.json(
      {
        projectId: id,
        passCount,
        failCount,
        warnCount,
        blockers,
        warnings,
        passed,
        lastCheckedAt: lastChecked ? new Date(lastChecked).toISOString() : null,
      },
      { status: 200 }
    );
  }
);
