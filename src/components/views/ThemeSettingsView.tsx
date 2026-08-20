"use client";

import { useState } from "react";
import { Palette, Monitor, Sun, Moon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeSettingsViewProps {
  ar: boolean;
  currentTheme: string;
  setTheme: (theme: string) => void;
}

export function ThemeSettingsView({ ar, currentTheme, setTheme }: ThemeSettingsViewProps) {
  const [selected, setSelected] = useState(currentTheme || "system");

  const themes = [
    {
      id: "light",
      label: ar ? "فاتح" : "Light",
      desc: ar ? "واجهة فاتحة" : "Clean, bright interface",
      icon: Sun,
      preview: "bg-white border-gray-200",
    },
    {
      id: "dark",
      label: ar ? "داكن" : "Dark",
      desc: ar ? "واجهة داكنة" : "Easy on the eyes at night",
      icon: Moon,
      preview: "bg-gray-900 border-gray-700",
    },
    {
      id: "system",
      label: ar ? "النظام" : "System",
      desc: ar ? "مزامنة مع إعدادات النظام" : "Follow your system settings",
      icon: Monitor,
      preview: "bg-gradient-to-r from-white to-gray-900 border-gray-400",
    },
  ];

  const handleSelect = (id: string) => {
    setSelected(id);
    setTheme(id);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Palette className="h-4 w-4" /> {ar ? "اختيار السمة" : "Choose Theme"}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {ar ? "اختر كيف تريد أن تبدو الواجهة" : "Choose how the interface looks"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themes.map((theme) => {
            const Icon = theme.icon;
            const isSelected = selected === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                  isSelected
                    ? "border-[#0E6C3C] bg-[#0E6C3C]/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#0E6C3C] flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    "h-16 w-24 rounded-lg border-2 flex items-center justify-center",
                    theme.preview
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6",
                      theme.id === "dark" ? "text-white" : "text-[#0E6C3C]"
                    )}
                  />
                </div>

                <div className="text-center">
                  <p className="font-medium text-sm">{theme.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{theme.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
