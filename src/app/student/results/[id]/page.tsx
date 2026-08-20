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
  saveEmployabilityAttempt,
  type EmployabilityAttemptSnapshot,
} from "@/lib/assessment/attempt-report-store";
import {
  clearReportBuildJob,
  loadReportBuildJob,
  type ReportBuildProgress,
} from "@/lib/assessment/report-build-job";
import { authHeaders } from "@/lib/client-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertTriangle } from "lucide-react";

type PageMode = "loading" | "building" | "ready" | "error";

/**
 * Detailed employability report for one attempt.
 *
 * ISC-QA-001: scoring + report assembly run on the server via
 * POST /attempts/[id]/finalize (idempotent). sessionStorage is only a handoff
 * of frozen answers until finalize succeeds.
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

  const startServerFinalize = useCallback(
    async (attemptId: string) => {
      setMode("building");
      setError(null);
      setCanRetry(false);
      setProgress({
        phase: "assembling",
        done: 0,
        total: 1,
        message: ar ? "جارٍ بناء التقرير على الخادم…" : "Building report on the server…",
      });

      try {
        const pending = loadReportBuildJob(attemptId);
        const res = await fetch(`/api/iscarb/assessment/attempts/${encodeURIComponent(attemptId)}/finalize`, {
          method: "POST",
          headers: authHeaders({
            "Content-Type": "application/json",
            Accept: "application/json",
          }),
          body: JSON.stringify({
            answers: pending?.answers,
            requireComplete: false,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
          attempt?: EmployabilityAttemptSnapshot;
        };

        if (!res.ok || !json.attempt?.profile) {
          // Fallback: idempotent read if finalize already happened.
          const read = await fetch(
            `/api/iscarb/assessment/attempts/${encodeURIComponent(attemptId)}/report`,
            { credentials: "include", cache: "no-store", headers: authHeaders() },
          );
          const readJson = (await read.json().catch(() => ({}))) as {
            attempt?: EmployabilityAttemptSnapshot;
            error?: string;
          };
          if (read.ok && readJson.attempt?.profile) {
            clearReportBuildJob();
            saveEmployabilityAttempt(readJson.attempt);
            setAttempt(readJson.attempt);
            setProgress(null);
            setMode("ready");
            return;
          }
          throw new Error(json.error || readJson.error || `Finalize failed (${res.status})`);
        }

        clearReportBuildJob();
        saveEmployabilityAttempt(json.attempt);
        setAttempt(json.attempt);
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
    void startServerFinalize(resultId);
  }, [resultId, startServerFinalize]);

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

      // Pending handoff or real attempt id → server finalize (ISC-QA-001).
      const pending = loadReportBuildJob(resultId);
      if (pending || !resultId.startsWith("emp_")) {
        if (!cancelled) void startServerFinalize(resultId);
        return;
      }

      // Legacy: student-scoped live recompute.
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
  }, [resultId, studentId, ar, startServerFinalize]);

  if (mode === "building") {
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
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-iscarb-green/70" />
          </div>
        </div>
        <p className="mt-6 max-w-sm text-xs text-muted-foreground">
          {ar
            ? "يمكنك تحديث الصفحة بأمان — يتم البناء على الخادم ولن يُعاد بدء الامتحان."
            : "You can refresh safely — the report builds on the server and the exam will not restart."}
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
