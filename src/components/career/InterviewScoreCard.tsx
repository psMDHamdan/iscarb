"use client";

import { MessageSquare, Video, Brain, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewSession {
  id: string;
  type: "behavioral" | "technical" | "case" | "general";
  overallScore: number;
  confidenceScore: number;
  communicationScore: number;
  createdAt: string;
}

interface InterviewScoreCardProps {
  session: InterviewSession;
  lang?: "en" | "ar";
  className?: string;
}

const TYPE_CONFIG = {
  behavioral: {
    en: "Behavioral",
    ar: "سلوكي",
    icon: Users,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  technical: {
    en: "Technical",
    ar: "تقني",
    icon: Brain,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  case: {
    en: "Case Study",
    ar: "دراسة حالة",
    icon: MessageSquare,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  general: {
    en: "General",
    ar: "عام",
    icon: Video,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400",
  },
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function formatDate(dateStr: string, ar: boolean) {
  const date = new Date(dateStr);
  if (ar) {
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ScoreBar({
  label,
  labelAr,
  score,
  lang,
}: {
  label: string;
  labelAr: string;
  score: number;
  lang: "en" | "ar";
}) {
  const ar = lang === "ar";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{ar ? labelAr : label}</span>
        <span className={cn("text-xs font-semibold", getScoreColor(score))}>
          {score}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500",
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function InterviewScoreCard({
  session,
  lang = "en",
  className,
}: InterviewScoreCardProps) {
  const ar = lang === "ar";
  const config = TYPE_CONFIG[session.type] || TYPE_CONFIG.general;
  const TypeIcon = config.icon;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              config.color,
            )}
          >
            <TypeIcon className="h-3 w-3" />
            {ar ? config.ar : config.en}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(session.createdAt, ar)}</span>
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-baseline gap-1">
          <span className={cn("text-3xl font-bold font-display", getScoreColor(session.overallScore))}>
            {session.overallScore}
          </span>
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">
            {ar ? "النتيجة الإجمالية" : "Overall Score"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {session.overallScore >= 80
              ? ar ? "أداء ممتاز" : "Excellent performance"
              : session.overallScore >= 60
                ? ar ? "أداء جيد" : "Good performance"
                : ar ? "يحتاج تحسين" : "Needs improvement"}
          </p>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="space-y-2.5">
        <ScoreBar
          label="Confidence"
          labelAr="الثقة"
          score={session.confidenceScore}
          lang={lang}
        />
        <ScoreBar
          label="Communication"
          labelAr="التواصل"
          score={session.communicationScore}
          lang={lang}
        />
      </div>
    </div>
  );
}
