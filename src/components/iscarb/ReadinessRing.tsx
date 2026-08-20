"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

interface ReadinessRingProps {
  /** 0-100 readiness score */
  score: number;
  /** pixel size of the SVG (width = height) */
  size?: number;
  /** stroke thickness */
  stroke?: number;
  /** small label under the number, e.g. "Readiness" */
  label?: string;
  /** secondary label, e.g. "Top decile" */
  caption?: string;
  className?: string;
  /** disable the mount animation (e.g. when re-rendering on data change) */
  animate?: boolean;
  /** show the "average zone" band (50-60) that the student must break past */
  showAverageZone?: boolean;
  /** cohort average (0-100) — drawn as a tick marker if provided */
  cohortAverage?: number;
}

/**
 * iSCARB Unified National Readiness Ring.
 * Brand gradient (cyan → green → gold) with animated dashoffset fill.
 *
 * Design philosophy (Master Handover Document §4):
 *   - NO red/green progress bars. A single sovereign gauge.
 *   - Targets the "fear of being average": an optional Average Zone band
 *     (50-60) is rendered as a subtle arc the student must BREAK PAST.
 *   - When cohortAverage is provided, a tick marker shows exactly where the
 *     middle of the pack sits — so the student sees the line to cross.
 */
export function ReadinessRing({
  score,
  size = 220,
  stroke = 16,
  label = "Readiness",
  caption,
  className,
  animate = true,
  showAverageZone = true,
  cohortAverage,
}: ReadinessRingProps) {
  const gid = useId().replace(/:/g, "");
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  // mount animation: start at full offset, then fill
  const [mounted, setMounted] = useState(!animate);
  useEffect(() => {
    if (!animate) return;
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [animate]);

  // tier label drives the inner caption color
  const tier =
    clamped >= 85
      ? "Top decile"
      : clamped >= 70
        ? "Career-ready"
        : clamped >= 55
          ? "Developing"
          : "At risk";

  // "Break the average" framing — does the student sit above the average zone?
  const brokeAverage = clamped >= 61;
  const averageZone = { from: 50, to: 60 };
  const avgArc = {
    start: circumference - (averageZone.from / 100) * circumference,
    len: ((averageZone.to - averageZone.from) / 100) * circumference,
  };
  const cohortTick =
    typeof cohortAverage === "number"
      ? circumference - (Math.max(0, Math.min(100, cohortAverage)) / 100) * circumference
      : null;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`${label}: ${clamped} out of 100`}
      >
        <defs>
          <linearGradient id={`ring-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00B4D8" />
            <stop offset="55%" stopColor="#1E8A5A" />
            <stop offset="100%" stopColor="#FFB700" />
          </linearGradient>
          <linearGradient id={`ring-track-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(30,138,90,0.10)" />
            <stop offset="100%" stopColor="rgba(0,180,216,0.10)" />
          </linearGradient>
        </defs>
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-track-${gid})`}
          strokeWidth={stroke}
        />
        {/* Average Zone band (50-60) — the line the student must BREAK PAST.
            Rendered as a hatched/muted arc behind the fill. §4 "fear of being average". */}
        {showAverageZone && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(180,180,180,0.45)"
            strokeWidth={stroke}
            strokeDasharray={`${avgArc.len} ${circumference - avgArc.len}`}
            strokeDashoffset={avgArc.start}
            opacity={0.55}
          />
        )}
        {/* Cohort-average tick marker — the exact line to cross. */}
        {cohortTick !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#0E2A22"
            strokeWidth={stroke + 4}
            strokeDasharray={`2 ${circumference - 2}`}
            strokeDashoffset={cohortTick}
            opacity={0.9}
          />
        )}
        {/* brand-gradient fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          style={{
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: "drop-shadow(0 6px 14px rgba(30,138,90,0.18))",
          }}
        />
        {/* subtle tick marks every 10% */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const inner = radius - stroke / 2 - 4;
          const outer = radius + stroke / 2 + 2;
          const x1 = size / 2 + Math.cos(angle) * inner;
          const y1 = size / 2 + Math.sin(angle) * inner;
          const x2 = size / 2 + Math.cos(angle) * outer;
          const y2 = size / 2 + Math.sin(angle) * outer;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(14,42,34,0.18)"
              strokeWidth={1}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="font-display text-5xl font-bold tracking-tight text-iscarb-ink dark:text-white"
          style={{ fontSize: size * 0.22 }}
        >
          {Math.round(clamped)}
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          / 100
        </span>
        <span className="mt-1 text-xs font-semibold text-iscarb-green dark:text-iscarb-green">
          {label}
        </span>
        {caption ? (
          <span className="mt-0.5 text-[10px] text-muted-foreground">{caption}</span>
        ) : (
          <span className="mt-0.5 text-[10px] font-medium text-iscarb-gold">{tier}</span>
        )}
        {showAverageZone && (
          <span
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
              brokeAverage
                ? "bg-iscarb-green-soft text-iscarb-green-dark"
                : "bg-iscarb-gold-soft text-iscarb-gold-dark"
            )}
          >
            {brokeAverage ? "▲ Break the average" : "Break the average"}
          </span>
        )}
      </div>
    </div>
  );
}

export default ReadinessRing;
