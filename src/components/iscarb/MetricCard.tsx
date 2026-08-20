import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MetricDelta {
  /** Pre-formatted, already-localized delta text, e.g. "+12%" or "−3 pts". */
  value: string;
  /** Drives the icon direction and color (up = primary/success, down = destructive). */
  trend: "up" | "down";
  /**
   * Screen-reader context for the delta, e.g. "up 12% vs last month".
   * Falls back to a generic increase/decrease announcement per `lang`.
   */
  srLabel?: string;
}

/**
 * MetricCard — the one sanctioned KPI tile for dashboards and segment pages.
 * Label + value + optional delta (trend icon, primary for up / destructive
 * for down) + optional leading icon + optional footer slot. Built on ui/card
 * so elevation, radius and dark mode stay consistent everywhere.
 *
 * Design-system tokens only; RTL-safe (logical properties via Tailwind ms/me).
 */
export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  footer,
  lang = "en",
  className,
}: {
  /** Short metric name shown above the value (already localized). */
  label: ReactNode;
  /** The headline figure (already formatted/localized). */
  value: ReactNode;
  /** Optional period-over-period change indicator. */
  delta?: MetricDelta;
  /** Optional decorative icon, end-aligned next to the label. */
  icon?: LucideIcon;
  /** Optional footer slot (link, sparkline, caption). */
  footer?: ReactNode;
  lang?: "en" | "ar";
  className?: string;
}) {
  const ar = lang === "ar";
  const up = delta?.trend === "up";
  const TrendIcon = up ? TrendingUp : TrendingDown;
  const srFallback = up
    ? ar
      ? "ارتفاع"
      : "increase"
    : ar
      ? "انخفاض"
      : "decrease";

  return (
    <Card className={cn("gap-3 py-5", className)}>
      <CardContent className="px-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <span className="rounded-md bg-accent p-1.5 text-accent-foreground" aria-hidden="true">
              <Icon className="size-4" />
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium",
                up ? "text-primary" : "text-destructive",
              )}
            >
              <TrendIcon className="size-4 shrink-0" aria-hidden="true" />
              <span aria-hidden="true">{delta.value}</span>
              <span className="sr-only">{delta.srLabel ?? `${srFallback} ${delta.value}`}</span>
            </span>
          )}
        </div>
      </CardContent>
      {footer && (
        <CardFooter className="px-5 text-sm text-muted-foreground">{footer}</CardFooter>
      )}
    </Card>
  );
}
