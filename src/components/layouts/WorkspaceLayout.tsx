"use client";

import { useEffect, Children } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/use-session";
import { Topbar } from "@/components/iscarb/Topbar";
import { Footer } from "@/components/iscarb/Footer";

/**
 * WorkspaceLayout — the authenticated shell for workspace pages.
 * Replaces AppShell for workspace-specific routes.
 * Each workspace provides its own sidebar component.
 */
export function WorkspaceLayout({
  children,
  sidebar: Sidebar,
  topbar: TopbarComponent,
  subheader: SubheaderComponent,
}: {
  children: React.ReactNode;
  sidebar: React.ComponentType;
  topbar?: React.ComponentType<{ className?: string }>;
  subheader?: React.ComponentType;
}) {
  const { role, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !role) router.push("/login");
  }, [role, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading iSCARB…</p>
        </div>
      </div>
    );
  }
  if (!role) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-1 w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {TopbarComponent ? <TopbarComponent className="no-print" /> : <Topbar className="no-print" />}
          {SubheaderComponent && <SubheaderComponent />}
          <main id="iscarb-main" className="flex-1 overflow-y-auto p-6 animate-fade-in">
            {Children.toArray(children)}
          </main>
        </div>
      </div>
    </div>
  );
}
