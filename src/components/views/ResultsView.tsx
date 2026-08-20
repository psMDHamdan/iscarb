"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Target,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { useSession } from "@/lib/use-session";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { PASS_THRESHOLD, SCORE_BANDS, bandFor } from "@/lib/assessment";
import {
  listEmployabilityAttempts,
  type EmployabilityAttemptSnapshot,
} from "@/lib/assessment/attempt-report-store";
import { cn } from "@/lib/utils";

const BAND_BAR: Record<string, string> = {
  weak: "bg-destructive/75",
  developing: "bg-iscarb-gold",
  proficient: "bg-iscarb-cyan",
  strong: "bg-iscarb-green",
};

const BAND_DOT: Record<string, string> = {
  weak: "bg-destructive/80",
  developing: "bg-iscarb-gold",
  proficient: "bg-iscarb-cyan",
  strong: "bg-iscarb-green",
};

const BAND_BADGE: Record<string, string> = {
  weak: "border-destructive/30 bg-destructive/10 text-destructive",
  developing: "border-iscarb-gold/40 bg-iscarb-gold-soft/60 text-iscarb-gold-dark",
  proficient: "border-iscarb-cyan/30 bg-iscarb-cyan/10 text-iscarb-cyan",
  strong: "border-iscarb-green/30 bg-iscarb-green-soft text-iscarb-green-dark",
};

const BAND_ICON: Record<string, string> = {
  weak: "bg-destructive/10 text-destructive",
  developing: "bg-iscarb-gold-soft/60 text-iscarb-gold-dark",
  proficient: "bg-iscarb-cyan/10 text-iscarb-cyan",
  strong: "bg-iscarb-green-soft text-iscarb-green",
};

