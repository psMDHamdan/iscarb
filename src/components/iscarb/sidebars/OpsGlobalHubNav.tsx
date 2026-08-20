"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface TopTab { label: string; labelAr: string; href: string; }
interface SectionConfig { prefixes: string[]; tabs: TopTab[]; }

const SECTIONS: SectionConfig[] = [
  { prefixes: ["/ops/dashboard"], tabs: [] },
  {
    prefixes: ["/ops/monitoring", "/ops/alerts", "/ops/system-health"],
    tabs: [
      { label: "Monitoring", labelAr: "المراقبة", href: "/ops/monitoring" },
      { label: "Alerts", labelAr: "التنبيهات", href: "/ops/alerts" },
      { label: "System Health", labelAr: "صحة النظام", href: "/ops/system-health" },
    ],
  },
  {
    prefixes: ["/ops/deployments", "/ops/backups", "/ops/environments"],
    tabs: [
      { label: "Deployments", labelAr: "النشر", href: "/ops/deployments" },
      { label: "Backups", labelAr: "النسخ الاحتياطي", href: "/ops/backups" },
      { label: "Environments", labelAr: "البيئات", href: "/ops/environments" },
    ],
  },
  {
    prefixes: ["/ops/integrations", "/ops/logs"],
    tabs: [
      { label: "Integrations", labelAr: "التكامل", href: "/ops/integrations" },
      { label: "Logs", labelAr: "السجلات", href: "/ops/logs" },
    ],
  },
  {
    prefixes: ["/ops/security", "/ops/knowledge-graph"],
    tabs: [
      { label: "Security", labelAr: "الأمان", href: "/ops/security" },
      { label: "Knowledge Graph", labelAr: "رسم المعرفة", href: "/ops/knowledge-graph" },
    ],
  },
];

export function OpsGlobalHubNav() {
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
