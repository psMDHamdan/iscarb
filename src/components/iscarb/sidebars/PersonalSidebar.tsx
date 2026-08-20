"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  X,
  LayoutDashboard,
  User,
  GraduationCap,
  Briefcase,
  Star,
  Trophy,
  Award,
  Medal,
  FileText,
  Settings2,
  Lock,
  Shield,
  Bell,
  Link as LinkIcon,
  Sliders,
  Accessibility,
  Languages,
  Palette,
  Download,
  Settings,
} from "lucide-react";

type Group = "overview" | "identity" | "credentials" | "connections" | "preferences";

const NAV: { href: string; label: string; labelAr: string; icon: any; group: Group }[] = [
  // Overview
  { href: "/personal/dashboard", label: "Personal Dashboard", labelAr: "لوحة التحكم الشخصية", icon: LayoutDashboard, group: "overview" },
  
  // Identity
  { href: "/personal/profile", label: "Profile", labelAr: "الملف الشخصي", icon: User, group: "identity" },
  { href: "/personal/academic", label: "Academic Profile", labelAr: "الملف الأكاديمي", icon: GraduationCap, group: "identity" },
  { href: "/personal/career", label: "Career Profile", labelAr: "الملف المهني", icon: Briefcase, group: "identity" },
  { href: "/personal/skills", label: "Skills", labelAr: "المهارات", icon: Star, group: "identity" },
  
  // Credentials
  { href: "/personal/achievements", label: "Achievements", labelAr: "الإنجازات", icon: Trophy, group: "credentials" },
  { href: "/personal/certificates", label: "Certificates", labelAr: "الشهادات", icon: Award, group: "credentials" },
  { href: "/personal/badges", label: "Badges", labelAr: "الشارات", icon: Medal, group: "credentials" },
  { href: "/personal/transcript", label: "Transcript", labelAr: "السجل الأكاديمي", icon: FileText, group: "credentials" },
  
  // Connections & Privacy
  { href: "/personal/portfolio-settings", label: "Portfolio Settings", labelAr: "إعدادات ملف الإنجاز", icon: Settings2, group: "connections" },
  { href: "/personal/privacy", label: "Privacy", labelAr: "الخصوصية", icon: Lock, group: "connections" },
  { href: "/personal/security", label: "Security", labelAr: "الأمان", icon: Shield, group: "connections" },
  { href: "/personal/notifications", label: "Notifications", labelAr: "الإشعارات", icon: Bell, group: "connections" },
  { href: "/personal/connected-accounts", label: "Connected Accounts", labelAr: "الحسابات المتصلة", icon: LinkIcon, group: "connections" },
  
  // Preferences
  { href: "/personal/preferences", label: "Preferences", labelAr: "التفضيلات", icon: Sliders, group: "preferences" },
  { href: "/personal/accessibility", label: "Accessibility", labelAr: "إمكانية الوصول", icon: Accessibility, group: "preferences" },
  { href: "/personal/language", label: "Language", labelAr: "اللغة", icon: Languages, group: "preferences" },
  { href: "/personal/theme", label: "Theme", labelAr: "المظهر", icon: Palette, group: "preferences" },
  { href: "/personal/data-export", label: "Data Export", labelAr: "تصدير البيانات", icon: Download, group: "preferences" },
  { href: "/personal/settings", label: "Account Settings", labelAr: "إعدادات الحساب", icon: Settings, group: "preferences" },
];

const GROUP_META: Record<Group, { en: string; ar: string }> = {
  overview: { en: "Overview", ar: "نظرة عامة" },
  identity: { en: "Digital Identity", ar: "الهوية الرقمية" },
  credentials: { en: "Credentials", ar: "وثائق الاعتماد" },
  connections: { en: "Privacy & Connections", ar: "الخصوصية والاتصالات" },
  preferences: { en: "Preferences", ar: "التفضيلات" },
};

export function PersonalSidebar() {
  const pathname = usePathname();
  const { lang, sidebarOpen, setSidebarOpen } = useApp();
  const ar = lang === "ar";

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn("fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-72 shrink-0 border-r border-border bg-background/60 backdrop-blur-2xl shadow-[1px_0_40px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_40px_rgba(255,255,255,0.02)] flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", ar && "lg:order-last border-r-0 border-l")}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link href="/personal/dashboard" className="flex items-center gap-2">
            <img src="/iscarb-mark.png" alt="iSCARB" className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg tracking-tight"><span className="text-iscarb-cyan">i</span><span className="text-iscarb-green">SCARB</span></span>
              <span className="text-[10px] text-muted-foreground font-arabic">{ar ? "المساحة الشخصية" : "Personal Hub"}</span>
            </div>
          </Link>
          <button className="lg:hidden p-1.5 rounded-md hover:bg-accent" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-iscarb px-3 py-4">
          <ul className="space-y-6">
            {(["overview", "identity", "credentials", "connections", "preferences"] as Group[]).map((groupKey) => (
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
