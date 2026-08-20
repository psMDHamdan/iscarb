"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trend {
  skill: string;
  demand: number;
  trend: "rising" | "stable" | "falling";
}

interface MarketTrendChartProps {
  trends: Trend[];
  lang?: "en" | "ar";
  className?: string;
}

const TREND_CONFIG = {
  rising: {
    en: "Rising",
    ar: "صاعد",
    icon: TrendingUp,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  stable: {
    en: "Stable",
    ar: "مستقر",
    icon: Minus,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  falling: {
    en: "Falling",
    ar: "هابط",
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
};

function getBarColor(demand: number) {
  if (demand >= 80) return "bg-green-500";
  if (demand >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export function MarketTrendChart({
  trends,
  lang = "en",
  className,
}: MarketTrendChartProps) {
  const ar = lang === "ar";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {ar ? "اتجاهات المهارات" : "Skill Demand Trends"}
      </h3>

      {trends.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {ar ? "لا توجد بيانات اتجاهات" : "No trend data available"}
        </p>
      ) : (
        <div className="space-y-3">
          {trends.map((item) => {
            const config = TREND_CONFIG[item.trend] || TREND_CONFIG.stable;
            const TrendIcon = config.icon;
            return (
              <div key={item.skill} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground truncate">
                      {item.skill}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {item.demand}%
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                          config.bg,
                          config.color,
                        )}
                      >
                        <TrendIcon className="h-2.5 w-2.5" />
                        {ar ? config.ar : config.en}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        getBarColor(item.demand),
                      )}
                      style={{ width: `${item.demand}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        {(["rising", "stable", "falling"] as const).map((key) => {
          const config = TREND_CONFIG[key];
          const Icon = config.icon;
          return (
            <div key={key} className="flex items-center gap-1">
              <Icon className={cn("h-3 w-3", config.color)} />
              <span className="text-[10px] text-muted-foreground">
                {ar ? config.ar : config.en}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
