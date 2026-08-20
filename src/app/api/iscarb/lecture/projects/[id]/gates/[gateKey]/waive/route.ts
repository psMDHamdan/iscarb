/**
 * Waive API — waive a warning gate.
 * ===========================================================================
 * POST /api/iscarb/lecture/projects/[id]/gates/[gateKey]/waive
 * Body: { reason: string }
 *
 * Only gates with severity = "warning" can be waived.
 * Error gates cannot be waived — they must be fixed.
 *
 * Response 200: { gateKey, status: "waived", waivedBy, reason }
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import { isWaivable, type GateKey, GATE_KEYS, type GateSeverity } from "@/lib/lecture/quality/types";

const bodySchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long (max 500 chars)"),
});

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string; gateKey: string }> }
  ) => {
    const { id, gateKey } = await params;
    const tenantId = ctx.session.universityId || "default";

    // Validate gateKey
    if (!GATE_KEYS.includes(gateKey as GateKey)) {
      return NextResponse.json({ error: `Unknown gate: ${gateKey}` }, { status: 400 });
    }

    // Check waivable
    if (!isWaivable(gateKey as GateKey)) {
      return NextResponse.json(
        { error: `Gate '${gateKey}' has severity 'error' and cannot be waived` },
        { status: 400 }
      );
    }

    const project = await db.lectureProject.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { reason } = parsed.data;

    // Get current gate result
    const existing = await db.lectureGateResult.findFirst({
      where: { projectId: id, gateKey },
    });
    if (!existing) {
      return NextResponse.json({ error: "Gate result not found — run validate first" }, { status: 404 });
    }
    if (existing.status !== "fail" && existing.status !== "waived") {
      return NextResponse.json({ error: "Only failed/waived gates can be waived" }, { status: 400 });
    }

    // Update to waived
    await db.lectureGateResult.update({
      where: { id: existing.id },
      data: {
        status: "waived",
        waiveReason: reason,
        waivedBy: ctx.session.userId ?? "unknown",
        checkedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        gateKey,
        status: "waived",
        waivedBy: ctx.session.userId ?? "unknown",
        reason,
      },
      { status: 200 }
    );
  }
);