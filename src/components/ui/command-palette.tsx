"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Search, LayoutDashboard, Users, BarChart3, Settings, FileText,
  ClipboardCheck, Briefcase, GraduationCap, ShieldCheck,
} from "lucide-react";

interface CommandItem {
  label: string;
  labelAr: string;
  href: string;
  icon: React.ElementType;
  category: string;
  categoryAr: string;
}

const COMMANDS: CommandItem[] = [
  { label: "Dashboard", labelAr: "لوحة التحكم", href: "/student/dashboard", icon: LayoutDashboard, category: "Navigation", categoryAr: "التنقل" },
  { label: "Readiness Scale", labelAr: "مقياس الجاهزية", href: "/student/readiness", icon: BarChart3, category: "Student", categoryAr: "الطالب" },
  { label: "Assessment", labelAr: "التقييم", href: "/student/my-assessments", icon: ClipboardCheck, category: "Student", categoryAr: "الطالب" },
  { label: "Portfolio", labelAr: "الملف الشخصي", href: "/student/portfolio", icon: FileText, category: "Student", categoryAr: "الطالب" },
  { label: "Faculty Dashboard", labelAr: "لوحة الأستاذ", href: "/faculty/dashboard", icon: GraduationCap, category: "Faculty", categoryAr: "هيئة التدريس" },
  { label: "Admin Dashboard", labelAr: "لوحة الإدارة", href: "/admin/dashboard", icon: ShieldCheck, category: "Admin", categoryAr: "الإدارة" },
  { label: "Users", labelAr: "المستخدمون", href: "/admin/users", icon: Users, category: "Admin", categoryAr: "الإدارة" },
  { label: "Settings", labelAr: "الإعدادات", href: "/settings", icon: Settings, category: "System", categoryAr: "النظام" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const runCommand = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input placeholder="Search commands..." className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
            {COMMANDS.map((cmd) => (
              <Command.Item
                key={cmd.href}
                value={`${cmd.label} ${cmd.labelAr}`}
                onSelect={() => runCommand(cmd.href)}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <cmd.icon className="h-4 w-4" />
                <span>{cmd.label}</span>
                <span className="ml-auto text-xs text-muted-foreground font-arabic">{cmd.labelAr}</span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
