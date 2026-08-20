/**
 * iSCARB RBAC Permission Matrix — CRUD per feature per role
 * ===========================================================================
 * The matrix defines which CRUD actions each role may perform on which
 * feature domain. `hasPermission()` is the runtime evaluator that the
 * API guard / middleware calls on every mutating request.
 *
 * Convention:
 *   feature names here are logical labels, NOT database table names.
 *   They map 1-to-1 to the feature strings in `roles.ts` where overlap
 *   exists, and extend to finer-grained CRUD controls not listed there.
 * ===========================================================================
 */

export type CrudAction = 'create' | 'read' | 'update' | 'delete';

export interface FeaturePermission {
  /** Logical feature/domain name. */
  feature: string;
  /** CRUD booleans for this feature. */
  permissions: { create: boolean; read: boolean; update: boolean; delete: boolean };
  /** Free-text notes on scope or special conditions. */
  notes: string;
}

/**
 * Full RBAC matrix keyed by role ID.
 *
 * Each entry is an array of `FeaturePermission` objects. A missing feature
 * entry means the role has zero access (all CRUD false).
 */
export const RBAC_MATRIX: Record<string, FeaturePermission[]> = {
  // ── University Administrator ──────────────────────────────────────────
  university_admin: [
    {
      feature: 'University Settings',
      permissions: { create: false, read: true, update: true, delete: false },
      notes: 'Institution Admin only; versioned',
    },
    {
      feature: 'Program/Curriculum',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Controlled by University Admin/Faculty',
    },
    {
      feature: 'User Accounts',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Full user management',
    },
    {
      feature: 'Courses',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Full access',
    },
    {
      feature: 'Grades',
      permissions: { create: false, read: true, update: true, delete: false },
      notes: 'Read all, update when needed',
    },
    {
      feature: 'Analytics Reports',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Read-only institutional analytics',
    },
    {
      feature: 'Audit Logs',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Read-only',
    },
    {
      feature: 'Policy/Accreditation',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'University Admin only',
    },
  ],

  // ── System Administrator ──────────────────────────────────────────────
  system_admin: [
    {
      feature: 'User Accounts',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Full user management including SSO/MFA',
    },
    {
      feature: 'RBAC Roles & Permissions',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'System Admin only; audit changes',
    },
    {
      feature: 'Login/SSO config',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'System Admin only',
    },
    {
      feature: 'System Settings',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'Global platform settings',
    },
    {
      feature: 'Audit Logs',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Read-only',
    },
    {
      feature: 'API/Webhooks',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Full API management',
    },
    {
      feature: 'Plugins/Extensions',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Developer/System Admin only',
    },
    {
      feature: 'System Backup/Recovery',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'SysAdmin/IT only',
    },
    {
      feature: 'Notification Settings',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'User-specific U',
    },
  ],

  // ── Faculty ───────────────────────────────────────────────────────────
  faculty: [
    {
      feature: 'Courses',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Faculty C/U own courses',
    },
    {
      feature: 'Lessons/Modules',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Faculty (own courses) only',
    },
    {
      feature: 'Assignments/Quizzes',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Faculty create; manage content',
    },
    {
      feature: 'Grades',
      permissions: { create: false, read: true, update: true, delete: false },
      notes: 'Faculty U (grade), Students R only',
    },
    {
      feature: 'Attendance Records',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'Faculty C/U (own classes)',
    },
    {
      feature: 'Forums/Q&A Threads',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Moderate own course forums',
    },
    {
      feature: 'Chat/Messages',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'Peer communication; delete disabled',
    },
  ],

  // ── Student ───────────────────────────────────────────────────────────
  student: [
    {
      feature: 'Courses',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Students R enrolled courses',
    },
    {
      feature: 'Assignments/Quizzes',
      permissions: { create: false, read: true, update: true, delete: false },
      notes: 'Students R/U own submissions',
    },
    {
      feature: 'Grades',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Students R only',
    },
    {
      feature: 'Forums/Q&A Threads',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'C/R/U own posts',
    },
    {
      feature: 'Profile & Preferences',
      permissions: { create: false, read: true, update: true, delete: false },
      notes: 'User U own profile',
    },
    {
      feature: 'Chat/Messages',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'Peer communication; delete disabled',
    },
    {
      feature: 'Notification Settings',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'User-specific U',
    },
  ],

  // ── Researcher ────────────────────────────────────────────────────────
  researcher: [
    {
      feature: 'Research Projects',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Researcher create; faculty/partners R/U on shared',
    },
    {
      feature: 'Publications Repository',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'Researcher C/U; Admin R; Immutable',
    },
    {
      feature: 'Experiment/Lab Notebook',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'Researcher C/U; auditors R',
    },
    {
      feature: 'Data/Files',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Owner and shared group only',
    },
    {
      feature: 'Chat/Messages',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'Peer communication; delete disabled',
    },
    {
      feature: 'Notification Settings',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'User-specific U',
    },
  ],

  // ── Recruiter ─────────────────────────────────────────────────────────
  recruiter: [
    {
      feature: 'Job Postings',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Recruiter create; Admin audit',
    },
    {
      feature: 'Applicant Profiles',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Recruiter R; Student/Alumni R/U own',
    },
    {
      feature: 'Interview Schedules',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Recruiter manage; invites by email',
    },
    {
      feature: 'Chat/Messages',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'Peer communication; delete disabled',
    },
    {
      feature: 'Notification Settings',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'User-specific U',
    },
  ],

  // ── Employer ──────────────────────────────────────────────────────────
  employer: [
    {
      feature: 'Job Postings',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Employer create/manage',
    },
    {
      feature: 'Applicant Profiles',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Employer R',
    },
    {
      feature: 'Notification Settings',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'User-specific U',
    },
  ],

  // ── Alumni ────────────────────────────────────────────────────────────
  alumni: [
    {
      feature: 'Profile & Preferences',
      permissions: { create: false, read: true, update: true, delete: false },
      notes: 'Alumni U own profile',
    },
    {
      feature: 'Courses',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Access continuing-ed courses',
    },
    {
      feature: 'Chat/Messages',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'Peer communication; delete disabled',
    },
    {
      feature: 'Notification Settings',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'User-specific U',
    },
  ],

  // ── Auditor ───────────────────────────────────────────────────────────
  auditor: [
    {
      feature: 'Audit Logs',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Auditor R only',
    },
    {
      feature: 'Compliance Reports',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Read-only compliance data',
    },
    {
      feature: 'User Accounts',
      permissions: { create: false, read: true, update: false, delete: false },
      notes: 'Read-only to assess permissions',
    },
  ],

  // Roles without explicit RBAC entries (employer, partner) fall back to
  // the sidebar feature list in roles.ts and can be extended here as
  // feature-level CRUD is wired up.

  // ── IT/Ops Staff ────────────────────────────────────────────────────────
  it_ops: [
    {
      feature: 'System Backup/Recovery',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'SysAdmin/IT only',
    },
    {
      feature: 'Notification Settings',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'User-specific U',
    },
  ],

  // ── Developer ───────────────────────────────────────────────────────────
  developer: [
    {
      feature: 'Plugins/Extensions',
      permissions: { create: true, read: true, update: true, delete: true },
      notes: 'Developer/System Admin only',
    },
    {
      feature: 'Notification Settings',
      permissions: { create: true, read: true, update: true, delete: false },
      notes: 'User-specific U',
    },
  ],
};

