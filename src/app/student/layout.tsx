"use client";

import { usePathname } from "next/navigation";
import { WorkspaceLayout } from "@/components/layouts/WorkspaceLayout";
import { StudentSidebar } from "@/components/iscarb/sidebars/StudentSidebar";
import { StudentTopBar } from "@/components/iscarb/sidebars/StudentTopBar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The lecture player (/student/lecture/[id] and /student/learn/[id]) is a
  // standalone, full-viewport learning experience. Render it WITHOUT the
  // workspace shell (sidebar / topbar) so it isn't clipped or
  // hidden behind the app chrome.
  if (/^\/student\/(lecture|learn)\/[^/]+$/.test(pathname)) {
    return <>{children}</>;
  }

  return (
    <WorkspaceLayout sidebar={StudentSidebar} topbar={StudentTopBar}>
      {children}
    </WorkspaceLayout>
  );
}
