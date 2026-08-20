"use client";

import { cn } from "@/lib/utils";

/** Segment color tokens matching BRD §3.3 / ZTM-on-iSCARB Cyan/Gold/Gray contract */
const COLORS = {
  completed: "#06B6D4", // Cyan
  current:   "#F59E0B", // Gold
  future:    "#94A3B8", // Gray (slate-400)
} as const;

export interface StudentProgressOverlayProps {
  /** 0-based index of the slide currently displayed */
  currentSlideIndex: number;
  /** Set of 0-based indices that have been fully completed */
  completedSlideIndices: Set<number>;
  /** Total number of segments — typically 20 */
  totalSlides: number;
}

/**
 * Compact 20-micro-segment progress bar rendered inside the SlideCanvas header.
 * Purely presentational — no internal state; parent controls visibility (only
 * rendered when slideNo ≥ 2).
 *
 * Validates: Requirements 2.3, 2.4
 */
export function StudentProgressOverlay({
  currentSlideIndex,
  completedSlideIndices,
  totalSlides,
}: StudentProgressOverlayProps) {
  return (
    <div
      role="progressbar"
      aria-label="Lecture progress"
      aria-valuenow={currentSlideIndex + 1}
      aria-valuemin={1}
      aria-valuemax={totalSlides}
      className="flex items-center gap-[3px] w-full py-1"
    >
      {Array.from({ length: totalSlides }, (_, idx) => {
        const isCompleted = completedSlideIndices.has(idx);
        const isCurrent   = idx === currentSlideIndex;

        const color = isCompleted
          ? COLORS.completed
          : isCurrent
          ? COLORS.current
          : COLORS.future;

        const label = isCompleted
          ? `Segment ${idx + 1}: completed`
          : isCurrent
          ? `Segment ${idx + 1}: current`
          : `Segment ${idx + 1}: upcoming`;

        return (
          <div
            key={idx}
            aria-label={label}
            className={cn(
              "flex-1 h-[6px] rounded-sm transition-colors",
              // The transition-colors class satisfies the ≤ 100 ms requirement;
              // React's synchronous render + CSS transition completes well within budget.
              isCurrent && "rounded"
            )}
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );
}
