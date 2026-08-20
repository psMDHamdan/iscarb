"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Building2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  code: string;
  type: string;
}

const MOCK_ORGS: Organization[] = [
  { id: "1", name: "King Faisal University", code: "KFU", type: "university" },
  { id: "2", name: "Personal Workspace", code: "PERSONAL", type: "personal" },
];

export function OrganizationSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(MOCK_ORGS[0]);
  const { lang } = useApp();
  const ar = lang === "ar";

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
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0E6C3C] to-[#0F7B8A] flex items-center justify-center text-white text-xs font-bold">
          {selectedOrg.code.substring(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{selectedOrg.name}</p>
          <p className="text-xs text-muted-foreground">{selectedOrg.type}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 z-50 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                {ar ? "تبديل المنظمة" : "Switch Organization"}
              </p>
              {MOCK_ORGS.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setSelectedOrg(org);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-2 rounded-lg text-left",
                    "hover:bg-accent transition-colors",
                    selectedOrg.id === org.id && "bg-accent",
                  )}
                >
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0E6C3C] to-[#0F7B8A] flex items-center justify-center text-white text-xs font-bold">
                    {org.code.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.type}</p>
                  </div>
                  {selectedOrg.id === org.id && (
                    <Check className="h-4 w-4 text-[#0E6C3C]" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-border p-2">
              <button className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-left text-sm text-muted-foreground hover:bg-accent">
                <Building2 className="h-4 w-4" />
                {ar ? "إدارة المنظمات" : "Manage Organizations"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
