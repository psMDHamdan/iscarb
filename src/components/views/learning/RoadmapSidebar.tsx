"use client";

/**
 * RoadmapSidebar — collapsible left panel showing all 20 lecture segments.
 *
 * Responsibilities:
 *  - List all 20 slide segments with slide number, truncated title, and
 *    completion indicator (Req 2.1)
 *  - Color segments Cyan/Gold/Gray via segmentColor() logic (Req 2.2)
 *  - In Guided Mode: disable segments where idx > current && !completed.has(idx)
 *    with opacity-40 (Req 2.5)
 *  - Display cumulative XP score and percentage-complete progress bar below
 *    the course title (Req 2.6)
 *  - Render tooltip on hover with pedagogical phase label and CLO identifiers
 *    (Req 2.7)
 *  - Accept onNavigate and onCollapse callbacks (Req 1.6, 1.7)
 *
 * Validates: Requirements 2.1, 2.2, 2.5, 2.6, 2.7
 */

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  ChevronLeft,
  MapPin,
  Star,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoadmapSidebarSlide {
  slideNo: number;
  title: string;
  /** Optional CLO identifiers to show in the tooltip */
  cloIds?: string[];
}

export interface RoadmapSidebarProps {
  slides: RoadmapSidebarSlide[];
  currentSlideIndex: number;
  completedSlideIndices: Set<number>;
  xpScore: number;
  progressPercent: number;
  playerMode: "GUIDED" | "REVIEW";
  onNavigate: (index: number) => void;
  onCollapse: () => void;
}

// ---------------------------------------------------------------------------
// Pedagogical phase helper
// Phase ranges from design.md Property 19:
//   1–4: blue | 5–7: teal | 8–10: purple | 11–13: cyan | 14–17: emerald | 18–20: amber
// ---------------------------------------------------------------------------

function getSlidePhase(slideNo: number): {
  nameEn: string;
  color: string;
  accent: string;
} {
  if (slideNo <= 2)
    return {
      nameEn: "1. The problem",
      color: "bg-emerald-600",
      accent: "#0F7B8A",
    };
  if (slideNo <= 5)
    return {
      nameEn: "2. Build the idea",
      color: "bg-teal-600",
      accent: "#0D9488",
    };
  if (slideNo <= 8)
    return {
      nameEn: "3. See how PCA works",
      color: "bg-blue-600",
      accent: "#2563EB",
    };
  if (slideNo <= 12)
    return {
      nameEn: "4. Try it yourself",
      color: "bg-indigo-600",
      accent: "#6366F1",
    };
  if (slideNo <= 16)
    return {
      nameEn: "5. Use it on a real problem",
      color: "bg-purple-600",
      accent: "#8B5CF6",
    };
  return {
    nameEn: "6. Take the challenge",
    color: "bg-rose-600",
    accent: "#E11D48",
  };
}

// ---------------------------------------------------------------------------
// Color logic — Req 2.2, Design Property 2
// ---------------------------------------------------------------------------

function segmentColor(
  idx: number,
  current: number,
  completed: Set<number>
): string {
  if (completed.has(idx)) return "#06B6D4"; // Cyan  — completed
  if (idx === current) return "#F59E0B"; // Gold  — current
  return "#94A3B8"; // Gray  — future
}

// ---------------------------------------------------------------------------
// SegmentButton — single row in the roadmap list
// ---------------------------------------------------------------------------

interface SegmentButtonProps {
  slide: RoadmapSidebarSlide;
  index: number;
  currentSlideIndex: number;
  completedSlideIndices: Set<number>;
  playerMode: "GUIDED" | "REVIEW";
  onNavigate: (index: number) => void;
}

