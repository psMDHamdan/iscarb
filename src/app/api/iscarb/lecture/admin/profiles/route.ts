/**
 * FR-013 — Versioned Admin Profiles (collection).
 * ===========================================================================
 * GET  /api/iscarb/lecture/admin/profiles        → list versions by type & status
 * POST /api/iscarb/lecture/admin/profiles        → create new version (status draft)
 *
 * Roles: admin only. Org-scoped via guard + organizationId.
 * Audit: creates auditLog record with category "GOVERNANCE" on draft creation.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import { computeProfileHash, PROFILE_TYPES } from "@/lib/lecture/profile-governance";

const createSchema = z.object({
  profileType: z.enum(PROFILE_TYPES),
  schema: z.record(z.string(), z.unknown()),
  tenantId: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = guard(
  { tier: "read", roles: ["admin"] },
  async (req: Request, ctx: GuardContext) => {
    const orgId = ctx.session.universityId ?? null;
    const url = new URL(req.url);
    const profileType = url.searchParams.get("profileType");
    const status = url.searchParams.get("status");

    const versions = await db.lectureProfileVersion.findMany({
      where: {
        tenantId: ctx.session.universityId ?? "default",
        ...(profileType ? { profileType } : {}),
        ...(status ? { status } : {}),
        ...(orgId ? { organizationId: orgId } : {}),
      },
      orderBy: [{ profileType: "asc" }, { version: "desc" }],
    });

    const versionsWithHash = versions.map((v) => ({
      ...v,
      profileHash: computeProfileHash(v.schema ?? {}),
    }));

    return NextResponse.json({ versions: versionsWithHash }, { status: 200 });
  }
);

export const POST = guard(
  { tier: "write", roles: ["admin"] },
  async (req: Request, ctx: GuardContext) => {
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const orgId = ctx.session.universityId ?? null;
    const tenantId = parsed.data.tenantId ?? ctx.session.universityId ?? "default";

    // Next version number for this (tenantId, profileType).
    const latest = await db.lectureProfileVersion.findFirst({
      where: { tenantId, profileType: parsed.data.profileType },
      orderBy: { version: "desc" },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    const version = await db.lectureProfileVersion.create({
      data: {
        organizationId: orgId ?? undefined,
        tenantId,
        profileType: parsed.data.profileType,
        schema: parsed.data.schema,
        version: nextVersion,
        status: "draft",
        createdBy: ctx.session.userId,
      },
    });

    // Record governance audit log
    await db.auditLog.create({
      data: {
        actorId: ctx.session.userId ?? null,
        action: "CREATE_DRAFT",
        entityType: "LectureProfileVersion",
        entityId: version.id,
        category: "GOVERNANCE",
        severity: "info",
        organizationId: orgId,
        afterJson: JSON.stringify(version),
        details: {
          profileType: version.profileType,
          version: version.version,
          tenantId,
          notes: parsed.data.notes ?? null,
        },
      },
    });

    const profileHash = computeProfileHash(version.schema ?? {});

    return NextResponse.json(
      { version: { ...version, profileHash } },
      { status: 201 }
    );
  }
);
