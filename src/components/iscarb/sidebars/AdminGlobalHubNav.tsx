"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface TopTab {
  label: string;
  labelAr: string;
  href: string;
}

interface SectionConfig {
  prefixes: string[];
  tabs: TopTab[];
}

const SECTIONS: SectionConfig[] = [
  // ── Dashboard — no top bar ──
  { prefixes: ["/admin/dashboard", "/admin/executive-dashboard"], tabs: [] },

  // ── Academic ──
  {
    prefixes: ["/admin/programs", "/admin/departments", "/admin/courses", "/admin/curriculum"],
    tabs: [
      { label: "Programs", labelAr: "البرامج", href: "/admin/programs" },
      { label: "Curriculum", labelAr: "المنهج", href: "/admin/curriculum" },
      { label: "Departments", labelAr: "الأقسام", href: "/admin/departments" },
      { label: "Courses", labelAr: "المقررات", href: "/admin/courses" },
    ],
  },

  // ── Users ──
  {
    prefixes: ["/admin/users", "/admin/rbac", "/admin/roles", "/admin/permissions"],
    tabs: [
      { label: "Users", labelAr: "المستخدمون", href: "/admin/users" },
      { label: "Roles", labelAr: "الأدوار", href: "/admin/roles" },
      { label: "Permissions", labelAr: "الصلاحيات", href: "/admin/permissions" },
      { label: "RBAC", labelAr: "التحكم بالوصول", href: "/admin/rbac" },
    ],
  },

  // ── Analytics ──
  {
    prefixes: ["/admin/analytics", "/admin/kpis", "/admin/reports"],
    tabs: [
      { label: "Analytics", labelAr: "التحليلات", href: "/admin/analytics" },
      { label: "KPIs", labelAr: "مؤشرات الأداء", href: "/admin/kpis" },
      { label: "Reports", labelAr: "التقارير", href: "/admin/reports" },
    ],
  },

  // ── Operations ──
  {
    prefixes: ["/admin/announcements", "/admin/approvals", "/admin/partnerships", "/admin/events"],
    tabs: [
      { label: "Announcements", labelAr: "الإعلانات", href: "/admin/announcements" },
      { label: "Approvals", labelAr: "الموافقات", href: "/admin/approvals" },
      { label: "Partnerships", labelAr: "الشراكات", href: "/admin/partnerships" },
      { label: "Events", labelAr: "الأحداث", href: "/admin/events" },
    ],
  },

  // ── Compliance ──
  {
    prefixes: ["/admin/compliance", "/admin/audit", "/admin/policies", "/admin/governance"],
    tabs: [
      { label: "Compliance", labelAr: "الامتثال", href: "/admin/compliance" },
      { label: "Audit Logs", labelAr: "سجلات المراجعة", href: "/admin/audit" },
      { label: "Policies", labelAr: "السياسات", href: "/admin/policies" },
      { label: "Governance", labelAr: "الحوكمة", href: "/admin/governance" },
    ],
  },

  // ── Intelligence ──
  {
    prefixes: ["/admin/intelligence", "/admin/ai-admin", "/admin/knowledge-graph"],
    tabs: [
      { label: "Executive Dashboard", labelAr: "لوحة القيادة", href: "/admin/intelligence" },
      { label: "AI Admin", labelAr: "إدارة الذكاء", href: "/admin/ai-admin" },
      { label: "Knowledge Graph", labelAr: "خريطة المعرفة", href: "/admin/knowledge-graph" },
    ],
  },

  // ── Settings ──
  {
    prefixes: ["/admin/settings", "/admin/branding", "/admin/security"],
    tabs: [
      { label: "Organization", labelAr: "المؤسسة", href: "/admin/settings" },
      { label: "Branding", labelAr: "العلامة التجارية", href: "/admin/branding" },
      { label: "Security", labelAr: "الأمان", href: "/admin/security" },
    ],
  },

  // ── Platform Health ──
  {
    prefixes: ["/admin/platform-health", "/admin/infrastructure"],
    tabs: [
      { label: "Platform Health", labelAr: "صحة المنصة", href: "/admin/platform-health" },
      { label: "Infrastructure", labelAr: "البنية التحتية", href: "/admin/infrastructure" },
    ],
  },
];

export function AdminGlobalHubNav() {
  const pathname = usePathname();
  const { lang } = useApp();
  const ar = lang === "ar";

  const activeSection = SECTIONS.find((section) =>
    section.prefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
    ),
  );

  if (!activeSection || activeSection.tabs.length === 0) return null;

  return (
    <div className="w-full border-b border-border bg-background/90 backdrop-blur-md z-20 sticky top-14 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-iscarb px-3 lg:px-5 gap-0.5">
        {activeSection.tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
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
