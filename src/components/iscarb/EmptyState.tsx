import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EmptyState — the one sanctioned "nothing here yet" block for lists, tables
 * and dashboards. Empty screens are an invitation to act: every EmptyState
 * pairs an explanation of *why* it's empty with what to do next (the optional
 * action slot). Never render a bare "No data" string — use this.
 *
 * Design-system tokens only; RTL-safe (centered layout, no physical offsets).
 * No built-in copy — callers pass already-localized strings.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  /** Icon that hints at the missing content type (e.g. Inbox, FileText). */
  icon: LucideIcon;
  /** What is empty (already localized). */
  title: ReactNode;
  /** Why it's empty and what to do next (already localized). */
  description: ReactNode;
  /** Optional call-to-action slot (typically a ui/button). */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-1 rounded-full bg-accent p-3 text-accent-foreground" aria-hidden="true">
        <Icon className="size-6" />
      </span>
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
