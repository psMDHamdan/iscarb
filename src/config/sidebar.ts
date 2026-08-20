/**
 * iSCARB Sidebar Configuration — role-aware navigation
 * ===========================================================================
 * Defines every sidebar section with bilingual labels, Lucide icon names,
 * route hrefs, role visibility, and optional children. The
 * `getSidebarForRole()` helper filters the full list down to what a given
 * role should see, keeping the sidebar lean and RBAC-respecting.
 * ===========================================================================
 */

export interface SidebarItem {
  /** English label. */
  label: string;
  /** Arabic label. */
  labelAr: string;
  /** Lucide icon name (used by <Icon name={...}>). */
  icon: string;
  /** Route href. */
  href: string;
}

export interface SidebarSection {
  /** English label for the top-level item. */
  label: string;
  /** Arabic label. */
  labelAr: string;
  /** Lucide icon name. */
  icon: string;
  /** Route href (section root). */
  href: string;
  /** Role IDs that see this section. 'all' means every role. */
  roles: string[];
  /** Whether the section starts collapsed in the sidebar. */
  collapsed: boolean;
  /** Optional nested items (shown when section is expanded). */
  children?: SidebarItem[];
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  // ── Global (all roles) ──────────────────────────────────────────────────
  {
    label: 'Dashboard',
    labelAr: 'لوحة المعلومات',
    icon: 'layout-dashboard',
    href: '/',
    roles: ['all'],
    collapsed: false,
  },
  {
    label: 'Search',
    labelAr: 'بحث',
    icon: 'search',
    href: '/search',
    roles: ['all'],
    collapsed: true,
  },
  {
    label: 'Notifications',
    labelAr: 'الإشعارات',
    icon: 'bell',
    href: '/notifications',
    roles: ['all'],
    collapsed: true,
  },

  // ── Academic Platform ──────────────────────────────────────────────────
  {
    label: 'Academic',
    labelAr: 'الأكاديمي',
    icon: 'graduation-cap',
    href: '/academic',
    roles: ['faculty', 'student', 'university_admin', 'system_admin', 'it_ops', 'recruiter', 'lab_technician', 'career_officer', 'alumni', 'parent'],
    collapsed: true,
    children: [
      { label: 'Programs', labelAr: 'البرامج', icon: 'layers', href: '/academic/programs' },
      { label: 'Curriculum', labelAr: 'المنهج', icon: 'book-open', href: '/academic/curriculum' },
      { label: 'Courses', labelAr: 'المقررات', icon: 'book', href: '/academic/courses' },
      { label: 'Calendar', labelAr: 'التقويم', icon: 'calendar', href: '/academic/calendar' },
      { label: 'Timetable', labelAr: 'الجدول الزمني', icon: 'clock', href: '/academic/timetable' },
      { label: 'Attendance', labelAr: 'الحضور', icon: 'check-circle', href: '/academic/attendance' },
    ],
  },

  // ── Learning Platform (student) ────────────────────────────────────────
  {
    label: 'Learning',
    labelAr: 'التعلم',
    icon: 'target',
    href: '/learning',
    roles: ['student', 'alumni'],
    collapsed: true,
    children: [
      { label: 'My Learning Journey', labelAr: 'رحلة التعلم الخاصة بي', icon: 'route', href: '/learning/paths' },
      { label: 'AI Tutor', labelAr: 'المدرس الذكي', icon: 'bot', href: '/ai/tutor' },
      { label: 'Flashcards', labelAr: 'البطاقات التعليمية', icon: 'layers', href: '/learning/flashcards' },
      { label: 'Study Planner', labelAr: 'مخطط الدراسة', icon: 'calendar', href: '/learning/planner' },
      { label: 'Progress', labelAr: 'التقدم', icon: 'trending-up', href: '/learning/progress' },
    ],
  },

  // ── Teaching Platform (faculty only) ───────────────────────────────────
  {
    label: 'Teaching',
    labelAr: 'التدريس',
    icon: 'book-open',
    href: '/teaching',
    roles: ['faculty'],
    collapsed: true,
    children: [
      { label: 'Course Management', labelAr: 'إدارة المقررات', icon: 'settings', href: '/teaching/content' },
      { label: 'Lesson Planning', labelAr: 'تخطيط الدروس', icon: 'calendar', href: '/teaching/lesson-planning' },
      { label: 'Assignments', labelAr: 'الواجبات', icon: 'clipboard', href: '/teaching/assignments' },
      { label: 'Gradebook', labelAr: 'سجل الدرجات', icon: 'bar-chart', href: '/teaching/gradebook' },
      { label: 'AI Assistant', labelAr: 'المساعد الذكي', icon: 'sparkles', href: '/teaching/ai-assistant' },
    ],
  },

