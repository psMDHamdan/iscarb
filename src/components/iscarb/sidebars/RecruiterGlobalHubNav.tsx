"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface TopTab { label: string; labelAr: string; href: string; }
interface SectionConfig { prefixes: string[]; tabs: TopTab[]; }

const SECTIONS: SectionConfig[] = [
  { prefixes: ["/recruiter/dashboard"], tabs: [] },
  {
    prefixes: ["/recruiter/candidates", "/recruiter/talent", "/recruiter/search"],
    tabs: [
      { label: "Candidates", labelAr: "المرشحون", href: "/recruiter/candidates" },
      { label: "Talent Search", labelAr: "بحث المواهب", href: "/recruiter/talent" },
      { label: "Pipeline", labelAr: "خط السير", href: "/recruiter/pipeline" },
      { label: "Interviews", labelAr: "المقابلات", href: "/recruiter/interviews" },
    ],
  },
  {
    prefixes: ["/recruiter/jobs"],
    tabs: [
      { label: "Job Listings", labelAr: "الوظائف", href: "/recruiter/jobs" },
      { label: "Applications", labelAr: "التقديمات", href: "/recruiter/jobs/applications" },
      { label: "Post Job", labelAr: "نشر وظيفة", href: "/recruiter/jobs/post" },
    ],
  },
  {
    prefixes: ["/recruiter/analytics", "/recruiter/reports"],
    tabs: [
      { label: "Analytics", labelAr: "التحليلات", href: "/recruiter/analytics" },
      { label: "Reports", labelAr: "التقارير", href: "/recruiter/reports" },
    ],
  },
];

export function RecruiterGlobalHubNav() {
  const pathname = usePathname();
  const { lang } = useApp();
  const ar = lang === "ar";
  const activeSection = SECTIONS.find((s) => s.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/")));
  if (!activeSection || activeSection.tabs.length === 0) return null;
  return (
    <div className="w-full border-b border-border bg-background/90 backdrop-blur-md z-20 sticky top-14 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-iscarb px-3 lg:px-5 gap-0.5">
        {activeSection.tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link key={tab.href} href={tab.href} className={cn("relative whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-all duration-200 shrink-0", isActive ? "text-[#0E6C3C] dark:text-[#58CE95]" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
              {ar ? tab.labelAr : tab.label}
              {isActive && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#0E6C3C] dark:bg-[#58CE95]" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
