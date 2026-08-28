import "server-only";
import { db } from "@/lib/db";
import {
  computeProfile,
  type DimensionId,
  type DimensionScore,
} from "@/lib/assessment/framework";
import { excludesSeedSource, liveCurrentResponseWhere } from "@/lib/assessment/live-response-where";
import { computePercentilesBatch } from "@/lib/assessment/percentile";
import {
  canonicalSpecializationLabel,
  resolveAssessmentModuleSet,
} from "@/lib/assessment/catalog";
import { type DimensionChapter, buildDimensionChapters } from "./dimension-report-sections";

export const NO_LIVE_DATA_ERROR = "No live assessment data";

export type LiveReportModuleDetail = {
  moduleCode: string;
  moduleTitle: string;
  dimension: string;
  score: number;
  band: string;
  passed: boolean;
  source: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  perCriterion: Array<{ criterion: string; score: number; max?: number; weight?: number }>;
  percentile: number | null;
  rawResponse: string | null;
  isFallback: boolean;
};

export type LiveEmployabilityReport = {
  kind: "employability-live";
  studentId: string;
  studentName: string;
  specialization: string | null;
  computedAt: string;
  /** Derived from the response query that actually ran — never asserted. */
  excludedSeed: boolean;
  isCurrentOnly: true;
  profile: {
    composite: number;
    band: string;
    passed: boolean;
    specialization: string | null;
    dimensions: DimensionScore[];
    covered: string[];
    computedAt: string;
    liveModuleCount: number;
  };
  /** Per-module rows for the HTML/PDF report (latest live attempt each). */
  results: LiveReportModuleDetail[];
  /** Catalog scenario/instructions for each module (what the student was asked). */
  modules: Array<{
    code: string;
    title: string;
    titleAr: string | null;
    dimension: string;
    framework: string;
    focus: string;
    scenario: string;
    instructions: string;
  }>;
  /** Answers keyed by moduleCode from AssessmentResponse.rawResponse. */
  answers: Record<string, string>;
  /** Generated per-dimension synthesis chapters. */
  dimensionChapters: DimensionChapter[];
};

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

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function parsePerCriterion(raw: string | null | undefined): LiveReportModuleDetail["perCriterion"] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((c) => c && typeof c === "object")
      .map((c: Record<string, unknown>) => ({
        criterion: String(c.criterion ?? ""),
        score: Number(c.score ?? 0),
        max: typeof c.max === "number" ? c.max : typeof c.weight === "number" ? c.weight : undefined,
        weight: typeof c.weight === "number" ? c.weight : undefined,
      }));
  } catch {
    return [];
  }
}

/**
 * Build the HR score report from this student's own Postgres live rows only
 * (isCurrent=true, source != seed). Same integrity bar as the profile route
 * (REPORT_GENERATION_SPEC_2026-08-03 §1.1): no findFirst retarget, no Dev
 * Candidate invent, no query that drops the studentId filter. Zero live rows
 * → `{ error, status: 404 }`, never a report borrowed from other students.
 */
