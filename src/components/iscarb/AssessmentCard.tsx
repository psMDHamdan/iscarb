import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AssessmentCardProps {
  title: string;
  description?: string;
  status?: "idle" | "in-progress" | "completed";
  score?: number;
  maxScore?: number;
  icon?: ReactNode;
  onClick?: () => void;
  badge?: string;
  className?: string;
}

const statusStyles = {
  idle: "border-border hover:border-primary/50 hover:shadow-md",
  "in-progress": "border-accent bg-accent/5 dark:bg-accent/10",
  completed: "border-primary bg-primary/5 dark:bg-primary/10",
};

export function AssessmentCard({
  title,
  description,
  status = "idle",
  score,
  maxScore,
  icon,
  onClick,
  badge,
  className,
}: AssessmentCardProps) {
  const scorePercent = maxScore && score ? Math.round((score / maxScore) * 100) : null;
  const isClickable = !!onClick;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        "group rounded-xl border-2 bg-white dark:bg-card p-6 text-start transition-all duration-200",
        isClickable && "cursor-pointer",
        !isClickable && "cursor-default",
        statusStyles[status],
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {icon && <div className="text-2xl shrink-0">{icon}</div>}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
              {title}
            </h3>
            {description && (
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
        {badge && (
          <span className="shrink-0 ms-2 inline-flex items-center rounded-full bg-primary/10 dark:bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
            {badge}
          </span>
        )}
      </div>

      {status === "completed" && scorePercent !== null && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Score</span>
            <span className="text-sm font-semibold text-foreground">
              {score}/{maxScore}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-300"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{scorePercent}% complete</p>
        </div>
      )}

      {status === "in-progress" && (
        <div className="mt-4 flex items-center gap-2 text-accent text-xs font-medium">
          <span className="animate-spin">⟳</span>
          In progress
        </div>
      )}

      {isClickable && (
        <div className="mt-4 flex items-center text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          Start assessment →
        </div>
      )}
    </button>
  );
}
