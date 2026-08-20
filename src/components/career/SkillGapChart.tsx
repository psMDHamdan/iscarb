"use client";

import { cn } from "@/lib/utils";

interface SkillGap {
  skill: string;
  current: number;
  target: number;
  priority: "high" | "medium" | "low";
}

interface SkillGapChartProps {
  gaps: SkillGap[];
  lang?: "en" | "ar";
  className?: string;
}

const PRIORITY_CONFIG = {
  high: {
    en: "High",
    ar: "عالي",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
  medium: {
    en: "Medium",
    ar: "متوسط",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  low: {
    en: "Low",
    ar: "منخفض",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
  },
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function SkillGapChart({ gaps, lang = "en", className }: SkillGapChartProps) {
  const ar = lang === "ar";
  const sorted = [...gaps].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99));

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {ar ? "فجوات المهارات" : "Skill Gap Analysis"}
      </h3>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {ar ? "لا توجد بيانات فجوات" : "No gap data available"}
        </p>
      ) : (
        <div className="space-y-4">
          {sorted.map((gap) => {
            const config = PRIORITY_CONFIG[gap.priority];
            return (
              <div key={gap.skill} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {gap.skill}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0",
                      config.bg,
                      config.text,
                    )}
                  >
                    {ar ? config.ar : config.en}
                  </span>
                </div>

                <div className="relative h-6 rounded-full bg-muted/30 overflow-hidden">
                  {/* Target bar (background) */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-muted/50"
                    style={{ width: `${gap.target}%` }}
                  />
                  {/* Current bar */}
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                      gap.current >= gap.target
                        ? "bg-green-500"
                        : gap.current >= gap.target * 0.7
                          ? "bg-amber-500"
                          : "bg-red-500",
                    )}
                    style={{ width: `${gap.current}%` }}
                  />
                  {/* Labels */}
                  <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-medium">
                    <span className="text-foreground/80 drop-shadow-sm">
                      {gap.current}%
                    </span>
                    <span className="text-muted-foreground">
                      {ar ? "الهدف" : "Target"}: {gap.target}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-[10px] text-muted-foreground">
            {ar ? "الحالي" : "Current"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-muted/50" />
          <span className="text-[10px] text-muted-foreground">
            {ar ? "الهدف" : "Target"}
          </span>
        </div>
      </div>
    </div>
  );
}
