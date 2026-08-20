"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface TopTab { label: string; labelAr: string; href: string; }
interface SectionConfig { prefixes: string[]; tabs: TopTab[]; }

const SECTIONS: SectionConfig[] = [
  { prefixes: ["/faculty/dashboard", "/faculty/home"], tabs: [] },

  {
    prefixes: ["/faculty/classes", "/faculty/teaching"],
    tabs: [
      { label: "Classes", labelAr: "الفصول", href: "/faculty/classes" },
      { label: "Teaching", labelAr: "التدريس", href: "/faculty/teaching" },
      { label: "Content", labelAr: "المحتوى", href: "/faculty/teaching/content" },
      { label: "Curriculum", labelAr: "المنهج", href: "/faculty/teaching/curriculum" },
      { label: "Resources", labelAr: "الموارد", href: "/faculty/teaching/resources" },
    ],
  },

  {
    prefixes: ["/faculty/assessments", "/faculty/assessment"],
    tabs: [
      { label: "Assessments", labelAr: "التقييمات", href: "/faculty/assessments" },
      { label: "Gradebook", labelAr: "سجل الدرجات", href: "/faculty/assessment/gradebook" },
      { label: "Rubrics", labelAr: "معايير التقييم", href: "/faculty/assessments/rubrics" },
      { label: "Quiz Builder", labelAr: "منشئ الاختبارات", href: "/faculty/assessment/quiz-builder" },
      { label: "Viva", labelAr: "الامتحان الشفهي", href: "/faculty/assessment/viva" },
    ],
  },

  {
    prefixes: ["/faculty/research"],
    tabs: [
      { label: "Projects", labelAr: "المشاريع", href: "/faculty/research/projects" },
      { label: "Publications", labelAr: "المنشورات", href: "/faculty/research/publications" },
      { label: "Grants", labelAr: "المنح", href: "/faculty/research/grants" },
      { label: "Literature", labelAr: "الأدبيات", href: "/faculty/research/literature" },
    ],
  },

  {
    prefixes: ["/faculty/students"],
    tabs: [
      { label: "Profiles", labelAr: "الملفات", href: "/faculty/students/profiles" },
      { label: "At-Risk", labelAr: "المعرضون للخطر", href: "/faculty/students/at-risk" },
      { label: "Attendance", labelAr: "الحضور", href: "/faculty/students/attendance" },
      { label: "Progress", labelAr: "التقدم", href: "/faculty/students/progress" },
      { label: "Reports", labelAr: "التقارير", href: "/faculty/students/reports" },
    ],
  },

  {
    prefixes: ["/faculty/ai-assistant"],
    tabs: [
      { label: "AI Assistant", labelAr: "المساعد الذكي", href: "/faculty/ai-assistant" },
      { label: "Explain", labelAr: "الشرح", href: "/faculty/ai-assistant/explain" },
      { label: "Generate", labelAr: "التوليد", href: "/faculty/ai-assistant/generate" },
      { label: "Summarize", labelAr: "التلخيص", href: "/faculty/ai-assistant/summarize" },
    ],
  },

  {
    prefixes: ["/faculty/knowledge"],
    tabs: [
      { label: "Notes", labelAr: "الملاحظات", href: "/faculty/knowledge/notes" },
      { label: "Bookmarks", labelAr: "الإشارات", href: "/faculty/knowledge/bookmarks" },
      { label: "Graph", labelAr: "الخريطة", href: "/faculty/knowledge/graph" },
      { label: "Search", labelAr: "البحث", href: "/faculty/knowledge/search" },
    ],
  },

  {
    prefixes: ["/faculty/analytics"],
    tabs: [
      { label: "KPIs", labelAr: "مؤشرات الأداء", href: "/faculty/analytics/kpis" },
      { label: "Outcomes", labelAr: "النتائج", href: "/faculty/analytics/outcomes" },
      { label: "Teaching", labelAr: "التدريس", href: "/faculty/analytics/teaching" },
    ],
  },

  {
    prefixes: ["/faculty/collaboration", "/faculty/communication"],
    tabs: [
      { label: "Announcements", labelAr: "الإعلانات", href: "/faculty/collaboration/announcements" },
      { label: "Discussions", labelAr: "المناقشات", href: "/faculty/collaboration/discussions" },
      { label: "Resources", labelAr: "الموارد", href: "/faculty/collaboration/resources" },
    ],
  },
];

export function FacultyGlobalHubNav() {
  const pathname = usePathname();
  const { lang } = useApp();
  const ar = lang === "ar";

  const activeSection = SECTIONS.find((s) =>
    s.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/")),
  );

  if (!activeSection || activeSection.tabs.length === 0) return null;

  return (
    <div className="w-full border-b border-border bg-background/90 backdrop-blur-md z-20 sticky top-14 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-iscarb px-3 lg:px-5 gap-0.5">
        {activeSection.tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link key={tab.href} href={tab.href}
              className={cn("relative whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-all duration-200 shrink-0",
                isActive ? "text-[#0E6C3C] dark:text-[#58CE95]" : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              {ar ? tab.labelAr : tab.label}
              {isActive && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#0E6C3C] dark:bg-[#58CE95]" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
