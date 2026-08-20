"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CareerReadinessCardProps {
  score: number;
  label: string;
  labelAr: string;
  trend?: "up" | "down" | "stable";
  lang?: "en" | "ar";
  className?: string;
}

function getColor(score: number) {
  if (score >= 80) return { stroke: "#22c55e", text: "text-green-600 dark:text-green-400" };
  if (score >= 60) return { stroke: "#f59e0b", text: "text-amber-600 dark:text-amber-400" };
  return { stroke: "#ef4444", text: "text-red-600 dark:text-red-400" };
}

function getTrendIcon(trend: "up" | "down" | "stable") {
  switch (trend) {
    case "up":
      return TrendingUp;
    case "down":
      return TrendingDown;
    default:
      return Minus;
  }
}

function getTrendLabel(trend: "up" | "down" | "stable", ar: boolean) {
  const labels = {
    up: ar ? "تحسن" : "Improving",
    down: ar ? "انخفاض" : "Declining",
    stable: ar ? "مستقر" : "Stable",
  };
  return labels[trend];
}

function getScoreLabel(score: number, ar: boolean) {
  if (score >= 80) return ar ? "ممتاز" : "Excellent";
  if (score >= 60) return ar ? "جيد" : "Good";
  return ar ? "يحتاج تحسين" : "Needs Work";
}

export function CareerReadinessCard({
  score,
  label,
  labelAr,
  trend,
  lang = "en",
  className,
}: CareerReadinessCardProps) {
  const ar = lang === "ar";
  const { stroke, text } = getColor(score);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const TrendIcon = trend ? getTrendIcon(trend) : null;
  const trendLabel = trend ? getTrendLabel(trend, ar) : null;
  const scoreLabel = getScoreLabel(score, ar);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{ar ? labelAr : label}</h3>
        {trend && TrendIcon && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend === "up" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              trend === "down" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              trend === "stable" && "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400",
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {trendLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={stroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold font-display", text)}>{score}</span>
            <span className="text-[10px] text-muted-foreground font-medium">%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold", text)}>{scoreLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {ar ? "مستوى الاستعداد المهني" : "Career readiness level"}
          </p>
        </div>
      </div>
    </div>
  );
}