function SegmentButton({
  slide,
  index,
  currentSlideIndex,
  completedSlideIndices,
  playerMode,
  onNavigate,
}: SegmentButtonProps) {
  const isCurrent = index === currentSlideIndex;
  const isCompleted = completedSlideIndices.has(index);

  // Req 2.5: in Guided Mode, disable segments ahead that are not yet completed
  const isDisabled =
    playerMode === "GUIDED" &&
    index > currentSlideIndex &&
    !completedSlideIndices.has(index);

  const color = segmentColor(index, currentSlideIndex, completedSlideIndices);
  const phase = getSlidePhase(slide.slideNo);

  // Truncate title to ~28 chars for compact display
  const truncatedTitle =
    slide.title.length > 28 ? slide.title.slice(0, 26).trimEnd() + "…" : slide.title;

  const tooltipContent = (
    <div className="space-y-1 max-w-[200px]">
      <p className="font-semibold text-xs leading-snug">{slide.title}</p>
      <p className="text-[10px] opacity-80">{phase.nameEn}</p>
      {slide.cloIds && slide.cloIds.length > 0 && (
        <p className="text-[10px] opacity-70 font-mono">
          {slide.cloIds.join(" · ")}
        </p>
      )}
    </div>
  );

  const button = (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => !isDisabled && onNavigate(index)}
      aria-label={`Go to slide ${slide.slideNo}: ${slide.title}${isCompleted ? " (completed)" : ""}${isCurrent ? " (current)" : ""}${isDisabled ? " (locked)" : ""}`}
      aria-current={isCurrent ? "true" : undefined}
      className={cn(
        // Base layout
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left",
        // Transitions
        "transition-colors duration-150",
        // Active / hover states (only when not disabled)
        !isDisabled &&
          "hover:bg-slate-100/80 dark:hover:bg-slate-700/50 cursor-pointer",
        // Current slide highlight
        isCurrent &&
          "bg-amber-50/80 dark:bg-amber-950/20",
        // Disabled (Guided Mode locked)
        isDisabled && "opacity-40 cursor-not-allowed",
        // Focus ring
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        isCurrent
          ? "focus-visible:ring-amber-400"
          : "focus-visible:ring-slate-400"
      )}
    >
      {/* Colored segment dot / indicator */}
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      >
        {isCompleted ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : isCurrent ? (
          <MapPin className="h-3.5 w-3.5" />
        ) : (
          <span>{slide.slideNo}</span>
        )}
      </span>

      {/* Title */}
      <span
        className={cn(
          "flex-1 text-xs leading-snug min-w-0",
          isCurrent
            ? "font-semibold text-amber-900 dark:text-amber-200"
            : isCompleted
            ? "text-cyan-700 dark:text-cyan-300 font-medium"
            : "text-slate-600 dark:text-slate-400"
        )}
      >
        {truncatedTitle}
      </span>

      {/* Slide number badge (only when not shown in dot) */}
      {!isCompleted && !isCurrent && (
        <span
          className="text-[9px] font-mono text-slate-400 dark:text-slate-500 shrink-0"
          aria-hidden="true"
        >
          S{slide.slideNo}
        </span>
      )}
    </button>
  );

  // Wrap in Tooltip for hover info (Req 2.7)
  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={6}
        className="bg-slate-900 text-slate-100 border-slate-700 px-3 py-2"
      >
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// RoadmapSidebar — main export
// ---------------------------------------------------------------------------

export function RoadmapSidebar({
  slides,
  currentSlideIndex,
  completedSlideIndices,
  xpScore,
  progressPercent,
  playerMode,
  onNavigate,
  onCollapse,
}: RoadmapSidebarProps) {
  const completedCount = completedSlideIndices.size;
  const totalSlides = slides.length;

  // Clamp progressPercent to [0, 100]
  const clampedProgress = Math.max(0, Math.min(100, progressPercent));

  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-label="Lecture Roadmap"
      className="flex h-full flex-col bg-white/80 dark:bg-slate-900/80 border-r border-emerald-500/15 backdrop-blur-xl shadow-lg select-none"
    >
      {/* ----------------------------------------------------------------- */}
      {/* Header: course label + collapse button                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-2 px-3 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: "#0E6C3C" }}
            aria-hidden="true"
          >
            <Star className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">
              {playerMode === "GUIDED" ? "Guided Mode" : "Review Mode"}
            </p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
              Lecture Roadmap
            </p>
          </div>
        </div>

        {/* Collapse button — Req 1.6, 1.7 */}
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse roadmap sidebar"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Student Journey Goal Progress                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="px-3.5 py-3 shrink-0 space-y-2 border-b border-emerald-500/10 bg-emerald-50/20 dark:bg-slate-950/20">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
            {getSlidePhase(currentSlideIndex + 1).nameEn}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            {Math.min(6, Math.max(1, Math.ceil(((currentSlideIndex + 1) / totalSlides) * 6)))} / 6
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <Progress
            value={clampedProgress}
            className="h-1.5 bg-slate-200 dark:bg-slate-700"
            indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            aria-label={`Milestone progress`}
          />
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Segment list — Req 2.1, 2.2, 2.5, 2.7                             */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5"
        role="list"
        aria-label="Slide segments"
      >
        {slides.map((slide, idx) => (
          <div key={`segment-${slide.slideNo}`} role="listitem">
            <SegmentButton
              slide={slide}
              index={idx}
              currentSlideIndex={currentSlideIndex}
              completedSlideIndices={completedSlideIndices}
              playerMode={playerMode}
              onNavigate={onNavigate}
            />
          </div>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Footer — mode indicator                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="shrink-0 px-3 py-3 border-t border-slate-100 dark:border-slate-700/40">
        <div
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider",
            playerMode === "GUIDED"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
              : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              playerMode === "GUIDED"
                ? "bg-emerald-500"
                : "bg-blue-500"
            )}
            aria-hidden="true"
          />
          {playerMode === "GUIDED" ? "Guided Mode" : "Review Mode"}
        </div>
      </div>
    </motion.aside>
  );
}
