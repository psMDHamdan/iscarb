"use client";

import { cn } from "@/lib/utils";
import { PASS_THRESHOLD } from "@/lib/assessment";

/** Shared 0 · threshold · 100 label row — always LTR so % aligns with the tick. */
function ScaleLabels({
  threshold,
  className,
}: {
  threshold: number;
  className?: string;
}) {
  const mark = Math.max(0, Math.min(100, threshold));
  return (
    <div
      className={cn(
        "relative mt-1.5 h-4 w-full text-[10px] font-medium tabular-nums leading-none text-muted-foreground",
        className,
      )}
      dir="ltr"
      aria-hidden
    >
      <span className="absolute left-0 top-0">0</span>
      <span
        className="absolute top-0 -translate-x-1/2"
        style={{ left: `${mark}%` }}
      >
        {mark}
      </span>
      <span className="absolute right-0 top-0">100</span>
    </div>
  );
}

/**
 * Progress track with threshold tick + aligned 0 / 60 / 100 labels.
 * Always renders LTR so the numbers sit under the correct positions.
 */
export function ScoreBar({
  score,
  passed,
  threshold = PASS_THRESHOLD,
  thickness = "md",
  className,
}: {
  score: number;
  passed: boolean;
  threshold?: number;
  thickness?: "sm" | "md" | "lg";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const mark = Math.max(0, Math.min(100, threshold));
  const trackH =
    thickness === "lg" ? "h-3.5" : thickness === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("w-full", className)} dir="ltr">
      <div
        className={cn(
          "relative w-full overflow-visible rounded-full bg-muted/70",
          trackH,
        )}
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            passed
              ? "bg-gradient-to-r from-[#005f73] via-[#0a9396] to-[#94d2bd] shadow-sm"
              : "bg-gradient-to-r from-[#ca6702] to-[#bb3e03] shadow-sm",
          )}
          style={{ width: `${clamped}%` }}
        />
        <div
          className="absolute top-1/2 h-[calc(100%+4px)] w-0.5 -translate-y-1/2 rounded-full bg-iscarb-ink/45 dark:bg-white/50"
          style={{ left: `${mark}%` }}
          aria-hidden
        />
      </div>
      <ScaleLabels threshold={mark} />
    </div>
  );
}

/**
 * Clean score-vs-pass progress meter for Result + Detailed Report.
 */
