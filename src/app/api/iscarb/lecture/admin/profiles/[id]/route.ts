/**
 * FR-013 — Versioned Admin Profiles (item).
 * ===========================================================================
 * GET    /api/iscarb/lecture/admin/profiles/:id   → fetch profile version with hash
 * PATCH  /api/iscarb/lecture/admin/profiles/:id   → update draft schema, activate, or archive
 * DELETE /api/iscarb/lecture/admin/profiles/:id   → delete unreferenced draft/archived version
 *
 * Immutability: active & archived profiles reject schema mutations with 409 Conflict.
 * Activation: atomically archives sibling active profiles and activates target version.
 * Deletion: blocks active profiles (400) and profiles referenced in published packages (409).
 * Audit: all mutations write to db.auditLog with category="GOVERNANCE".
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";
import { computeProfileHash } from "@/lib/lecture/profile-governance";

const patchSchema = z.object({
  status: z.enum(["active", "archived"]).optional(),
  schema: z.record(z.string(), z.unknown()).optional(),
  reason: z.string().optional(),
});

export const GET = guard(
  { tier: "read", roles: ["admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const orgId = ctx.session.universityId ?? null;
    const tenantId = ctx.session.universityId ?? "default";

    const version = await db.lectureProfileVersion.findFirst({
      where: {
        id,
        tenantId,
        ...(orgId ? { organizationId: orgId } : {}),
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Profile version not found" }, { status: 404 });
    }

    const profileHash = computeProfileHash(version.schema ?? {});
    return NextResponse.json({ version: { ...version, profileHash } }, { status: 200 });
  }
);

export const PATCH = guard(
  { tier: "write", roles: ["admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const orgId = ctx.session.universityId ?? null;
    const tenantId = ctx.session.universityId ?? "default";

    const existing = await db.lectureProfileVersion.findFirst({
      where: {
        id,
        tenantId,
        ...(orgId ? { organizationId: orgId } : {}),
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Profile version not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 1. Immutability check: cannot mutate schema of active or archived profiles
    if (
      parsed.data.schema !== undefined &&
      (existing.status === "active" || existing.status === "archived")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot modify schema of an active or archived profile. Create a new draft version instead.",
        },
        { status: 409 }
      );
    }

    let updatedVersion = existing;
    let action = "UPDATE_DRAFT";
    let archivedSiblingsCount = 0;

    // 2. Activation logic: atomic transaction to archive siblings and activate target
    if (parsed.data.status === "active") {
      if (existing.status === "active") {
        return NextResponse.json(
          {
            version: {
              ...existing,
              profileHash: computeProfileHash(existing.schema ?? {}),
            },
          },
          { status: 200 }
        );
      }

      action = "ACTIVATE_VERSION";
      const [archivedResult, activatedRecord] = await db.$transaction([
        db.lectureProfileVersion.updateMany({
          where: {
            tenantId: existing.tenantId,
            profileType: existing.profileType,
            id: { not: id },
            status: "active",
          },
          data: { status: "archived" },
        }),
        db.lectureProfileVersion.update({
          where: { id },
          data: {
            status: "active",
            effectiveAt: new Date(),
            ...(existing.status === "draft" && parsed.data.schema
              ? { schema: parsed.data.schema }
              : {}),
          },
        }),
      ]);

      archivedSiblingsCount = archivedResult.count;
      updatedVersion = activatedRecord;
    } else if (parsed.data.status === "archived") {
      if (existing.status === "archived") {
        return NextResponse.json(
          {
            version: {
              ...existing,
              profileHash: computeProfileHash(existing.schema ?? {}),
            },
          },
          { status: 200 }
        );
      }

      action = "ARCHIVE_VERSION";
      updatedVersion = await db.lectureProfileVersion.update({
        where: { id },
        data: { status: "archived" },
      });
    } else if (parsed.data.schema !== undefined) {
      // Draft schema update
      action = "UPDATE_DRAFT";
      updatedVersion = await db.lectureProfileVersion.update({
        where: { id },
        data: { schema: parsed.data.schema },
      });
    }

    // 3. Governance Audit Trail
    await db.auditLog.create({
      data: {
        actorId: ctx.session.userId ?? null,
        action,
        entityType: "LectureProfileVersion",
        entityId: id,
        category: "GOVERNANCE",
        severity: "info",
        organizationId: orgId,
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify(updatedVersion),
        details: {
          profileType: existing.profileType,
          version: existing.version,
          tenantId: existing.tenantId,
          reason: parsed.data.reason ?? null,
          archivedSiblingsCount:
            action === "ACTIVATE_VERSION" ? archivedSiblingsCount : undefined,
        },
      },
    });

    const profileHash = computeProfileHash(updatedVersion.schema ?? {});
    return NextResponse.json(
      { version: { ...updatedVersion, profileHash } },
      { status: 200 }
    );
  }
);

export const DELETE = guard(
  { tier: "write", roles: ["admin"] },
  async (
    _req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const orgId = ctx.session.universityId ?? null;
    const tenantId = ctx.session.universityId ?? "default";

    const existing = await db.lectureProfileVersion.findFirst({
      where: {
        id,
        tenantId,
        ...(orgId ? { organizationId: orgId } : {}),
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Profile version not found" }, { status: 404 });
    }

    // 1. Block deletion if active
    if (existing.status === "active") {
      return NextResponse.json(
        { error: "Cannot delete an active profile version — archive it first" },
        { status: 400 }
      );
    }

    // 2. Block deletion if referenced by published lecture packages
    const referencingPackages = await db.lecturePackageVersion.findMany({
      where: {
        status: { in: ["approved", "exported"] },
      },
      select: { id: true, profileVersionsJson: true },
    });

    const isReferenced = referencingPackages.some((pkg) => {
      if (!pkg.profileVersionsJson) return false;
      const jsonStr =
        typeof pkg.profileVersionsJson === "string"
          ? pkg.profileVersionsJson
          : JSON.stringify(pkg.profileVersionsJson);
      return jsonStr.includes(id);
    });

    if (isReferenced) {
      return NextResponse.json(
        {
          error:
            "Cannot delete profile version referenced by published lecture packages",
        },
        { status: 409 }
      );
    }

    await db.lectureProfileVersion.delete({ where: { id } });

    // Governance Audit Trail
    await db.auditLog.create({
      data: {
        actorId: ctx.session.userId ?? null,
        action: "DELETE_DRAFT",
        entityType: "LectureProfileVersion",
        entityId: id,
        category: "GOVERNANCE",
        severity: "warn",
        organizationId: orgId,
        beforeJson: JSON.stringify(existing),
        details: {
          profileType: existing.profileType,
          version: existing.version,
          tenantId: existing.tenantId,
        },
      },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  }
);
