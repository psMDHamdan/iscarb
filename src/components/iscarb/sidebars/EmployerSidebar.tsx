"use client";

import { RoleSidebar, type NavItem } from "./RoleSidebar";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  BarChart3,
  UsersRound,
} from "lucide-react";

const NAV: NavItem[] = [
  { href: "/employer/dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/employer/job-posting", label: "Job Postings", labelAr: "الوظائف", icon: Briefcase },
  { href: "/employer/candidates", label: "Candidates", labelAr: "المرشحون", icon: Users },
  { href: "/employer/offers", label: "Offers", labelAr: "العروض", icon: FileText },
  { href: "/employer/analytics", label: "Analytics", labelAr: "التحليلات", icon: BarChart3 },
  { href: "/employer/team", label: "Team", labelAr: "الفريق", icon: UsersRound },
];

export function EmployerSidebar() {
  return (
    <RoleSidebar
      navItems={NAV}
      homeHref="/employer/dashboard"
      workspaceLabel="Employer Portal"
      workspaceLabelAr="بوابة صاحب العمل"
    />
  );
}
