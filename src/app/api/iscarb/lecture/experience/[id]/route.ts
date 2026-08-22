import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { StudentUxAdapter } from "@/lib/lecture/projections/student-ux-adapter";
import { projectLegacyStudentExperience } from "@/lib/lecture/projections/legacy-student-ux-adapter";
import { getCachedProjection, setCachedProjection, clearProjectionCache } from "@/lib/lecture/projections/projection-cache";
import type { LearningExperience } from "@/lib/lecture/types/learning-experience";

/**
 * Full Prisma include for hydrating all LearningExperience relations
 * needed by the StudentUxAdapter projection.
 */
const EXPERIENCE_INCLUDE = {
  blueprint: true,
  conceptBlocks: { orderBy: { orderIndex: "asc" as const } },
  activities: { orderBy: { orderIndex: "asc" as const } },
  assessments: { orderBy: { orderIndex: "asc" as const } },
  visuals: { orderBy: { orderIndex: "asc" as const } },
  guide: true,
  evidenceReferences: true,
} as const;

export function clearExperienceCache(id: string) {
  clearProjectionCache(id);
}

/**
 * Converts a raw Prisma LearningExperience row (with JSON columns) into
 * the canonical TypeScript LearningExperience shape expected by the adapter.
 */
function toCanonical(row: any): LearningExperience {
  return {
    ...row,
    // Prisma stores blueprint JSON columns as raw objects; ensure they pass through.
    blueprint: row.blueprint
      ? {
          ...row.blueprint,
          learningOutcomes: row.blueprint.learningOutcomes ?? [],
          stagePlanJson: row.blueprint.stagePlanJson ?? [],
          prerequisiteGraph: row.blueprint.prerequisiteGraph ?? { nodes: [], edges: [] },
          pacingStrategy: row.blueprint.pacingStrategy ?? { totalDurationMin: 50, checkpoints: [] },
        }
      : undefined,
    // ConceptBlock.misconceptions is not a DB column — derive from misconceptionAlert text.
    conceptBlocks: (row.conceptBlocks || []).map((cb: any) => ({
      ...cb,
      misconceptions: cb.misconceptions ?? [],
    })),
    // AssessmentItem.options is stored as Json in Prisma.
    assessments: (row.assessments || []).map((a: any) => ({
      ...a,
      options: Array.isArray(a.options) ? a.options : [],
      distractorExplanations: a.distractorExplanations ?? {},
    })),
    // VisualArtifact.specificationJson is a Json column — pass through.
    visuals: (row.visuals || []).map((v: any) => ({
      ...v,
      specificationJson: v.specificationJson ?? {},
    })),
    // EvidenceReference doesn't have a `citation` column in Prisma; construct it.
    evidenceReferences: (row.evidenceReferences || []).map((er: any) => ({
      ...er,
      citation: er.citation ?? {
        sourceKey: er.sourceLocator || "Source Document",
        hash: "",
        retrievedAt: er.createdAt?.toISOString?.() || new Date().toISOString(),
      },
    })),
    // Guide JSON columns.
    guide: row.guide
      ? {
          ...row.guide,
          facultyGuideJson: row.guide.facultyGuideJson ?? {},
          studentCompanionJson: row.guide.studentCompanionJson ?? {},
        }
      : undefined,
  } as LearningExperience;
}

// GET /api/iscarb/lecture/experience/[id]
// Returns StudentExperienceViewModel projected through StudentUxAdapter.
export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id: rawId } = await params;
      const id = rawId.replace(/^PREVIEW_/, "");
      const tenantId = ctx.session.universityId || "default";

      // Check cache first for sub-50ms instant response
      const cached = getCachedProjection(rawId);
      if (cached !== null) {
        return NextResponse.json(cached, { status: 200 });
      }

      const isPreview = rawId.startsWith("PREVIEW_");

      // 1. Try to find a LearningExperience directly by ID or clean projectId.
      // We do this even in preview mode now that the engine generates real LearningExperience rows.
      let row = await db.learningExperience.findFirst({
        where: { OR: [{ id }, { id: rawId }, { projectId: id }] },
        orderBy: { version: "desc" },
        include: EXPERIENCE_INCLUDE,
      });

      // An empty shell row (approved but never populated with concept blocks)
      // must not win over the legacy projection — fall through to legacy data.
      if (row && (!row.conceptBlocks || row.conceptBlocks.length === 0)) {
        row = null;
      }

      if (!row) {
        // 2. Project the lecture data model (slide plans + artifacts + readiness items)
        let legacy = await projectLegacyStudentExperience({ id, tenantId });
        
        // If direct legacy lookup failed, attempt resolving id through artifacts or plans
        if (!legacy) {
          const artifact = await db.lectureSlideArtifact.findFirst({
            where: { OR: [{ id }, { projectId: id }] },
            select: { projectId: true },
          });
          if (artifact?.projectId) {
            legacy = await projectLegacyStudentExperience({ id: artifact.projectId, tenantId });
          }
        }

        if (legacy) {
          setCachedProjection(rawId, legacy);
          return NextResponse.json(legacy, { status: 200 });
        }

        // Distinguish "project exists but no slide content has been generated
        // yet" from a genuinely missing experience — the studio needs to tell
        // faculty to run generation instead of showing a generic not-found.
        const existingProject = await db.lectureProject.findFirst({
          where: { id, tenantId },
          select: { id: true },
        });
        if (existingProject) {
          const artifactCount = await db.lectureSlideArtifact.count({
            where: { projectId: existingProject.id },
          });
          if (artifactCount === 0) {
            return NextResponse.json(
              {
                error: "NOT_GENERATED",
                message: "No slide content has been generated yet. Run slide generation in the Studio first.",
              },
              { status: 404 }
            );
          }
        }
        return NextResponse.json(
          { error: "Learning experience not found" },
          { status: 404 }
        );
      }

      // Tenant isolation check.
      if (row.tenantId !== tenantId && tenantId !== "default") {
        return NextResponse.json(
          { error: "Learning experience not found" },
          { status: 404 }
        );
      }

      // 3. Convert to canonical type and project through StudentUxAdapter.
      const experience = toCanonical(row);
      const adapter = new StudentUxAdapter();
      const result = await adapter.project(experience);

      if (!result.success || !result.data) {
        return NextResponse.json(
          {
            error: "Projection failed",
            details: result.errors.map((e) => e.message),
          },
          { status: 500 }
        );
      }

      return NextResponse.json(result.data, { status: 200 });
    } catch (err: any) {
      console.error("[experience] failed to project student experience:", err);
      return NextResponse.json(
        { error: "Failed to render student experience", details: err?.message },
        { status: 500 }
      );
    }
  }
);
