"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  X,
  LayoutDashboard,
  Map,
  Gauge,
  Briefcase,
  FileText,
  Files,
  FolderOpen,
  Trophy,
  Target,
  LineChart,
  Search,
  Building,
  CheckSquare,
  MessageSquare,
  Video,
  Bot,
  Users,
  Send,
  Calendar,
  Banknote,
  Award,
  BarChart3,
  Settings,
} from "lucide-react";

type Group = "status" | "identity" | "opportunities" | "coaching" | "network" | "records";

const NAV: { href: string; label: string; labelAr: string; icon: any; group: Group }[] = [
  // Core Status
  { href: "/career/dashboard", label: "Career Dashboard", labelAr: "لوحة المسار المهني", icon: LayoutDashboard, group: "status" },
  { href: "/career/journey", label: "Career Journey", labelAr: "رحلة المسار المهني", icon: Map, group: "status" },
  { href: "/career/readiness", label: "Career Readiness", labelAr: "الجاهزية المهنية", icon: Gauge, group: "status" },
  
  // Professional Identity
  { href: "/career/portfolio", label: "Portfolio", labelAr: "ملف الإنجاز", icon: Briefcase, group: "identity" },
  { href: "/career/resume-builder", label: "Resume Builder", labelAr: "منشئ السيرة الذاتية", icon: FileText, group: "identity" },
  { href: "/career/cover-letter", label: "Cover Letter Builder", labelAr: "منشئ خطاب الغلاف", icon: Files, group: "identity" },
  { href: "/career/documents", label: "Documents", labelAr: "المستندات", icon: FolderOpen, group: "identity" },
  { href: "/career/achievements", label: "Achievements", labelAr: "الإنجازات", icon: Trophy, group: "identity" },
  
  // Opportunities
  { href: "/career/match", label: "Career Match", labelAr: "التوافق المهني", icon: Target, group: "opportunities" },
  { href: "/career/skill-gap", label: "Skill Gap Analysis", labelAr: "تحليل فجوة المهارات", icon: LineChart, group: "opportunities" },
  { href: "/career/jobs", label: "Jobs", labelAr: "الوظائف", icon: Search, group: "opportunities" },
  { href: "/career/internships", label: "Internships", labelAr: "التدريب التعاوني", icon: Building, group: "opportunities" },
  { href: "/career/applications", label: "Applications", labelAr: "الطلبات المقدمة", icon: CheckSquare, group: "opportunities" },
  
  // Interview & Coaching
  { href: "/career/interview-prep", label: "Interview Prep", labelAr: "التحضير للمقابلات", icon: MessageSquare, group: "coaching" },
  { href: "/career/mock-interviews", label: "Mock Interviews", labelAr: "المقابلات التجريبية", icon: Video, group: "coaching" },
  { href: "/career/coach-ai", label: "Career Coach (iSCARB AI)", labelAr: "المرشد المهني", icon: Bot, group: "coaching" },
  
  // Network & Market
  { href: "/career/networking", label: "Networking", labelAr: "الشبكة المهنية", icon: Users, group: "network" },
  { href: "/career/recruiter-connect", label: "Recruiter Connect", labelAr: "تواصل جهات التوظيف", icon: Send, group: "network" },
  { href: "/career/events", label: "Events", labelAr: "الفعاليات", icon: Calendar, group: "network" },
  { href: "/career/salary-insights", label: "Salary Insights", labelAr: "رؤى الرواتب", icon: Banknote, group: "network" },
  
  // Records & Settings
  { href: "/career/certifications", label: "Certifications", labelAr: "الشهادات", icon: Award, group: "records" },
  { href: "/career/analytics", label: "Career Analytics", labelAr: "تحليلات المسار", icon: BarChart3, group: "records" },
  { href: "/career/settings", label: "Settings", labelAr: "الإعدادات", icon: Settings, group: "records" },
];

const GROUP_META: Record<Group, { en: string; ar: string }> = {
  status: { en: "Core Status", ar: "الحالة الأساسية" },
  identity: { en: "Professional Identity", ar: "الهوية المهنية" },
  opportunities: { en: "Opportunities", ar: "الفرص" },
  coaching: { en: "Interview & Coaching", ar: "المقابلات والتوجيه" },
  network: { en: "Network & Market", ar: "الشبكة والسوق" },
  records: { en: "Records & Settings", ar: "السجلات والإعدادات" },
};

export function CareerSidebar() {
  const pathname = usePathname();
  const { lang, sidebarOpen, setSidebarOpen } = useApp();
  const ar = lang === "ar";

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn("fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-72 shrink-0 border-r border-border bg-background/60 backdrop-blur-2xl shadow-[1px_0_40px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_40px_rgba(255,255,255,0.02)] flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", ar && "lg:order-last border-r-0 border-l")}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link href="/career/dashboard" className="flex items-center gap-2">
            <img src="/iscarb-mark.png" alt="iSCARB" className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg tracking-tight"><span className="text-iscarb-cyan">i</span><span className="text-iscarb-green">SCARB</span></span>
              <span className="text-[10px] text-muted-foreground font-arabic">{ar ? "نظام المسار المهني" : "Career Hub"}</span>
            </div>
          </Link>
          <button className="lg:hidden p-1.5 rounded-md hover:bg-accent" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-iscarb px-3 py-4">
          <ul className="space-y-6">
            {(["status", "identity", "opportunities", "coaching", "network", "records"] as Group[]).map((groupKey) => (
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
            <p className="font-display text-xs font-bold text-[#0E6C3C] dark:text-[#58CE95] leading-tight tracking-wide uppercase">{ar ? "من القبول إلى التوظيف" : "From Admission to Hire"}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
