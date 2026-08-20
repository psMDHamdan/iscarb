"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  X,
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Briefcase,
  Database,
  Brain,
  Workflow,
  Shield,
  LineChart,
  Lightbulb,
  Compass,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

type Group =
  | "executive"
  | "domain"
  | "ai-data"
  | "decision-support"
  | "reporting";

const NAV: { href: string; label: string; labelAr: string; icon: any; group: Group }[] = [
  // Executive
  { href: "/intelligence/executive", label: "Executive Dashboard", labelAr: "لوحة القيادة التنفيذية", icon: LayoutDashboard, group: "executive" },
  { href: "/intelligence/departments", label: "Department Rankings", labelAr: "ترتيب الأقسام", icon: GraduationCap, group: "executive" },
  { href: "/intelligence/accreditation", label: "Accreditation Readiness", labelAr: "جاهزية الاعتماد", icon: Shield, group: "executive" },

  // Domain
  { href: "/intelligence/enrollment", label: "Enrollment Analytics", labelAr: "تحليلات التسجيل", icon: Users, group: "domain" },
  { href: "/intelligence/graduation", label: "Graduation Tracking", labelAr: "تتبع التخرج", icon: BookOpen, group: "domain" },
  { href: "/intelligence/placement", label: "Placement Analytics", labelAr: "تحليلات التوظيف", icon: Briefcase, group: "domain" },
  { href: "/intelligence/research", label: "Research Intelligence", labelAr: "استخبارات البحث", icon: LineChart, group: "domain" },
  { href: "/intelligence/benchmarks", label: "Benchmarking", labelAr: "المقارنة المرجعية", icon: BarChart3, group: "domain" },

  // AI & Data
  { href: "/intelligence/ai", label: "AI Intelligence", labelAr: "استخبارات الذكاء الاصطناعي", icon: Brain, group: "ai-data" },
  { href: "/intelligence/data-quality", label: "Data Quality", labelAr: "جودة البيانات", icon: Database, group: "ai-data" },
  { href: "/intelligence/predictions", label: "Predictions", labelAr: "التنبؤات", icon: Lightbulb, group: "ai-data" },

  // Decision Support
  { href: "/intelligence/recommendations", label: "Recommendations", labelAr: "التوصيات", icon: Compass, group: "decision-support" },
  { href: "/intelligence/lineage", label: "Data Lineage", labelAr: "سلسلة البيانات", icon: Workflow, group: "decision-support" },

  // Reporting
  { href: "/intelligence/reports", label: "Reports", labelAr: "التقارير", icon: FileText, group: "reporting" },
  { href: "/intelligence/settings", label: "Settings", labelAr: "الإعدادات", icon: Settings, group: "reporting" },
];

const GROUP_META: Record<Group, { en: string; ar: string }> = {
  executive: { en: "Executive", ar: "القيادة" },
  domain: { en: "Domain Analytics", ar: "تحليلات المجال" },
  "ai-data": { en: "AI & Data", ar: "الذكاء الاصطناعي والبيانات" },
  "decision-support": { en: "Decision Support", ar: "دعم القرار" },
  reporting: { en: "Reporting", ar: "التقارير" },
};

const GROUP_ORDER: Group[] = [
  "executive",
  "domain",
  "ai-data",
  "decision-support",
  "reporting",
];

export function IntelligenceSidebar() {
  const pathname = usePathname();
  const { lang, sidebarOpen, setSidebarOpen } = useApp();
  const ar = lang === "ar";

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-72 shrink-0 border-r border-border bg-background/60 backdrop-blur-2xl shadow-[1px_0_40px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_40px_rgba(255,255,255,0.02)] flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          ar && "lg:order-last border-r-0 border-l",
        )}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link href="/intelligence/executive" className="flex items-center gap-2">
            <img src="/iscarb-mark.png" alt="iSCARB" className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg tracking-tight">
                <span className="text-iscarb-cyan">i</span>
                <span className="text-iscarb-green">SCARB</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-arabic">
                {ar ? "منصة الاستخبارات والقرار" : "Intelligence Platform"}
              </span>
            </div>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-iscarb px-3 py-4">
          <ul className="space-y-6">
            {GROUP_ORDER.map((groupKey) => (
              <li key={groupKey}>
                <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {ar ? GROUP_META[groupKey].ar : GROUP_META[groupKey].en}
                </div>
                <ul className="space-y-1">
                  {NAV.filter((item) => item.group === groupKey).map((item) => {
                    const active =
                      pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                            active
                              ? "bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A] text-white shadow-lg shadow-[#0E6C3C]/20 border border-white/10"
                              : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground",
                          )}
                        >
                          {active && (
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                          <Icon
                            className={cn(
                              "h-[18px] w-[18px] shrink-0",
                              !active && "text-muted-foreground group-hover:text-foreground",
                            )}
                          />
                          <span className="truncate">{ar ? item.labelAr : item.label}</span>
                          {active && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-iscarb-gold" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-gradient-to-br from-[#0E6C3C]/10 to-[#0F7B8A]/10 border border-[#0E6C3C]/20 p-4 text-center shadow-inner">
            <p className="font-display text-xs font-bold text-[#0E6C3C] dark:text-[#58CE95] leading-tight tracking-wide uppercase">
              {ar ? "من البيانات إلى القرار" : "From Data to Decision"}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
