import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, tenantWhere } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { rdfSyncService } from "@/services/rdf/rdf-sync.service";

/**
 * Calibration APIs previously targeted a non-existent AssessmentResult model.
 * Until CalibrationSession + AssessmentScore adjustments are fully wired,
 * these endpoints refuse safely instead of crashing production.
 *
 * GET  /api/iscarb/assessment/[id]/calibration — list calibration sessions
 * POST /api/iscarb/assessment/[id]/calibration — create session (scaffold)
 */
export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (req, ctx) => {
    const id = req.nextUrl.pathname.split("/assessment/")[1]?.split("/")[0];
    if (!id) return apiError("Assessment ID is required", 400);

    const assessment = await db.assessment.findFirst({
      where: { id, ...tenantWhere(ctx) },
    });
    if (!assessment) return apiError("Assessment not found", 404);

    const sessions = await db.calibrationSession.findMany({
      where: { assessmentId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      data: { assessmentId: id, sessions },
      meta: { timestamp: new Date().toISOString() },
    });
  }
);

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (req, ctx) => {
    const id = req.nextUrl.pathname.split("/assessment/")[1]?.split("/")[0];
    if (!id) return apiError("Assessment ID is required", 400);

    const assessment = await db.assessment.findFirst({
      where: { id, ...tenantWhere(ctx) },
    });
    if (!assessment) return apiError("Assessment not found", 404);

    const body = await req.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : `Calibration ${new Date().toISOString().slice(0, 10)}`;

    const session = await db.calibrationSession.create({
      data: {
        assessmentId: id,
        universityId: assessment.universityId,
        title,
        description:
          typeof body.reason === "string" ? body.reason : body.description ?? null,
        facilitated: ctx.session.userId,
      },
    });

    
      
      // RDF sync
      rdfSyncService.insertEntity("CalibrationSession", "unknown", "ISCARB", data).catch(() => {});// RDF sync
      rdfSyncService.insertEntity("CalibrationSession", session.id, "ISCARB", session).catch(() => {});return NextResponse.json(
      {
        data: session,
        meta: {
          timestamp: new Date().toISOString(),
          note: "Score bulk-multiplier calibration is not enabled; use per-submission score override.",
        },
      },
      { status: 201 }
    );
  }
);
