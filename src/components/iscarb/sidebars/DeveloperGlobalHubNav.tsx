"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface TopTab { label: string; labelAr: string; href: string; }
interface SectionConfig { prefixes: string[]; tabs: TopTab[]; }

const SECTIONS: SectionConfig[] = [
  { prefixes: ["/developer/dashboard"], tabs: [] },
  {
    prefixes: ["/developer/api-docs", "/developer/api-explorer", "/developer/api-keys", "/developer/api-usage"],
    tabs: [
      { label: "API Docs", labelAr: "وثائق API", href: "/developer/api-docs" },
      { label: "API Explorer", labelAr: "مستكشف API", href: "/developer/api-explorer" },
      { label: "API Keys", labelAr: "مفاتيح API", href: "/developer/api-keys" },
      { label: "API Usage", labelAr: "استخدام API", href: "/developer/api-usage" },
    ],
  },
  {
    prefixes: ["/developer/plugins", "/developer/sdks", "/developer/webhooks"],
    tabs: [
      { label: "Plugins", labelAr: "الإضافات", href: "/developer/plugins" },
      { label: "SDKs", labelAr: "أدوات التطوير", href: "/developer/sdks" },
      { label: "Webhooks", labelAr: "Webhooks", href: "/developer/webhooks" },
    ],
  },
  {
    prefixes: ["/developer/sandbox", "/developer/cli"],
    tabs: [
      { label: "Sandbox", labelAr: "بيئة التجربة", href: "/developer/sandbox" },
      { label: "CLI", labelAr: "سطر الأوامر", href: "/developer/cli" },
    ],
  },
];

export function DeveloperGlobalHubNav() {
  const pathname = usePathname();
  const { lang } = useApp();
  const ar = lang === "ar";
  const activeSection = SECTIONS.find((s) => s.prefixes.some((p) => pathname === p || pathname.startsWith(p + "/")));
  if (!activeSection || activeSection.tabs.length === 0) return null;
  return (
    <div className="w-full border-b border-border bg-background/90 backdrop-blur-md z-20 sticky top-14 shadow-sm">
      <div className="flex overflow-x-auto scrollbar-iscarb px-3 lg:px-5 gap-0.5">
        {activeSection.tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link key={tab.href} href={tab.href} className={cn("relative whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-all duration-200 shrink-0", isActive ? "text-[#0E6C3C] dark:text-[#58CE95]" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
              {ar ? tab.labelAr : tab.label}
              {isActive && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#0E6C3C] dark:bg-[#58CE95]" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
