/**
 * NFR-02 — Data RetentionPolicy (tenant-configurable).
 * ===========================================================================
 * GET  /api/iscarb/lecture/admin/retention         → list all policies
 * POST /api/iscarb/lecture/admin/retention         → create or update a policy
 *
 * Each policy targets one entityType (assessment | lecture | audit_log | pii | rag_retrieval)
 * and specifies retentionDays + action (archive | delete). Policies are
 * tenant-scoped: a null organizationId is the global default; a non-null
 * value overrides the global for that tenant (AC-11).
 *
 * Admin role only. All mutations are audited (NFR-02).
 */
import { NextResponse } from "next/server";
import { guard, type GuardContext } from "@/lib/api-guard";
import { z } from "zod";
import { db } from "@/lib/db";

const ENTITY_TYPES = [
  "assessment",
  "lecture",
  "lecture_source",
  "audit_log",
  "pii",
  "rag_retrieval",
  "model_runs",
] as const;

const ACTIONS = ["archive", "delete", "anonymize"] as const;

const bodySchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  retentionDays: z.number().int().min(1).max(36500),
  action: z.enum(ACTIONS).default("archive"),
  enabled: z.boolean().default(true),
});

export const GET = guard(
  { tier: "read", roles: ["admin"] },
  async (_req: Request, ctx: GuardContext) => {
    const orgId = ctx.session.universityId ?? null;

    // Show global defaults + tenant-specific overrides
    const policies = await db.dataRetentionPolicy.findMany({
      where: {
        OR: [
          { organizationId: null }, // global defaults
          ...(orgId ? [{ organizationId: orgId }] : []),
        ],
      },
      orderBy: [{ entityType: "asc" }, { organizationId: "asc" }],
    });

    return NextResponse.json({ policies }, { status: 200 });
  }
);

export const POST = guard(
  { tier: "write", roles: ["admin"] },
  async (req: Request, ctx: GuardContext) => {
    const orgId = ctx.session.universityId ?? null;

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // Upsert: one policy per (entityType, organizationId)
    const existing = await db.dataRetentionPolicy.findFirst({
      where: {
        entityType: d.entityType,
        organizationId: orgId ?? null,
      },
    });

    let policy;
    if (existing) {
      policy = await db.dataRetentionPolicy.update({
        where: { id: existing.id },
        data: {
          retentionDays: d.retentionDays,
          action: d.action,
          enabled: d.enabled,
        },
      });
    } else {
      policy = await db.dataRetentionPolicy.create({
        data: {
          entityType: d.entityType,
          retentionDays: d.retentionDays,
          action: d.action,
          organizationId: orgId,
          enabled: d.enabled,
        },
      });
    }

    // Audit the policy change (NFR-02)
    await db.auditLog.create({
      data: {
        actorId: ctx.session.userId ?? null,
        action: existing ? "retention_policy_updated" : "retention_policy_created",
        entityType: "DataRetentionPolicy",
        entityId: policy.id,
        category: "GOVERNANCE",
        severity: "info",
        organizationId: orgId,
        details: {
          entityType: d.entityType,
          retentionDays: d.retentionDays,
          action: d.action,
          enabled: d.enabled,
        },
      },
    });

    return NextResponse.json({ policy }, { status: existing ? 200 : 201 });
  }
);