  // ── Assessment Platform ────────────────────────────────────────────────
  {
    label: 'Assessment',
    labelAr: 'التقييم',
    icon: 'bar-chart-2',
    href: '/assessment',
    roles: ['faculty', 'student', 'university_admin', 'system_admin', 'lab_technician'],
    collapsed: true,
    children: [
      { label: 'Question Bank', labelAr: 'بنك الأسئلة', icon: 'database', href: '/assessment/question-bank' },
      { label: 'Quizzes & Exams', labelAr: 'الاختبارات والامتحانات', icon: 'file-check', href: '/assessment/exams' },
      { label: 'Assignments', labelAr: 'الواجبات', icon: 'clipboard', href: '/assessment/assignments' },
      { label: 'Gradebook', labelAr: 'سجل الدرجات', icon: 'award', href: '/assessment/gradebook' },
      { label: 'Results', labelAr: 'النتائج', icon: 'pie-chart', href: '/assessment/results' },
      { label: 'Analytics', labelAr: 'التحليلات', icon: 'trending-up', href: '/assessment/analytics' },
    ],
  },

  // ── Research Platform ──────────────────────────────────────────────────
  {
    label: 'Research',
    labelAr: 'البحث',
    icon: 'microscope',
    href: '/research',
    roles: ['faculty', 'university_admin', 'system_admin'],
    collapsed: true,
    children: [
      { label: 'Literature Review', labelAr: 'المراجعة الأدبية', icon: 'search', href: '/research/literature' },
      { label: 'Papers', labelAr: 'الأوراق البحثية', icon: 'file-text', href: '/research/publications' },
      { label: 'Projects', labelAr: 'المشاريع', icon: 'folder', href: '/research/projects' },
      { label: 'Experiments', labelAr: 'التجارب', icon: 'flask', href: '/research/experiments' },
      { label: 'Lab Notebook', labelAr: 'دفتر المختبر', icon: 'book', href: '/research/lab-notebook' },
    ],
  },

  // ── Laboratory Platform ────────────────────────────────────────────────
  {
    label: 'Laboratory',
    labelAr: 'المختبر',
    icon: 'flask-conical',
    href: '/laboratory',
    roles: ['lab_technician', 'university_admin', 'system_admin'],
    collapsed: true,
    children: [
      { label: 'Equipment Inventory', labelAr: 'جرد المعدات', icon: 'package', href: '/laboratory/equipment' },
      { label: 'Protocols', labelAr: 'البروتوكولات', icon: 'file-text', href: '/laboratory/protocols' },
      { label: 'Booking', labelAr: 'الحجز', icon: 'calendar', href: '/laboratory/booking' },
      { label: 'Safety Logs', labelAr: 'سجلات السلامة', icon: 'shield', href: '/laboratory/safety' },
    ],
  },

  // ── Career Platform ────────────────────────────────────────────────────
  {
    label: 'Career',
    labelAr: 'المسيرة المهنية',
    icon: 'briefcase',
    href: '/career',
    roles: ['student', 'recruiter', 'employer', 'alumni', 'career_officer', 'university_admin'],
    collapsed: true,
    children: [
      { label: 'Resume Builder', labelAr: 'منشئ السيرة الذاتية', icon: 'file-text', href: '/career/resume' },
      { label: 'Job Postings', labelAr: 'الوظائف', icon: 'briefcase', href: '/career/jobs' },
      { label: 'Internships', labelAr: 'التدريب', icon: 'building', href: '/career/internships' },
      { label: 'Applications', labelAr: 'الطلبات', icon: 'send', href: '/career/applications' },
      { label: 'Alumni Network', labelAr: 'شبكة الخريجين', icon: 'users', href: '/career/alumni' },
    ],
  },

