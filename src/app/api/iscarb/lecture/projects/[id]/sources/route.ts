/**
 * Lecture Planning — source document upload.
 * ===========================================================================
 * POST /api/iscarb/lecture/projects/[id]/sources
 *
 * Accepts multipart/form-data with `file`. Flow:
 *   1. Validate project exists in the caller's tenant (404)
 *   2. Validate extension + MIME type (415 on mismatch / unsupported)
 *   3. Enforce 50 MB size cap (413)
 *   4. Persist LectureSourceDocument (parseStatus="parsing") + hash
 *   5. Upload the raw bytes to S3
 *   6. Fire-and-forget the parse worker, publishing job progress in Redis
 */
import { NextResponse } from "next/server";
import { createHash } from "crypto";

// Source parsing may take time for large PDFs/PPTX. Extend Vercel timeout.
export const maxDuration = 120;
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { uploadLectureFile, buildStorageKey } from "@/lib/lecture/storage";
import { scanUploadedFile } from "@/lib/lecture/sources/malware-scanner";
import { enqueueParse } from "@/lib/lecture/queue";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".html": "text/html",
  ".htm": "text/html",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

export const POST = guard(
  { tier: "write", roles: ["faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id: projectId } = await params;
      const tenantId = ctx.session.universityId || "default";

      const project = await db.lectureProject.findFirst({ where: { id: projectId, tenantId } });
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const extractedText = formData.get("extractedText") as string | null;
      
      if (!file || !file.name) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }

      const ext = extOf(file.name);
      const expectedMime = ALLOWED_TYPES[ext];
      if (!expectedMime) {
        return NextResponse.json(
          { error: `Unsupported file type '${ext}'. Allowed: pdf, pptx, docx, html, png, jpg` },
          { status: 415 }
        );
      }
      if (file.type && !file.type.startsWith("multipart/") && file.type !== expectedMime) {
        return NextResponse.json({ error: "File extension does not match its content type" }, { status: 415 });
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      if (bytes.length > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File exceeds 50 MB limit" }, { status: 413 });
      }
      if (bytes.length === 0) {
        return NextResponse.json({ error: "Empty file" }, { status: 400 });
      }

      const scan = await scanUploadedFile(bytes, ext.replace(".", ""));
      if (!scan.ok) {
        return NextResponse.json({ error: `File rejected: ${scan.reason ?? "malware check failed"}` }, { status: 422 });
      }

      const document = await db.lectureSourceDocument.create({
        data: {
          projectId,
          type: ext.replace(".", ""),
          originalName: file.name,
          storageKey: "",
          hash: createHash("sha256").update(bytes).digest("hex"),
          parseStatus: extractedText ? "done" : "parsing",
        },
      });

      const storageKey = buildStorageKey(projectId, document.id, file.name);
      await uploadLectureFile(storageKey, bytes, expectedMime);
      await db.lectureSourceDocument.update({ where: { id: document.id }, data: { storageKey } });

      if (extractedText) {
        // Bypass the parser queue, create a block directly from client-OCR text
        await db.lectureSourceBlock.create({
          data: {
            projectId,
            documentId: document.id,
            locator: "image:1",
            type: "text",
            text: extractedText,
            criticality: "normal",
            status: "unresolved",
          }
        });
      } else {
        await enqueueParse(document.id);
      }

      return NextResponse.json(
        {
          documentId: document.id,
          jobId: document.id,
          projectId,
          originalName: file.name,
          status: extractedText ? "done" : "parsing",
        },
        { status: 202 }
      );
    } catch (err: any) {
      console.error("[SOURCES UPLOAD ERROR]", err);
      return NextResponse.json(
        { error: err?.message || String(err), stack: err?.stack },
        { status: 500 }
      );
    }
  }
);
