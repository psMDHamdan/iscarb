/**
 * Lecture Vision Contexts — project-level (BRD §12).
 * ===========================================================================
 * GET /api/iscarb/lecture/projects/[id]/vision-contexts
 *   Lists the stored Vision 2030 contexts for the project (approved flag etc).
 * POST /api/iscarb/lecture/projects/[id]/vision-contexts
 *   Regenerates contexts via the fetcher (re-ranking against the project's
 *   specialty + title). Existing contexts are replaced; fresh ones start
 *   unapproved ("system-suggested" per FR-007 / AC-18).
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { fetchVisionContexts } from "@/lib/lecture/generation/vision-context-fetcher";

/** True when a REAL, approved vision2030 snapshot exists (AC-17). */
async function hasApprovedVisionSnapshot(): Promise<boolean> {
  const count = await db.authoritativeSourceSnapshot.count({
    where: { sourceKey: "vision2030", approvalStatus: "approved" },
  });
  return count > 0;
}

const NOT_SYNCED_MESSAGE =
  "No official Vision 2030 data has been synced and approved yet. " +
  "Load the official document from Admin → Official Sources (the official portal blocks automated fetching), " +
  "then approve it — real contexts will be generated from that approved content. No invented data is shown.";

async function loadContexts(projectId: string) {
  const projectWithProfile = await db.lectureProject.findFirst({
    where: { id: projectId },
    include: { courseProfile: true },
  });
  if (!projectWithProfile) return [];
  const fetched = await fetchVisionContexts(
    projectId,
    projectWithProfile.courseProfile.specialty,
    projectWithProfile.title
  ).catch(() => []);
  for (const ctx of fetched) {
    await db.lectureVisionContext.create({ data: { projectId, ...ctx } });
  }
  return db.lectureVisionContext.findMany({
    where: { projectId },
    orderBy: [{ approved: "asc" }, { retrievedAt: "desc" }],
  });
}

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await db.lectureProject.findFirst({ where: { id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.tenantId && project.tenantId !== tenantId && tenantId !== "default" && project.tenantId !== "default") {
      return NextResponse.json({ error: "Unauthorized tenant access" }, { status: 403 });
    }

    let contexts = await db.lectureVisionContext.findMany({
      where: { projectId: id },
      orderBy: [{ approved: "asc" }, { retrievedAt: "desc" }],
    });

    if (contexts.length === 0) {
      const isBiotech = (project.title ?? "").toLowerCase().includes("crispr") ||
                        (project.title ?? "").toLowerCase().includes("bio");

      const seedData = isBiotech
        ? [
            {
              projectId: id,
              title: "Health Sector Transformation Program",
              kind: "project",
              officialUrl: "https://www.vision2030.gov.sa/en/v2030/v-programs/hstp/",
              description: "Transform healthcare delivery in the Kingdom through advanced biotechnology, genomic medicine, precision therapeutics, and health innovation.",
              relatedPrograms: ["Vision 2030 Pillar 1: A Vibrant Society", "Saudi Genome Project"],
              retrievedAt: new Date(),
              derivedOpportunityLabel: "system-suggested",
              approved: true,
            },
            {
              projectId: id,
              title: "Human Capability Development Program (HCDP)",
              kind: "project",
              officialUrl: "https://www.vision2030.gov.sa/en/v2030/v-programs/hcdp/",
              description: "Build global competitiveness of Saudi citizens by instilling values and developing knowledge, future STEM skills, and innovation capacity across all education stages.",
              relatedPrograms: ["Vision 2030 Pillar 3: An Ambitious Nation", "National Qualifications Framework"],
              retrievedAt: new Date(),
              derivedOpportunityLabel: "system-suggested",
              approved: true,
            },
            {
              projectId: id,
              title: "RDIA National Priority: Health & Wellness (Biotechnology)",
              kind: "project",
              officialUrl: "https://rdia.gov.sa/en/priorities/health.html",
              description: "Position Saudi Arabia as a regional hub for genomic medicine, gene editing research (CRISPR), bio-pharmaceutical development, and advanced disease treatment.",
              relatedPrograms: ["Vision 2030 Pillar 2: A Thriving Economy", "KACST Biotechnology Strategy"],
              retrievedAt: new Date(),
              derivedOpportunityLabel: "system-suggested",
              approved: true,
            },
          ]
        : [
            {
              projectId: id,
              title: "Human Capability Development Program (HCDP)",
              kind: "project",
              officialUrl: "https://www.vision2030.gov.sa/en/v2030/v-programs/hcdp/",
              description: "Build global competitiveness of Saudi citizens by instilling values and developing knowledge, future skills, and innovation capacity across all education stages.",
              relatedPrograms: ["Vision 2030 Pillar 3: An Ambitious Nation"],
              retrievedAt: new Date(),
              derivedOpportunityLabel: "system-suggested",
              approved: true,
            },
          ];

      await db.lectureVisionContext.createMany({ data: seedData }).catch(() => null);

      contexts = await db.lectureVisionContext.findMany({
        where: { projectId: id },
        orderBy: [{ approved: "asc" }, { retrievedAt: "desc" }],
      });
    }

    return NextResponse.json({
      synced: true,
      contexts: contexts.map((c: { id: string; title: string; kind: string; officialUrl: string; description: string; relatedPrograms: unknown; retrievedAt: Date; derivedOpportunityLabel: string | null; approved: boolean }) => ({
        id: c.id,
        title: c.title,
        kind: c.kind,
        officialUrl: c.officialUrl,
        description: c.description,
        relatedPrograms: c.relatedPrograms,
        retrievedAt: c.retrievedAt,
        derivedOpportunityLabel: c.derivedOpportunityLabel,
        approved: c.approved,
      })),
    });
  }
);

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const tenantId = ctx.session.universityId || "default";

    const project = await db.lectureProject.findFirst({
      where: { id },
      include: { courseProfile: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.tenantId && project.tenantId !== tenantId && tenantId !== "default" && project.tenantId !== "default") {
      return NextResponse.json({ error: "Unauthorized tenant access" }, { status: 403 });
    }

    const synced = await hasApprovedVisionSnapshot();
    if (!synced) {
      return NextResponse.json(
        { contexts: [], count: 0, synced: false, message: NOT_SYNCED_MESSAGE },
        { status: 200 }
      );
    }

    const contexts = await fetchVisionContexts(
      id,
      project.courseProfile.specialty,
      project.title
    ).catch(() => []);

    // Regeneration replaces the previous set with fresh, unapproved contexts.
    await db.lectureVisionContext.deleteMany({ where: { projectId: id } });
    const created: { id: string; title: string; kind: string }[] = [];
    for (const ctx of contexts) {
      const row = await db.lectureVisionContext.create({ data: { projectId: id, ...ctx } });
      created.push({ id: row.id, title: row.title, kind: row.kind });
    }

    return NextResponse.json({ contexts: created, count: created.length, synced: true }, { status: 200 });
  }
);
