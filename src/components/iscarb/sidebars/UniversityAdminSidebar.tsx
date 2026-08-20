"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  X, LayoutDashboard, Building2, BookOpen, Shield, Users, BarChart3,
  Megaphone, CheckCircle, Handshake, Activity, Scale, Landmark,
  Settings, FileText, GraduationCap, Search, Bell, HelpCircle,
} from "lucide-react";

type Group = "dashboard" | "academic" | "users" | "analytics" | "operations" | "compliance";

const NAV: { href: string; label: string; labelAr: string; icon: any; group: Group }[] = [
  { href: "/admin/dashboard", label: "Executive Dashboard", labelAr: "لوحة القيادة التنفيذية", icon: LayoutDashboard, group: "dashboard" },

  { href: "/admin/programs", label: "Programs & Curriculum", labelAr: "البرامج والمنهج", icon: GraduationCap, group: "academic" },
  { href: "/admin/departments", label: "Departments", labelAr: "الأقسام", icon: Building2, group: "academic" },
  { href: "/admin/courses", label: "Course Catalog", labelAr: "دليل المقررات", icon: BookOpen, group: "academic" },
  { href: "/admin/policies", label: "Policies & Accreditation", labelAr: "السياسات والاعتماد", icon: Scale, group: "academic" },

  { href: "/admin/users", label: "User Management", labelAr: "إدارة المستخدمين", icon: Users, group: "users" },
  { href: "/admin/rbac", label: "Roles & Permissions", labelAr: "الأدوار والصلاحيات", icon: Shield, group: "users" },

  { href: "/admin/analytics", label: "Analytics & Reports", labelAr: "التحليلات والتقارير", icon: BarChart3, group: "analytics" },
  { href: "/admin/kpis", label: "KPI Center", labelAr: "مركز مؤشرات الأداء", icon: BarChart3, group: "analytics" },

  { href: "/admin/announcements", label: "Announcements", labelAr: "الإعلانات", icon: Megaphone, group: "operations" },
  { href: "/admin/approvals", label: "Approvals", labelAr: "الموافقات", icon: CheckCircle, group: "operations" },
  { href: "/admin/partnerships", label: "Partnerships", labelAr: "الشراكات", icon: Handshake, group: "operations" },
  { href: "/admin/platform-health", label: "Platform Health", labelAr: "صحة المنصة", icon: Activity, group: "operations" },

  { href: "/admin/compliance", label: "Compliance", labelAr: "الامتثال", icon: Scale, group: "compliance" },
  { href: "/admin/audit", label: "Audit Logs", labelAr: "سجلات المراجعة", icon: FileText, group: "compliance" },
  { href: "/admin/settings", label: "University Settings", labelAr: "إعدادات الجامعة", icon: Settings, group: "compliance" },
];

const GROUP_META: Record<Group, { en: string; ar: string }> = {
  dashboard: { en: "Dashboard", ar: "لوحة القيادة" },
  academic: { en: "Academic", ar: "الأكاديمي" },
  users: { en: "User Management", ar: "إدارة المستخدمين" },
  analytics: { en: "Analytics & Reports", ar: "التحليلات والتقارير" },
  operations: { en: "Operations", ar: "العمليات" },
  compliance: { en: "Compliance & Settings", ar: "الامتثال والإعدادات" },
};

export function UniversityAdminSidebar() {
  const pathname = usePathname();
  const { lang, sidebarOpen, setSidebarOpen } = useApp();
  const ar = lang === "ar";

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn("fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-72 shrink-0 border-r border-border bg-background/60 backdrop-blur-2xl shadow-[1px_0_40px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_40px_rgba(255,255,255,0.02)] flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", ar && "lg:order-last border-r-0 border-l")}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <img src="/iscarb-mark.png" alt="iSCARB" className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg tracking-tight"><span className="text-iscarb-cyan">i</span><span className="text-iscarb-green">SCARB</span></span>
              <span className="text-[10px] text-muted-foreground font-arabic">{ar ? "لوحة إدارة الجامعة" : "University Admin"}</span>
            </div>
          </Link>
          <button className="lg:hidden p-1.5 rounded-md hover:bg-accent" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-iscarb px-3 py-4">
          <ul className="space-y-6">
            {(["dashboard", "academic", "users", "analytics", "operations", "compliance"] as Group[]).map((groupKey) => (
              <li key={groupKey}>
                <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {ar ? GROUP_META[groupKey].ar : GROUP_META[groupKey].en}
                </div>
                <ul className="space-y-1">
                  {NAV.filter((item) => item.group === groupKey).map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link href={item.href} onClick={() => setSidebarOpen(false)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group relative overflow-hidden", active ? "bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A] text-white shadow-lg shadow-[#0E6C3C]/20 border border-white/10" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground")}>
                          {active && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          <Icon className={cn("h-[18px] w-[18px] shrink-0", !active && "text-muted-foreground group-hover:text-foreground")} />
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
            <p className="font-display text-xs font-bold text-[#0E6C3C] dark:text-[#58CE95] leading-tight tracking-wide uppercase">{ar ? "إدارة استراتيجية" : "Strategic Leadership"}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
