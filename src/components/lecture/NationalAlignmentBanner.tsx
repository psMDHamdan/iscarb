"use client";

import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { Info, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export type BannerMode = "OFFICIAL_JAHEZIAH" | "CONFIRM_REQUIRED" | "COURSE_READINESS" | "STALE_OFFICIAL_SOURCE";

const COPY: Record<BannerMode, { en: string; ar: string; tone: string; icon: typeof Info }> = {
  OFFICIAL_JAHEZIAH: {
    en: "Aligned to the official Jaheziah standard for this specialty. Official outcome IDs will appear on alignment screens.",
    ar: "محاذاة مع معيار جاهزية الرسمي لهذا التخصص. ستظهر معرفات النواتج الرسمية في شاشات المواءمة.",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  CONFIRM_REQUIRED: {
    en: "A Jaheziah standard candidate was found but needs confirmation. Resolve it before content generation.",
    ar: "تم العثور على معيار جاهزية مرشح ويحتاج إلى تأكيد. حُلّ ذلك قبل توليد المحتوى.",
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: AlertTriangle,
  },
  COURSE_READINESS: {
    en: "Course-readiness mode: alignment is based on your CLOs only.",
    ar: "وضع جاهزية المقرر: تستند المواءمة إلى مخرجات التعلّم فقط.",
    tone: "border-border bg-muted/40 text-muted-foreground",
    icon: Info,
  },
  STALE_OFFICIAL_SOURCE: {
    en: "The official source snapshot is stale (>90 days). Re-sync and approve before relying on official outcomes.",
    ar: "لقطة المصدر الرسمي قديمة (أكثر من 90 يومًا). أعد المزامنة واعتمدها قبل الاعتماد على النواتج الرسمية.",
    tone: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    icon: ShieldAlert,
  },
};

interface Props {
  mode: BannerMode | string | null | undefined;
  className?: string;
}

/** Prominent alignment-mode explanation banner for faculty. */
export function NationalAlignmentBanner({ mode, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const key = (mode ?? "COURSE_READINESS") as BannerMode;
  const c = COPY[key] ?? COPY.COURSE_READINESS;
  const Icon = c.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-4", c.tone, className)} role="status">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <p className="text-sm font-medium">{ar ? c.ar : c.en}</p>
    </div>
  );
}