export async function buildLiveEmployabilityReport(
  studentId: string,
  specializationHint?: string | null,
): Promise<LiveEmployabilityReport | { error: string; status: number }> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, program: true, college: true },
  });

  if (!student) {
    return { error: "Student not found", status: 404 };
  }

  // Canonical JOBFIT_TRACKS label for persistence + report (alias forms → track label).
  const specialization = canonicalSpecializationLabel(
    (specializationHint && specializationHint.trim()) ||
      student.program ||
      student.college ||
      null,
  );

  const responseWhere = liveCurrentResponseWhere(student.id);
  const responses = await db.assessmentResponse.findMany({
    where: responseWhere,
    orderBy: [{ moduleCode: "asc" }, { createdAt: "desc" }],
  });

  if (responses.length === 0) {
    return { error: NO_LIVE_DATA_ERROR, status: 404 };
  }

  const latestByModule = new Map<string, (typeof responses)[number]>();
  for (const r of responses) {
    if (!latestByModule.has(r.moduleCode)) latestByModule.set(r.moduleCode, r);
  }

  // Rows exist but none carry a dimension the framework can score: there is
  // nothing honest to roll up into an HR report.
  const hasScorableDimension = Array.from(latestByModule.values()).some(
    (r) => normalizeDimensionId(r.dimension) !== null,
  );
  if (!hasScorableDimension) {
    return { error: NO_LIVE_DATA_ERROR, status: 404 };
  }

  const catalogSet = resolveAssessmentModuleSet(specialization || "General Studies").modules;

  // Batch-compute all percentiles in 2 queries instead of 2N (N=47 modules).
  const percentileModules = catalogSet.map((modSpec) => {
    const r = latestByModule.get(modSpec.code);
    return { code: modSpec.code, score: r?.score ?? 0 };
  });
  const percentileMap = await computePercentilesBatch(percentileModules);

  const results: LiveReportModuleDetail[] = catalogSet.map((modSpec) => {
    const r = latestByModule.get(modSpec.code);
    const percentile = percentileMap.get(modSpec.code) ?? null;
    if (r) {
      const sourceNorm = (r.source || "").toLowerCase();
      return {
        moduleCode: r.moduleCode,
        moduleTitle: modSpec.title || r.moduleCode,
        dimension: r.dimension,
        score: r.score,
        band: r.band,
        passed: r.passed,
        source: r.source,
        feedback: r.feedback,
        strengths: parseJsonArray(r.strengthsJson),
        improvements: parseJsonArray(r.improvementsJson),
        perCriterion: parsePerCriterion(r.perCriterionJson),
        percentile,
        rawResponse: r.rawResponse,
        isFallback: sourceNorm === "fallback" || sourceNorm === "heuristic",
      };
    }

    const score = 0;
    const band = "weak";
    return {
      moduleCode: modSpec.code,
      moduleTitle: modSpec.title,
      dimension: modSpec.dimension,
      score,
      band,
      passed: false,
      source: "evaluator",
      feedback: `Evaluation pending for ${modSpec.title}. Complete scenario questions to receive detailed feedback.`,
      strengths: ["Domain Awareness"],
      improvements: ["Complete full assessment module"],
      perCriterion: modSpec.rubric.map((rub) => ({
        criterion: rub.criterion,
        score: 0,
        max: rub.weight,
        weight: rub.weight,
      })),
      percentile,
      rawResponse: null,
      isFallback: false,
    };
  });

  // ISC-QA-006: only count scored responses for modules in the current catalog
  // set. Prior attempts may leave orphaned rows for modules no longer in the
  // student's specialization, which would inflate dimension moduleCount.
  const catalogCodes = new Set(catalogSet.map((m) => m.code));
  const moduleScores: Array<{ dimension: DimensionId; score: number }> = [];
  for (const r of latestByModule.values()) {
    if (!catalogCodes.has(r.moduleCode)) continue;
    const dim = normalizeDimensionId(r.dimension);
    if (!dim) continue;
    moduleScores.push({ dimension: dim, score: r.score });
  }

  const profileComputed = computeProfile(moduleScores, specialization);
  const computedAt = new Date().toISOString();

  const modules = catalogSet.map((m) => ({
    code: m.code,
    title: m.title,
    titleAr: m.titleAr ?? null,
    dimension: m.dimension,
    framework: m.framework ?? "NQF / Vision 2030 Framework",
    focus: m.focus ?? m.title,
    scenario: m.scenario ?? "",
    instructions: m.instructions ?? "",
  }));

  const answers: Record<string, string> = {};
  for (const r of results) {
    if (r.rawResponse) answers[r.moduleCode] = r.rawResponse;
  }

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
    composite: profileComputed.composite,
    band: profileComputed.band,
    passed: profileComputed.passed,
    specialization,
    dimensionsJson,
    coveredJson,
    computedAt: new Date(),
  };

  // Keep EmployabilityProfile in sync with the live report
  await db.employabilityProfile.upsert({
    where: { studentId: student.id },
    create: { studentId: student.id, ...persisted },
    update: persisted,
  });

  const report: LiveEmployabilityReport = {
    kind: "employability-live" as const,
    studentId: student.id,
    studentName: student.name || "Candidate",
    specialization,
    computedAt,
    excludedSeed: excludesSeedSource(responseWhere),
    isCurrentOnly: true as const,
    profile: {
      composite: profileComputed.composite,
      band: profileComputed.band,
      passed: profileComputed.passed,
      specialization,
      dimensions: profileComputed.dimensions,
      covered: profileComputed.covered,
      computedAt,
      liveModuleCount: latestByModule.size,
    },
    results,
    modules,
    answers,
    dimensionChapters: [] as DimensionChapter[],
  };
  report.dimensionChapters = buildDimensionChapters(report.results, report.profile.dimensions);
  return report;
}

/** Shape expected by EmployabilityDetailedReportView. */
export function toAttemptSnapshotView(report: LiveEmployabilityReport) {
  return {
    id: `live_${report.studentId}`,
    kind: "employability" as const,
    studentId: report.studentId,
    studentName: report.studentName,
    specialization: report.specialization ?? "",
    computedAt: report.computedAt,
    timedOut: false,
    profile: {
      composite: report.profile.composite,
      band: report.profile.band,
      passed: report.profile.passed,
      specialization: report.profile.specialization,
      dimensions: report.profile.dimensions,
      covered: report.profile.covered,
      computedAt: report.profile.computedAt,
    },
    results: report.results.map((r) => ({
      moduleCode: r.moduleCode,
      moduleTitle: r.moduleTitle,
      dimension: r.dimension,
      score: r.score,
      band: r.band,
      passed: r.passed,
      feedback: r.feedback,
      strengths: r.strengths,
      improvements: r.improvements,
      perCriterion: (r.perCriterion ?? []).map((c) => ({
        criterion: c.criterion,
        weight: c.weight ?? c.max ?? 0,
        score: c.score,
        max: c.max ?? c.weight ?? 0,
      })),
      isFallback: r.isFallback,
    })),
    modules: report.modules,
    answers: report.answers,
    dimensionChapters: report.dimensionChapters,
  };
}
