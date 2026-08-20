"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmployabilityDetailedReportView } from "@/components/views/EmployabilityDetailedReportView";
import { useApp } from "@/lib/store";
import { useSession } from "@/lib/use-session";
import {
  isEmployabilityAttemptId,
  findEmployabilityAttempt,
  type EmployabilityAttemptSnapshot,
} from "@/lib/assessment/attempt-report-store";
import {
  loadReportBuildJob,
  runReportBuild,
  saveReportBuildJob,
  type ReportBuildProgress,
} from "@/lib/assessment/report-build-job";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertTriangle } from "lucide-react";

type PageMode = "loading" | "building" | "ready" | "error";

/**
 * Detailed employability report for one attempt.
 *
 * After exam submit, this route owns scoring: shows Building Report until every
 * answered module is scored and the snapshot is saved, then reveals the report.
 */
export default function AssessmentResultPage() {
  const params = useParams();
  const resultId = String(params.id ?? "");
  const { lang } = useApp();
  const { studentId } = useSession();
  const ar = lang === "ar";

  const [mode, setMode] = useState<PageMode>("loading");
  const [attempt, setAttempt] = useState<EmployabilityAttemptSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ReportBuildProgress | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  const startBuild = useCallback(
    async (attemptId: string) => {
      setMode("building");
      setError(null);
      setCanRetry(false);
      setProgress({
        phase: "scoring",
        done: 0,
        total: 0,
        message: ar ? "جارٍ بناء التقرير…" : "Building Report",
      });

      try {
        const snapshot = await runReportBuild(attemptId, {
          onProgress: (p) => setProgress(p),
        });
        setAttempt(snapshot);
        setProgress(null);
        setMode("ready");
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : ar
              ? "تعذر بناء التقرير."
              : "Could not build the report.";
        setError(msg);
        setCanRetry(Boolean(loadReportBuildJob(attemptId)));
        setMode("error");
      }
    },
    [ar],
  );

  const handleRetry = useCallback(() => {
    const job = loadReportBuildJob(resultId);
    if (!job) return;
    saveReportBuildJob({ ...job, status: "pending", error: null });
    void startBuild(resultId);
  }, [resultId, startBuild]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setMode("loading");
      setError(null);
      setAttempt(null);
      setProgress(null);
      setCanRetry(false);

      if (!resultId) {
        if (!cancelled) {
          setError(ar ? "معرّف التقرير غير صالح." : "Invalid report id.");
          setMode("error");
        }
        return;
      }

      // Finished snapshot already in localStorage → show immediately.
      if (isEmployabilityAttemptId(resultId)) {
        const localAttempt = findEmployabilityAttempt(resultId, studentId);
        if (localAttempt?.profile && !cancelled) {
          setAttempt(localAttempt);
          setMode("ready");
          return;
        }
      }

      // Pending / in-progress build for this attempt → Building Report (refresh-safe).
      const pending = loadReportBuildJob(resultId);
      if (pending) {
        if (pending.status === "error" && pending.error && !cancelled) {
          setError(pending.error);
          setCanRetry(true);
          setMode("error");
          return;
        }
        if (!cancelled) {
          void startBuild(resultId);
        }
        return;
      }

      // Legacy / missing snapshot: live API recompute (not used during a pending build).
      if (!studentId) {
        if (!cancelled) {
          setError(
            ar
              ? "التقرير غير جاهز بعد. أعد تحميل الصفحة أو أعد إرسال التقييم."
              : "Report is not ready yet. Refresh or resubmit the assessment.",
          );
          setMode("error");
        }
        return;
      }

      try {
        const res = await fetch(
          `/api/iscarb/assessment/report?studentId=${encodeURIComponent(studentId)}`,
          { credentials: "include", cache: "no-store" },
        );
        const json = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok) {
          setError(
            (json && (json.error || json.message)) ||
              (ar ? "لا توجد بيانات تقييم لهذا التقرير." : "No assessment data found."),
          );
          setMode("error");
          return;
        }

        const liveAttempt = json?.attempt as EmployabilityAttemptSnapshot | undefined;
        if (!liveAttempt?.profile) {
          setError(ar ? "تعذر تحميل التقرير." : "Could not load the report.");
          setMode("error");
          return;
        }

        setAttempt({
          ...liveAttempt,
          id: resultId.startsWith("emp_") ? resultId : liveAttempt.id,
        });
        setMode("ready");
      } catch {
        if (!cancelled) {
          setError(ar ? "فشل الاتصال بخادم التقرير." : "Failed to reach the report API.");
          setMode("error");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [resultId, studentId, ar, startBuild]);

  if (mode === "building") {
    const total = progress?.total ?? 0;
    const done = progress?.done ?? 0;
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : undefined;
    const detail =
      progress?.message ||
      (ar ? "جارٍ بناء التقرير…" : "Building Report");

    return (
      <div
        className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center"
        dir={ar ? "rtl" : "ltr"}
      >
        <Loader2 className="mb-5 size-10 animate-spin text-iscarb-green" />
        <h1 className="font-display text-2xl font-bold text-iscarb-ink dark:text-white">
          {ar ? "جارٍ بناء التقرير" : "Building Report"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        <div className="mt-8 w-full space-y-2">
          {typeof pct === "number" ? (
            <>
              <Progress value={pct} className="h-2.5" />
              <p className="text-xs tabular-nums text-muted-foreground">
                {ar ? `تسجيل الإجابات… ${done}/${total}` : `Scoring your answers… ${done}/${total}`}
              </p>
            </>
          ) : (
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-iscarb-green/70" />
            </div>
          )}
        </div>
        <p className="mt-6 max-w-sm text-xs text-muted-foreground">
          {ar
            ? "يمكنك تحديث الصفحة بأمان — لن تفقد إجاباتك ولن يُعاد بدء الامتحان."
            : "You can refresh safely — your answers are saved and the exam will not restart."}
        </p>
      </div>
    );
  }

  if (mode === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (mode === "ready" && attempt) {
    return <EmployabilityDetailedReportView attempt={attempt} ar={ar} />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center" dir={ar ? "rtl" : "ltr"}>
      <AlertTriangle className="mx-auto mb-4 size-10 text-amber-600" />
      <h1 className="font-display text-xl font-bold text-iscarb-ink dark:text-white">
        {ar ? "تعذر بناء التقرير" : "Could not build report"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error ||
          (ar
            ? "حدث خطأ أثناء تسجيل الإجابات أو تجميع التقرير."
            : "Something went wrong while scoring answers or assembling the report.")}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {canRetry && (
          <Button
            className="h-11 rounded-xl bg-iscarb-green font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-iscarb-green-dark hover:shadow-md active:translate-y-0"
            onClick={handleRetry}
          >
            {ar ? "إعادة المحاولة" : "Retry"}
          </Button>
        )}
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm active:translate-y-0"
        >
          <Link href="/student/results">{ar ? "كل النتائج" : "All results"}</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm active:translate-y-0"
        >
          <Link href="/assessment/employability">
            {ar ? "التقييم" : "Assessment"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
