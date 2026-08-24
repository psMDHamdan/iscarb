/**
 * Faculty slide image upload / serve / remove.
 * ===========================================================================
 * POST   /api/iscarb/lecture/projects/[id]/slides/[slideNo]/image
 * GET    same — serve the faculty-uploaded (or fall through 404)
 * DELETE same — clear faculty override, revert to auto image
 *
 * Stores bytes in LECTURE_STORAGE_* (S3 / local fallback). Persists URL on
 * content.visualSpec.facultyUploadedUrl — never base64 in the DB.
 */
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";
import {
  uploadLectureFile,
  getLectureFile,
  buildSlideImageStorageKey,
} from "@/lib/lecture/storage";
import { clearProjectionCache } from "@/lib/lecture/projections/projection-cache";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

async function loadLatestArtifact(projectId: string, slideNo: number) {
  return db.lectureSlideArtifact.findFirst({
    where: { projectId, slideNo, status: { not: "superseded" } },
    orderBy: { version: "desc" },
  });
}

function facultyServeUrl(projectId: string, slideNo: number, versionToken: string): string {
  return `/api/iscarb/lecture/projects/${projectId}/slides/${slideNo}/image?v=${encodeURIComponent(versionToken)}`;
}

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string; slideNo: string }> }
  ) => {
    const { id: projectId, slideNo: slideNoRaw } = await params;
    const slideNo = Number(slideNoRaw);
    if (!Number.isInteger(slideNo) || slideNo < 1 || slideNo > 20) {
      return NextResponse.json({ error: "Invalid slide number (1–20)" }, { status: 400 });
    }

    const tenantId = ctx.session.universityId || "default";
    const scoped = await getScopedProject(projectId, tenantId, ctx.session.userId);
    if (!scoped) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const artifact = await loadLatestArtifact(scoped.id, slideNo);
    if (!artifact) {
      return NextResponse.json(
        { error: "Slide artifact not found — generate the slide before uploading an image" },
        { status: 404 }
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Expected multipart/form-data with a file field" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const upload = file as File;
    const ext = extOf(upload.name || "");
    const expectedMime = ALLOWED[ext];
    if (!expectedMime) {
      return NextResponse.json(
        {
          error: `Unsupported file type '${ext || "(none)"}'. Allowed: jpg, jpeg, png, webp`,
        },
        { status: 415 }
      );
    }
    if (upload.type && upload.type !== expectedMime && !upload.type.startsWith("multipart/")) {
      return NextResponse.json(
        { error: `File extension does not match content type (got ${upload.type}, expected ${expectedMime})` },
        { status: 415 }
      );
    }

    const bytes = Buffer.from(await upload.arrayBuffer());
    if (bytes.length === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json(
        { error: `File exceeds 5 MB limit (${(bytes.length / (1024 * 1024)).toFixed(1)} MB)` },
        { status: 413 }
      );
    }

    const versionToken = randomUUID().slice(0, 12);
    const filename = `${versionToken}${ext}`;
    const storageKey = buildSlideImageStorageKey(scoped.id, slideNo, filename);
    await uploadLectureFile(storageKey, bytes, expectedMime);

    const facultyUploadedUrl = facultyServeUrl(scoped.id, slideNo, versionToken);
    const currentContent = (artifact.contentJson as Record<string, any>) || {};
    const priorSpec = currentContent.visualSpec || {};
    const updatedContent = {
      ...currentContent,
      visualSpec: {
        ...priorSpec,
        facultyUploadedUrl,
        facultyUploadedStorageKey: storageKey,
        facultyUploadedAt: new Date().toISOString(),
        facultyUploadedOriginalName: upload.name || filename,
        // Keep auto URLs intact so remove/revert can fall back to them.
        imageUrl: priorSpec.imageUrl || priorSpec.fetchedImageUrl || priorSpec.imageUrl,
        fetchedImageUrl: priorSpec.fetchedImageUrl || priorSpec.imageUrl,
      },
    };

    const updated = await db.lectureSlideArtifact.update({
      where: { id: artifact.id },
      data: { contentJson: updatedContent, updatedAt: new Date() },
    });

    clearProjectionCache(scoped.id);

    return NextResponse.json({
      success: true,
      slideNo,
      imageUrl: facultyUploadedUrl,
      storageKey,
      visualSpec: updatedContent.visualSpec,
      artifactId: updated.id,
    });
  }
);

export const GET = guard(
  { tier: "read", roles: ["faculty", "admin", "student"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string; slideNo: string }> }
  ) => {
    const { id: projectId, slideNo: slideNoRaw } = await params;
    const slideNo = Number(slideNoRaw);
    if (!Number.isInteger(slideNo) || slideNo < 1 || slideNo > 20) {
      return NextResponse.json({ error: "Invalid slide number" }, { status: 400 });
    }

    const tenantId = ctx.session.universityId || "default";
    const scoped = await getScopedProject(projectId, tenantId, ctx.session.userId);
    if (!scoped) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const artifact = await loadLatestArtifact(scoped.id, slideNo);
    if (!artifact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const spec = ((artifact.contentJson as any)?.visualSpec || {}) as {
      facultyUploadedStorageKey?: string;
      facultyUploadedUrl?: string;
    };
    const key = spec.facultyUploadedStorageKey;
    if (!key) return NextResponse.json({ error: "No faculty image for this slide" }, { status: 404 });

    try {
      const buffer = await getLectureFile(key);
      const lower = key.toLowerCase();
      const contentType = lower.endsWith(".png")
        ? "image/png"
        : lower.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json({ error: "Image file missing from storage" }, { status: 404 });
    }
  }
);

export const DELETE = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string; slideNo: string }> }
  ) => {
    const { id: projectId, slideNo: slideNoRaw } = await params;
    const slideNo = Number(slideNoRaw);
    if (!Number.isInteger(slideNo) || slideNo < 1 || slideNo > 20) {
      return NextResponse.json({ error: "Invalid slide number" }, { status: 400 });
    }

    const tenantId = ctx.session.universityId || "default";
    const scoped = await getScopedProject(projectId, tenantId, ctx.session.userId);
    if (!scoped) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const artifact = await loadLatestArtifact(scoped.id, slideNo);
    if (!artifact) return NextResponse.json({ error: "Slide artifact not found" }, { status: 404 });

    const currentContent = (artifact.contentJson as Record<string, any>) || {};
    const priorSpec = { ...(currentContent.visualSpec || {}) };
    delete priorSpec.facultyUploadedUrl;
    delete priorSpec.facultyUploadedStorageKey;
    delete priorSpec.facultyUploadedAt;
    delete priorSpec.facultyUploadedOriginalName;

    const updatedContent = {
      ...currentContent,
      visualSpec: priorSpec,
    };

    await db.lectureSlideArtifact.update({
      where: { id: artifact.id },
      data: { contentJson: updatedContent, updatedAt: new Date() },
    });

    clearProjectionCache(scoped.id);

    return NextResponse.json({
      success: true,
      slideNo,
      visualSpec: priorSpec,
      revertedTo:
        priorSpec.fetchedImageUrl || priorSpec.imageUrl || null,
    });
  }
);
