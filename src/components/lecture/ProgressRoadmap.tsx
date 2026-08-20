"use client";

import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";

export interface RoadmapSlot {
  slideNo: number;
  fn?: string | null;
  approved?: boolean;
}

interface Props {
  slots: RoadmapSlot[];
  current?: number;
  onSelect?: (slideNo: number) => void;
  className?: string;
}

/** S1–S20 horizontal roadmap with unified premium styling. */
export function ProgressRoadmap({ slots, current, onSelect, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const sorted = [...slots].sort((a, b) => a.slideNo - b.slideNo);

  return (
    <div className={cn("w-full", className)} role="navigation" aria-label={ar ? "خارطة المحاضرة" : "Lecture roadmap"}>
      <div className="flex items-end gap-2 overflow-x-auto pb-3 pt-2 px-1 scrollbar-iscarb" dir="ltr">
        {sorted.map((s) => {
          const isCurrent = current !== undefined && s.slideNo === current;
          return (
            <button
              key={s.slideNo}
              type="button"
              onClick={() => onSelect?.(s.slideNo)}
              disabled={!onSelect}
              aria-label={`S${s.slideNo}${s.fn ? ` — ${s.fn}` : ""}`}
              className={cn(
                "group relative flex h-14 min-w-[50px] flex-1 flex-col items-center justify-center rounded-xl border text-[10px] font-bold transition-all duration-300",
                isCurrent 
                  ? "bg-gradient-to-br from-emerald-500 to-[#0F7B8A] text-white border-transparent shadow-lg shadow-emerald-500/30 scale-105 z-10"
                  : s.approved
                    ? "bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/80"
                    : "bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 shadow-sm backdrop-blur-md",
                onSelect && !isCurrent && "cursor-pointer hover:-translate-y-0.5",
              )}
            >
              <span className={cn("text-[11px]", isCurrent ? "text-white" : "opacity-90")}>S{s.slideNo}</span>
              <span className={cn("max-w-full truncate text-[8px] font-semibold normal-case px-1", isCurrent ? "text-emerald-100" : "opacity-70")}>
                {s.fn?.replace(/_/g, " ") ?? "—"}
              </span>
              {s.approved && !isCurrent && (
                <span aria-hidden className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] border-2 border-white dark:border-slate-900 shadow-sm">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