export function ScoreMeter({
  score,
  ar,
  passed,
  threshold = PASS_THRESHOLD,
  className,
  size = "md",
}: {
  score: number;
  ar: boolean;
  passed: boolean;
  threshold?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const scoreSize =
    size === "lg" ? "text-4xl" : size === "sm" ? "text-2xl" : "text-3xl";
  const barThickness = size === "lg" ? "lg" : size === "sm" ? "sm" : "md";

  return (
    <div className={cn("w-full text-start", className)} dir={ar ? "rtl" : "ltr"}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {ar ? "الدرجة المركّبة" : "Composite score"}
          </p>
          <p
            className={cn(
              "font-display font-bold tabular-nums leading-none text-iscarb-ink dark:text-white",
              scoreSize,
            )}
          >
            {clamped}
            <span className="ms-1 text-base font-semibold text-muted-foreground">
              /100
            </span>
          </p>
        </div>

      </div>

      <ScoreBar
        score={clamped}
        passed={passed}
        threshold={threshold}
        thickness={barThickness}
      />
    </div>
  );
}

/** Compact horizontal bars for each dimension. */
export function DimensionProgressList({
  dimensions,
  ar,
  threshold = PASS_THRESHOLD,
}: {
  dimensions: Array<{
    dimension: string;
    label: string;
    labelAr: string;
    score: number;
  }>;
  ar: boolean;
  threshold?: number;
}) {
  return (
    <ul className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      {dimensions.map((d) => {
        const score = Math.round(Math.max(0, Math.min(100, d.score)));
        const ok = score >= threshold;
        return (
          <li key={d.dimension}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-iscarb-ink dark:text-white">
                {ar ? d.labelAr : d.label}
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums">
                {score}
                <span className="text-xs font-medium text-muted-foreground">%</span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Clean semi-circle score gauge for the employability report.
 * Score + /100 in the center; band shown once in a pill below (no arc labels).
 */
export function ThomasGauge({
  score,
  label,
  className,
  size = "md",
}: {
  score: number;
  label?: string;
  className?: string;
  /** `sm` fits inline in card headers (e.g. profile insights). */
  size?: "sm" | "md";
}) {
  const compact = size === "sm";
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const bandKey = String(label || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, "");
  const band =
    bandKey === "strong" || bandKey === "proficient" || bandKey === "developing" || bandKey === "weak"
      ? bandKey
      : clamped >= 80
        ? "strong"
        : clamped >= 60
          ? "proficient"
          : clamped >= 40
            ? "developing"
            : "weak";

  const bandMeta: Record<
    string,
    { label: string; stroke: string; pill: string }
  > = {
    weak: {
      label: "Weak",
      stroke: "#dc2626",
      pill: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
    },
    developing: {
      label: "Developing",
      stroke: "#d97706",
      pill: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200",
    },
    proficient: {
      label: "Proficient",
      stroke: "#059669",
      pill: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
    },
    strong: {
      label: "Strong",
      stroke: "#006838",
      pill: "border-emerald-300 bg-iscarb-green/10 text-iscarb-green-dark dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
    },
  };

  const meta = bandMeta[band]!;
  const r = 78;
  const circumference = Math.PI * r;
  const scoreLength = (clamped / 100) * circumference;

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <div className={cn("relative w-full", compact ? "max-w-[108px]" : "max-w-[220px]")}>
        <svg viewBox="0 0 200 118" className="w-full overflow-visible" aria-hidden>
          {/* Track */}
          <path
            d={`M 22 100 A ${r} ${r} 0 0 1 178 100`}
            fill="none"
            stroke="currentColor"
            strokeWidth={compact ? 16 : 14}
            strokeLinecap="round"
            className="text-muted/25"
          />
          {/* Quiet band ticks (no text on the arc) */}
          {[0.25, 0.5, 0.75].map((t) => {
            const a = Math.PI + t * Math.PI;
            const x1 = 100 + (r - 11) * Math.cos(a);
            const y1 = 100 + (r - 11) * Math.sin(a);
            const x2 = 100 + (r + 11) * Math.cos(a);
            const y2 = 100 + (r + 11) * Math.sin(a);
            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted-foreground/35"
              />
            );
          })}
          {/* Score fill */}
          <path
            d={`M 22 100 A ${r} ${r} 0 0 1 178 100`}
            fill="none"
            stroke={meta.stroke}
            strokeWidth={compact ? 16 : 14}
            strokeLinecap="round"
            strokeDasharray={`${scoreLength} ${circumference}`}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Score only — sits in the open bowl of the arc */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center justify-end",
            compact ? "pb-0.5" : "pb-1",
          )}
        >
          <span
            className={cn(
              "font-display font-bold leading-none tabular-nums tracking-tight text-iscarb-ink dark:text-white",
              compact ? "text-xl" : "text-[2.75rem]",
            )}
          >
            {clamped}
          </span>
          <span
            className={cn(
              "font-medium tabular-nums text-muted-foreground",
              compact ? "mt-0 text-[9px]" : "mt-0.5 text-xs",
            )}
          >
            / 100
          </span>
        </div>
      </div>

      {/* Band once, clearly below the dial */}
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border font-bold uppercase",
          compact
            ? "mt-1.5 min-w-[4.5rem] px-2 py-0.5 text-[9px] tracking-[0.12em]"
            : "mt-3 min-w-[7.5rem] px-4 py-1.5 text-xs tracking-[0.14em]",
          meta.pill,
        )}
      >
        {meta.label}
      </span>
    </div>
  );
}