/**
 * Check whether a role has a specific CRUD permission on a feature.
 *
 * @param roleId  - Machine role ID (e.g. 'faculty')
 * @param feature - Logical feature name (e.g. 'Courses')
 * @param action  - One of 'create' | 'read' | 'update' | 'delete'
 * @returns true if permitted, false otherwise
 */
export function hasPermission(
  roleId: string,
  feature: string,
  action: CrudAction,
): boolean {
  const rolePermissions = RBAC_MATRIX[roleId];
  if (!rolePermissions) return false;

  const featurePerm = rolePermissions.find((p) => p.feature === feature);
  if (!featurePerm) return false;

  return featurePerm.permissions[action];
}

/**
 * Return all features a role has any access to (any CRUD true).
 */
export function getAccessibleFeatures(roleId: string): string[] {
  const rolePermissions = RBAC_MATRIX[roleId];
  if (!rolePermissions) return [];

  return rolePermissions
    .filter((p) => p.permissions.create || p.permissions.read || p.permissions.update || p.permissions.delete)
    .map((p) => p.feature);
}

/**
 * Return the full permission record for a role+feature pair.
 * Useful for UI that needs to render per-action toggles.
 */
export function getFeaturePermissions(
  roleId: string,
  feature: string,
): FeaturePermission | undefined {
  const rolePermissions = RBAC_MATRIX[roleId];
  if (!rolePermissions) return undefined;
  return rolePermissions.find((p) => p.feature === feature);
}