  // ── Student Success ────────────────────────────────────────────────────
  {
    label: 'Student Success',
    labelAr: 'نجاح الطالب',
    icon: 'heart-pulse',
    href: '/student-success',
    roles: ['student', 'faculty', 'university_admin', 'system_admin', 'career_officer', 'alumni', 'parent'],
    collapsed: true,
    children: [
      { label: 'Dashboard', labelAr: 'لوحة المعلومات', icon: 'layout', href: '/student-success/dashboard' },
      { label: 'Goals & Habits', labelAr: 'الأهداف والعادات', icon: 'target', href: '/student-success/goals' },
      { label: 'Wellbeing', labelAr: 'الصحة والعلاج', icon: 'heart', href: '/student-success/wellbeing' },
      { label: 'Risk Alerts', labelAr: 'تنبيهات المخاطر', icon: 'alert-triangle', href: '/student-success/risk' },
    ],
  },

  // ── Faculty Platform ───────────────────────────────────────────────────
  {
    label: 'Faculty',
    labelAr: 'هيئة التدريس',
    icon: 'users',
    href: '/faculty',
    roles: ['faculty', 'university_admin', 'system_admin'],
    collapsed: true,
    children: [
      { label: 'Course Management', labelAr: 'إدارة المقررات', icon: 'settings', href: '/faculty/courses' },
      { label: 'Student Insights', labelAr: 'رؤى الطلاب', icon: 'eye', href: '/faculty/insights' },
      { label: 'Analytics', labelAr: 'التحليلات', icon: 'bar-chart', href: '/faculty/analytics' },
      { label: 'AI Assistant', labelAr: 'المساعد الذكي', icon: 'sparkles', href: '/faculty/ai-assistant' },
    ],
  },

  // ── Administration ─────────────────────────────────────────────────────
  {
    label: 'Administration',
    labelAr: 'الإدارة',
    icon: 'building-2',
    href: '/admin',
    roles: ['university_admin', 'system_admin', 'it_ops'],
    collapsed: true,
    children: [
      { label: 'Admissions', labelAr: 'القبول', icon: 'user-plus', href: '/admin/admissions' },
      { label: 'Records', labelAr: 'السجلات', icon: 'file-text', href: '/admin/records' },
      { label: 'Compliance', labelAr: 'الامتثال', icon: 'shield-check', href: '/admin/compliance' },
      { label: 'Users', labelAr: 'المستخدمون', icon: 'users', href: '/admin/users' },
      { label: 'Roles & Permissions', labelAr: 'الأدوار والصلاحيات', icon: 'shield', href: '/admin/rbac' },
      { label: 'Settings', labelAr: 'الإعدادات', icon: 'sliders', href: '/admin/settings' },
      { label: 'Audit Logs', labelAr: 'سجلات المراجعة', icon: 'clipboard-list', href: '/admin/audit-logs' },
    ],
  },

  // ── Intelligence ───────────────────────────────────────────────────────
  {
    label: 'Intelligence',
    labelAr: 'الذكاء',
    icon: 'brain',
    href: '/intelligence',
    roles: ['university_admin', 'system_admin', 'faculty'],
    collapsed: true,
    children: [
      { label: 'Dashboards', labelAr: 'لوحات المعلومات', icon: 'layout', href: '/intelligence/dashboards' },
      { label: 'AI Insights', labelAr: 'رؤى الذكاء الاصطناعي', icon: 'sparkles', href: '/intelligence/insights' },
      { label: 'Predictions', labelAr: 'التوقعات', icon: 'trending-up', href: '/intelligence/predictions' },
      { label: 'Reports', labelAr: 'التقارير', icon: 'file-text', href: '/intelligence/reports' },
    ],
  },

  // ── Knowledge Platform ─────────────────────────────────────────────────
  {
    label: 'Knowledge',
    labelAr: 'المعرفة',
    icon: 'book-open',
    href: '/knowledge',
    roles: ['faculty', 'student', 'alumni', 'developer', 'employer', 'lab_technician'],
    collapsed: true,
    children: [
      { label: 'Wiki', labelAr: 'الويكي', icon: 'file-text', href: '/knowledge/wiki' },
      { label: 'Documents', labelAr: 'المستندات', icon: 'folder', href: '/knowledge/documents' },
      { label: 'Semantic Search', labelAr: 'البحث الدلالي', icon: 'search', href: '/knowledge/search' },
    ],
  },

