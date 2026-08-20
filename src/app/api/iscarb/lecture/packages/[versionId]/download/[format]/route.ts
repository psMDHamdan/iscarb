/**
 * Export Download API — serves exported lecture files.
 * ===========================================================================
 * GET /api/iscarb/lecture/packages/:versionId/download/:format
 *
 * Maps formatId → exportKeys key, fetches the file from object storage,
 * and streams it to the client with correct Content-Type and Content-Disposition.
 *
 * Format IDs:
 *   pptx              → student deck
 *   pdf               → executive PDF
 *   html              → interactive HTML
 *   instructor_guide  → instructor guide PDF
 *   evidence_pack     → NCAAA evidence pack PDF
 *   qti               → QTI assessment package
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { getLectureFile, getLectureFileUrl } from "@/lib/lecture/storage";
import { renderPPTX } from "@/lib/lecture/renderer/pptx-renderer";
import { renderHTML } from "@/lib/lecture/renderer/html-renderer";
import { renderPDF } from "@/lib/lecture/renderer/pdf-renderer";
import { renderInstructorGuideDOCX } from "@/lib/lecture/renderer/instructor-guide-renderer";
import { renderEvidencePackPDF } from "@/lib/lecture/renderer/evidence-pack-renderer";
import { deduplicateSlideArtifacts, deduplicateReadinessItems } from "@/lib/lecture/deduplication";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";

async function buildEvidenceData(
  projectId: string,
  manifestHash: string | null,
  approvedBy: string | null,
  approvedAt: Date | null,
  clos: { number: string; text: string; bloomLevel: string }[]
) {
  const project = await db.lectureProject.findUnique({
    where: { id: projectId },
    include: { courseProfile: true },
  });
  const gateResults = await db.lectureGateResult.findMany({ where: { projectId } });
  const artifacts = await db.lectureSlideArtifact.findMany({
    where: { projectId },
    orderBy: { slideNo: "asc" },
  });
  const readiness = await db.lectureReadinessItem.findMany({ where: { projectId } });

  return {
    projectTitle: project?.title ?? "Lecture",
    manifestHash: manifestHash ?? "N/A",
    approvedBy: approvedBy ?? "Faculty",
    approvedAt: approvedAt ? approvedAt.toISOString() : new Date().toISOString(),
    coverage: artifacts.map((a: { contentJson: unknown; slideNo: number }) => {
      const src = (a.contentJson as any)?.sourceCoverage as any;
      return {
        blockId: src?.mappedBlockIds?.[0] ?? "",
        locator: src?.sourceLocator ?? `Slide ${a.slideNo}`,
        disposition: src?.mappedBlockIds?.length ? "mapped" : "none",
        reason: src?.mappedBlockIds?.length ? null : "no source blocks mapped",
      };
    }),
    clos: clos.map((c) => ({ number: c.number, text: c.text, bloomLevel: c.bloomLevel })),
    citations: [],
    readiness: readiness.map((r: { slideNo: number; stem: string; cloId: string }) => ({
      slideNo: r.slideNo,
      stem: r.stem,
      clo: r.cloId,
      outcome: null,
    })),
    gates: gateResults.map((g: { gateKey: string; status: string; severity: string }) => ({ gateKey: g.gateKey, status: g.status, severity: g.severity })),
  };
}

const FORMAT_MIME: Record<string, string> = {
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  html: "text/html",
  instructor_guide: "application/pdf",
  instructor_guide_pdf: "application/pdf",
  instructor_guide_docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  evidence_pack: "application/pdf",
  qti: "application/zip",
};

const FORMAT_EXTENSIONS: Record<string, string> = {
  pptx: ".pptx",
  pdf: ".pdf",
  html: ".html",
  instructor_guide: ".pdf",
  instructor_guide_pdf: ".pdf",
  instructor_guide_docx: ".docx",
  evidence_pack: ".pdf",
  qti: ".zip",
};

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin", "student"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ versionId: string; format: string }> }
  ) => {
    const { versionId, format: formatId } = await params;
    const tenantId = ctx.session.universityId || "default";

    const version = await db.lecturePackageVersion.findUnique({
      where: { id: versionId },
      include: { project: { select: { id: true, tenantId: true, title: true, courseProfileId: true } } },
    });

    if (!version) {
      return NextResponse.json({ error: "Package version not found" }, { status: 404 });
    }

    const scoped = await getScopedProject(version.projectId, tenantId, ctx.session.userId);
    if (!scoped) {
      return NextResponse.json({ error: "Package version not found" }, { status: 404 });
    }

    if (version.status !== "approved") {
      return NextResponse.json(
        { error: "Package version is not approved for download" },
        { status: 403 }
      );
    }

    const contentType = FORMAT_MIME[formatId] ?? "application/octet-stream";
    const ext = FORMAT_EXTENSIONS[formatId] ?? "";
    const safeTitle = (version.project.title ?? "lecture")
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80);
    const filename = `${safeTitle}-v${version.version}${ext}`;
    const exportKeys = (version.exportKeys as Record<string, string> | null) ?? {};
    const storageKey = exportKeys[formatId] ?? exportKeys["instructor_guide"] ?? exportKeys["instructor_guide.pdf"] ?? null;

    // If file key exists in storage, try serving it from storage first
    if (storageKey) {
      try {
        const url = await getLectureFileUrl(storageKey, 300);
        if (url.startsWith("file://")) {
          const buffer = await getLectureFile(storageKey);
          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Content-Disposition": `attachment; filename="${filename}"`,
              "Cache-Control": "private, max-age=300",
            },
          });
        }
        return NextResponse.redirect(url, {
          status: 302,
          headers: {
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      } catch (err) {
        console.warn(`[DownloadRoute] Storage fetch failed for key ${storageKey}, falling back to dynamic rendering:`, err);
      }
    }

    // Dynamic on-the-fly rendering fallback if not pre-rendered in storage
    try {
      const artifactIds = (version.approvedArtifacts as string[] | null) ?? [];
      let rawArtifacts = await db.lectureSlideArtifact.findMany({
        where: artifactIds.length > 0 ? { id: { in: artifactIds } } : { projectId: version.projectId },
        orderBy: { slideNo: "asc" },
      });
      if (rawArtifacts.length === 0) {
        rawArtifacts = await db.lectureSlideArtifact.findMany({
          where: { projectId: version.projectId },
          orderBy: { slideNo: "asc" },
        });
      }
      const artifacts = deduplicateSlideArtifacts(rawArtifacts);

      const rawReadiness = await db.lectureReadinessItem.findMany({
        where: { projectId: version.projectId },
      });
      const readinessItems = deduplicateReadinessItems(rawReadiness);

      const courseProfile = version.project.courseProfileId
        ? await db.lectureCourseProfile.findUnique({
            where: { id: version.project.courseProfileId },
          })
        : null;
      const clos = (courseProfile?.teacherEnteredClos as unknown as { number: string; text: string; bloomLevel: string }[] | null) ?? [];

      let fileBuffer: Buffer | Uint8Array;
      let finalContentType = contentType;

      if (formatId === "pptx") {
        fileBuffer = await renderPPTX(artifacts, "ztm");
      } else if (formatId === "html") {
        const html = renderHTML(artifacts, readinessItems);
        fileBuffer = Buffer.from(html, "utf-8");
      } else if (formatId === "instructor_guide" || formatId === "instructor_guide_docx") {
        fileBuffer = await renderInstructorGuideDOCX(artifacts, readinessItems, clos);
      } else if (formatId === "evidence_pack") {
        const evidenceData = await buildEvidenceData(version.projectId, version.manifestHash, version.approvedBy, version.approvedAt, clos);
        try {
          fileBuffer = await renderEvidencePackPDF(evidenceData);
        } catch {
          const html = renderHTML(artifacts, readinessItems);
          fileBuffer = Buffer.from(html, "utf-8");
          finalContentType = "text/html";
        }
      } else {
        // Default PDF / Executive PDF
        const html = renderHTML(artifacts, readinessItems);
        try {
          fileBuffer = await renderPDF(html);
        } catch {
          fileBuffer = Buffer.from(html, "utf-8");
          finalContentType = "text/html";
        }
      }

      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          "Content-Type": finalContentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, max-age=300",
        },
      });
    } catch (err: any) {
      console.error(`[DownloadRoute] On-the-fly rendering failed:`, err);
      return NextResponse.json(
        { error: `Failed to render download format '${formatId}': ${err.message}` },
        { status: 500 }
      );
    }
  }
);
