"use client";

import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Menu, Moon, Sun, Languages, LogOut } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useSession } from "@/lib/use-session";
import { clearClientToken } from "@/lib/client-auth";
import { NotificationBell } from "@/components/iscarb/NotificationBell";
import { ConsentToggle } from "@/components/iscarb/ConsentToggle";

export function Topbar({ className }: { className?: string }) {
  const { lang, setLang, theme, setTheme, setSidebarOpen } = useApp();
  const { role } = useSession();
  // Hydration guard: false on the server + during hydration, true thereafter.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const ar = lang === "ar";

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {}
    clearClientToken(); // wipe this tab's per-tab token only
    window.location.href = "/login";
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const toggleLang = () => {
    let next: typeof lang = "en";
    if (lang === "en") next = "ar";
    else if (lang === "ar") next = "fr";
    
    setLang(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  };

  return (
    <header className={cn("sticky top-0 z-30 h-16 border-b border-border bg-background/85 backdrop-blur-md flex items-center gap-3 px-4 lg:px-6", className)}>
      <button
        className="lg:hidden p-2 rounded-md hover:bg-accent"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-iscarb-green-soft text-iscarb-green-dark text-[11px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-iscarb-green animate-pulse-soft" />
          {ar ? "المحرّك متصل" : "Engine live"}
        </span>
        {(role === "student" || role === "admin") && (
          <>
            <NotificationBell />
            <ConsentToggle />
          </>
        )}
        <button
          onClick={toggleLang}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Toggle language"
          title={ar ? "English" : "العربية"}
        >
          <Languages className="h-[18px] w-[18px]" />
          <span className="sr-only">Toggle language</span>
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Toggle theme"
          title={ar ? "تبديل المظهر" : "Toggle theme"}
        >
          {mounted && theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <button
          onClick={handleLogout}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Logout"
          title={ar ? "تسجيل الخروج" : "Logout"}
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span className="sr-only">Logout</span>
        </button>
      </div>
    </header>
  );
}
