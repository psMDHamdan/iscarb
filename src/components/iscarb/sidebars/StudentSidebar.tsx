"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/lib/use-api-query";
import {
  ClipboardCheck,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  BookOpen,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  labelAr: string;
  icon: React.ElementType;
}

const LIVE_HREFS = new Set([
  "/assessment/employability",
  "/student/lecture",
  "/student/results",
  "/student/profile",
]);

const NAV: NavItem[] = [
  { href: "/assessment/employability", label: "Assessment", labelAr: "التقييم", icon: ClipboardCheck },
  { href: "/student/lecture", label: "Lectures", labelAr: "المحاضرات", icon: BookOpen },
  { href: "/student/results", label: "Results", labelAr: "النتائج", icon: FileText },
  { href: "/student/profile", label: "Profile", labelAr: "الملف الشخصي", icon: User },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { lang, sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useApp();
  const ar = lang === "ar";

  const { data: countData } = useApiQuery<{ count: number; unstarted: number }>(
    ["student", "lecture-count"],
    "/api/iscarb/lecture/student/list?countOnly=true",
    { staleTime: 60_000 }
  );

  const unstarted = countData?.unstarted;

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 z-50 lg:z-30 h-screen shrink-0 border-r border-border bg-background/60 backdrop-blur-2xl flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-[64px]" : "w-[220px]",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ar && "lg:order-last border-r-0 border-l",
      )}>
        {/* Header */}
        <div className={cn("flex shrink-0 items-center h-14 gap-2 border-b border-border transition-all duration-300", sidebarCollapsed ? "justify-center px-0 flex-col" : "justify-between px-3")}>
          <Link href="/student/dashboard" className="flex min-w-0 items-center gap-2 rounded-md transition hover:opacity-90 flex-1" onClick={() => setSidebarOpen(false)}>
            {!sidebarCollapsed && <img src="/iscarb-mark.png" alt="iSCARB" className="h-8 w-8 shrink-0" />}
            {!sidebarCollapsed && (
              <div className="flex min-w-0 flex-col leading-none">
                <span className="font-display text-lg font-extrabold">
                  <span className="text-iscarb-cyan">i</span>
                  <span className="text-iscarb-green">SCARB</span>
                </span>
                <span className="text-[10px] text-muted-foreground">{ar ? "نظام الطالب" : "Student OS"}</span>
              </div>
            )}
          </Link>
          <button
            className={cn("hidden lg:flex p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground", sidebarCollapsed && "mt-auto mb-2")}
            onClick={toggleSidebarCollapsed}
            aria-label="Toggle sidebar"
            title={ar ? "تبديل القائمة الجانبية" : "Toggle sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>

        {/* Flat Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-iscarb py-3 px-2 space-y-0.5" aria-label={ar ? "التنقل الرئيسي" : "Main navigation"}>
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const label = ar ? item.labelAr : item.label;
            const isLectures = item.href === "/student/lecture";
            const showBadge = isLectures && unstarted !== undefined && unstarted > 0;

            return (
              <Link
                key={item.href}
                href={LIVE_HREFS.has(item.href) ? item.href : "/coming-soon"}
                onClick={() => setSidebarOpen(false)}
                title={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                  sidebarCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "w-full gap-2.5 px-3 py-2",
                  active
                    ? "border border-white/10 bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A] text-white shadow-md"
                    : "text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
                )}
              >
                <Icon className={cn("shrink-0", sidebarCollapsed ? "h-5 w-5" : "h-4 w-4", !active && "text-muted-foreground group-hover:text-foreground")} />
                {!sidebarCollapsed && <span className="truncate">{label}</span>}
                {showBadge && !sidebarCollapsed && (
                  <span className="ms-auto flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-[#0F7B8A] text-[10px] font-bold text-white shadow-sm">
                    {unstarted > 9 ? "9+" : unstarted}
                  </span>
                )}
                {active && !sidebarCollapsed && !showBadge && <span className="ms-auto h-1 w-1 rounded-full bg-iscarb-gold" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 shrink-0">
          {!sidebarCollapsed ? (
            <div className="rounded-xl bg-gradient-to-br from-[#0E6C3C]/10 to-[#0F7B8A]/10 border border-[#0E6C3C]/20 p-3 text-center">
              <p className="font-display text-[11px] font-bold text-[#0E6C3C] dark:text-[#58CE95] leading-tight tracking-wide uppercase">
                {ar ? "أنا أستطيع، أنا سأفعل" : "I can, I will"}
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-1 w-8 rounded-full bg-[#0E6C3C]/20" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
