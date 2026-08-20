"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/iscarb/NotificationBell";
import { clearClientToken } from "@/lib/client-auth";
import { Search, Moon, Sun, Languages, LogOut, Menu, HelpCircle, Clock, Star } from "lucide-react";

interface SubPage { href: string; label: string; labelAr: string; }

const SECTION_SUBPAGES: Record<string, SubPage[]> = {
  "/student/dashboard": [
    { href: "/student/dashboard", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/dashboard/quick-stats", label: "Quick Stats", labelAr: "إحصائيات سريعة" },
    { href: "/student/dashboard/ai-insights", label: "AI Insights", labelAr: "رؤى الذكاء الاصطناعي" },
    { href: "/student/dashboard/announcements", label: "Announcements", labelAr: "الإعلانات" },
    { href: "/student/onboarding", label: "Onboarding", labelAr: "التوجيه" },
  ],
  "/student/academic": [
    { href: "/student/academic", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/academic/courses", label: "Courses", labelAr: "المقررات" },
    { href: "/student/academic/semester", label: "Semester", labelAr: "الفصل الدراسي" },
    { href: "/student/academic/timetable", label: "Timetable", labelAr: "الجدول الدراسي" },
    { href: "/student/academic/attendance", label: "Attendance", labelAr: "الحضور" },
    { href: "/student/academic/grades", label: "Grades", labelAr: "الدرجات" },
    { href: "/student/academic/transcript", label: "Transcript", labelAr: "السجل الأكاديمي" },
    { href: "/student/academic/program", label: "Study Plan", labelAr: "الخطة الدراسية" },
    { href: "/student/academic/graduation", label: "Graduation", labelAr: "التخرج" },
    { href: "/student/certificates", label: "Certificates", labelAr: "الشهادات" },
  ],
  "/student/learning": [
    { href: "/student/learning", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/learning/courses", label: "Courses", labelAr: "الدورات" },
    { href: "/student/learning-paths", label: "Learning Paths", labelAr: "مسارات التعلم" },
    { href: "/student/study-coach", label: "Study Coach", labelAr: "مدرب الدراسة" },
    { href: "/student/ai/learning-coach", label: "Learning Coach", labelAr: "مدرب التعلم" },
    { href: "/student/learning/ai-learning", label: "AI Learning", labelAr: "التعلم بالذكاء الاصطناعي" },
    { href: "/student/learning/study-workspace", label: "Study Workspace", labelAr: "مساحة الدراسة" },
    { href: "/student/learning/intelligence", label: "Intelligence", labelAr: "الذكاء" },
    { href: "/student/learning/resources", label: "Resources", labelAr: "الموارد" },
    { href: "/student/recommendations", label: "Recommendations", labelAr: "التوصيات" },
    { href: "/student/notes", label: "Notes", labelAr: "الملاحظات" },
    { href: "/student/bookmarks", label: "Bookmarks", labelAr: "الإشارات المرجعية" },
    { href: "/student/flashcards", label: "Flashcards", labelAr: "البطاقات التعليمية" },
  ],
  "/assessment": [
    { href: "/assessment/employability", label: "Employability Journey", labelAr: "رحلة التوظيف" },
  ],
  "/student/results": [
    { href: "/student/results", label: "Results", labelAr: "النتائج" },
  ],
  "/student/profile": [
    { href: "/student/profile", label: "Profile", labelAr: "الملف الشخصي" },
  ],
  "/student/competencies": [
    { href: "/student/competencies", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/competency-radar", label: "Competency Radar", labelAr: "رادار الكفاءات" },
    { href: "/student/competency-graph", label: "Competency Graph", labelAr: "رسم الكفاءات" },
    { href: "/student/skill-tree", label: "Skill Tree", labelAr: "شجرة المهارات" },
    { href: "/student/competency/roadmap", label: "Roadmap", labelAr: "خارطة الطريق" },
    { href: "/student/competency/passport", label: "Passport", labelAr: "جواز الكفاءات" },
    { href: "/student/competency/credential-wallet", label: "Credential Wallet", labelAr: "محفظة الشهادات" },
    { href: "/student/competency/badges", label: "Badges", labelAr: "الشارات" },
    { href: "/student/competency/gap", label: "Gap Analysis", labelAr: "تحليل الفجوات" },
  ],
  "/student/success": [
    { href: "/student/success", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/success-coach", label: "Success Coach", labelAr: "مدرب النجاح" },
    { href: "/student/goals", label: "Goals", labelAr: "الأهداف" },
    { href: "/student/success/productivity", label: "Productivity", labelAr: "الإنتاجية" },
    { href: "/student/success/risk", label: "Risk", labelAr: "المخاطر" },
    { href: "/student/readiness", label: "Readiness", labelAr: "الجاهزية" },
    { href: "/student/achievements", label: "Achievements", labelAr: "الإنجازات" },
    { href: "/student/tasks", label: "Tasks", labelAr: "المهام" },
    { href: "/student/simulation", label: "Simulation", labelAr: "المحاكاة" },
    { href: "/student/capstone", label: "Capstone", labelAr: "مشروع التخرج" },
  ],
  "/student/wellbeing": [
    { href: "/student/wellbeing", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/wellness", label: "Wellness", labelAr: "الصحة" },
    { href: "/student/habits", label: "Habits", labelAr: "العادات" },
    { href: "/student/focus", label: "Focus Sessions", labelAr: "جلسات التركيز" },
  ],
  "/student/career": [
    { href: "/student/career", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/career-explorer", label: "Career Explorer", labelAr: "استكشاف المهنة" },
    { href: "/student/career-match", label: "Career Match", labelAr: "مطابقة المهنة" },
    { href: "/student/career-coach", label: "Career Coach", labelAr: "مدرب المهنة" },
    { href: "/student/career-journey", label: "Career Journey", labelAr: "رحلة المهنة" },
    { href: "/student/career/jobs", label: "Jobs", labelAr: "الوظائف" },
    { href: "/student/applications", label: "Applications", labelAr: "الطلبات" },
    { href: "/student/career/internships", label: "Internships", labelAr: "التدريب" },
    { href: "/student/career/interview-prep", label: "Interview Prep", labelAr: "إعداد المقابلة" },
    { href: "/student/career/resume", label: "Resume", labelAr: "السيرة الذاتية" },
    { href: "/student/career/placement", label: "Placement", labelAr: "التوظيف" },
    { href: "/student/career/networking", label: "Networking", labelAr: "شبكة العلاقات" },
    { href: "/student/funding", label: "Funding", labelAr: "التمويل" },
  ],
  "/student/research": [
    { href: "/student/research", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/ai/research-coach", label: "Research Coach", labelAr: "مدرب البحث" },
    { href: "/student/research-assistant", label: "Research Assistant", labelAr: "مساعد البحث" },
    { href: "/student/research/literature", label: "Literature", labelAr: "الأدبيات" },
    { href: "/student/research/publications", label: "Publications", labelAr: "المنشورات" },
    { href: "/student/research/innovation", label: "Innovation", labelAr: "الابتكار" },
  ],
  "/student/portfolio": [
    { href: "/student/portfolio", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/portfolio/projects", label: "Projects", labelAr: "المشاريع" },
    { href: "/student/portfolio/achievements", label: "Achievements", labelAr: "الإنجازات" },
    { href: "/student/portfolio/skills-visualization", label: "Skills", labelAr: "المهارات" },
    { href: "/student/portfolio/competency-display", label: "Competencies", labelAr: "الكفاءات" },
    { href: "/student/portfolio/badge-management", label: "Badges", labelAr: "الشارات" },
    { href: "/student/portfolio/journey", label: "Journey", labelAr: "الرحلة" },
    { href: "/student/portfolio/experience", label: "Experience", labelAr: "الخبرات" },
    { href: "/student/portfolio/certifications", label: "Certifications", labelAr: "الشهادات" },
    { href: "/student/portfolio/publications", label: "Publications", labelAr: "المنشورات" },
    { href: "/student/portfolio/ai-generator", label: "AI Generator", labelAr: "مولد الذكاء الاصطناعي" },
    { href: "/student/portfolio/ai", label: "AI Portfolio", labelAr: "ملف الذكاء الاصطناعي" },
    { href: "/student/portfolio/add", label: "Add Entry", labelAr: "إضافة" },
    { href: "/student/portfolio/export", label: "Export", labelAr: "تصدير" },
    { href: "/student/portfolio/share", label: "Share", labelAr: "مشاركة" },
  ],
  "/student/community": [
    { href: "/student/community", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/arena", label: "Arena", labelAr: "الساحة" },
    { href: "/student/community/feed", label: "Feed", labelAr: "التدفق" },
    { href: "/student/communication/chat", label: "Chat & Messages", labelAr: "الدردشة والرسائل" },
    { href: "/student/clubs", label: "Clubs", labelAr: "الأندية" },
    { href: "/student/challenges", label: "Challenges & Competitions", labelAr: "التحديات والمسابقات" },
    { href: "/student/leaderboards", label: "Leaderboard", labelAr: "لوحة الصدارة" },
    { href: "/student/study-groups", label: "Study Groups", labelAr: "مجموعات الدراسة" },
    { href: "/student/mentorship", label: "Mentorship", labelAr: "الإرشاد" },
    { href: "/student/events", label: "Events", labelAr: "الفعاليات" },
    { href: "/student/eportfolio", label: "E-Portfolio", labelAr: "الملف الإلكتروني" },
  ],
  "/student/knowledge": [
    { href: "/student/knowledge", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/knowledge-base", label: "Knowledge Base", labelAr: "قاعدة المعرفة" },
    { href: "/student/knowledge/universal-search", label: "Universal Search", labelAr: "بحث شامل" },
    { href: "/student/knowledge/graph", label: "Knowledge Graph", labelAr: "رسم المعرفة" },
    { href: "/student/knowledge/personal-graph", label: "Personal Graph", labelAr: "الرسم البياني الشخصي" },
  ],
  "/student/ai": [
    { href: "/student/ai", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/ai-assistant", label: "AI Assistant", labelAr: "مساعد الذكاء الاصطناعي" },
    { href: "/student/ai/prompts", label: "Prompts", labelAr: "الموجهات" },
    { href: "/student/ai/memory", label: "Memory", labelAr: "الذاكرة" },
    { href: "/student/ai/agents", label: "Agents & Workflows", labelAr: "الوكلاء وسير العمل" },
    { href: "/student/ai/notebook", label: "Notebook", labelAr: "دفتر الملاحظات" },
    { href: "/student/ai/insights", label: "Insights", labelAr: "الرؤى" },
  ],
  "/student/analytics": [
    { href: "/student/analytics", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/analytics/academic", label: "Academic", labelAr: "الأكاديمي" },
    { href: "/student/analytics/learning", label: "Learning", labelAr: "التعلم" },
    { href: "/student/analytics/competency", label: "Competency", labelAr: "الكفاءة" },
    { href: "/student/analytics/career", label: "Career", labelAr: "المهنة" },
    { href: "/student/analytics/assessment", label: "Assessment", labelAr: "التقييم" },
    { href: "/student/analytics/productivity", label: "Productivity", labelAr: "الإنتاجية" },
    { href: "/student/analytics/wellness", label: "Wellness", labelAr: "العافية" },
    { href: "/student/analytics/ai", label: "AI Analytics", labelAr: "تحليلات الذكاء الاصطناعي" },
    { href: "/student/analytics/timeline", label: "Timeline", labelAr: "الجدول الزمني" },
  ],
  "/student/personal": [
    { href: "/student/personal", label: "Overview", labelAr: "نظرة عامة" },
    { href: "/student/personal/documents", label: "Documents", labelAr: "المستندات" },
    { href: "/student/personal/student-id", label: "Student ID", labelAr: "بطاقة الطالب" },
    { href: "/student/personal/preferences", label: "Preferences", labelAr: "التفضيلات" },
    { href: "/student/personal/accessibility", label: "Accessibility", labelAr: "إمكانية الوصول" },
    { href: "/student/personal/security", label: "Security", labelAr: "الأمان" },
    { href: "/student/personal/privacy", label: "Privacy", labelAr: "الخصوصية" },
    { href: "/student/settings", label: "Settings", labelAr: "الإعدادات" },
    { href: "/student/account/notifications", label: "Notifications", labelAr: "الإشعارات" },
    { href: "/student/account/connected-apps", label: "Connected Apps", labelAr: "التطبيقات المتصلة" },
  ],
};

export function StudentTopBar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { lang, setLang, theme, setTheme, setSidebarOpen } = useApp();
  const ar = lang === "ar";
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<{ href: string; label: string }[]>([]);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [recentPages, setRecentPages] = useState<{ href: string; label: string }[]>([]);
  const [recentOpen, setRecentOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setFavoritesOpen(false); setRecentOpen(false); setHelpOpen(false); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-topbar-popover]")) {
        setFavoritesOpen(false); setRecentOpen(false); setHelpOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const getSubPages = (): SubPage[] => {
    for (const [p, pages] of Object.entries(SECTION_SUBPAGES)) {
      if (pathname === p || pathname.startsWith(p + "/")) return pages;
    }
    for (const pages of Object.values(SECTION_SUBPAGES)) {
      if (pages.some(page => pathname === page.href)) return pages;
    }
    return [];
  };
  const subPages = getSubPages();

  useEffect(() => {
    try { const s = localStorage.getItem("iscarb-favorites"); if (s) setFavorites(JSON.parse(s)); } catch { }
  }, []);

  const isFavorited = favorites.some((f) => f.href === pathname);

  const toggleFavorite = useCallback(() => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.href === pathname);
      const label = ar ? "صفحة" : "Page";
      const next = exists
        ? prev.filter((f) => f.href !== pathname)
        : [{ href: pathname, label }, ...prev].slice(0, 10);
      try { localStorage.setItem("iscarb-favorites", JSON.stringify(next)); } catch { }
      return next;
    });
  }, [pathname, ar]);

  useEffect(() => {
    try { const s = localStorage.getItem("iscarb-recent-pages"); if (s) setRecentPages(JSON.parse(s)); } catch { }
  }, []);

  const addRecentPage = useCallback((href: string, label: string) => {
    setRecentPages((prev) => {
      const next = [{ href, label }, ...prev.filter((p) => p.href !== href)].slice(0, 5);
      try { localStorage.setItem("iscarb-recent-pages", JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);

  useEffect(() => {
    for (const [p, pages] of Object.entries(SECTION_SUBPAGES)) {
      if (pathname === p || pathname.startsWith(p + "/")) {
        const name = p.split("/").pop() || "Page";
        addRecentPage(pathname, name.charAt(0).toUpperCase() + name.slice(1));
        return;
      }
      if (pages.some(page => pathname === page.href)) {
        const name = p.split("/").pop() || "Page";
        addRecentPage(pathname, name.charAt(0).toUpperCase() + name.slice(1));
        return;
      }
    }
  }, [pathname]);

  const handleLogout = async () => {
    try { await fetch("/api/v1/auth/logout", { method: "POST" }); } catch { }
    clearClientToken(); // wipe this tab's per-tab token only
    window.location.href = "/login";
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    if (typeof setTheme === "function") {
      setTheme(next);
    }
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const toggleLang = () => {
    let next: typeof lang = "en";
    if (lang === "en") next = "ar";
    else if (lang === "ar") next = "fr";
    setLang(next);
  };

  return (
    <header className={cn("sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md", className)}>
      <div className="h-12 flex items-center gap-2 px-3 lg:px-5">
        <button className="lg:hidden p-2 rounded-md hover:bg-accent" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1" />
        <button onClick={() => setSearchOpen(true)} className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border border-border/60 bg-muted/30 text-muted-foreground text-sm hover:bg-muted/60 transition-colors cursor-pointer">
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">{ar ? "بحث..." : "Search..."}</span>
          <kbd className="ml-2 text-[10px] font-mono bg-background border border-border rounded px-1 py-0.5">⌘K</kbd>
        </button>
        <div className="relative" data-topbar-popover>
          <button onClick={() => { setRecentOpen(!recentOpen); setFavoritesOpen(false); setHelpOpen(false); }} className="p-2 rounded-md hover:bg-accent transition-colors" title={ar ? "الأخيرة" : "Recent"}>
            <Clock className="h-[18px] w-[18px]" />
          </button>
          {recentOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border"><span className="text-xs font-semibold">{ar ? "الأخيرة" : "Recently Viewed"}</span></div>
              {recentPages.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">{ar ? "لا توجد صفحات" : "No recent pages"}</p>
              ) : (
                <div className="py-1">{recentPages.map((p) => (<Link key={p.href} href={p.href} onClick={() => setRecentOpen(false)} className="block px-3 py-2 text-xs hover:bg-accent transition-colors">{p.label}</Link>))}</div>
              )}
            </div>
          )}
        </div>
        <div className="relative" data-topbar-popover>
          <button onClick={() => { setFavoritesOpen(!favoritesOpen); setRecentOpen(false); setHelpOpen(false); }} className={cn("p-2 rounded-md transition-colors", isFavorited ? "text-yellow-500" : "text-muted-foreground hover:bg-accent")} title={ar ? "المفضلة" : "Favorites"}>
            <Star className={cn("h-[18px] w-[18px]", isFavorited && "fill-yellow-500")} />
          </button>
          {favoritesOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold">{ar ? "المفضلة" : "Favorites"}</span>
                <button onClick={toggleFavorite} className="text-[11px] text-[#0E6C3C] hover:underline">{isFavorited ? (ar ? "إزالة" : "Remove") : (ar ? "إضافة" : "Add")}</button>
              </div>
              {favorites.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">{ar ? "لا توجد مفضلة" : "No favorites"}</p>
              ) : (
                <div className="py-1">{favorites.map((f) => (<Link key={f.href} href={f.href} onClick={() => setFavoritesOpen(false)} className="block px-3 py-2 text-xs hover:bg-accent transition-colors">{f.label}</Link>))}</div>
              )}
            </div>
          )}
        </div>
        <NotificationBell />
        <div className="relative" data-topbar-popover>
          <button onClick={() => { setHelpOpen(!helpOpen); setFavoritesOpen(false); setRecentOpen(false); }} className="p-2 rounded-md hover:bg-accent transition-colors" title={ar ? "المساعدة" : "Help"}>
            <HelpCircle className="h-[18px] w-[18px]" />
          </button>
          {helpOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border"><span className="text-xs font-semibold">{ar ? "المساعدة" : "Help"}</span></div>
              <div className="py-1">
                {[{ href: "/help/getting-started", label: ar ? "البدء" : "Getting Started" }, { href: "/help/faq", label: "FAQ" }, { href: "/help/contact", label: ar ? "تواصل" : "Contact" }].map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setHelpOpen(false)} className="block px-3 py-2 text-xs hover:bg-accent transition-colors">{item.label}</Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={toggleLang} className="p-2 rounded-md hover:bg-accent transition-colors" title={ar ? "English" : "العربية"}><Languages className="h-[18px] w-[18px]" /></button>
        <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-accent transition-colors" title={ar ? "المظهر" : "Theme"}>
          {mounted && theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button onClick={handleLogout} className="p-2 rounded-md hover:bg-accent transition-colors" title={ar ? "خروج" : "Logout"}><LogOut className="h-[18px] w-[18px]" /></button>
      </div>
      {subPages.length > 0 && (
        <div className="h-10 flex items-center gap-1 px-3 lg:px-5 border-t border-border/50 overflow-x-auto scrollbar-iscarb">
          {subPages.map((page) => {
            const active = pathname === page.href || pathname.startsWith(page.href + "/");
            return (
              <Link key={page.href} href={page.href} className={cn("shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", active ? "bg-[#0E6C3C]/10 text-[#0E6C3C] font-semibold" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                {ar ? page.labelAr : page.label}
              </Link>
            );
          })}
        </div>
      )}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setSearchOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="relative z-50 w-full max-w-lg mx-4 bg-background border border-border rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={ar ? "ابحث..." : "Search..."} className="flex-1 bg-transparent outline-none text-sm" onKeyDown={(e) => { if (e.key === "Escape") setSearchOpen(false); if (e.key === "Enter" && searchQuery.trim()) window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`; }} />
              <kbd className="text-[10px] font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground">ESC</kbd>
            </div>
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">{ar ? "اكتب للبحث..." : "Type to search..."}</div>
          </div>
        </div>
      )}
    </header>
  );
}
