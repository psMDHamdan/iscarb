"use client";

import { Bookmark, ExternalLink, MapPin, Building2, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  titleAr: string;
  employer: string;
  location: string;
  matchScore: number;
  salary?: string;
  vision2030?: boolean;
  sector?: string;
}

interface JobMatchCardProps {
  job: Job;
  lang?: "en" | "ar";
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  className?: string;
}

function getMatchColor(score: number) {
  if (score >= 80) return { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", ring: "#22c55e" };
  if (score >= 60) return { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", ring: "#f59e0b" };
  return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", ring: "#ef4444" };
}

export function JobMatchCard({
  job,
  lang = "en",
  onSave,
  onApply,
  className,
}: JobMatchCardProps) {
  const ar = lang === "ar";
  const { bg, text, ring } = getMatchColor(job.matchScore);
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (job.matchScore / 100) * circumference;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {/* Match score circle */}
        <div className="relative flex-shrink-0">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/30"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={ring}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-xs font-bold", text)}>{job.matchScore}%</span>
          </div>
        </div>

        {/* Job info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {ar ? job.titleAr : job.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{job.employer}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>

            {job.vision2030 && (
              <span className="inline-flex items-center rounded-full bg-iscarb-cyan/10 px-2 py-0.5 text-[10px] font-bold text-iscarb-cyan uppercase tracking-wider shrink-0">
                {ar ? "رؤية 2030" : "Vision 2030"}
              </span>
            )}
          </div>

          {/* Salary + Sector */}
          <div className="flex items-center gap-3 mt-2">
            {job.salary && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <IndianRupee className="h-3 w-3" />
                <span>{job.salary}</span>
              </div>
            )}
            {job.sector && (
              <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                {job.sector}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <button
          onClick={() => onSave?.(job.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Bookmark className="h-3.5 w-3.5" />
          {ar ? "حفظ" : "Save"}
        </button>
        <button
          onClick={() => onApply?.(job.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:shadow-md transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {ar ? "تقديم" : "Apply"}
        </button>
      </div>
    </div>
  );
}
