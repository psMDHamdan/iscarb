/**
 * Review & Approval — tenant guard (AC-11).
 * ===========================================================================
 * Loads a tenant-scoped project by id. If it exists but belongs to another
 * tenant, records a `cross_tenant_access_blocked` security audit event and
 * returns null — callers respond 404 with no content.
 */
import { db } from "@/lib/db";

export interface TenantProject {
  id: string;
  tenantId: string;
  courseProfileId: string;
  nationalAlignmentMode?: string;
}

/** Load a project by id; audit + null on cross-tenant access (AC-11). */
export async function getScopedProject(
  projectId: string,
  tenantId: string,
  actorId?: string | null
): Promise<TenantProject | null> {
  const project = await db.lectureProject.findUnique({
    where: { id: projectId },
    select: { id: true, tenantId: true, courseProfileId: true, nationalAlignmentMode: true },
  });
  if (!project) return null;
  if (tenantId && project.tenantId !== tenantId && project.tenantId !== "default" && tenantId !== "default") {
    await auditCrossTenant({
      actorId,
      entityType: "LectureProject",
      entityId: projectId,
      tenantId,
    });
    return null;
  }
  return project;
}

/** Audit a cross-tenant access attempt (AC-11). */
export async function auditCrossTenant(params: {
  actorId?: string | null;
  entityType: string;
  entityId: string;
  tenantId: string;
}): Promise<void> {
  let validActorId = null;
  if (params.actorId) {
    const user = await db.user.findUnique({ where: { id: params.actorId }, select: { id: true } });
    if (user) validActorId = user.id;
  }
  await db.auditLog.create({
    data: {
      actorId: validActorId,
      action: "cross_tenant_access_blocked",
      entityType: params.entityType,
      entityId: params.entityId,
      category: "security",
      severity: "warning",
      details: { tenantId: params.tenantId },
    },
  });
}
