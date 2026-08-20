"use client";

import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useApiQuery } from "@/hooks/use-api-query";
import { RoleSidebar, type NavItem } from "./RoleSidebar";
import {
  LayoutDashboard,
  Map,
  ListChecks,
  Layers,
  Inbox,
  ShieldCheck,
  Target,
  BookOpen,
  FileText,
  Globe,
  Send,
  Settings,
} from "lucide-react";

export function LectureSidebar() {
  const pathname = usePathname();
  const { role } = useSession();
  // Resolve the active project id so per-project nav items link to the current project.
  // Exclude non-project segments (new, admin) from being treated as a project id.
  const id = pathname.match(/^\/faculty\/lecture\/(?!(?:new|admin)(?:\/|$))([^/]+)/)?.[1];
  const p = (suffix: string) =>
    id ? `/faculty/lecture/${id}${suffix}` : `/faculty/lecture`;

  const { data: project } = useApiQuery<{ nationalAlignmentMode?: string }>(
    ["project", id || ""],
    `/api/iscarb/lecture/projects/${id}`,
    { enabled: !!id }
  );

  // Admin-tier roles — mirrors requireRole() in src/lib/auth.ts exactly
  // (roles: ["admin"] is expanded to university_admin/system_admin/super_admin).
  // Keep in sync: it_ops/developer are NOT granted admin here so they never see
  // a nav item whose API would 403 them.
  let NAV: NavItem[] = id
    ? [
        { href: "/faculty/lecture", label: "Back to Dashboard", labelAr: "العودة للوحة التحكم", icon: LayoutDashboard, exact: true },
        { href: p("/source-map"), label: "Source Map", labelAr: "خريطة المصادر", icon: Map },
        { href: p("/plan"), label: "iSCARB Plan", labelAr: "خطة iSCARB", icon: ListChecks },
        { href: p("/studio"), label: "Studio", labelAr: "الاستوديو", icon: Layers },
        { href: p("/inbox"), label: "Decision Inbox", labelAr: "صندوق القرارات", icon: Inbox },
        { href: p("/quality"), label: "Quality Gates", labelAr: "بوابات الجودة", icon: ShieldCheck },
        { href: p("/alignment"), label: "Readiness & Align", labelAr: "الجاهزية والمواءمة", icon: Target },
        { href: p("/jaheziah"), label: "Jaheziah", labelAr: "جاهزية", icon: BookOpen },
        { href: p("/ncaaa"), label: "NCAAA Evidence", labelAr: "أدلة الاعتماد", icon: FileText },
        { href: p("/sources"), label: "Sources", labelAr: "المصادر", icon: Globe },
        { href: p("/publish"), label: "Publish", labelAr: "نشر", icon: Send },
      ]
    : [
        { href: "/faculty/lecture", label: "Lecture Compiler", labelAr: "محوّل المحاضرات", icon: BookOpen, exact: true },
      ];

  if (id && project?.nationalAlignmentMode === "COURSE_READINESS") {
    NAV = NAV.filter(n => n.label !== "Jaheziah");
  }

  return (
    <RoleSidebar
      navItems={NAV}
      homeHref="/faculty/lecture"
      workspaceLabel="Faculty AI Co-Pilot"
      workspaceLabelAr="مساعد الأستاذ"
    />
  );
}
