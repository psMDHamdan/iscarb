"use client";

import { Sidebar } from "@/components/iscarb/Sidebar";
import { Topbar } from "@/components/iscarb/Topbar";

/**
 * Same chrome as the SPA home shell — used on /student/* quiz routes
 * so assessments aren't a naked page without navigation.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1 w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
