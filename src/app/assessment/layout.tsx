"use client";

import { WorkspaceLayout } from "@/components/layouts/WorkspaceLayout";
import { StudentSidebar } from "@/components/iscarb/sidebars/StudentSidebar";
import { StudentTopBar } from "@/components/iscarb/sidebars/StudentTopBar";

import React, { Children } from "react";

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceLayout sidebar={StudentSidebar} topbar={StudentTopBar}>
      {Children.toArray(children)}
    </WorkspaceLayout>
  );
}
