/**
 * Official Sources Hub — collection (additive, used by the Admin Sources screen).
 * ===========================================================================
 * GET /api/iscarb/lecture/admin/sources
 *
 * Lists the three AuthoritativeSource rows (ncaaa / jaheziah / vision2030)
 * with their snapshots, active id, and freshness. Read-only; admin role.
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { db } from "@/lib/db";

export const GET = guard(
  { tier: "read", roles: ["admin"] },
  async (_req: Request, ctx: GuardContext) => {
    const orgId = ctx.session.universityId ?? null;

    const sources = await db.authoritativeSource.findMany({
      where: orgId ? { organizationId: orgId } : {},
      orderBy: { sourceKey: "asc" },
      include: {
        snapshots: {
          orderBy: { retrievedAt: "desc" },
          select: {
            id: true,
            url: true,
            language: true,
            retrievedAt: true,
            contentHash: true,
            approvalStatus: true,
            translationStatus: true,
          },
        },
      },
    });

    return NextResponse.json({ sources }, { status: 200 });
  }
);
