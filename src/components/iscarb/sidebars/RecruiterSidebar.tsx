"use client";

import { RoleSidebar, type NavItem } from "./RoleSidebar";
import {
  LayoutDashboard,
  Search,
  UserCheck,
  ListTodo,
  BarChart3,
} from "lucide-react";

const NAV: NavItem[] = [
  { href: "/recruiter/dashboard", label: "Recruiter Dashboard", labelAr: "لوحة التوظيف", icon: LayoutDashboard },
  { href: "/recruiter/search", label: "Talent Search", labelAr: "بحث الموهوبين", icon: Search },
  { href: "/recruiter/candidates", label: "Candidates", labelAr: "المرشحون", icon: UserCheck },
  { href: "/recruiter/pipeline", label: "Pipeline", labelAr: "خط التوظيف", icon: ListTodo },
  { href: "/recruiter/analytics", label: "Analytics", labelAr: "التحليلات", icon: BarChart3 },
];

export function RecruiterSidebar() {
  return (
    <RoleSidebar
      navItems={NAV}
      homeHref="/recruiter/dashboard"
      workspaceLabel="Recruiter Portal"
      workspaceLabelAr="بوابة التوظيف"
    />
  );
}
