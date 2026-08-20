import { cn } from "@/lib/utils";

const VARIANTS = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-gray-50 text-gray-700 border-gray-200",
} as const;

const DOT_COLORS = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-gray-500",
} as const;

interface StatusBadgeProps {
  variant: keyof typeof VARIANTS;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", VARIANTS[variant], className)}>
      <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", DOT_COLORS[variant])} />
      {children}
    </span>
  );
}
