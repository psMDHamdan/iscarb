import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/api-guard";
import { CLASSIFICATION_SOURCES } from "@/lib/classifications/data";

/**
 * GET /api/iscarb/classifications
 *
 * Returns the national-classification reference data that iSCARB anchors to:
 *   - SCED (educational levels + specializations) and SSCO (occupations),
 *   - summary counts + coverage stats (how many students/career-mappings are
 *     currently anchored), used by the Home "National Classifications" feature.
 *
 * This is GLOBAL reference data (no tenant scoping) → `public` cacheable, like
 * /market and /challenges. Optional `?kind=` filters the SCED rows by level/field.
 */
export const GET = guard({ tier: "read" }, async (req) => {
  const sp = req.nextUrl.searchParams;
  const view = (sp.get("view") ?? "summary").trim(); // "summary" | "sced" | "ssco"

  const [
    scedLevels,
    scedBroad,
    scedSpecCount,
    sscoMajors,
    sscoOccCount,
    studentsTotal,
    studentsAnchored,
    mappingsTotal,
    mappingsAnchored,
  ] = await Promise.all([
    db.scedField.findMany({ where: { kind: "level" }, orderBy: { code: "asc" } }),
    db.scedField.findMany({ where: { kind: "broad" }, orderBy: { code: "asc" } }),
    db.scedField.count({ where: { kind: "specialization" } }),
    db.ssccoOccupation.findMany({ where: { kind: "major" }, orderBy: { code: "asc" } }),
    db.ssccoOccupation.count({ where: { kind: "occupation" } }),
    db.student.count(),
    db.student.count({ where: { scedSpecializationCode: { not: null } } }),
    db.careerMapping.count(),
    db.careerMapping.count({ where: { sscoCode: { not: null } } }),
  ]);

  const summary = {
    sources: CLASSIFICATION_SOURCES,
    counts: {
      scedLevels: scedLevels.length,
      scedBroadFields: scedBroad.length,
      scedSpecializations: scedSpecCount,
      sscoMajorGroups: sscoMajors.length,
      sscoOccupations: sscoOccCount,
    },
    coverage: {
      studentsTotal,
      studentsAnchored,
      studentsAnchoredPct: studentsTotal ? Math.round((studentsAnchored / studentsTotal) * 100) : 0,
      careerMappingsTotal: mappingsTotal,
      careerMappingsAnchored: mappingsAnchored,
      careerMappingsAnchoredPct: mappingsTotal ? Math.round((mappingsAnchored / mappingsTotal) * 100) : 0,
    },
    levels: scedLevels.map((l) => ({
      code: l.code, nameEn: l.nameEn, nameAr: l.nameAr, nqfLevel: l.nqfLevel, iscedLevel: l.iscedLevel,
    })),
    sscoMajorGroups: sscoMajors.map((m) => ({
      code: m.code, nameEn: m.nameEn, nameAr: m.nameAr, iscoCode: m.iscoCode, skillLevel: m.skillLevel,
    })),
    scedBroadFields: scedBroad.map((b) => ({ code: b.code, nameEn: b.nameEn, nameAr: b.nameAr })),
  };

  if (view === "sced") {
    const sced = await db.scedField.findMany({ orderBy: { code: "asc" } });
    return NextResponse.json(
      { sced, summary },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  }
  if (view === "ssco") {
    const ssco = await db.ssccoOccupation.findMany({ orderBy: { code: "asc" } });
    return NextResponse.json(
      { ssco, summary },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  }

  return NextResponse.json(
    { summary },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
});
