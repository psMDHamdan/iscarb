/**
 * NCAAA Report Sections — POST (TASK-06 §E, F8).
 * ===========================================================================
 * POST /api/iscarb/lecture/projects/:id/ncaaa-report-sections
 * Body: { requirementIds: string[] }
 * Drafts a cited narrative from approved evidence using DeepSeek. Output is
 * explicitly labeled "system-suggested narrative" (NFR-10) — never claims
 * accreditation.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";
import { chatJson } from "@/lib/ai-engine";

const MODEL = "nvidia/nemotron-3-nano-30b-a3b";

const bodySchema = z.object({
  requirementIds: z.array(z.string().min(1)).min(1, "At least one requirement is required"),
});

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await getScopedProject(id, tenantId, ctx.session.userId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const links = await db.lectureNCAAAEvidenceLink.findMany({
      where: { projectId: id, requirementId: { in: parsed.data.requirementIds } },
      select: { requirementId: true, locator: true, status: true, qualityAction: true },
    });
    if (links.length === 0) {
      return NextResponse.json(
        { error: "No approved evidence links for the requested requirements on this project" },
        { status: 400 }
      );
    }

    const requirementIds = [...new Set(parsed.data.requirementIds)];
    const draft = await draftNarrative(links);

    const section = await db.lectureNCAAAReportSection.create({
      data: {
        projectId: id,
        requirementIds,
        narrative: draft.narrative,
        citations: draft.citations,
        sourceMode: "official_snapshot",
        verifierStatus: "draft",
      },
    });

    return NextResponse.json(
      { sectionId: section.id, status: "drafting", narrative: section.narrative },
      { status: 202 }
    );
  }
);

export interface NarrativeDraft {
  narrative: string;
  citations: { requirementId: string; locator: string | null }[];
}

export async function draftNarrative(
  links: { requirementId: string; locator: string | null; status: string; qualityAction: string | null }[]
): Promise<NarrativeDraft> {
  const system =
    "You draft NCAAA self-study narrative text from approved evidence only. " +
    "This is a system-suggested narrative, not an accreditation claim (NFR-10). " +
    "Never assert accreditation status; phrase as evidence summaries. Return STRICT JSON only.";
  const user = [
    "Draft a narrative section for the following approved evidence items:",
    JSON.stringify(links, null, 2),
    'Return JSON: { "narrative": string, "summary": string }',
    'Begin the narrative with the label: "System-suggested narrative".',
  ].join("\n");

  const result = await chatJson({ system, user, temperature: 0.3, model: MODEL });

  let narrative = "";
  if (result.json && (result.json as { fallback?: boolean }).fallback !== true) {
    narrative = String((result.json as { narrative?: unknown }).narrative ?? "");
  }
  if (!narrative) {
    narrative = "System-suggested narrative: no draft could be generated from the approved evidence.";
  }

  const citations = links
    .filter((l) => l.locator)
    .map((l) => ({ requirementId: l.requirementId, locator: l.locator }));

  return { narrative, citations };
}
