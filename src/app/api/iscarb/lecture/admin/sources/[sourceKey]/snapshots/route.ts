/**
 * Official Sources — load a document manually (bot-protection fallback).
 * ===========================================================================
 * POST /api/iscarb/lecture/admin/sources/:sourceKey/snapshots
 * Body: { content: string, url?: string, language?: "en" | "ar" }
 * Roles: admin only.
 *
 * Some official Saudi portals (vision2030.gov.sa, etec.gov.sa) sit behind
 * Cloudflare challenges / geo-blocks that a datacenter fetch cannot pass.
 * This endpoint lets an admin paste the official document text they have
 * already obtained (e.g. opened in a real browser) as a PENDING snapshot.
 * Nothing is used by product surfaces until the admin approves it (AC-17),
 * at which point the approval hook parses it into real rows.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { createHash } from "crypto";
import { db } from "@/lib/db";

const ALLOWED_KEYS = ["ncaaa", "jaheziah", "vision2030"] as const;

const bodySchema = z.object({
  content: z.string().min(20, "Content is too short — paste the official document text."),
  url: z.string().url().optional(),
  language: z.enum(["en", "ar"]).optional(),
});

export const POST = guard(
  { tier: "write", roles: ["admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ sourceKey: string }> }
  ) => {
    const { sourceKey } = await params;
    if (!(ALLOWED_KEYS as readonly string[]).includes(sourceKey)) {
      return NextResponse.json({ error: `Unknown source: ${sourceKey}` }, { status: 404 });
    }

    // Sources are platform-level (organizationId null); admin sees them all.
    const orgId = ctx.session.universityId ?? null;
    const source = await db.authoritativeSource.findFirst({
      where: { sourceKey, ...(orgId ? { OR: [{ organizationId: orgId }, { organizationId: null }] } : {}) },
    });
    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 }
      );
    }

    const contentText = parsed.data.content.trim();
    const contentHash = createHash("sha256").update(contentText).digest("hex");

    // Idempotency: identical content already pending/active → reuse.
    const existing = await db.authoritativeSourceSnapshot.findFirst({
      where: { sourceKey, contentHash, translationOfSnapshotId: null },
    });
    if (existing) {
      return NextResponse.json(
        { snapshotId: existing.id, status: existing.approvalStatus, deduped: true },
        { status: 200 }
      );
    }

    // Snapshots are platform-level, matching the sync path — no organizationId
    // (the caller's universityId is not necessarily an Organization row).
    const snapshot = await db.authoritativeSourceSnapshot.create({
      data: {
        sourceKey,
        url: parsed.data.url ?? source.originalUrl,
        language: parsed.data.language ?? source.originalLanguage ?? "en",
        contentText,
        contentHash,
        approvalStatus: "pending",
      },
    });

    await db.auditLog.create({
      data: {
        actorId: ctx.session.userId ?? null,
        action: "source_snapshot_loaded_manually",
        entityType: "AuthoritativeSourceSnapshot",
        entityId: snapshot.id,
        category: "source_sync",
        severity: "info",
        details: { sourceKey, chars: contentText.length, url: parsed.data.url ?? null },
      },
    });

    return NextResponse.json(
      { snapshotId: snapshot.id, status: "pending", deduped: false },
      { status: 201 }
    );
  }
);
