/**
 * Export Trigger API (TASK-08 §A).
 * ===========================================================================
 * POST /api/iscarb/lecture/packages/[versionId]/exports
 * Body: { formats: ('pptx'|'pdf'|'html'|'instructor_guide'|'evidence_pack')[] }
 *
 * Pre-check: PackageVersion.status must be "approved" (400 otherwise).
 * Renders the requested formats synchronously from the approved artifacts,
 * uploads each to object storage, records the keys on the package version,
 * and returns 200 with the storage keys.
 *
 * `instructor_guide` produces both PDF and DOCX (plan §E). Deterministic:
 * rendering never calls the LLM (FR-012).
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import { renderPPTX } from "@/lib/lecture/renderer/pptx-renderer";
import { renderHTML } from "@/lib/lecture/renderer/html-renderer";
import { renderPDF } from "@/lib/lecture/renderer/pdf-renderer";
import {
  renderInstructorGuidePDF,
  renderInstructorGuideDOCX,
} from "@/lib/lecture/renderer/instructor-guide-renderer";
import { renderEvidencePackPDF } from "@/lib/lecture/renderer/evidence-pack-renderer";
import { generateQtiPackage } from "@/lib/lecture/renderer/qti-renderer";
import {
  buildStorageKey,
  uploadLectureFile,
} from "@/lib/lecture/storage";
import { runSingleGate } from "@/lib/lecture/quality/gate-runner";
import { auditCrossTenant } from "@/lib/lecture/review/tenant-guard";
import { deduplicateSlideArtifacts, deduplicateReadinessItems } from "@/lib/lecture/deduplication";

const FORMATS = ["pptx", "pdf", "html", "instructor_guide", "evidence_pack", "qti"] as const;
type Format = (typeof FORMATS)[number];

const bodySchema = z.object({
  formats: z.array(z.enum(FORMATS)).min(1),
});

interface ExportAsset {
  filename: string;
  mimeType: string;
  data: Buffer | string;
}

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ versionId: string }> }
  ) => {
    const { versionId } = await params;
    const tenantId = ctx.session.universityId || "default";

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const version = await db.lecturePackageVersion.findUnique({
      where: { id: versionId },
      include: { project: true },
    });
    if (!version) return NextResponse.json({ error: "Package version not found" }, { status: 404 });
    if (version.project.tenantId !== tenantId) {
      await auditCrossTenant({
        actorId: ctx.session.userId,
        entityType: "LecturePackageVersion",
        entityId: versionId,
        tenantId,
      });
      return NextResponse.json({ error: "Package version not found" }, { status: 404 });
    }
    if (version.status !== "approved") {
      return NextResponse.json(
        { error: "Package version is not approved for export" },
        { status: 400 }
      );
    }

    const artifactIds = (version.approvedArtifacts as string[] | null) ?? [];
    const rawArtifacts = await db.lectureSlideArtifact.findMany({
      where: { id: { in: artifactIds } },
      orderBy: { slideNo: "asc" },
    });
    const artifacts = deduplicateSlideArtifacts(rawArtifacts);
    const rawReadiness = await db.lectureReadinessItem.findMany({
      where: { projectId: version.projectId },
    });
    const readinessItems = deduplicateReadinessItems(rawReadiness);
    const courseProfile = await db.lectureCourseProfile.findUnique({
      where: { id: version.project.courseProfileId },
    });
    const clos = (courseProfile?.teacherEnteredClos as unknown as { number: string; text: string; bloomLevel: string }[] | null) ?? [];

    const formats = parsed.data.formats as Format[];
    const keys: Record<string, string> = {};
    const existing = (version.exportKeys as Record<string, string> | null) ?? {};

    for (const format of formats) {
      const assets = await buildAssets(format, artifacts, readinessItems, clos, version);
      for (const asset of assets) {
        const key = buildStorageKey(version.projectId, `package-${version.version}`, asset.filename);
        await uploadLectureFile(key, toBuffer(asset), asset.mimeType);
        keys[asset.format ?? format] = key;
      }
    }

    await db.lecturePackageVersion.update({
      where: { id: versionId },
      data: { exportKeys: { ...existing, ...keys } },
    });

    await runSingleGate(version.projectId, "cross_format_parity");

    return NextResponse.json(
      { versionId, formats: keys, requestedFormats: formats },
      { status: 200 }
    );
  }
);

async function buildAssets(
  format: Format,
  artifacts: { slideNo: number; contentJson: unknown }[],
  readinessItems: {
    slideNo: number;
    stem: string;
    correctIndex: number;
    options: unknown;
    difficulty: string;
    rationale: string | null;
    cloId: string;
    sourceLocator: string | null;
  }[],
  clos: { number: string; text: string; bloomLevel: string }[],
  version: {
    id?: string;
    projectId: string;
    version: number;
    manifestHash: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
  }
): Promise<(ExportAsset & { format?: string })[]> {
  switch (format) {
    case "pptx":
      return [
        {
          filename: `lecture-v${version.version}.pptx`,
          mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          data: await renderPPTX(artifacts, "ztm"),
        },
      ];
    case "html": {
      const html = renderHTML(artifacts, readinessItems);
      return [{ filename: `lecture-v${version.version}.html`, mimeType: "text/html", data: html }];
    }
    case "pdf": {
      const html = renderHTML(artifacts, readinessItems);
      return [
        { filename: `lecture-v${version.version}.pdf`, mimeType: "application/pdf", data: await renderPDF(html) },
      ];
    }
    case "instructor_guide":
      return [
        {
          format: "instructor_guide.pdf",
          filename: `instructor-guide-v${version.version}.pdf`,
          mimeType: "application/pdf",
          data: await renderInstructorGuidePDF(artifacts, readinessItems, clos),
        },
        {
          format: "instructor_guide.docx",
          filename: `instructor-guide-v${version.version}.docx`,
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          data: await renderInstructorGuideDOCX(artifacts, readinessItems, clos),
        },
      ];
    case "evidence_pack":
      return [
        {
          filename: `evidence-pack-v${version.version}.pdf`,
          mimeType: "application/pdf",
          data: await renderEvidencePackPDF(
            await buildEvidenceData(version.projectId, version.manifestHash, version.approvedBy, version.approvedAt, clos)
          ),
        },
      ];
    case "qti": {
      const qtiResult = await generateQtiPackage({
        packageVersion: {
          id: version.id ?? version.projectId,
          version: version.version,
          manifestHash: version.manifestHash,
        },
        project: {
          id: version.projectId,
          courseProfile: { courseCode: "course" },
          slideArtifacts: artifacts,
        },
        readinessItems,
      });
      return [
        {
          filename: `qti-assessment-v${version.version}.zip`,
          mimeType: "application/zip",
          data: qtiResult.zipBuffer,
        },
      ];
    }
  }
}

function toBuffer(asset: ExportAsset): Buffer {
  return typeof asset.data === "string" ? Buffer.from(asset.data, "utf8") : asset.data;
}

async function buildEvidenceData(
  projectId: string,
  manifestHash: string | null,
  approvedBy: string | null,
  approvedAt: Date | null,
  clos: { number: string; text: string; bloomLevel: string }[]
): Promise<Parameters<typeof renderEvidencePackPDF>[0]> {
  const [project, coverage, citations, readiness, gates, blocks, documents] = await Promise.all([
    db.lectureProject.findUnique({
      where: { id: projectId },
      select: { title: true },
    }),
    db.lectureCoverageLink.findMany({
      where: { projectId },
      select: { blockId: true, disposition: true, reason: true, block: { select: { locator: true } } },
    }),
    db.lectureSlideArtifact.findMany({
      where: { projectId },
      select: { citations: true },
    }),
    db.lectureReadinessItem.findMany({
      where: { projectId },
      select: { slideNo: true, stem: true, cloId: true, outcomeId: true },
    }),
    db.lectureGateResult.findMany({
      where: { projectId },
      select: { gateKey: true, severity: true, status: true },
    }),
    db.lectureSourceBlock.findMany({
      where: { projectId },
      select: { id: true, documentId: true, locator: true },
    }),
    db.lectureSourceDocument.findMany({
      where: { projectId },
      select: { id: true, originalName: true, hash: true, createdAt: true },
    }),
  ]);

  const documentById = new Map(documents.map((d) => [d.id, d]));
  const blockById = new Map(blocks.map((b) => [b.id, b]));

  return {
    projectTitle: project?.title ?? "Untitled lecture",
    manifestHash: manifestHash ?? "—",
    approvedBy: approvedBy ?? "—",
    approvedAt: approvedAt?.toISOString() ?? "—",
    coverage: coverage.map((c) => ({
      blockId: c.blockId,
      locator: c.block?.locator ?? "?",
      disposition: c.disposition,
      reason: c.reason,
    })),
    clos: clos.map((c) => ({ number: c.number, text: c.text, bloomLevel: c.bloomLevel })),
    citations: citations.flatMap((a) =>
      ((a.citations as unknown as { sourceBlockId: string; locator: string; excerpt: string }[]) ?? []).map(
        (ci) => {
          const block = blockById.get(ci.sourceBlockId);
          const doc = block ? documentById.get(block.documentId) : undefined;
          return {
            claim: ci.excerpt,
            sourceKey: doc?.originalName ?? "lecture-source",
            url: ci.locator,
            hash: doc?.hash ?? "—",
            retrievedAt: doc?.createdAt?.toISOString() ?? "—",
          };
        }
      )
    ),
    readiness: readiness.map((r) => ({
      slideNo: r.slideNo,
      stem: r.stem,
      clo: r.cloId,
      outcome: r.outcomeId,
    })),
    gates: gates.map((g) => ({ gateKey: g.gateKey, severity: g.severity, status: g.status })),
  };
}
