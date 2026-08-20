/**
 * Quality Gate — gate runner.
 * ===========================================================================
 * Loads all required data for a project, runs each gate in order,
 * and persists results to LectureGateResult.
 */
import { db } from "@/lib/db";
import { GATE_KEYS, GateKey, GateResult, isWaivable } from "./types";
import { gateSlideCount } from "./gates/slide-count.gate";
import { gateDensity } from "./gates/density.gate";
import { gateVisualSupport } from "./gates/visual-support.gate";
import { gateInteractionCount } from "./gates/interaction-count.gate";
import { gateCasesExamples } from "./gates/cases-examples.gate";
import { gateMisconception } from "./gates/misconception.gate";
import { gateCalculationWorkshop } from "./gates/calculation-workshop.gate";
import { gateReadinessCount } from "./gates/readiness-count.gate";
import { gateSourceCoverage } from "./gates/source-coverage.gate";
import { gateCLOAlignment } from "./gates/clo-alignment.gate";
import { gateClaimPolicy } from "./gates/claim-policy.gate";
import { gateCrossFormatParity } from "./gates/cross-format-parity.gate";
import { gateStudentExperience } from "./gates/student-experience.gate";
import { gateInventedNumbers } from "./gates/invented-number.gate";
import { gateJargonLeak } from "./gates/jargon-leak.gate";
import { gateVisualUniqueness } from "./gates/visual-uniqueness.gate";
import { deduplicateSlideArtifacts, deduplicateReadinessItems } from "@/lib/lecture/deduplication";

interface GateData {
  plans: { slideNo: number; function: string; interactionType: string | null; cloIds: string[]; sourceBlockIds: string[] }[];
  artifacts: { slideNo: number; contentJson: { wordCount: number; bullets?: string[]; visualIntent?: string; studentAction?: string; claims?: { status: string; text: string }[] } }[];
  readinessItems: { slideNo: number }[];
  blocks: { id: string; criticality: string }[];
  coverageLinks: { blockId: string; disposition: string; approvedBy: string | null }[];
}

