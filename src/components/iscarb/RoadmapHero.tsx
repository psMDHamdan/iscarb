"use client";

import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useIscarbFetch } from "@/lib/use-iscarb-fetch";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Check, Circle, Lock, Compass, Sparkles } from "lucide-react";
import type { Roadmap, RoadmapStage } from "@/lib/journey-roadmap";
import type { ViewId } from "@/lib/store";

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

interface RoadmapResponse extends Roadmap {
  academicYear: number;
}

/**
 * The guided spine on Home: "you're in Year N — here's your single next step",
 * plus a compact rail of the whole day-one→graduation journey. Mirrors ZTM's
 * career-path roadmap, in iSCARB's palette and RTL-aware.
 */
export function RoadmapHero({ compact = false }: { compact?: boolean }) {
  const { ar } = useI18n();
  const selectedStudentId = useApp((s) => s.selectedStudentId);
  const setView = useApp((s) => s.setView);
  const { data } = useIscarbFetch<RoadmapResponse>(
    selectedStudentId ? `/api/iscarb/journey/roadmap?studentId=${selectedStudentId}` : null,
  );

  if (!selectedStudentId || !data) return null;
  const { nextStep, stages, percent, academicYear } = data;

  const go = (view: ViewId, tab?: string) => {
    if (tab) {
      try {
        sessionStorage.setItem("iscarb:journeyTab", tab);
      } catch {
        /* ignore */
      }
    }
    setView(view);
  };

  return (
    <div className="rounded-2xl border border-iscarb-green/20 bg-gradient-to-br from-iscarb-green-soft/60 to-iscarb-cyan-soft/30 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-iscarb-green-dark">
            <Compass className="size-3.5" /> {L(ar, `Year ${academicYear} · Your journey`, `السنة ${academicYear} · رحلتك`)}
          </span>
          <span className="text-xs text-muted-foreground">{percent}% {L(ar, "complete", "مكتملة")}</span>
        </div>
        <div className="min-w-[140px] flex-1 sm:max-w-[220px]">
          <Progress value={percent} className="h-2" />
        </div>
      </div>

      {nextStep ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-iscarb-green-dark">
              {L(ar, "Your next step", "خطوتك التالية")}
            </div>
            <h3 className="mt-0.5 font-display text-xl font-bold text-iscarb-ink dark:text-white">
              {ar ? nextStep.titleAr : nextStep.titleEn}
            </h3>
          </div>
          <Button onClick={() => go(nextStep.view, nextStep.tab)} className="shrink-0">
            {ar ? nextStep.ctaAr : nextStep.ctaEn}
            <ArrowRight className="ms-1.5 size-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-iscarb-green-dark">
          <Sparkles className="size-4" /> {L(ar, "You've completed every milestone — you're graduation-ready.", "أكملت كل المحطّات — أنت جاهز للتخرّج.")}
        </div>
      )}

      {!compact && <StageRail stages={stages} ar={ar} onGo={go} />}
    </div>
  );
}

function StageRail({ stages, ar, onGo }: { stages: RoadmapStage[]; ar: boolean; onGo: (v: ViewId, t?: string) => void }) {
  return (
    <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stages.map((s) => {
        const isDone = s.status === "done";
        const isCurrent = s.status === "current";
        const Icon = isDone ? Check : isCurrent ? Circle : Lock;
        return (
          <li key={s.key}>
            <button
              onClick={() => onGo(s.view, s.tab)}
              className={[
                "flex w-full flex-col items-start gap-1 rounded-xl border p-2.5 text-start transition",
                isCurrent
                  ? "border-iscarb-green bg-white shadow-sm"
                  : isDone
                    ? "border-iscarb-green/30 bg-white/60"
                    : "border-border/50 bg-white/30 opacity-70 hover:opacity-100",
              ].join(" ")}
            >
              <span
                className={[
                  "flex size-5 items-center justify-center rounded-full",
                  isDone ? "bg-iscarb-green text-white" : isCurrent ? "bg-iscarb-green/15 text-iscarb-green-dark" : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                <Icon className="size-3" />
              </span>
              <span className="text-xs font-semibold leading-tight text-iscarb-ink dark:text-white">{ar ? s.titleAr : s.titleEn}</span>
              <span className="text-[10px] text-muted-foreground">{ar ? s.detailAr : s.detailEn}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export default RoadmapHero;
