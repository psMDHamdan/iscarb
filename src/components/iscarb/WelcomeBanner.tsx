"use client";

import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useIscarbFetch } from "@/lib/use-iscarb-fetch";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ArrowRight, Check, Circle, Compass } from "lucide-react";
import type { ViewId } from "@/lib/store";

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

interface WelcomeStep {
  key: string; titleEn: string; titleAr: string; view: ViewId; tab?: string; done: boolean;
}
interface WelcomeResponse {
  isNewStudent: boolean;
  suggestedClusters: { cluster: string; score: number }[];
  plan: WelcomeStep[];
  progress: number;
  nextStep: WelcomeStep | null;
}

/**
 * Shown on Home for a first-year, onboarding-incomplete student: a warm,
 * discovery-first welcome (NOT graduation prep). Suggests career clusters from
 * their interests and nudges the next first-week step. Renders nothing for
 * everyone else, so the roadmap hero takes over once they're established.
 */
export function WelcomeBanner() {
  const { ar } = useI18n();
  const selectedStudentId = useApp((s) => s.selectedStudentId);
  const setView = useApp((s) => s.setView);
  const { data } = useIscarbFetch<WelcomeResponse>(
    selectedStudentId ? `/api/iscarb/welcome?studentId=${selectedStudentId}` : null,
  );

  if (!data || !data.isNewStudent) return null;

  const go = (view: ViewId, tab?: string) => {
    if (tab) {
      try { sessionStorage.setItem("iscarb:journeyTab", tab); } catch { /* ignore */ }
    }
    setView(view);
  };

  return (
    <div className="rounded-2xl border border-iscarb-cyan/25 bg-gradient-to-br from-iscarb-cyan-soft/50 to-iscarb-green-soft/30 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-iscarb-cyan-dark" />
        <span className="text-xs font-semibold uppercase tracking-wide text-iscarb-cyan-dark">
          {L(ar, "Welcome to iSCARB", "أهلًا بك في iSCARB")}
        </span>
      </div>
      <h2 className="mt-1 font-display text-xl font-bold text-iscarb-ink dark:text-white">
        {L(ar, "Let's discover your path — no pressure, just exploration.", "لنكتشف مسارك — بلا ضغط، مجرّد استكشاف.")}
      </h2>

      {data.suggestedClusters.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-muted-foreground">{L(ar, "Based on your interests, you might love:", "بناءً على اهتماماتك، قد يعجبك:")}</p>
          <div className="flex flex-wrap gap-2">
            {data.suggestedClusters.map((c) => (
              <Button key={c.cluster} size="sm" variant="outline" onClick={() => go("fieldhub")} className="bg-white/60">
                <Compass className="me-1 size-3.5" /> {c.cluster}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* First-week plan */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-iscarb-ink dark:text-white">{L(ar, "Your first steps", "خطواتك الأولى")}</span>
          <span className="text-xs text-muted-foreground">{data.progress}%</span>
        </div>
        <Progress value={data.progress} className="mb-3 h-2" />
        <ol className="space-y-1.5">
          {data.plan.map((step) => (
            <li key={step.key}>
              <button
                onClick={() => go(step.view, step.tab)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm transition hover:bg-white/50"
              >
                <span className={`flex size-5 items-center justify-center rounded-full ${step.done ? "bg-iscarb-green text-white" : "bg-white text-muted-foreground"}`}>
                  {step.done ? <Check className="size-3" /> : <Circle className="size-3" />}
                </span>
                <span className={step.done ? "text-muted-foreground line-through" : "text-foreground"}>
                  {ar ? step.titleAr : step.titleEn}
                </span>
                {!step.done && data.nextStep?.key === step.key && (
                  <ArrowRight className="ms-auto size-4 text-iscarb-cyan-dark" />
                )}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default WelcomeBanner;
