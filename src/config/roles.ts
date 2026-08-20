/**
 * iSCARB Role Definitions — 12 role configs for RBAC
 * ===========================================================================
 * Each role declares its capabilities, default dashboard route, and which
 * sidebar sections it can see. Consumed by the sidebar renderer, the
 * RBAC permission evaluator, and any route-level guard that needs to
 * branch on role.
 * ===========================================================================
 */

export interface RoleConfig {
  /** Machine-readable role identifier (matches DB enum / Prisma). */
  id: string;
  /** English display name. */
  name: string;
  /** Arabic display name. */
  nameAr: string;
  /** Short human-readable description. */
  description: string;
  /** Action-oriented feature labels this role is authorized for. */
  features: string[];
  /** Route the user is redirected to after login. */
  defaultDashboard: string;
  /** Sidebar section keys this role should see (matches SIDEBAR_SECTIONS key). */
  sidebarVisible: string[];
}

export const ROLES: RoleConfig[] = [
  {
    id: 'university_admin',
    name: 'University Administrator',
    nameAr: 'مدير الجامعة',
    description:
      'Top-level leadership. Manages university-wide settings, policies, strategic planning, accreditation.',
    features: [
      'Configure University Settings',
      'Manage Programs & Curriculum',
      'Define Policies & Accreditation',
      'Manage Users and Roles',
      'View Executive Dashboard',
      'Review Reports & Analytics',
      'Post University Announcements',
      'Approve Major Actions',
      'Manage Partnerships',
      'Monitor Platform Health',
      'Oversee Compliance',
      'Manage Campus Resources',
    ],
    defaultDashboard: '/admin/executive-dashboard',
    sidebarVisible: [
      'home',
      'search',
      'notifications',
      'academic',
      'assessment',
      'research',
      'career',
      'student-success',
      'faculty',
      'administration',
      'intelligence',
      'communication',
      'marketplace',
      'help',
      'settings',
    ],
  },
  {
    id: 'system_admin',
    name: 'System Administrator',
    nameAr: 'مدير النظام',
    description:
      'Platform operators. Manages user accounts, permissions, system configuration, integrations, security.',
    features: [
      'Manage System Settings',
      'User Account Administration',
      'Role and Permission Management',
      'Configure Authentication',
      'Monitor Logs and Audit Trails',
      'Manage Data Backups/Recovery',
      'Maintain Infrastructure',
      'System Health Dashboard',
      'Integrations Hub',
      'Platform Notifications',
      'Custom Branding',
      'Data Governance',
      'Manage Extensions',
    ],
    defaultDashboard: '/admin/system-health',
    sidebarVisible: [
      'home',
      'search',
      'notifications',
      'academic',
      'assessment',
      'research',
      'laboratory',
      'career',
      'student-success',
      'faculty',
      'administration',
      'intelligence',
      'developer',
      'marketplace',
      'help',
      'settings',
    ],
  },
  {
    id: 'faculty',
    name: 'Faculty',
    nameAr: 'عضو هيئة التدريس',
    description:
      'Creates and manages courses, lessons, learning materials; assigns and grades coursework.',
    features: [
      'Create/Edit Courses',
      'Upload Learning Materials',
      'Schedule Classes & Office Hours',
      'Manage Enrollments',
      'Create and Assign Work',
      'Grade and Provide Feedback',
      'Track Student Progress',
      'Host Discussions/Q&A',
      'Use AI Teaching Aids',
      'Generate Reports',
      'Manage Classroom Communication',
      'Collaborate with Faculty Peers',
    ],
    defaultDashboard: '/faculty/dashboard',
    sidebarVisible: [
      'home',
      'search',
      'notifications',
      'academic',
      'teaching',
      'learning',
      'assessment',
      'research',
      'student-success',
      'faculty',
      'knowledge',
      'ai',
      'communication',
      'help',
      'settings',
    ],
  },
  {
    id: 'student',
    name: 'Student',
    nameAr: 'طالب',
    description:
      'Engages with course content, completes coursework and assessments, tracks progress.',
    features: [
      'View My Courses',
      'Complete Assignments & Quizzes',
      'Track Learning Progress',
      'Attend Classes and Events',
      'Access Learning Resources',
      'Participate in Discussions',
      'Use AI Tutor',
      'Set Learning Goals',
      'Interact with Dashboard',
      'Request Transcripts/Certificates',
      'Engage in Peer Learning',
      'Manage Profile & Preferences',
    ],
    defaultDashboard: '/student/dashboard',
    sidebarVisible: [
      'home',
      'search',
      'notifications',
      'academic',
      'learning',
      'assessment',
      'career',
      'student-success',
      'knowledge',
      'ai',
      'communication',
      'marketplace',
      'help',
      'settings',
    ],
  },
  {
    id: 'recruiter',
    name: 'Recruiter',
    nameAr: 'مسؤول توظيف',
    description:
      'Posts job/internship opportunities, sources candidates, coordinates campus events.',
    features: [
      'Post Job/Internship Openings',
      'Search Candidate Profiles',
      'Manage Campus Events',
      'Invite Applicants',
      'Review Applications',
      'Schedule Interviews',
      'Provide Feedback',
      'Generate Placement Reports',
      'Coordinate with Employers',
      'Manage Recruitment Dashboard',
    ],
    defaultDashboard: '/recruiter/dashboard',
    sidebarVisible: [
      'home',
      'search',
      'notifications',
      'career',
      'student-success',
      'communication',
      'help',
    ],
  },
  {
    id: 'employer',
    name: 'Employer',
    nameAr: 'صاحب عمل',
    description:
      'Posts career opportunities, reviews candidate pools, conducts interviews.',
    features: [
      'Post Opportunities',
      'Review Candidates',
      'Schedule Interviews',
      'Communicate with Recruiters',
      'Provide Offer Letters',
      'View Analytics',
      'Attend Career Events',
      'Engage Alumni Network',
    ],
    defaultDashboard: '/employer/dashboard',
    sidebarVisible: [
      'home',
      'search',
      'notifications',
      'career',
      'communication',
      'help',
    ],
  },
  {
    id: 'alumni',
    name: 'Alumni',
    nameAr: 'خريج',
    description:
      'Graduates. Manages profile, accesses transcripts, networks, takes continuing-ed courses.',
    features: [
      'Maintain Profile/Resume',
      'Access Courses & Content',
      'Network with Students/Alumni',
      'View My Records',
      'Participate in Career Services',
      'Receive Alumni News',
      'Contribute Back',
      'Use Alumni Dashboard',
    ],
    defaultDashboard: '/alumni/dashboard',
    sidebarVisible: [
      'home',
      'search',
      'notifications',
      'academic',
      'learning',
      'career',
      'student-success',
      'knowledge',
      'ai',
      'communication',
      'marketplace',
      'help',
      'settings',
    ],
  },
  {
    id: 'it_ops',
    name: 'IT/Ops Staff',
    nameAr: 'staff التقني',
    description:
      'Deploys and maintains infrastructure, handles backups, monitors system performance.',
    features: [
      'Deploy Updates',
      'Monitor System Health',
      'Manage Backups/DR',
      'Support Users',
      'Configure Integrations',
      'Maintain Security',
      'Manage Environments',
      'View Ops Dashboard',
    ],
    defaultDashboard: '/admin/infrastructure',
    sidebarVisible: [
      'home',
      'search',
      'notifications',
      'academic',
      'assessment',
      'research',
      'laboratory',
      'career',
      'student-success',
      'faculty',
      'administration',
      'intelligence',
      'developer',
      'marketplace',
      'help',
      'settings',
    ],
  },
  {
    id: 'developer',
    name: 'Developer',
    nameAr: 'مطور',
    description:
      'Extends the platform via APIs, plugins, SDKs and custom code.',
    features: [
      'Access Developer APIs',
      'Manage API Keys & Webhooks',
      'Use CLI/SDK',
      'Develop Plugins/Extensions',
      'View Dev Portal',
      'Version Control Integration',
      'Test Sandbox',
      'Monitor API Usage',
      'Collaborate on Platform',
    ],
    defaultDashboard: '/developer/dashboard',
    sidebarVisible: [
      'home',
      'search',
      'notifications',
      'knowledge',
      'research',
      'developer',
      'help',
    ],
  },
];

/** Lookup a role by its machine ID. Returns undefined if not found. */
export function getRoleById(id: string): RoleConfig | undefined {
  return ROLES.find((r) => r.id === id);
}

/** Return all role IDs. Useful for Prisma enum validation. */
export function getRoleIds(): string[] {
  return ROLES.map((r) => r.id);
}

/** Check whether a role ID exists in the config. */
export function isValidRoleId(id: string): boolean {
  return ROLES.some((r) => r.id === id);
}
