"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  X, LayoutDashboard, Server, Database, RefreshCw, HeadphonesIcon,
  Plug, Shield, GitBranch, Activity, BarChart3, Settings, Bell,
  Globe, Code, Network,
} from "lucide-react";

type Group = "dashboard" | "infrastructure" | "support" | "monitoring";

const NAV: { href: string; label: string; labelAr: string; icon: any; group: Group }[] = [
  { href: "/ops/dashboard", label: "Ops Dashboard", labelAr: "لوحة العمليات", icon: LayoutDashboard, group: "dashboard" },

  { href: "/ops/deployments", label: "Deploy Updates", labelAr: "نشر التحديثات", icon: GitBranch, group: "infrastructure" },
  { href: "/ops/system-health", label: "System Health", labelAr: "صحة النظام", icon: Server, group: "infrastructure" },
  { href: "/ops/backups", label: "Backups & DR", labelAr: "النسخ الاحتياطي", icon: Database, group: "infrastructure" },
  { href: "/ops/environments", label: "Environments", labelAr: "البيئات", icon: GitBranch, group: "infrastructure" },
  { href: "/ops/security", label: "Security Patches", labelAr: "الترقيعات الأمنية", icon: Shield, group: "infrastructure" },
  { href: "/ops/knowledge-graph", label: "Knowledge Graph", labelAr: "رسم المعرفة", icon: Network, group: "infrastructure" },

  { href: "/ops/support", label: "User Support", labelAr: "دعم المستخدمين", icon: HeadphonesIcon, group: "support" },
  { href: "/ops/integrations", label: "Integrations", labelAr: "التكاملات", icon: Plug, group: "support" },

  { href: "/ops/monitoring", label: "Monitoring", labelAr: "المراقبة", icon: Activity, group: "monitoring" },
  { href: "/ops/logs", label: "System Logs", labelAr: "سجلات النظام", icon: BarChart3, group: "monitoring" },
  { href: "/ops/alerts", label: "Alerts", labelAr: "التنبيهات", icon: Bell, group: "monitoring" },
  { href: "/ops/settings", label: "Settings", labelAr: "الإعدادات", icon: Settings, group: "monitoring" },
];

const GROUP_META: Record<Group, { en: string; ar: string }> = {
  dashboard: { en: "Dashboard", ar: "لوحة القيادة" },
  infrastructure: { en: "Infrastructure", ar: "البنية التحتية" },
  support: { en: "Support & Integrations", ar: "الدعم والتكاملات" },
  monitoring: { en: "Monitoring & Alerts", ar: "المراقبة والتنبيهات" },
};

export function ItOpsSidebar() {
  const pathname = usePathname();
  const { lang, sidebarOpen, setSidebarOpen } = useApp();
  const ar = lang === "ar";

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn("fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-72 shrink-0 border-r border-border bg-background/60 backdrop-blur-2xl shadow-[1px_0_40px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_40px_rgba(255,255,255,0.02)] flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", ar && "lg:order-last border-r-0 border-l")}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link href="/ops/dashboard" className="flex items-center gap-2">
            <img src="/iscarb-mark.png" alt="iSCARB" className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg tracking-tight"><span className="text-iscarb-cyan">i</span><span className="text-iscarb-green">SCARB</span></span>
              <span className="text-[10px] text-muted-foreground font-arabic">{ar ? "عمليات البنية التحتية" : "IT Operations"}</span>
            </div>
          </Link>
          <button className="lg:hidden p-1.5 rounded-md hover:bg-accent" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-iscarb px-3 py-4">
          <ul className="space-y-6">
            {(["dashboard", "infrastructure", "support", "monitoring"] as Group[]).map((groupKey) => (
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
            <p className="font-display text-xs font-bold text-[#0E6C3C] dark:text-[#58CE95] leading-tight tracking-wide uppercase">{ar ? "بنية تحتية موثوقة" : "Reliable Infrastructure"}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
