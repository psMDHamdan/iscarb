/**
 * Role-Based Access Control (RBAC) system for iSCARB
 * ===========================================================================
 * Defines roles, permissions, and provides utilities for checking access.
 */

import { Role, Permission, RolePermissions } from "@prisma/client";

/**
 * Define all available roles in the system
 */
export const ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  RECRUITER: "recruiter",
  DEAN: "dean",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
  UNIVERSITY_ADMIN: "university_admin",
  SYSTEM_ADMIN: "system_admin",
  IT_OPS: "it_ops",
  RESEARCHER: "researcher",
  DEVELOPER: "developer",
  PARTNER: "partner",
  ALUMNI: "alumni",
  EMPLOYER: "employer",
  AUDITOR: "auditor",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Define all available permissions in the system
 */
export const PERMISSIONS = {
  // User management
  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Role management
  ROLE_READ: "role:read",
  ROLE_CREATE: "role:create",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",

  // Course management
  COURSE_READ: "course:read",
  COURSE_CREATE: "course:create",
  COURSE_UPDATE: "course:update",
  COURSE_DELETE: "course:delete",

  // Assessment management
  ASSESSMENT_READ: "assessment:read",
  ASSESSMENT_CREATE: "assessment:create",
  ASSESSMENT_UPDATE: "assessment:update",
  ASSESSMENT_DELETE: "assessment:delete",

  // Portfolio management
  PORTFOLIO_READ: "portfolio:read",
  PORTFOLIO_CREATE: "portfolio:create",
  PORTFOLIO_UPDATE: "portfolio:update",
  PORTFOLIO_DELETE: "portfolio:delete",

  // Admin settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  // Analytics
  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_EXPORT: "analytics:export",

  // System administration
  SYSTEM_ADMIN: "system:admin",

  // Research
  RESEARCH_READ: "research:read",
  RESEARCH_CREATE: "research:create",
  RESEARCH_UPDATE: "research:update",
  RESEARCH_DELETE: "research:delete",

  // Career / Jobs
  CAREER_READ: "career:read",
  CAREER_CREATE: "career:create",
  CAREER_UPDATE: "career:update",
  CAREER_DELETE: "career:delete",

  // Audit
  AUDIT_READ: "audit:read",

  // API / Developer
  API_READ: "api:read",
  API_CREATE: "api:create",
  API_UPDATE: "api:update",
  API_DELETE: "api:delete",

  // Partner
  PARTNER_READ: "partner:read",
  PARTNER_CREATE: "partner:create",
  PARTNER_UPDATE: "partner:update",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Define role-permission mappings
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.STUDENT]: [
    PERMISSIONS.USER_READ, // own profile only
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.ASSESSMENT_READ,
    PERMISSIONS.PORTFOLIO_CREATE,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.PORTFOLIO_UPDATE, // own portfolio
    PERMISSIONS.PORTFOLIO_DELETE, // own portfolio
    PERMISSIONS.CAREER_READ,
  ],

  [ROLES.FACULTY]: [
    PERMISSIONS.USER_READ, // students in their courses
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.ASSESSMENT_READ,
    PERMISSIONS.ASSESSMENT_CREATE,
    PERMISSIONS.ASSESSMENT_UPDATE,
    PERMISSIONS.PORTFOLIO_READ, // student portfolios
    PERMISSIONS.ANALYTICS_VIEW, // their course analytics
    PERMISSIONS.RESEARCH_READ,
    PERMISSIONS.RESEARCH_CREATE,
    PERMISSIONS.RESEARCH_UPDATE,
  ],

  [ROLES.RECRUITER]: [
    PERMISSIONS.USER_READ, // student profiles (limited)
    PERMISSIONS.PORTFOLIO_READ, // student portfolios
    PERMISSIONS.ANALYTICS_VIEW, // graduate outcomes
    PERMISSIONS.CAREER_READ,
    PERMISSIONS.CAREER_CREATE,
    PERMISSIONS.CAREER_UPDATE,
  ],

  [ROLES.DEAN]: [
    // College-level access
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.ASSESSMENT_READ,
    PERMISSIONS.ASSESSMENT_CREATE,
    PERMISSIONS.ASSESSMENT_UPDATE,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
  ],

  [ROLES.ADMIN]: [
    // University-level access
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_DELETE,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.COURSE_DELETE,
    PERMISSIONS.ASSESSMENT_READ,
    PERMISSIONS.ASSESSMENT_CREATE,
    PERMISSIONS.ASSESSMENT_UPDATE,
    PERMISSIONS.ASSESSMENT_DELETE,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.PORTFOLIO_CREATE,
    PERMISSIONS.PORTFOLIO_UPDATE,
    PERMISSIONS.PORTFOLIO_DELETE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.RESEARCH_READ,
    PERMISSIONS.RESEARCH_CREATE,
    PERMISSIONS.RESEARCH_UPDATE,
    PERMISSIONS.CAREER_READ,
    PERMISSIONS.CAREER_CREATE,
    PERMISSIONS.CAREER_UPDATE,
  ],

  [ROLES.SUPER_ADMIN]: [
    // Full system access
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.UNIVERSITY_ADMIN]: [
    // Strategic oversight — read-heavy, limited create
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.ASSESSMENT_READ,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.CAREER_READ,
    PERMISSIONS.AUDIT_READ,
  ],

  [ROLES.SYSTEM_ADMIN]: [
    // Full platform management
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.IT_OPS]: [
    // Infrastructure, monitoring, support
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.API_READ,
  ],

  [ROLES.RESEARCHER]: [
    // Research-focused access
    PERMISSIONS.USER_READ,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.ASSESSMENT_READ,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.RESEARCH_READ,
    PERMISSIONS.RESEARCH_CREATE,
    PERMISSIONS.RESEARCH_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [ROLES.DEVELOPER]: [
    // API and integration access
    PERMISSIONS.USER_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.API_READ,
    PERMISSIONS.API_CREATE,
    PERMISSIONS.API_UPDATE,
    PERMISSIONS.API_DELETE,
    PERMISSIONS.RESEARCH_READ,
  ],

  [ROLES.PARTNER]: [
    // Partner content and analytics
    PERMISSIONS.USER_READ,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.PARTNER_READ,
    PERMISSIONS.PARTNER_CREATE,
    PERMISSIONS.PARTNER_UPDATE,
    PERMISSIONS.API_READ,
  ],

  [ROLES.ALUMNI]: [
    // Alumni: profile, courses, career, community
    PERMISSIONS.USER_READ,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.PORTFOLIO_UPDATE, // own
    PERMISSIONS.CAREER_READ,
    PERMISSIONS.CAREER_CREATE, // apply for jobs
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [ROLES.EMPLOYER]: [
    // Employer: job postings, candidates, analytics
    PERMISSIONS.USER_READ,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.CAREER_READ,
    PERMISSIONS.CAREER_CREATE,
    PERMISSIONS.CAREER_UPDATE,
    PERMISSIONS.CAREER_DELETE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [ROLES.AUDITOR]: [
    // Read-only compliance access
    PERMISSIONS.USER_READ,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.ASSESSMENT_READ,
    PERMISSIONS.PORTFOLIO_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.RESEARCH_READ,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

/**
 * Get role hierarchy (which roles can manage which other roles)
 */
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [ROLES.STUDENT]: [],
  [ROLES.FACULTY]: [ROLES.STUDENT],
  [ROLES.RECRUITER]: [],
  [ROLES.DEAN]: [ROLES.STUDENT, ROLES.FACULTY, ROLES.RECRUITER],
  [ROLES.ADMIN]: [
    ROLES.STUDENT,
    ROLES.FACULTY,
    ROLES.RECRUITER,
    ROLES.DEAN,
  ],
  [ROLES.SUPER_ADMIN]: [
    ROLES.STUDENT,
    ROLES.FACULTY,
    ROLES.RECRUITER,
    ROLES.DEAN,
    ROLES.ADMIN,
  ],
  [ROLES.UNIVERSITY_ADMIN]: [
    ROLES.STUDENT,
    ROLES.FACULTY,
    ROLES.DEAN,
    ROLES.RECRUITER,
    ROLES.ADMIN,
  ],
  [ROLES.SYSTEM_ADMIN]: [
    ROLES.STUDENT,
    ROLES.FACULTY,
    ROLES.RECRUITER,
    ROLES.DEAN,
    ROLES.ADMIN,
    ROLES.IT_OPS,
    ROLES.DEVELOPER,
  ],
  [ROLES.IT_OPS]: [
    ROLES.DEVELOPER,
  ],
  [ROLES.RESEARCHER]: [],
  [ROLES.DEVELOPER]: [],
  [ROLES.PARTNER]: [],
  [ROLES.ALUMNI]: [],
  [ROLES.EMPLOYER]: [],
  [ROLES.AUDITOR]: [],
};

/**
 * Check if a role can manage another role
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  const manageableRoles = ROLE_HIERARCHY[managerRole] || [];
  return manageableRoles.includes(targetRole);
}

/**
 * Get all users that a role can manage (based on role hierarchy)
 * This would typically be used in a database query
 */
export function getManageableRoles(role: Role): Role[] {
  return [...(ROLE_HIERARCHY[role] || [])];
}