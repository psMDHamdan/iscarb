"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { useSession } from "@/lib/use-session";
import { Sidebar } from "@/components/iscarb/Sidebar";
import { Topbar } from "@/components/iscarb/Topbar";
import { Footer } from "@/components/iscarb/Footer";

/**
 * AppShell — the single authenticated chrome for every workspace page.
 * ===========================================================================
 * Masterplan §3.1: one global shell hosts all applications behind one
 * authenticated session. §3.3: sidebar + topbar + stable URLs.
 *
 * Owns:
 *   1. Session gate — unauthenticated users are pushed to /login.
 *   2. lang/dir + theme application on <html> (RTL-first).
 *   3. Navigation via Next.js app router (pure URL-based, no SPA bridge).
 */
export function AppShell({
  children,
  padded = false,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) {
  const { lang, theme } = useApp();
  const { role, isLoading } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // 1. Session gate
  useEffect(() => {
    if (!isLoading && !role) router.push("/login");
  }, [role, isLoading, router]);

  // 2. lang + theme on <html>
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // scroll to top on navigation
  useEffect(() => {
    document.getElementById("iscarb-main")?.scrollTo({ top: 0 });
  }, [pathname]);

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
          <Topbar />
          <main id="iscarb-main" className={padded ? "flex-1 overflow-y-auto p-6" : "flex-1 overflow-y-auto"}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}