  // ── AI Platform ────────────────────────────────────────────────────────
  {
    label: 'AI',
    labelAr: 'الذكاء الاصطناعي',
    icon: 'bot',
    href: '/ai',
    roles: ['student', 'alumni', 'faculty', 'career_officer'],
    collapsed: true,
    children: [
      { label: 'AI Agents', labelAr: 'عملاء الذكاء الاصطناعي', icon: 'bot', href: '/ai/agents' },
      { label: 'AI Models', labelAr: 'نماذج الذكاء الاصطناعي', icon: 'cpu', href: '/ai/models' },
      { label: 'Prompt Studio', labelAr: 'استوديو الأوامر', icon: 'terminal', href: '/ai/prompts' },
    ],
  },

  // ── Communication (MVP) ────────────────────────────────────────────────
  {
    label: 'Communication',
    labelAr: 'التواصل',
    icon: 'message-circle',
    href: '/community',
    roles: ['faculty', 'student', 'recruiter', 'alumni', 'employer', 'university_admin', 'parent', 'career_officer'],
    collapsed: true,
    children: [
      { label: 'Announcements', labelAr: 'الإعلانات', icon: 'megaphone', href: '/community/announcements' },
      { label: 'Discussion Forum', labelAr: 'منتدى النقاش', icon: 'message-square', href: '/community/forums' },
      { label: 'Chat', labelAr: 'المحادثة', icon: 'message-circle', href: '/community/chat' },
    ],
  },

  // ── Developer/Integration ──────────────────────────────────────────────
  {
    label: 'Developer',
    labelAr: 'المطور',
    icon: 'code',
    href: '/developer',
    roles: ['developer', 'it_ops', 'system_admin'],
    collapsed: true,
    children: [
      { label: 'API Docs', labelAr: 'وثائق API', icon: 'file-code', href: '/developer/api-docs' },
      { label: 'SDKs', labelAr: 'مكتبات SDK', icon: 'package', href: '/developer/sdks' },
      { label: 'Plugins', labelAr: 'الإضافات', icon: 'puzzle', href: '/developer/plugins' },
      { label: 'Webhooks', labelAr: 'الويب هوكس', icon: 'link', href: '/developer/webhooks' },
    ],
  },

  // ── Marketplace ────────────────────────────────────────────────────────
  {
    label: 'Marketplace',
    labelAr: 'السوق',
    icon: 'store',
    href: '/marketplace',
    roles: ['student', 'faculty', 'university_admin', 'system_admin', 'alumni', 'it_ops'],
    collapsed: true,
    children: [
      { label: 'AI Agents', labelAr: 'عملاء الذكاء الاصطناعي', icon: 'bot', href: '/marketplace/agents' },
      { label: 'Plugins', labelAr: 'الإضافات', icon: 'puzzle', href: '/marketplace/plugins' },
      { label: 'Courses', labelAr: 'المقررات', icon: 'book', href: '/marketplace/courses' },
    ],
  },

  // ── Help (all roles) ───────────────────────────────────────────────────
  {
    label: 'Help',
    labelAr: 'المساعدة',
    icon: 'help-circle',
    href: '/help',
    roles: ['all'],
    collapsed: true,
    children: [
      { label: 'Documentation', labelAr: 'التوثيق', icon: 'book', href: '/help/docs' },
      { label: 'Support', labelAr: 'الدعم', icon: 'life-buoy', href: '/help/support' },
      { label: 'Tutorials', labelAr: 'الدروس', icon: 'play-circle', href: '/help/tutorials' },
    ],
  },

  // ── Settings ───────────────────────────────────────────────────────────
  {
    label: 'Settings',
    labelAr: 'الإعدادات',
    icon: 'settings',
    href: '/settings',
    roles: ['faculty', 'student', 'alumni', 'university_admin', 'system_admin', 'it_ops', 'career_officer'],
    collapsed: true,
  },
];

/**
 * Return the sidebar sections visible to a given role.
 * Sections with `roles: ['all']` are always included.
 */
export function getSidebarForRole(roleId: string): SidebarSection[] {
  return SIDEBAR_SECTIONS.filter(
    (section) => section.roles.includes('all') || section.roles.includes(roleId),
  );
}

/**
 * Flat list of all unique route hrefs across the sidebar (useful for
 * route-guard pre-computation or sitemap generation).
 */
export function getAllSidebarHrefs(): string[] {
  const hrefs = new Set<string>();
  for (const section of SIDEBAR_SECTIONS) {
    hrefs.add(section.href);
    for (const child of section.children ?? []) {
      hrefs.add(child.href);
    }
  }
  return Array.from(hrefs);
}
