"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  X,
  LayoutDashboard,
  FileText,
  Book,
  GraduationCap,
  Library,
  FileSearch,
  BookOpen,
  Video,
  LayoutTemplate,
  Database,
  Wrench,
  Link as LinkIcon,
  Download,
  HelpCircle,
  LifeBuoy,
  MonitorPlay,
  Bookmark,
  BarChart3,
} from "lucide-react";

type Group = "core" | "library" | "learning" | "tools" | "support";

const NAV: { href: string; label: string; labelAr: string; icon: any; group: Group }[] = [
  // Core
  { href: "/resources/dashboard", label: "Resources Dashboard", labelAr: "لوحة الموارد", icon: LayoutDashboard, group: "core" },
  { href: "/resources/knowledge-base", label: "Knowledge Base", labelAr: "قاعدة المعرفة", icon: Book, group: "core" },
  
  // Library
  { href: "/resources/documents", label: "Documents", labelAr: "المستندات", icon: FileText, group: "library" },
  { href: "/resources/books", label: "Books", labelAr: "الكتب", icon: Library, group: "library" },
  { href: "/resources/papers", label: "Research Papers", labelAr: "الأبحاث الأكاديمية", icon: FileSearch, group: "library" },
  
  // Learning
  { href: "/resources/courses", label: "Courses", labelAr: "الدورات", icon: GraduationCap, group: "learning" },
  { href: "/resources/notes", label: "Lecture Notes", labelAr: "ملاحظات المحاضرات", icon: BookOpen, group: "learning" },
  { href: "/resources/videos", label: "Videos", labelAr: "مقاطع الفيديو", icon: Video, group: "learning" },
  { href: "/resources/tutorials", label: "Tutorials", labelAr: "الدروس التعليمية", icon: MonitorPlay, group: "learning" },
  
  // Tools
  { href: "/resources/templates", label: "Templates", labelAr: "القوالب", icon: LayoutTemplate, group: "tools" },
  { href: "/resources/datasets", label: "Datasets", labelAr: "مجموعات البيانات", icon: Database, group: "tools" },
  { href: "/resources/tools", label: "Tools", labelAr: "الأدوات", icon: Wrench, group: "tools" },
  { href: "/resources/apis", label: "APIs", labelAr: "واجهات برمجة التطبيقات", icon: LinkIcon, group: "tools" },
  { href: "/resources/software", label: "Software Downloads", labelAr: "تحميل البرامج", icon: Download, group: "tools" },
  
  // Support & Records
  { href: "/resources/faqs", label: "FAQs", labelAr: "الأسئلة الشائعة", icon: HelpCircle, group: "support" },
  { href: "/resources/help-center", label: "Help Center", labelAr: "مركز المساعدة", icon: LifeBuoy, group: "support" },
  { href: "/resources/bookmarks", label: "Bookmarks", labelAr: "الإشارات المرجعية", icon: Bookmark, group: "support" },
  { href: "/resources/downloads", label: "My Downloads", labelAr: "تنزيلاتي", icon: Download, group: "support" },
  { href: "/resources/analytics", label: "Resource Analytics", labelAr: "تحليلات الموارد", icon: BarChart3, group: "support" },
];

const GROUP_META: Record<Group, { en: string; ar: string }> = {
  core: { en: "Hub", ar: "المركز" },
  library: { en: "Library", ar: "المكتبة" },
  learning: { en: "Learning Material", ar: "المواد التعليمية" },
  tools: { en: "Tools & Assets", ar: "الأدوات والأصول" },
  support: { en: "Support & Records", ar: "الدعم والسجلات" },
};

export function ResourcesSidebar() {
  const pathname = usePathname();
  const { lang, sidebarOpen, setSidebarOpen } = useApp();
  const ar = lang === "ar";

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn("fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-72 shrink-0 border-r border-border bg-background/60 backdrop-blur-2xl shadow-[1px_0_40px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_40px_rgba(255,255,255,0.02)] flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", ar && "lg:order-last border-r-0 border-l")}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link href="/resources/dashboard" className="flex items-center gap-2">
            <img src="/iscarb-mark.png" alt="iSCARB" className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg tracking-tight"><span className="text-iscarb-cyan">i</span><span className="text-iscarb-green">SCARB</span></span>
              <span className="text-[10px] text-muted-foreground font-arabic">{ar ? "الموارد الأكاديمية" : "Resources Hub"}</span>
            </div>
          </Link>
          <button className="lg:hidden p-1.5 rounded-md hover:bg-accent" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-iscarb px-3 py-4">
          <ul className="space-y-6">
            {(["core", "library", "learning", "tools", "support"] as Group[]).map((groupKey) => (
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
      </aside>
    </>
  );
}