/** Compact score-band key — helpful, but secondary to choosing an attempt. */
function ScoreBandsExplainer({ ar }: { ar: boolean }) {
  return (
    <aside className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className="text-xs font-semibold text-foreground/80">
          {ar ? "معنى الدرجات" : "What the scores mean"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {ar
            ? `النجاح من ${PASS_THRESHOLD} فأعلى`
            : `Pass from ${PASS_THRESHOLD} and up`}
        </p>
      </div>

      <div
        className="flex h-2 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={ar ? "مقياس الدرجات من 0 إلى 100" : "Score bands from 0 to 100"}
      >
        {SCORE_BANDS.map((b) => {
          const span = Math.max(1, b.max - b.min + (b.id === "strong" ? 1 : 0));
          return (
            <div
              key={b.id}
              className={cn("min-w-0", BAND_BAR[b.id])}
              style={{ flexGrow: span, flexBasis: 0 }}
              title={`${ar ? b.labelAr : b.label}: ${b.min}–${b.max}`}
            />
          );
        })}
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] tabular-nums text-muted-foreground/80">
        <span>0</span>
        <span>100</span>
      </div>

      <ul className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {SCORE_BANDS.map((b) => (
          <li
            key={b.id}
            className="rounded-lg border border-border/40 bg-background/60 px-2 py-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span className={cn("size-1.5 shrink-0 rounded-full", BAND_DOT[b.id])} />
              <span className="truncate text-[11px] font-semibold text-foreground/85">
                {ar ? b.labelAr : b.label}
              </span>
            </div>
            <p className="mt-0.5 ps-3 text-[10px] tabular-nums text-muted-foreground">
              {b.min}–{b.max}
              <span className="ms-1 opacity-80">
                {b.pass ? (ar ? "· ناجح" : "· pass") : ar ? "· دون الحد" : "· below"}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * Student Reports list — own employability attempts only (scoped to session student).
 * Deep detail lives at `/student/results/[attemptId]`.
 */
export function ResultsView() {
  const { lang } = useApp();
  const { studentId } = useSession();
  const ar = lang === "ar";

  const [attempts, setAttempts] = useState<EmployabilityAttemptSnapshot[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setAttempts([]);
      setReady(true);
      return;
    }
    setAttempts(listEmployabilityAttempts(studentId));
    setReady(true);
  }, [studentId]);

  return (
    <>
      <PageHeader
        title={ar ? "النتائج" : "Results"}
        description={
          ar
            ? "محاولاتك في تقييم القابلية للتوظيف."
            : "Your employability assessment attempts."
        }
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/student" },
          { label: ar ? "النتائج" : "Results", href: "/student/results" },
        ]}
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-12" dir={ar ? "rtl" : "ltr"}>
        {studentId ? (
          <Link
            href="/student/results/live_report"
            className="flex items-center justify-between gap-3 rounded-2xl border-2 border-iscarb-green/40 bg-iscarb-green-soft/20 px-4 py-3 font-semibold text-iscarb-green-dark transition-colors hover:bg-iscarb-green-soft/40"
          >
            <span>
              {ar
                ? "فتح التقرير المباشر (من قاعدة البيانات — بدون seed)"
                : "Open live score report (from database — seed excluded)"}
            </span>
            <FileText className="size-4 shrink-0" />
          </Link>
        ) : null}

        {!ready ? (
          <p className="text-sm text-muted-foreground">
            {ar ? "جارٍ التحميل…" : "Loading…"}
          </p>
        ) : !studentId ? (
          <div className="rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
            {ar ? "سجّل الدخول لعرض نتائجك." : "Sign in to see your results."}
          </div>
        ) : attempts.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
            <ClipboardCheck className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              {ar ? "لا توجد محاولات محفوظة محلياً" : "No local attempt history"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar
                ? "استخدم زر التقرير المباشر أعلاه إن وُجدت إجابات حية في النظام."
                : "Use the live report button above if you have live scored answers in the system."}
            </p>
            <Button
              asChild
              className="mt-5 rounded-xl bg-iscarb-green font-semibold text-white hover:bg-iscarb-green-dark"
            >
              <Link href="/assessment/employability">{ar ? "ابدأ التقييم" : "Start assessment"}</Link>
            </Button>
          </div>
        ) : (
          <>
            <h2 className="font-display text-base font-bold text-iscarb-ink dark:text-white">
              {ar
                ? "سجل الجهاز (الفتح يعيد الحساب من القاعدة مباشرة)"
                : "Device history (opening recomputes live from the database)"}
            </h2>
            <ScoreBandsExplainer ar={ar} />
            <ul className="space-y-3">
              {attempts.map((a, i) => {
                const passed = a.profile.passed;
                const band =
                  SCORE_BANDS.find((b) => b.id === a.profile.band) ??
                  bandFor(a.profile.composite);
                const bandTone = BAND_BADGE[band.id] ?? BAND_BADGE.developing;
                const iconTone = BAND_ICON[band.id] ?? BAND_ICON.developing;
                return (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={`/student/results/${a.id}`}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-iscarb-green/40 hover:bg-iscarb-green-soft/10"
                    >
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl",
                          iconTone,
                        )}
                      >
                        {passed ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <XCircle className="size-5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-base font-bold text-iscarb-ink dark:text-white">
                            {ar ? "تقييم القابلية للتوظيف" : "Employability Assessment"}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-semibold", bandTone)}
                          >
                            {ar ? band.labelAr : band.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold",
                              passed
                                ? "border-iscarb-green/40 text-iscarb-green-dark"
                                : "border-border text-muted-foreground",
                            )}
                          >
                            {passed ? (ar ? "ناجح" : "Passed") : ar ? "لم يجتز" : "Not passed"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {a.specialization}
                          {" · "}
                          {new Date(a.computedAt).toLocaleString(ar ? "ar" : "en", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                          {" · "}
                          {band.min}–{band.max}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-end">
                          <p
                            className={cn(
                              "font-display text-2xl font-bold tabular-nums",
                              band.id === "weak" && "text-destructive",
                              band.id === "developing" && "text-iscarb-gold-dark",
                              band.id === "proficient" && "text-iscarb-cyan",
                              band.id === "strong" && "text-iscarb-green-dark",
                            )}
                          >
                            {Math.round(a.profile.composite)}
                          </p>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {ar ? band.labelAr : band.label}
                          </p>
                        </div>
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </>
        )}

        <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <Target className="size-3.5 shrink-0" />
          {ar
            ? "أرقام التقرير التفصيلي تُحسب دائماً من الصفوف الحية (isCurrent، بدون seed) عند الفتح."
            : "Detailed report scores always recompute from live rows (isCurrent, no seed) when opened."}
        </p>
      </div>
    </>
  );
}
