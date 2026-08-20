"use client";

import { RoleSidebar, type NavItem } from "./RoleSidebar";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Settings,
  BarChart3,
  Database,
  Bell,
  Network,
  GitBranch,
  BookOpen,
} from "lucide-react";

const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Admin Dashboard", labelAr: "لوحة الإدارة", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", labelAr: "المستخدمون", icon: Users },
  { href: "/admin/rbac", label: "Roles & Permissions", labelAr: "الأدوار والصلاحيات", icon: ShieldCheck },
  { href: "/admin/analytics", label: "Analytics", labelAr: "التحليلات", icon: BarChart3 },
  { href: "/admin/triple-explorer", label: "Triple Explorer", labelAr: "مستكشف الثلاثيات", icon: Network },
  { href: "/admin/ontology-editor", label: "Ontology Editor", labelAr: "محرر الأونتولوجيا", icon: GitBranch },
  { href: "/admin/knowledge-graph", label: "Knowledge Graph", labelAr: "خريطة المعرفة", icon: BookOpen },
  { href: "/admin/database", label: "Database", labelAr: "قاعدة البيانات", icon: Database },
  { href: "/admin/monitoring", label: "Monitoring", labelAr: "المراقبة", icon: Bell },
  { href: "/admin/settings", label: "Settings", labelAr: "الإعدادات", icon: Settings },
];

export function AdminSidebar() {
  return (
    <RoleSidebar
      navItems={NAV}
      homeHref="/admin/dashboard"
      workspaceLabel="Admin Console"
      workspaceLabelAr="لوحة التحكم"
    />
  );
}
