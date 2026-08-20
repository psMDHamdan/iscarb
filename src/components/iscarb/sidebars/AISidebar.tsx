"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  X,
  LayoutDashboard,
  MessageSquare,
  GraduationCap,
  Briefcase,
  ClipboardCheck,
  Microscope,
  FileText,
  FolderOpen,
  Video,
  PenTool,
  Code,
  BarChart3,
  Presentation,
  Languages,
  Bot,
  BookOpen,
  Workflow,
  Brain,
  MessagesSquare,
  Share2,
  Store,
  Activity,
  Settings,
  History,
} from "lucide-react";

type Group = "core" | "coaching" | "tools" | "platform" | "records";

const NAV: { href: string; label: string; labelAr: string; icon: any; group: Group }[] = [
  // Intelligence Core
  { href: "/ai/dashboard", label: "AI Dashboard", labelAr: "لوحة الذكاء الاصطناعي", icon: LayoutDashboard, group: "core" },
  { href: "/ai/assistant", label: "AI Assistant", labelAr: "المساعد الذكي", icon: MessageSquare, group: "core" },
  { href: "/ai/knowledge-chat", label: "Knowledge Chat", labelAr: "محادثة المعرفة", icon: MessagesSquare, group: "core" },

  // Coaching
  { href: "/ai/study-coach", label: "Study Coach", labelAr: "مدرب الدراسة", icon: GraduationCap, group: "coaching" },
  { href: "/ai/career-coach", label: "Career Coach", labelAr: "المرشد المهني", icon: Briefcase, group: "coaching" },
  { href: "/ai/assessment-coach", label: "Assessment Coach", labelAr: "مدرب التقييم", icon: ClipboardCheck, group: "coaching" },
  { href: "/ai/interview-coach", label: "Interview Coach", labelAr: "مدرب المقابلات", icon: Video, group: "coaching" },
  { href: "/ai/presentation-coach", label: "Presentation Coach", labelAr: "مدرب العروض", icon: Presentation, group: "coaching" },

  // Tools
  { href: "/ai/research-assistant", label: "Research Assistant", labelAr: "مساعد البحث", icon: Microscope, group: "tools" },
  { href: "/ai/resume-reviewer", label: "Resume Reviewer", labelAr: "مراجع السيرة", icon: FileText, group: "tools" },
  { href: "/ai/portfolio-reviewer", label: "Portfolio Reviewer", labelAr: "مراجع الملف", icon: FolderOpen, group: "tools" },
  { href: "/ai/writing-assistant", label: "Writing Assistant", labelAr: "مساعد الكتابة", icon: PenTool, group: "tools" },
  { href: "/ai/coding-assistant", label: "Coding Assistant", labelAr: "مساعد البرمجة", icon: Code, group: "tools" },
  { href: "/ai/data-analyst", label: "Data Analyst", labelAr: "محلل البيانات", icon: BarChart3, group: "tools" },
  { href: "/ai/translation", label: "Translation", labelAr: "الترجمة", icon: Languages, group: "tools" },

  // Platform
  { href: "/ai/agents", label: "AI Agents", labelAr: "الوكلاء الأذكياء", icon: Bot, group: "platform" },
  { href: "/ai/prompt-library", label: "Prompt Library", labelAr: "مكتبة الأوامر", icon: BookOpen, group: "platform" },
  { href: "/ai/workflows", label: "AI Workflows", labelAr: "سير العمل الذكي", icon: Workflow, group: "platform" },
  { href: "/ai/memory", label: "AI Memory", labelAr: "ذاكرة الذكاء", icon: Brain, group: "platform" },
  { href: "/ai/shared-chats", label: "Shared Chats", labelAr: "محادثات مشتركة", icon: Share2, group: "platform" },
  { href: "/ai/marketplace", label: "AI Marketplace", labelAr: "سوق الذكاء", icon: Store, group: "platform" },

  // Records
  { href: "/ai/analytics", label: "Usage Analytics", labelAr: "تحليلات الاستخدام", icon: Activity, group: "records" },
  { href: "/ai/settings", label: "AI Settings", labelAr: "إعدادات الذكاء", icon: Settings, group: "records" },
  { href: "/ai/history", label: "Chat History", labelAr: "سجل المحادثات", icon: History, group: "records" },
];

const GROUP_META: Record<Group, { en: string; ar: string }> = {
  core: { en: "Intelligence Core", ar: "نواة الذكاء" },
  coaching: { en: "AI Coaching", ar: "التوجيه الذكي" },
  tools: { en: "AI Tools", ar: "أدوات ذكية" },
  platform: { en: "Platform", ar: "المنصة" },
  records: { en: "Records & Settings", ar: "السجلات والإعدادات" },
};

export function AISidebar() {
  const pathname = usePathname();
  const { lang, sidebarOpen, setSidebarOpen } = useApp();
  const ar = lang === "ar";

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn("fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-72 shrink-0 border-r border-border bg-background/60 backdrop-blur-2xl shadow-[1px_0_40px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_40px_rgba(255,255,255,0.02)] flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", ar && "lg:order-last border-r-0 border-l")}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link href="/ai/dashboard" className="flex items-center gap-2">
            <img src="/iscarb-mark.png" alt="iSCARB" className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg tracking-tight"><span className="text-iscarb-cyan">i</span><span className="text-iscarb-green">SCARB</span></span>
              <span className="text-[10px] text-muted-foreground font-arabic">{ar ? "مساحة الذكاء الاصطناعي" : "AI Workspace"}</span>
            </div>
          </Link>
          <button className="lg:hidden p-1.5 rounded-md hover:bg-accent" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-iscarb px-3 py-4">
          <ul className="space-y-6">
            {(["core", "coaching", "tools", "platform", "records"] as Group[]).map((groupKey) => (
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
            <p className="font-display text-xs font-bold text-[#0E6C3C] dark:text-[#58CE95] leading-tight tracking-wide uppercase">{ar ? "ذكاء اصطناعي في كل خطوة" : "AI in Every Step"}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
