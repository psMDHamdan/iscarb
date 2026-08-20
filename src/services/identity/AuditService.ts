import { db } from '@/lib/db';

export type AuditLogCategory = 
  | 'authentication'
  | 'authorization'
  | 'user_management'
  | 'role_management'
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'system_config'
  | 'security';

export type AuditLogSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogOptions {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeJson?: string;
  afterJson?: string;
  ipAddress?: string;
  userAgent?: string;
  category: AuditLogCategory;
  severity: AuditLogSeverity;
  details?: any;
  universityId?: string;
  organizationId?: string;
}

export class AuditService {
  /**
   * Log an event to the unified audit log
   */
  static async log(options: AuditLogOptions) {
    try {
      await db.auditLog.create({
        data: {
          actor: options.actorId ? { connect: { id: options.actorId } } : undefined,
          action: options.action,
          entityType: options.entityType,
          entityId: options.entityId,
          beforeJson: options.beforeJson,
          afterJson: options.afterJson,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          category: options.category,
          severity: options.severity,
          details: options.details ? JSON.parse(JSON.stringify(options.details)) : undefined,
          organizationId: options.organizationId || options.universityId,
        },
      });
      // In a full implementation, we might also publish this to Kafka here.
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // We shouldn't throw here to prevent bringing down the main transaction,
      // but in a strict compliance environment, maybe we would.
    }
  }
}
