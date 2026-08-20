"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";

export type AlignmentMode =
  | "OFFICIAL_JAHEZIAH"
  | "CONFIRM_REQUIRED"
  | "COURSE_READINESS"
  | "STALE_OFFICIAL_SOURCE";

const STYLES: Record<AlignmentMode, string> = {
  OFFICIAL_JAHEZIAH: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  CONFIRM_REQUIRED: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  COURSE_READINESS: "bg-muted text-muted-foreground border-border",
  STALE_OFFICIAL_SOURCE: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

const LABELS: Record<AlignmentMode, { en: string; ar: string }> = {
  OFFICIAL_JAHEZIAH: { en: "Official Jaheziah", ar: "جاهزية رسمية" },
  CONFIRM_REQUIRED: { en: "Confirmation Required", ar: "مطلوب تأكيد" },
  COURSE_READINESS: { en: "Course Readiness", ar: "جاهزية المقرر" },
  STALE_OFFICIAL_SOURCE: { en: "Stale Official Source", ar: "مصدر رسمي قديم" },
};

interface Props {
  mode: AlignmentMode | string | null | undefined;
  className?: string;
}

/** Alignment-mode badge. Renders null for COURSE_READINESS (AC-27 / NFR-17). */
export function JaheziahModeBadge({ mode, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  if (!mode || mode === "COURSE_READINESS") return null;

  const key = mode as AlignmentMode;
  const label = LABELS[key] ?? { en: mode, ar: mode };
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-medium", STYLES[key] ?? STYLES.COURSE_READINESS, className)}
    >
      <span aria-hidden>⚖</span>
      {ar ? label.ar : label.en}
    </Badge>
  );
}
