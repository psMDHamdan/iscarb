import { db } from '@/lib/db';
import { AuditService } from './AuditService';

// Simple in-memory cache for permissions until Redis is fully integrated
const permissionCache: Map<string, { permissions: Set<string>, expiresAt: number }> = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export class AuthorizationService {
  /**
   * Check if a user has a specific permission within an organization
   */
  static async checkPermission(
    userId: string,
    organizationId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const permissionName = `${resource}:${action}`;
    const cacheKey = `${userId}:${organizationId}`;

    let permissions = await this.getUserPermissions(userId, organizationId);
    
    const hasPermission = permissions.has(permissionName);

    // Audit the permission check (as required by zero-trust & AI integration)
    if (!hasPermission) {
      await AuditService.log({
        actorId: userId,
        action: 'PERMISSION_DENIED',
        entityType: resource,
        category: 'authorization',
        severity: 'warning',
        organizationId,
        details: { action, permissionName },
      });
    }

    return hasPermission;
  }

  /**
   * Helper to get and cache a user's permissions
   */
  private static async getUserPermissions(userId: string, organizationId: string): Promise<Set<string>> {
    const cacheKey = `${userId}:${organizationId}`;
    const cached = permissionCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true,
              }
            }
          }
        }
      }
    });

    const permissions = new Set<string>();
    
    // If user has a direct role assigned
    if (user?.userRoles && user.userRoles.length > 0) {
      user.userRoles.forEach(userRole => {
        // Ensure the role applies to the org (either platform-wide or specific to this org)
        if (!userRole.organizationId || userRole.organizationId === organizationId) {
          userRole.role.permissions.forEach(p => {
            permissions.add(`${p.resource}:${p.action}`);
          });
        }
      });
    }

    // Update Cache
    permissionCache.set(cacheKey, {
      permissions,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return permissions;
  }

  /**
   * Clear cache for a user (called when roles change)
   */
  static clearCache(userId: string, organizationId: string) {
    permissionCache.delete(`${userId}:${organizationId}`);
  }
}
