import { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
import { AuditService } from './AuditService';

// We import a raw Prisma Client that bypasses the tenant extension 
// for platform-level operations (creating orgs, getting org details across tenants).
// In a real implementation, we might want a dedicated unextended client instance.
const platformDb = new PrismaClient();

export class OrganizationManagerService {
  
  /**
   * Creates a new organization and initializes its default settings.
   * This is a platform-level operation typically done by Super Admins.
   */
  static async createOrganization(data: {
    name: string;
    slug: string;
    type: string;
    domain?: string;
  }, actorId: string) {
    
    // Create the org and its default settings in a transaction
    const org = await platformDb.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          type: data.type,
          domain: data.domain,
          status: 'active',
          settings: {
            create: {
              ssoEnabled: false,
              mfaRequired: false,
              auditEnabled: true,
            }
          }
        },
        include: { settings: true }
      });

      return newOrg;
    });

    await AuditService.logEvent({
      action: 'organization.created',
      actorId,
      actorRole: 'admin',
      targetId: org.id,
      targetType: 'Organization',
      metadata: { name: org.name, slug: org.slug }
    });

    return org;
  }

  /**
   * Suspends an organization, blocking logins and API access.
   */
  static async suspendOrganization(orgId: string, actorId: string, reason: string) {
    const org = await platformDb.organization.update({
      where: { id: orgId },
      data: { status: 'suspended' }
    });

    await AuditService.logEvent({
      action: 'organization.suspended',
      actorId,
      actorRole: 'admin',
      targetId: org.id,
      targetType: 'Organization',
      metadata: { reason }
    });

    return org;
  }

  /**
   * Initiates the deletion of an organization (sets status to deleting).
   */
  static async initiateDeletion(orgId: string, actorId: string) {
    const org = await platformDb.organization.update({
      where: { id: orgId },
      data: { status: 'deleting' }
    });

    await AuditService.logEvent({
      action: 'organization.deletion_requested',
      actorId,
      actorRole: 'admin',
      targetId: org.id,
      targetType: 'Organization',
      metadata: { scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
    });

    return org;
  }

  /**
   * Updates an organization's configuration.
   */
  static async updateSettings(orgId: string, settings: any, actorId: string) {
    const updated = await platformDb.organizationSettings.update({
      where: { organizationId: orgId },
      data: settings
    });

    await AuditService.logEvent({
      action: 'settings.updated',
      actorId,
      actorRole: 'admin',
      targetId: orgId,
      targetType: 'Organization',
      metadata: { changes: Object.keys(settings) }
    });

    return updated;
  }
}
