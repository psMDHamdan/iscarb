"use client";

import { WorkspaceLayout } from "@/components/layouts/WorkspaceLayout";
import { LectureSidebar } from "@/components/iscarb/sidebars/LectureSidebar";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceLayout sidebar={LectureSidebar}>
      {children}
    </WorkspaceLayout>
  );
}
