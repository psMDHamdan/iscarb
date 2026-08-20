"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import {
  X,
  LayoutDashboard,
  MessageCircle,
  Shapes,
  BookOpen,
  Users,
  GraduationCap,
  Briefcase,
  Contact,
  Send,
  Calendar,
  MonitorPlay,
  Video,
  Trophy,
  Network,
  Store,
  Megaphone,
  MessageSquare,
  Crown,
  BarChart3,
  Settings,
} from "lucide-react";

type Group = "hub" | "connect" | "groups" | "events" | "platform";

const NAV: { href: string; label: string; labelAr: string; icon: any; group: Group }[] = [
  // Hub
  { href: "/community/dashboard", label: "Community Dashboard", labelAr: "لوحة المجتمع", icon: LayoutDashboard, group: "hub" },
  { href: "/community/announcements", label: "Announcements", labelAr: "الإعلانات", icon: Megaphone, group: "hub" },
  
  // Connect
  { href: "/community/discussions", label: "Discussions", labelAr: "النقاشات", icon: MessageCircle, group: "connect" },
  { href: "/community/messages", label: "Messages", labelAr: "الرسائل", icon: MessageSquare, group: "connect" },
  { href: "/community/networking", label: "Networking", labelAr: "الشبكات", icon: Network, group: "connect" },

  // Groups
  { href: "/community/clubs", label: "Clubs", labelAr: "الأندية", icon: Shapes, group: "groups" },
  { href: "/community/study-groups", label: "Study Groups", labelAr: "مجموعات الدراسة", icon: BookOpen, group: "groups" },
  { href: "/community/teams", label: "Teams", labelAr: "الفرق", icon: Users, group: "groups" },
  
  // Network
  { href: "/community/mentors", label: "Mentors", labelAr: "المرشدين", icon: GraduationCap, group: "groups" },
  { href: "/community/alumni", label: "Alumni Network", labelAr: "شبكة الخريجين", icon: Contact, group: "groups" },
  { href: "/community/faculty", label: "Faculty Connect", labelAr: "تواصل مع هيئة التدريس", icon: Briefcase, group: "groups" },
  { href: "/community/recruiters", label: "Recruiter Connect", labelAr: "تواصل مع جهات التوظيف", icon: Send, group: "groups" },

  // Events
  { href: "/community/events", label: "Events", labelAr: "الفعاليات", icon: Calendar, group: "events" },
  { href: "/community/workshops", label: "Workshops", labelAr: "ورش العمل", icon: MonitorPlay, group: "events" },
  { href: "/community/webinars", label: "Webinars", labelAr: "الندوات عبر الإنترنت", icon: Video, group: "events" },
  { href: "/community/competitions", label: "Competitions", labelAr: "المسابقات", icon: Trophy, group: "events" },

  // Platform
  { href: "/community/marketplace", label: "Marketplace", labelAr: "السوق", icon: Store, group: "platform" },
  { href: "/community/leaderboards", label: "Leaderboards", labelAr: "لوحات المتصدرين", icon: Crown, group: "platform" },
  { href: "/community/analytics", label: "Community Analytics", labelAr: "تحليلات المجتمع", icon: BarChart3, group: "platform" },
  { href: "/community/settings", label: "Community Settings", labelAr: "إعدادات المجتمع", icon: Settings, group: "platform" },
];

const GROUP_META: Record<Group, { en: string; ar: string }> = {
  hub: { en: "Community Hub", ar: "مركز المجتمع" },
  connect: { en: "Connect", ar: "تواصل" },
  groups: { en: "Groups & Network", ar: "المجموعات والشبكة" },
  events: { en: "Events & Activities", ar: "الفعاليات والأنشطة" },
  platform: { en: "Platform", ar: "المنصة" },
};

export function CommunitySidebar() {
  const pathname = usePathname();
  const { lang, sidebarOpen, setSidebarOpen } = useApp();
  const ar = lang === "ar";

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={cn("fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-72 shrink-0 border-r border-border bg-background/60 backdrop-blur-2xl shadow-[1px_0_40px_rgba(0,0,0,0.03)] dark:shadow-[1px_0_40px_rgba(255,255,255,0.02)] flex flex-col transition-transform duration-300", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0", ar && "lg:order-last border-r-0 border-l")}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link href="/community/dashboard" className="flex items-center gap-2">
            <img src="/iscarb-mark.png" alt="iSCARB" className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg tracking-tight"><span className="text-iscarb-cyan">i</span><span className="text-iscarb-green">SCARB</span></span>
              <span className="text-[10px] text-muted-foreground font-arabic">{ar ? "المجتمع" : "Community"}</span>
            </div>
          </Link>
          <button className="lg:hidden p-1.5 rounded-md hover:bg-accent" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-iscarb px-3 py-4">
          <ul className="space-y-6">
            {(["hub", "connect", "groups", "events", "platform"] as Group[]).map((groupKey) => (
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
