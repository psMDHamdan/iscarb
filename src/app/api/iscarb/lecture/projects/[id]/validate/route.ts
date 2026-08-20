/**
 * Validate API — runs quality gates for a lecture project.
 * ===========================================================================
 * POST /api/iscarb/lecture/projects/[id]/validate
 * Body: { gates?: string[] } — optional filter to run specific gates
 *
 * Response 200:
 * {
 *   projectId: string,
 *   passCount: number,
 *   failCount: number,
 *   warnCount: number,
 *   blockers: GateResult[],
 *   warnings: GateResult[],
 *   checkedAt: string
 * }
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import { runAllGates } from "@/lib/lecture/quality/gate-runner";
import { type GateKey, type GateResult, GATE_KEYS } from "@/lib/lecture/quality/types";

const bodySchema = z.object({
  gates: z.array(z.enum(GATE_KEYS as unknown as [string, ...string[]])).optional(),
});

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const tenantId = ctx.session.universityId || "default";

      const project = await db.lectureProject.findFirst({
        where: { id },
        select: { id: true, tenantId: true },
      });
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
      if (project.tenantId && project.tenantId !== tenantId && tenantId !== "default" && project.tenantId !== "default") {
        return NextResponse.json({ error: "Unauthorized tenant access" }, { status: 403 });
      }

      const body = await req.json().catch(() => ({}));
      const parsed = bodySchema.safeParse(body ?? {});
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
      }

      const gateKeys = parsed.data.gates as GateKey[] | undefined;
      const results = await runAllGates(id, gateKeys);

      const passCount = results.filter((r) => r.status === "pass").length;
      const failCount = results.filter((r) => r.status === "fail").length;
      const blockers = results.filter((r) => r.severity === "error" && r.status === "fail");
      const warnings = results.filter((r) => r.severity === "warning" && r.status === "fail");
      const warnCount = warnings.length;

      return NextResponse.json(
        {
          projectId: id,
          passCount,
          failCount,
          warnCount,
          blockers,
          warnings,
          checkedAt: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (err: any) {
      console.error("[validate] failed to run quality gates:", err);
      return NextResponse.json(
        { error: "Quality gate validation failed", details: err?.message },
        { status: 500 }
      );
    }
  }
);