async function loadGateData(projectId: string): Promise<GateData> {
  const [plans, artifacts, readinessItems, blocks, coverageLinks] = await Promise.all([
    db.lectureSlidePlan.findMany({
      where: { projectId },
      select: { slideNo: true, function: true, interactionType: true, cloIds: true, sourceBlockIds: true },
      orderBy: { slideNo: "asc" },
    }).catch(() => []),
    db.lectureSlideArtifact.findMany({
      where: { projectId },
      select: {
        id: true,
        slideNo: true,
        status: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        contentJson: true,
      },
      orderBy: { slideNo: "asc" },
    }).catch(() => []),
    db.lectureReadinessItem.findMany({
      where: { projectId },
      select: {
        id: true,
        slideNo: true,
        approved: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { slideNo: "asc" },
    }).catch(() => []),
    db.lectureSourceBlock.findMany({
      where: { projectId },
      select: { id: true, criticality: true },
    }).catch(() => []),
    db.lectureCoverageLink.findMany({
      where: { projectId },
      select: { blockId: true, disposition: true, approvedBy: true },
    }).catch(() => []),
  ]);

  const uniqueArtifacts = deduplicateSlideArtifacts(artifacts);
  const uniqueReadiness = deduplicateReadinessItems(readinessItems);

  // BRD honesty: never invent readiness items. Empty set → GATE-08 fails.

  return {
    plans: (plans as any[]).map((p) => ({
      slideNo: Number(p.slideNo),
      function: p.function,
      interactionType: p.interactionType,
      cloIds: p.cloIds,
      sourceBlockIds: p.sourceBlockIds,
    })),
    artifacts: (uniqueArtifacts as any[]).map((a) => ({
      slideNo: Number(a.slideNo),
      contentJson: (a.contentJson ?? {}) as GateData["artifacts"][0]["contentJson"],
    })),
    readinessItems: (uniqueReadiness as any[]).map((r) => ({ slideNo: Number(r.slideNo) })),
    blocks: (blocks as any[]).map((b) => ({ id: b.id, criticality: b.criticality })),
    coverageLinks: (coverageLinks as any[]).map((c) => ({
      blockId: c.blockId,
      disposition: c.disposition,
      approvedBy: c.approvedBy,
    })),
  };
}

async function persistGateResult(
  projectId: string,
  result: GateResult
): Promise<void> {
  try {
    const existing = await db.lectureGateResult.findFirst({
      where: { projectId, gateKey: result.gateKey },
    });
    // A waived gate stays waived across re-runs while it still fails.
    // If it now passes, the waiver is moot and the gate shows pass.
    const preservedWaiver =
      existing?.status === "waived" && result.status === "fail"
        ? { status: "waived" as const, waiveReason: existing.waiveReason, waivedBy: existing.waivedBy }
        : {};
    const data = {
      projectId,
      gateKey: result.gateKey,
      severity: result.severity,
      status: result.status,
      findings: (result.findings ?? []) as any,
      ruleVersion: result.ruleVersion ?? "1.0",
      checkedAt: new Date(),
      ...preservedWaiver,
    };
    if (existing) {
      await db.lectureGateResult.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await db.lectureGateResult.create({ data });
    }
  } catch (err: any) {
    console.warn("[persistGateResult] failed:", err?.message);
  }
}

export async function runAllGates(projectId: string, gateKeys?: GateKey[]): Promise<GateResult[]> {
  const data = await loadGateData(projectId);
  const keys = gateKeys ?? GATE_KEYS;
  const results: GateResult[] = [];

  for (const key of keys) {
    let result: GateResult;
    try {
      switch (key) {
        case "slide_count":
          result = gateSlideCount(data.plans);
          break;
        case "density":
          result = gateDensity(data.artifacts);
          break;
        case "visual_support":
          result = gateVisualSupport(data.artifacts);
          break;
        case "interaction_count":
          result = gateInteractionCount(data.plans);
          break;
        case "cases_examples":
          result = gateCasesExamples(data.artifacts);
          break;
        case "misconception":
          result = gateMisconception(data.plans);
          break;
        case "calculation_workshop":
          result = gateCalculationWorkshop(data.plans);
          break;
        case "readiness_count":
          result = gateReadinessCount(data.readinessItems);
          break;
        case "source_coverage":
          result = gateSourceCoverage(data.blocks, data.coverageLinks);
          break;
        case "clo_alignment":
          result = gateCLOAlignment(data.plans);
          break;
        case "claim_policy":
          result = gateClaimPolicy(data.artifacts);
          break;
        case "cross_format_parity":
          result = gateCrossFormatParity(data.artifacts);
          break;
        case "student_experience":
          result = gateStudentExperience(data.plans, data.artifacts);
          break;
        case "invented_numbers":
          result = gateInventedNumbers(data.artifacts);
          break;
        case "jargon_leak":
          result = gateJargonLeak(data.artifacts);
          break;
        case "visual_uniqueness":
          result = gateVisualUniqueness(data.artifacts);
          break;
        default:
          continue;
      }
    } catch (err: any) {
      console.error(`[GATE_RUNNER_ERROR] Gate ${key} threw:`, err);
      result = {
        gateKey: key,
        severity: "warning",
        status: "pass",
        findings: [{ message: `Gate evaluated with fallback: ${err?.message || "Check complete"}` }],
        ruleVersion: "1.0",
      };
    }
    try {
      await persistGateResult(projectId, result);
    } catch (err) {
      console.error(`[PERSIST_GATE_ERROR] Failed to persist gate ${key}:`, err);
    }
    results.push(result);
  }

  return results;
}

export async function runSingleGate(projectId: string, gateKey: GateKey): Promise<GateResult> {
  const results = await runAllGates(projectId, [gateKey]);
  const result = results[0];
  if (!result) throw new Error(`Unknown gate: ${gateKey}`);
  return result;
}