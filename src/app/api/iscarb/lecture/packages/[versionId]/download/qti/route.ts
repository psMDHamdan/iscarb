import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { generateQtiPackage, type QtiReadinessItem } from "@/lib/lecture/renderer/qti-renderer";
import { auditCrossTenant } from "@/lib/lecture/review/tenant-guard";
import { resolvePackageSnapshot } from "@/lib/lecture/review/review-logic";

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin", "student"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ versionId: string }> }
  ) => {
    const { versionId } = await params;
    const tenantId = ctx.session.universityId || "default";

    const version = await db.lecturePackageVersion.findUnique({
      where: { id: versionId },
      include: {
        project: {
          include: {
            courseProfile: true,
            slideArtifacts: { orderBy: { slideNo: "asc" } },
            readinessItems: { orderBy: { slideNo: "asc" } },
          },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Package version not found" }, { status: 404 });
    }

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
      return NextResponse.json({ error: "Package version is not approved" }, { status: 403 });
    }

    const snapshot = resolvePackageSnapshot({
      artifacts: version.project.slideArtifacts ?? [],
      readiness: version.project.readinessItems ?? [],
      approvedArtifactIds: version.approvedArtifacts,
      approvedAt: version.approvedAt,
    });
    if (snapshot.artifacts.length === 0) {
      return NextResponse.json(
        { error: "PACKAGE_SNAPSHOT_EMPTY", message: "This package version has no frozen approved slides." },
        { status: 422 }
      );
    }

    try {
      const qtiResult = await generateQtiPackage({
        packageVersion: version,
        project: { ...version.project, slideArtifacts: snapshot.artifacts },
        readinessItems: snapshot.readiness as QtiReadinessItem[],
      });

      return new NextResponse(qtiResult.zipBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${qtiResult.filename}"`,
          "Content-Length": String(qtiResult.zipBuffer.length),
          "Cache-Control": "private, max-age=300",
        },
      });
    } catch (err) {
      console.error("[download/qti] packaging failed:", err);
      return NextResponse.json({ error: "QTI packaging failed" }, { status: 500 });
    }
  }
);
