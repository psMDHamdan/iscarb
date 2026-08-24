import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { renderPPTX } from "@/lib/lecture/renderer/pptx-renderer";
import { renderHTML } from "@/lib/lecture/renderer/html-renderer";
import { renderInstructorGuideDOCX } from "@/lib/lecture/renderer/instructor-guide-renderer";
import { renderEvidencePackPDF } from "@/lib/lecture/renderer/evidence-pack-renderer";
import { renderPDF } from "@/lib/lecture/renderer/pdf-renderer";
import { deduplicateSlideArtifacts, deduplicateReadinessItems } from "@/lib/lecture/deduplication";
import { embedFacultyImagesForExport } from "@/lib/lecture/export-embed-images";

const FORMATS = ["pptx", "pdf", "html", "instructor_guide", "evidence_pack"] as const;
type Format = (typeof FORMATS)[number];

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string; format: string }> }
  ) => {
    const { id, format: rawFormat } = await params;
    const cleanId = id.replace(/^PREVIEW_/, "");

    if (!(FORMATS as readonly string[]).includes(rawFormat)) {
      return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
    }
    const format = rawFormat as Format;

    const tenantId = ctx.session.universityId || "default";

    const project = await db.lectureProject.findFirst({
      where: {
        OR: [{ id: cleanId }, { id }],
        tenantId,
      },
      include: {
        slideArtifacts: { orderBy: { slideNo: "asc" } },
        readinessItems: { orderBy: { slideNo: "asc" } },
        courseProfile: true,
        sourceBlocks: true,
        coverageLinks: true,
        gateResults: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const courseCode = project.courseProfile?.courseCode ?? "CRISPR-101";
    const artifacts = await embedFacultyImagesForExport(
      deduplicateSlideArtifacts(project.slideArtifacts)
    );
    const readinessItems = deduplicateReadinessItems(project.readinessItems);

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    try {
      switch (format) {
        case "pptx": {
          buffer = await renderPPTX(artifacts, "ztm");
          contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
          filename = `${courseCode}-lecture.pptx`;
          break;
        }
        case "pdf": {
          const html = renderHTML(artifacts, readinessItems);
          try {
            buffer = await renderPDF(html);
            contentType = "application/pdf";
            filename = `${courseCode}-lecture.pdf`;
          } catch {
            return NextResponse.json(
              { error: "PDF_UNAVAILABLE", message: "PDF rendering engine is currently unavailable." },
              { status: 503 }
            );
          }
          break;
        }
        case "html": {
          const html = renderHTML(artifacts, readinessItems);
          buffer = Buffer.from(html, "utf-8");
          contentType = "text/html; charset=utf-8";
          filename = `${courseCode}-interactive.html`;
          break;
        }
        case "instructor_guide": {
          buffer = await renderInstructorGuideDOCX(
            artifacts,
            readinessItems,
            project.courseProfile
          );
          contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          filename = `${courseCode}-instructor-guide.docx`;
          break;
        }
        case "evidence_pack": {
          const blockMap = new Map((project.sourceBlocks ?? []).map((b) => [b.id, b.locator]));
          const coverage = (project.coverageLinks ?? []).map((c) => ({
            blockId: c.blockId,
            locator: blockMap.get(c.blockId) ?? c.blockId,
            disposition: c.disposition,
            reason: c.reason ?? null,
          }));

          const teacherEntered = project.courseProfile?.teacherEnteredClos;
          const clos = Array.isArray(teacherEntered)
            ? (teacherEntered as any[]).map((c, i) => ({
                number: String(c.number ?? c.id ?? i + 1),
                text: String(c.text ?? c.description ?? ""),
                bloomLevel: String(c.bloomLevel ?? "Apply"),
              }))
            : [];

          const citations = (artifacts ?? []).flatMap((s) => {
            const c = (s.contentJson ?? {}) as any;
            const result: any[] = [];
            if (Array.isArray(c.citations)) {
              for (const cit of c.citations) {
                result.push({
                  claim: cit.claim ?? cit.text ?? "Source citation",
                  sourceKey: cit.sourceKey ?? "authoritative",
                  url: cit.url ?? cit.locator ?? "",
                  hash: cit.hash ?? "",
                  retrievedAt: cit.retrievedAt ?? new Date().toISOString(),
                });
              }
            }
            return result;
          });

          const readiness = (readinessItems ?? []).map((r) => ({
            slideNo: r.slideNo,
            stem: r.stem,
            clo: r.cloId ?? "N/A",
            outcome: (r as any).outcomeId ?? null,
          }));

          const gates = (project.gateResults ?? []).map((g) => ({
            gateKey: g.gateKey,
            severity: g.severity,
            status: g.status,
          }));

          try {
            buffer = await renderEvidencePackPDF({
              projectTitle: project.courseProfile?.title ?? project.title ?? "Course Project",
              manifestHash: project.id,
              approvedBy: "Faculty Lead",
              approvedAt: new Date().toISOString(),
              coverage,
              clos,
              citations,
              readiness,
              gates,
            });
            contentType = "application/pdf";
            filename = `${courseCode}-evidence-pack.pdf`;
          } catch {
            return NextResponse.json(
              { error: "PDF_UNAVAILABLE", message: "Evidence pack rendering failed." },
              { status: 503 }
            );
          }
          break;
        }
      }
    } catch (err) {
      console.error("[project-download] rendering failed:", err);
      return NextResponse.json({ error: "Rendering failed" }, { status: 500 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=60",
      },
    });
  }
);
