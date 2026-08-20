"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import type { GateResult } from "@/lib/lecture/quality/types";
import { isWaivable } from "@/lib/lecture/quality/types";

const GATE_LABELS: Record<string, { en: string; ar: string }> = {
  slide_count: { en: "Exactly 20 slides", ar: "20 شريحة بالضبط" },
  density: { en: "≤40 words / ≤5 bullets", ar: "40 كلمة / 5 نقاط كحد أقصى" },
  visual_support: { en: "≥18 visually supported", ar: "دعم بصري لـ 18 شريحة" },
  interaction_count: { en: "Interactions (≥3 pause, ≥2 polls, ≥1 collab)", ar: "التفاعلات" },
  cases_examples: { en: "2 cases OR 3 examples", ar: "حالتان أو 3 أمثلة" },
  misconception: { en: "Misconception slide present", ar: "شريحة المفاهيم الخاطئة" },
  calculation_workshop: { en: "Calculation workshop present", ar: "ورشة الحساب" },
  readiness_count: { en: "4 readiness checks (3 + final gate)", ar: "4 فحوصات جاهزية" },
  source_coverage: { en: "Source coverage ≥98%", ar: "تغطية المصادر 98%" },
  clo_alignment: { en: "Every slide → CLO + source", ar: "ربط كل شريحة بالمخرجات" },
  claim_policy: { en: "Claims sourced; hypotheticals labeled", ar: "سياسة الادعاءات" },
  cross_format_parity: { en: "Cross-format parity", ar: "تطابق الصيغ" },
  student_experience: { en: "Student experience (no vague activities, no framework leaks)", ar: "تجربة الطالب" },
  invented_numbers: { en: "No fabricated statistics", ar: "لا أرقام مختلقة" },
  jargon_leak: { en: "No framework labels in student content", ar: "لا مصطلحات هيكلية في المحتوى" },
  visual_uniqueness: { en: "Distinct visuals per slide", ar: "صور فريدة لكل شريحة" },
};

interface Props {
  gate: GateResult;
  fixHref?: string;
  onWaive?: (reason: string) => void;
  className?: string;
}

/** One quality-gate row: status badge, findings, go-to-fix, waive (warning gates only). */
export function GateStatusRow({ gate, fixHref, onWaive, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const label = GATE_LABELS[gate.gateKey] ?? { en: gate.gateKey, ar: gate.gateKey };
  const waivable = isWaivable(gate.gateKey as Parameters<typeof isWaivable>[0]);

  return (
    <div className={cn("flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3", className)}>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{ar ? label.ar : label.en}</span>
          <Badge
            variant="outline"
            className={cn(
              gate.status === "pass" && "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
              gate.status === "fail" && "border-red-500/40 text-red-600 dark:text-red-400",
              gate.status === "waived" && "border-amber-500/40 text-amber-600 dark:text-amber-400",
            )}
          >
            {gate.status}
          </Badge>
          {gate.severity === "warning" && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{ar ? "تحذير" : "warning"}</span>
          )}
        </div>
        {gate.findings?.length > 0 && (
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {gate.findings.slice(0, 4).map((f, i) => (
              <li key={i} className="flex gap-1.5">
                {f.slideNo != null && <span className="font-semibold">S{f.slideNo}:</span>}
                <span>{f.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {gate.status === "fail" && fixHref && (
          <Link href={fixHref} className="text-xs font-medium text-primary underline-offset-2 hover:underline">
            {ar ? "إصلاح" : "Fix"}
          </Link>
        )}
        {gate.status === "fail" && waivable && onWaive && (
          <button
            type="button"
            className="text-xs font-medium text-amber-600 underline-offset-2 hover:underline dark:text-amber-400"
            onClick={() => {
              const reason = window.prompt(ar ? "سبب التنازل:" : "Waive reason:");
              if (reason) onWaive(reason);
            }}
          >
            {ar ? "تنازل" : "Waive"}
          </button>
        )}
      </div>
    </div>
  );
}
