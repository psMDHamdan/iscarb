"use client";

import { useSession } from "@/lib/use-session";
import { StudentSidebar } from "./sidebars/StudentSidebar";
import { LectureSidebar } from "./sidebars/LectureSidebar";
import { DeanSidebar } from "./sidebars/DeanSidebar";
import { AdminSidebar } from "./sidebars/AdminSidebar";
import { RecruiterSidebar } from "./sidebars/RecruiterSidebar";

/**
 * Sidebar — role-aware navigation dispatcher.
 * ===========================================================================
 * AppShell renders a single <Sidebar />; this component reads the session role
 * and delegates to the matching per-role sidebar. Keeping the switch here means
 * every workspace page gets the right navigation without duplicating the role
 * check. Unknown/system roles fall back to the admin sidebar (widest access).
 */
export function Sidebar() {
  const { role } = useSession();

  switch (role) {
    case "student":
      return <StudentSidebar />;
    case "faculty":
      return <LectureSidebar />;
    case "dean":
      return <DeanSidebar />;
    case "recruiter":
      return <RecruiterSidebar />;
    case "admin":
    case "system":
      return <AdminSidebar />;
    default:
      return <StudentSidebar />;
  }
}
