import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { computeProfile, type DimensionId } from "@/lib/assessment/framework";
import { canonicalSpecializationLabel } from "@/lib/assessment/catalog";
import { excludesSeedSource, liveCurrentResponseWhere } from "@/lib/assessment/live-response-where";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import { resolveOwnedStudentId } from "@/lib/assessment/resolve-student";

/**
 * Map legacy / human-readable dimension labels onto framework DimensionId.
 * Seed scripts and older rows used title-case labels that computeProfile ignored.
 */
function normalizeDimensionId(raw: string): DimensionId | null {
  const key = raw.trim().toLowerCase().replace(/[\s/-]+/g, "_");
  const aliases: Record<string, DimensionId> = {
    core_professionalism: "core_professionalism",
    business_digital: "business_digital",
    business_digital_literacy: "business_digital",
    job_fit: "job_fit",
    job_fit_technical: "job_fit",
    growth_potential: "growth_potential",
  };
  return aliases[key] ?? null;
}

/** Next.js route modules may only export handlers, so keep this module-local. */
const NO_LIVE_DATA_ERROR = "No live assessment data";

function noLiveDataResponse() {
  return NextResponse.json({ success: false, error: NO_LIVE_DATA_ERROR }, { status: 404 });
}

/**
 * POST /api/iscarb/assessment/profile
 * Body: { studentId?: string, specialization?: string }
 *
 * Computes the 4D employability profile from this student's own live
 * AssessmentResponse rows only. A student with no live rows of their own has no
 * profile: the response is 404, never a composite borrowed from other students
 * (REPORT_GENERATION_SPEC_2026-08-03 §1.1).
 */
export const POST = guard({ tier: "write", roles: ["student", "faculty", "admin"] }, async (req, ctx) => {
  const body = await parseJSON(req);
  if (!body) return jsonErrorResponse("Invalid request body");

  const resolved = await resolveOwnedStudentId(
    ctx.session,
    (body as Record<string, unknown>).studentId as string | undefined,
  );
  if (!resolved.ok) {
    return NextResponse.json({ success: false, error: resolved.error }, { status: resolved.status });
  }
  const studentId = resolved.studentId;

  const specializationRaw =
    ((body as Record<string, unknown>).specialization as string | undefined) ?? null;
  const specialization = canonicalSpecializationLabel(specializationRaw);

  const responseWhere = liveCurrentResponseWhere(studentId);
  const responses = await db.assessmentResponse.findMany({
    where: responseWhere,
    orderBy: { createdAt: "desc" },
  });

  if (responses.length === 0) return noLiveDataResponse();

  const latestByModule = new Map<string, { dimension: DimensionId; score: number }>();
  for (const r of responses) {
    if (latestByModule.has(r.moduleCode)) continue;
    const dim = normalizeDimensionId(r.dimension);
    if (!dim) continue;
    latestByModule.set(r.moduleCode, { dimension: dim, score: r.score });
  }

  // Rows exist but none carry a dimension the framework can score: there is
  // nothing to roll up, so emit no profile rather than a 0-composite artifact.
  if (latestByModule.size === 0) return noLiveDataResponse();

  const moduleScoresArray = Array.from(latestByModule.values());
  const profileComputed = computeProfile(moduleScoresArray, specialization);
  const compositeScore = profileComputed.composite;
  const band = profileComputed.band;

  const dimensionsJson = JSON.stringify(
    profileComputed.dimensions.reduce(
      (acc, d) => {
        acc[d.dimension] = d.score;
        return acc;
      },
      {} as Record<string, number>,
    ),
  );
  const coveredJson = JSON.stringify(profileComputed.covered);
  const persisted = {
    composite: compositeScore,
    band,
    passed: profileComputed.passed,
    specialization,
    dimensionsJson,
    coveredJson,
    computedAt: new Date(),
  };

  let profileComputedAt = new Date();
  try {
    const profileRecord = await db.employabilityProfile.upsert({
      where: { studentId },
      create: { studentId, ...persisted },
      update: persisted,
    });
    profileComputedAt = profileRecord.computedAt ?? new Date();

    await db.assessmentSnapshot.create({
      data: {
        studentId,
        dataJson: JSON.stringify({
          composite: compositeScore,
          band,
          passed: profileComputed.passed,
          dimensions: profileComputed.dimensions,
          covered: profileComputed.covered,
          responseCount: responses.length,
          excludedSeed: excludesSeedSource(responseWhere),
        }),
      },
    });
  } catch (e) {
    console.warn("Profile persistence warning:", e);
  }

  return NextResponse.json({
    success: true,
    profile: {
      composite: compositeScore,
      band,
      passed: profileComputed.passed,
      specialization: specialization || "General Studies",
      dimensions: profileComputed.dimensions,
      covered: profileComputed.covered,
      computedAt: profileComputedAt.toISOString(),
      liveModuleCount: latestByModule.size,
    },
  });
});
