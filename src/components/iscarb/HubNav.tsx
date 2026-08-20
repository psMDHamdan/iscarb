"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import type { LucideIcon } from "lucide-react";

export interface HubNavItem {
  label: string;
  labelAr: string;
  href: string;
  icon: LucideIcon;
}

interface HubNavProps {
  items: HubNavItem[];
  /** Optional extra class on the outer container */
  className?: string;
}

/**
 * HubNav — secondary top navigation bar for hub pages.
 * Renders a horizontal scrollable tab bar below the page header.
 * Each tab links to a route and highlights when active.
 */
export function HubNav({ items, className }: HubNavProps) {
  const pathname = usePathname();
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <nav
      className={cn(
        "-mx-6 mb-6 overflow-x-auto border-b border-border bg-background/80 backdrop-blur-sm scrollbar-iscarb",
        className,
      )}
    >
      <div className="flex gap-1 px-6 py-2 min-w-max">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const label = ar ? item.labelAr : item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                active
                  ? "bg-[#0E6C3C]/10 text-[#0E6C3C] border border-[#0E6C3C]/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
