"use client";

import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";

const WARN = 35;
const BLOCK = 40;

interface Props {
  count: number;
  className?: string;
}

/** Live word-count pill — amber > 35, red ≥ 40 (BRD §7.2 density rule). */
export function WordCountBadge({ count, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";

  const tone =
    count >= BLOCK
      ? "bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30"
      : count > WARN
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
        tone,
        className,
      )}
      aria-label={ar ? "عدد الكلمات" : "Word count"}
    >
      {count}
      <span className="font-normal opacity-80">/ 40</span>
      {count > BLOCK && (
        <span aria-live="polite" className="font-bold">
          {ar ? "الحد تجاوز" : "over limit"}
        </span>
      )}
    </span>
  );
}
