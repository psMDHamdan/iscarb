"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { authHeaders } from "@/lib/client-auth";

export interface GenerationJobState {
  status: "pending" | "running" | "done" | "failed" | "queued";
  progress: number;
  error?: string | null;
}

interface Props {
  jobId: string | null;
  pollMs?: number;
  onDone?: () => void;
  className?: string;
}

/** Polls /api/iscarb/lecture/jobs/:jobId and renders a progress bar (slide-by-slide). */
export function GenerationProgress({ jobId, pollMs = 2500, onDone, className }: Props) {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [state, setState] = useState<GenerationJobState | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!jobId || finished) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const res = await fetch(`/api/iscarb/lecture/jobs/${jobId}`, {
          headers: authHeaders({ Accept: "application/json" }),
        });
        if (!res.ok) {
          if (res.status === 404) {
            setFinished(true);
            return;
          }
          throw new Error(`job ${res.status}`);
        }
        const data = (await res.json()) as { progress?: { status: string; progress: number; error?: string | null } };
        const p = data.progress;
        if (!p) return;
        setState({ status: p.status as GenerationJobState["status"], progress: p.progress, error: p.error });
        if (p.status === "done" || p.status === "failed") {
          setFinished(true);
          if (p.status === "done") onDone?.();
          return;
        }
      } catch {
        /* transient — keep polling */
      }
      if (!cancelled) timer = setTimeout(tick, pollMs);
    };

    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, pollMs, finished, onDone]);

  if (!jobId) return null;

  const failed = state?.status === "failed";
  const done = state?.status === "done";
  const pct = state?.progress ?? 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {failed
            ? ar ? "فشلت المعالجة" : "Processing failed"
            : done
              ? ar ? "اكتملت المعالجة" : "Processing complete"
              : ar ? "جارٍ المعالجة…" : "Processing…"}
        </span>
        <span className="text-muted-foreground tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            failed ? "bg-red-500" : "bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A]",
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      {failed && state?.error && (
        <p className="text-xs text-red-500" role="alert">{state.error}</p>
      )}
    </div>
  );
}
