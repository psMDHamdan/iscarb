/**
 * Lecture Readiness Items — item-level edit (BRD §12).
 * ===========================================================================
 * PATCH /api/iscarb/lecture/readiness-items/[id]
 *   Body (all optional): { stem?, options?, correctIndex?, difficulty?,
 *     rationale?, misconception?, sourceLocator?, slideNo?, action? }
 *   - action: "approve" | "reject" sets approved (+ approvedBy/approvedAt)
 *   - slideNo: relocates the check (1–20)
 *   - options: [{ id, text, isCorrect }] — exactly 4, one correct
 * DELETE /api/iscarb/lecture/readiness-items/[id] — removes the item.
 *
 * Tenant-scoped through the owning project, mirroring the readiness list route.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const patchSchema = z
  .object({
    stem: z.string().min(1).optional(),
    options: z.array(optionSchema).optional(),
    correctIndex: z.number().int().min(0).max(3).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    rationale: z.string().optional(),
    misconception: z.string().nullable().optional(),
    sourceLocator: z.string().nullable().optional(),
    slideNo: z.number().int().min(1).max(20).optional(),
    action: z.enum(["approve", "reject"]).optional(),
  })
  .refine((d) => !d.options || d.options.length === 4, {
    message: "options must contain exactly 4 choices",
    path: ["options"],
  })
  .refine((d) => {
    if (!d.options) return true;
    const correct = d.options.filter((o) => o.isCorrect).length;
    return correct === 1;
  }, {
    message: "exactly one option must be marked correct",
    path: ["options"],
  })
  .refine((d) => {
    if (!d.options || d.correctIndex === undefined) return true;
    return d.options[d.correctIndex]?.isCorrect === true;
  }, {
    message: "correctIndex must point at the option marked correct",
    path: ["correctIndex"],
  });

async function findItem(id: string, tenantId: string) {
  return db.lectureReadinessItem.findFirst({
    where: { id, project: { tenantId } },
    include: { project: { select: { id: true, tenantId: true } } },
  });
}

export const PATCH = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const item = await findItem(id, tenantId);
    if (!item) return NextResponse.json({ error: "Readiness item not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const rawData = body?.body && typeof body.body === "object" ? { ...body, ...body.body } : body;
    const parsed = patchSchema.safeParse(rawData ?? {});
    if (!parsed.success) {
      return NextResponse.json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      }, { status: 400 });
    }
    const d = parsed.data;

    const data: Record<string, unknown> = {};
    let hasChange = false;
    if (d.stem !== undefined) { data.stem = d.stem; hasChange = true; }
    if (d.options !== undefined) { data.options = d.options as object[]; hasChange = true; }
    if (d.correctIndex !== undefined) { data.correctIndex = d.correctIndex; hasChange = true; }
    if (d.difficulty !== undefined) { data.difficulty = d.difficulty; hasChange = true; }
    if (d.rationale !== undefined) { data.rationale = d.rationale; hasChange = true; }
    if (d.misconception !== undefined) { data.misconception = d.misconception; hasChange = true; }
    if (d.sourceLocator !== undefined) { data.sourceLocator = d.sourceLocator; hasChange = true; }
    if (d.slideNo !== undefined) { data.slideNo = d.slideNo; hasChange = true; }
    if (d.action === "approve") {
      data.approved = true;
      data.approvedBy = ctx.session.userId;
      data.approvedAt = new Date();
      hasChange = true;
    } else if (d.action === "reject") {
      data.approved = false;
      data.approvedBy = null;
      data.approvedAt = null;
      hasChange = true;
    }

    if (!hasChange) {
      return NextResponse.json({ error: "NOTHING_TO_UPDATE", message: "No updatable fields provided" }, { status: 400 });
    }

    const updated = await db.lectureReadinessItem.update({ where: { id }, data });

    return NextResponse.json({ item: updated }, { status: 200 });
  }
);

export const DELETE = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const item = await findItem(id, tenantId);
    if (!item) return NextResponse.json({ error: "Readiness item not found" }, { status: 404 });

    await db.lectureReadinessItem.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  }
);
