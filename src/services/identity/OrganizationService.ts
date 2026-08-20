import { db } from '@/lib/db';
import { AuditService } from './AuditService';

export class OrganizationService {
  /**
   * Get an organization by ID
   */
  static async getOrganization(id: string) {
    return db.organization.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new organization
   */
  static async createOrganization(data: { name: string; type: string; slug: string }, actorId?: string) {
    const org = await db.organization.create({
      data: {
        name: data.name,
        type: data.type,
        slug: data.slug,
        status: 'active',
      },
    });

    await AuditService.log({
      actorId,
      action: 'CREATE_ORGANIZATION',
      entityType: 'Organization',
      entityId: org.id,
      afterJson: JSON.stringify(org),
      category: 'user_management',
      severity: 'info',
      organizationId: org.id,
    });

    return org;
  }

  /**
   * Update organization
   */
  static async updateOrganization(id: string, data: any, actorId?: string) {
    const oldOrg = await db.organization.findUnique({ where: { id } });
    
    const org = await db.organization.update({
      where: { id },
      data,
    });

    await AuditService.log({
      actorId,
      action: 'UPDATE_ORGANIZATION',
      entityType: 'Organization',
      entityId: org.id,
      beforeJson: JSON.stringify(oldOrg),
      afterJson: JSON.stringify(org),
      category: 'system_config',
      severity: 'info',
      organizationId: org.id,
    });

    return org;
  }
}
