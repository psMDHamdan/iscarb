"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

// ─── Top bar tab definition ──────────────────────────────────────────────────
interface TopTab {
  label: string;
  labelAr: string;
  href: string;
}

// ─── Section: route prefixes → top bar tabs ──────────────────────────────────
interface SectionConfig {
  prefixes: string[];
  tabs: TopTab[];
}

// ─── All 16 sections — top bar shows CATEGORY HEADERS only ───────────────────
const SECTIONS: SectionConfig[] = [
  // ── 1. Dashboard — NO top bar, content is inside the page ──
  {
    prefixes: ["/student/dashboard"],
    tabs: [],
  },

  // ── 2. Academic — 7 category tabs ──
  {
    prefixes: ["/student/academic"],
    tabs: [
      { label: "Program", labelAr: "البرنامج", href: "/student/academic/program" },
      { label: "Semester", labelAr: "الفصل", href: "/student/academic/semester" },
      { label: "Courses", labelAr: "الدورات", href: "/student/academic/courses" },
      { label: "Timetable", labelAr: "الجدول", href: "/student/academic/timetable" },
      { label: "Attendance", labelAr: "الحضور", href: "/student/academic/attendance" },
      { label: "Grades", labelAr: "الدرجات", href: "/student/academic/grades" },
      { label: "Transcript", labelAr: "السجل", href: "/student/academic/transcript" },
    ],
  },

  // ── 3. Learning — 5 category tabs ──
  {
    prefixes: ["/student/learning", "/student/notes", "/student/flashcards", "/student/study", "/student/focus", "/student/bookmarks"],
    tabs: [
      { label: "Learning Dashboard", labelAr: "لوحة التعلم", href: "/student/learning/dashboard" },
      { label: "Course Learning", labelAr: "تعلم الدورات", href: "/student/learning/courses" },
      { label: "Study Workspace", labelAr: "مساحة الدراسة", href: "/student/learning/study-workspace" },
      { label: "AI Learning", labelAr: "التعلم الذكي", href: "/student/learning/ai-learning" },
      { label: "Learning Intelligence", labelAr: "ذكاء التعلم", href: "/student/learning/intelligence" },
    ],
  },

  // ── 4. Assessment — 5 category tabs ──
  {
    prefixes: ["/student/my-assessments", "/assessment", "/student/assessments", "/student/results"],
    tabs: [
      { label: "Assessments", labelAr: "التقييمات", href: "/student/my-assessments" },
      { label: "Assignments", labelAr: "المهام", href: "/assessment/assignments" },
      { label: "Quizzes", labelAr: "الاختبارات", href: "/assessment/quizzes" },
      { label: "Exams", labelAr: "الامتحانات", href: "/assessment/exams" },
      { label: "Results", labelAr: "النتائج", href: "/student/results" },
    ],
  },

  // ── 5. Competencies & Skills — 5 category tabs ──
  {
    prefixes: ["/student/competency", "/student/skill", "/student/badges", "/student/certificates"],
    tabs: [
      { label: "Competencies", labelAr: "الكفاءات", href: "/student/competency/dashboard" },
      { label: "Skills", labelAr: "المهارات", href: "/student/skill/tree" },
      { label: "Competency Passport", labelAr: "جواز الكفاءات", href: "/student/competency/passport" },
      { label: "Certifications", labelAr: "الشهادات", href: "/student/certificates" },
      { label: "Credential Wallet", labelAr: "محفظة الاعتمادات", href: "/student/competency/credential-wallet" },
    ],
  },

  // ── 6. Student Success — 6 category tabs ──
  {
    prefixes: ["/student/success", "/student/habits", "/student/wellbeing", "/student/tasks"],
    tabs: [
      { label: "Success Dashboard", labelAr: "لوحة النجاح", href: "/student/success" },
      { label: "Goals", labelAr: "الأهداف", href: "/student/success/goals" },
      { label: "Productivity", labelAr: "الإنتاجية", href: "/student/success/productivity" },
      { label: "Habits", labelAr: "العادات", href: "/student/habits" },
      { label: "Wellbeing", labelAr: "العافية", href: "/student/wellbeing" },
      { label: "Risk Center", labelAr: "مركز المخاطر", href: "/student/success/risk" },
    ],
  },

  // ── 7. Career & Placement — 8 category tabs ──
  {
    prefixes: ["/student/career", "/student/cv", "/student/resume", "/student/jobs", "/student/interview", "/student/applications"],
    tabs: [
      { label: "Career Dashboard", labelAr: "لوحة المسيرة", href: "/student/career-match" },
      { label: "Career Planning", labelAr: "التخطيط المهني", href: "/student/career/planning" },
      { label: "Resume", labelAr: "السيرة الذاتية", href: "/student/resume-builder" },
      { label: "Jobs", labelAr: "الوظائف", href: "/student/jobs" },
      { label: "Internships", labelAr: "التدريب", href: "/student/career/internships" },
      { label: "Interview", labelAr: "المقابلات", href: "/student/interview-prep" },
      { label: "Placement", labelAr: "التوزيع", href: "/student/career/placement" },
      { label: "Networking", labelAr: "التواصل", href: "/student/career/networking" },
    ],
  },

  // ── 8. Research & Innovation — 3 category tabs ──
  {
    prefixes: ["/student/research", "/student/capstone", "/student/hackathon", "/student/competitions", "/student/challenges", "/student/startup"],
    tabs: [
      { label: "Research", labelAr: "البحث", href: "/student/research-assistant" },
      { label: "Innovation", labelAr: "الابتكار", href: "/student/hackathons" },
      { label: "Funding", labelAr: "التمويل", href: "/student/startup-funding" },
    ],
  },

  // ── 9. Portfolio — 3 category tabs ──
  {
    prefixes: ["/student/portfolio", "/student/eportfolio"],
    tabs: [
      { label: "Portfolio", labelAr: "الملف", href: "/student/portfolio" },
      { label: "AI Portfolio", labelAr: "الملف الذكي", href: "/student/portfolio/ai-generator" },
      { label: "Sharing", labelAr: "المشاركة", href: "/student/portfolio/share" },
    ],
  },

  // ── 10. Community — 4 category tabs ──
  {
    prefixes: ["/student/community", "/student/clubs", "/student/study-groups", "/student/leaderboard", "/student/mentors", "/student/events"],
    tabs: [
      { label: "Community", labelAr: "المجتمع", href: "/student/community/feed" },
      { label: "Collaboration", labelAr: "التعاون", href: "/student/study-groups" },
      { label: "Events", labelAr: "الأحداث", href: "/student/events" },
      { label: "Leaderboards", labelAr: "لوحة الشرف", href: "/student/leaderboard" },
    ],
  },

  // ── 11. Knowledge — 3 category tabs ──
  {
    prefixes: ["/student/knowledge"],
    tabs: [
      { label: "Knowledge Base", labelAr: "قاعدة المعرفة", href: "/student/knowledge-base" },
      { label: "Personal Knowledge", labelAr: "المعرفة الشخصية", href: "/student/knowledge/personal-graph" },
      { label: "Search", labelAr: "البحث", href: "/student/knowledge/universal-search" },
    ],
  },

  // ── 12. AI Studio — 6 category tabs ──
  {
    prefixes: ["/student/ai", "/student/study-coach", "/student/career-coach", "/student/success-coach", "/student/ai-memory"],
    tabs: [
      { label: "Personal AI", labelAr: "الذكاء الشخصي", href: "/student/ai-assistant" },
      { label: "Academic AI", labelAr: "الذكاء الأكاديمي", href: "/student/study-coach" },
      { label: "Learning AI", labelAr: "ذكاء التعلم", href: "/student/ai/learning-coach" },
      { label: "Career AI", labelAr: "الذكاء المهني", href: "/student/career-coach" },
      { label: "Research AI", labelAr: "ذكاء البحث", href: "/student/ai/research-coach" },
      { label: "AI Workspace", labelAr: "مساحة الذكاء", href: "/student/ai/prompts" },
    ],
  },

  // ── 13. Communication — 3 category tabs ──
  {
    prefixes: ["/student/discussions", "/student/messages", "/student/announcements"],
    tabs: [
      { label: "Messaging", labelAr: "الرسائل", href: "/student/messages" },
      { label: "Notifications", labelAr: "الإشعارات", href: "/student/announcements" },
      { label: "Collaboration", labelAr: "التعاون", href: "/student/discussions" },
    ],
  },

  // ── 14. Settings — 5 category tabs ──
  {
    prefixes: ["/student/settings", "/student/profile", "/student/account"],
    tabs: [
      { label: "Profile", labelAr: "الملف", href: "/student/profile" },
      { label: "Documents", labelAr: "المستندات", href: "/student/documents/my" },
      { label: "Preferences", labelAr: "التفضيلات", href: "/student/settings" },
      { label: "Accessibility", labelAr: "إمكانية الوصول", href: "/student/settings/accessibility" },
      { label: "Security", labelAr: "الأمان", href: "/student/settings/password" },
    ],
  },

  // ── 15. Analytics — 2 category tabs ──
  {
    prefixes: ["/student/analytics"],
    tabs: [
      { label: "Personal Analytics", labelAr: "التحليلات الشخصية", href: "/student/analytics" },
      { label: "Timeline", labelAr: "الجدول الزمني", href: "/student/analytics/timeline" },
    ],
  },

  // ── 16. Marketplace — 1 category tab ──
  {
    prefixes: ["/student/marketplace", "/student/market"],
    tabs: [
      { label: "Marketplace", labelAr: "السوق", href: "/student/marketplace" },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export function GlobalHubNav() {
  const pathname = usePathname();
  const { lang } = useApp();
  const ar = lang === "ar";

  const activeSection = SECTIONS.find((section) =>
    section.prefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
    ),
  );

  // Dashboard has no top bar tabs
  if (!activeSection || activeSection.tabs.length === 0) return null;

  return (
    <div className="w-full border-b border-border bg-background/90 backdrop-blur-md z-20 sticky top-14 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-iscarb px-3 lg:px-5 gap-0.5">
        {activeSection.tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-all duration-200 shrink-0",
                isActive
                  ? "text-[#0E6C3C] dark:text-[#58CE95]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              {ar ? tab.labelAr : tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#0E6C3C] dark:bg-[#58CE95]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
