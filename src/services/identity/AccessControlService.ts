import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/tenantContext';

export class AccessControlService {
  
  /**
   * Main entry point for checking permissions.
   * Evaluates RBAC, temporary elevations, and ABAC policies.
   */
  static async checkPermission(
    userId: string, 
    resource: string, 
    action: string, 
    context?: any
  ): Promise<boolean> {
    const organizationId = getTenantContext();
    if (!organizationId) return false;

    // 1. Get all active roles for the user (Standard + Elevated)
    const roleIds = await this.getActiveRoleIds(userId, organizationId);
    if (roleIds.length === 0) return false;

    // 2. Check RBAC
    const hasRbacPermission = await this.checkRbacPermission(roleIds, resource, action);
    if (!hasRbacPermission) {
      return false; // Deny if they don't even have the base role permission
    }

    // 3. Check ABAC (Attribute-Based Access Control)
    const abacResult = await this.evaluateAbacPolicies(organizationId, userId, roleIds, resource, action, context);
    
    return abacResult;
  }

  /**
   * Retrieves both permanent roles and active temporary dynamic roles.
   */
  private static async getActiveRoleIds(userId: string, organizationId: string): Promise<string[]> {
    // Standard Roles
    const userRoles = await db.userRole.findMany({
      where: { 
        userId, 
        organizationId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      select: { roleId: true }
    });

    // Elevated Roles (Dynamic)
    const now = new Date();
    const dynamicRoles = await db.dynamicRoleAssignment.findMany({
      where: {
        userId,
        isActive: true,
        approvalStatus: 'APPROVED',
        elevationStart: { lte: now },
        elevationEnd: { gt: now },
      },
      include: {
        elevatedRole: true
      }
    });

    const roleIds = new Set<string>();
    userRoles.forEach(ur => roleIds.add(ur.roleId));
    dynamicRoles.forEach(dr => {
      // Only include dynamic role if it belongs to the current org or is global
      if (!dr.elevatedRole.organizationId || dr.elevatedRole.organizationId === organizationId) {
        roleIds.add(dr.elevatedRoleId);
      }
    });

    return Array.from(roleIds);
  }

  /**
   * Checks if any of the given roles possess the requested permission.
   * Handles role inheritance.
   */
  private static async checkRbacPermission(roleIds: string[], resource: string, action: string): Promise<boolean> {
    // Fast path: direct permission check
    const count = await db.rolePermissions.count({
      where: {
        roleId: { in: roleIds },
        permission: {
          resource,
          action
        }
      }
    });

    if (count > 0) return true;

    // Slow path: check parent roles (1 level deep for simplicity in this example)
    const roles = await db.role.findMany({
      where: { id: { in: roleIds }, parentRoleId: { not: null }, inheritsPermissions: true },
      select: { parentRoleId: true }
    });

    if (roles.length > 0) {
      const parentRoleIds = roles.map(r => r.parentRoleId as string);
      return this.checkRbacPermission(parentRoleIds, resource, action);
    }

    return false;
  }

  /**
   * Evaluates custom ABAC policies for the given resource/action.
   * Returns true if allowed, false if explicitly denied or failed.
   */
  private static async evaluateAbacPolicies(
    organizationId: string, 
    userId: string,
    roleIds: string[],
    resource: string, 
    action: string, 
    context: any
  ): Promise<boolean> {
    const policies = await db.abacPolicy.findMany({
      where: {
        organizationId,
        enabled: true,
        OR: [
          { resource, permission: action },
          { resource: '*', permission: '*' },
          { resource, permission: '*' }
        ]
      },
      orderBy: { priority: 'asc' }
    });

    // If no specific policies, default allow (since RBAC passed)
    if (policies.length === 0) return true;

    // Evaluate policies in order
    // In a real implementation, conditionExpression would be evaluated using 
    // a safe sandbox or rules engine (e.g., json-rules-engine).
    // For demonstration, we simply parse it as JSON matching the context.
    
    for (const policy of policies) {
      try {
        const condition = JSON.parse(policy.conditionExpression);
        const matches = this.evaluateCondition(condition, context, userId, roleIds);
        
        if (matches) {
          if (policy.effect === 'DENY') return false;
          if (policy.effect === 'ALLOW') return true;
        }
      } catch (e) {
        console.error('Failed to evaluate ABAC policy', policy.id, e);
        return false; // Fail secure
      }
    }

    return true; // Default allow if RBAC passed and no ABAC rules explicitly denied
  }

  private static evaluateCondition(condition: any, context: any, userId: string, roleIds: string[]): boolean {
    // Stub for actual rules engine
    return true; 
  }
}
