"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  nameAr: string;
  href: string;
  icon: string;
  roles: string[];
}

const WORKSPACES: Workspace[] = [
  { id: "student", name: "Student", nameAr: "طالب", href: "/student/dashboard", icon: "📚", roles: ["student"] },
  { id: "faculty", name: "Faculty", nameAr: "هيئة تدريس", href: "/faculty/dashboard", icon: "👨‍🏫", roles: ["faculty"] },
  { id: "career", name: "Career", nameAr: "مسار مهني", href: "/career/dashboard", icon: "💼", roles: ["student", "faculty"] },
  { id: "learning", name: "Learning", nameAr: "تعلم", href: "/learning/dashboard", icon: "📖", roles: ["student", "faculty"] },
  { id: "research", name: "Research", nameAr: "بحث", href: "/research-os/dashboard", icon: "🔬", roles: ["faculty"] },
  { id: "community", name: "Community", nameAr: "مجتمع", href: "/community/dashboard", icon: "👥", roles: ["student", "faculty"] },
  { id: "growth", name: "Growth", nameAr: "نمو", href: "/growth/dashboard", icon: "🚀", roles: ["student"] },
  { id: "admin", name: "Administration", nameAr: "إدارة", href: "/admin/dashboard", icon: "⚙️", roles: ["admin", "superadmin"] },
  { id: "recruiter", name: "Recruiter", nameAr: "توظيف", href: "/recruiter/dashboard", icon: "🎯", roles: ["recruiter"] },
  { id: "employer", name: "Employer", nameAr: "صاحب عمل", href: "/employer/dashboard", icon: "🏢", roles: ["employer"] },
];

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { lang } = useApp();
  const ar = lang === "ar";

  const currentWorkspace = WORKSPACES.find((w) => pathname?.startsWith(w.href)) || WORKSPACES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "hover:bg-accent transition-colors w-full",
          "text-left text-sm",
        )}
      >
        <span className="text-lg">{currentWorkspace.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{ar ? currentWorkspace.nameAr : currentWorkspace.name}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-56 z-50 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                {ar ? "تبديل مساحة العمل" : "Switch Workspace"}
              </p>
              {WORKSPACES.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={workspace.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-2 rounded-lg",
                    "hover:bg-accent transition-colors",
                    pathname?.startsWith(workspace.href) && "bg-accent",
                  )}
                >
                  <span className="text-lg">{workspace.icon}</span>
                  <span className="flex-1 text-sm">{ar ? workspace.nameAr : workspace.name}</span>
                  {pathname?.startsWith(workspace.href) && (
                    <Check className="h-4 w-4 text-[#0E6C3C]" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
