"use client";

import { RoleSidebar, type NavItem } from "./RoleSidebar";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  ShieldCheck,
} from "lucide-react";

const NAV: NavItem[] = [
  { href: "/dean/dashboard", label: "Dean Dashboard", labelAr: "لوحة العميد", icon: LayoutDashboard },
  { href: "/dean/faculty", label: "Faculty Overview", labelAr: "نظرة على هيئة التدريس", icon: Users },
  { href: "/dean/analytics", label: "Analytics", labelAr: "التحليلات", icon: BarChart3 },
  { href: "/dean/reporting", label: "Reporting", labelAr: "التقارير", icon: FileText },
  { href: "/dean/compliance", label: "Compliance", labelAr: "الامتثال", icon: ShieldCheck },
];

export function DeanSidebar() {
  return (
    <RoleSidebar
      navItems={NAV}
      homeHref="/dean/dashboard"
      workspaceLabel="Dean Workspace"
      workspaceLabelAr="مساحة العميد"
    />
  );
}
