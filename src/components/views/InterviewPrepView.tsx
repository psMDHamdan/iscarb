"use client";

import { useState } from "react";
import {
  MessageSquareText, Building2, Loader2, History, Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { notify } from "@/lib/notify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ReadinessRing } from "@/components/iscarb/ReadinessRing";

const L = (ar: boolean, en: string, arr: string) => (ar ? arr : en);

const EMPLOYERS = ["Aramco", "stc", "SABIC", "NEOM"] as const;

interface InterviewQuestion {
  q: string;
  competency: string;
}
interface MockSession {
  date: string;
  score: number;
  question?: string;
}
interface PrepResponse {
  studentId: string;
  targetTitle: string | null;
  targetSsco: string | null;
  targetEmployer: (typeof EMPLOYERS)[number] | null;
  readiness: number;
  sessions: MockSession[];
  questionBank: InterviewQuestion[];
}

/**
 * Interview Simulator — surfaced as a first-class destination (P0 fix: this
 * was previously buried as tab 4 of 6 in "Journey & Growth"). Now
 * company-aware (P1 fix): practice questions are tailored to the student's
 * target employer (Aramco/stc/SABIC/NEOM) on top of the universal bank — see
 * src/lib/interview-questions.ts. Honest framing: these are iSCARB-authored
 * PRACTICE questions tailored to each employer's known focus areas, not
 * leaked real interview questions — stated plainly in the UI, not just code
 * comments.
 */
export function InterviewPrepView() {
  const { ar, lang } = useI18n();
  const { selectedStudentId } = useApp();
  const sid = selectedStudentId;
  const [employerOverride, setEmployerOverride] = useState<string | null>(null);

  const path = sid
    ? `/api/iscarb/interview-prep?studentId=${sid}${employerOverride ? `&employer=${encodeURIComponent(employerOverride)}` : ""}`
    : null;
  const { data, isLoading } = useApiQuery<PrepResponse>(["interview-prep", sid ?? "", employerOverride ?? ""], path ?? "", {
    enabled: !!sid,
  });

  const record = useApiMutation<{ ok: boolean; readiness: number }, { studentId: string; score: number; question: string }>(
    "/api/iscarb/interview-prep",
    {
      invalidateKeys: (vars) => [["interview-prep", vars.studentId], ["dashboard", vars.studentId]],
      onSuccess: () => notify.ok(lang, { en: "Session recorded", ar: "تم تسجيل الجلسة" }),
    },
  );

  if (!sid) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          {L(ar, "Select a student to practice interviews.", "اختر طالباً لممارسة المقابلات.")}
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-iscarb-green-soft text-iscarb-green">
          <MessageSquareText className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-iscarb-ink dark:text-white">
            {L(ar, "Interview Simulator", "محاكي المقابلات")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {L(ar, "Practice for the room before you're in it.", "تدرّب على المقابلة قبل أن تكون فيها.")}
          </p>
        </div>
      </div>

      {/* Employer picker */}
      <Card className="mb-5">
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <Building2 className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{L(ar, "Target employer:", "جهة التوظيف المستهدفة:")}</span>
          <Button
            size="sm"
            variant={employerOverride === null ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setEmployerOverride(null)}
          >
            {L(ar, "Auto-detect", "اكتشاف تلقائي")}
          </Button>
          {EMPLOYERS.map((e) => (
            <Button
              key={e}
              size="sm"
              variant={employerOverride === e ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setEmployerOverride(e)}
            >
              {e}
            </Button>
          ))}
          {data?.targetEmployer && (
            <Badge className="bg-iscarb-gold-soft text-iscarb-gold-dark ms-auto">
              <Sparkles className="me-1 size-3" />
              {L(ar, `أسئلة مخصصة لـ ${data.targetEmployer}`, `Tailored for ${data.targetEmployer}`)}
            </Badge>
          )}
        </CardContent>
      </Card>

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* Readiness rail */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">{L(ar, "Interview readiness", "جاهزية المقابلة")}</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center">
                <ReadinessRing score={Math.round(data.readiness)} size={150} stroke={11} label={L(ar, "Readiness", "الجاهزية")} />
                {data.targetTitle && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">{L(ar, "الهدف:", "Target:")} {data.targetTitle}</p>
                )}
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  {data.sessions.length} {L(ar, "جلسة محاكاة مسجَّلة", "mock sessions recorded")}
                </p>
              </CardContent>
            </Card>
            {data.sessions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-1.5 text-sm"><History className="size-3.5" />{L(ar, "آخر الجلسات", "Recent sessions")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.sessions.slice(0, 5).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{new Date(s.date).toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
                      <Badge variant="outline" className="text-[10px]">{Math.round(s.score)}/100</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Question bank */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{L(ar, "أسئلة التدريب", "Practice questions")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {L(
                  ar,
                  "أسئلة من إعداد iSCARB مصمَّمة حسب مجال كل جهة — وليست أسئلة مقابلات حقيقية مسرَّبة.",
                  "iSCARB-authored questions tailored to each employer's focus — not leaked real interview questions.",
                )}
              </p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.questionBank.map((q, i) => (
                <div key={i} className="rounded-lg border border-border/50 p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-iscarb-cyan-dark">{q.competency}</span>
                  </div>
                  <p className="mb-2 text-sm" dir="auto">{q.q}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">{L(ar, "نتيجتي:", "I scored:")}</span>
                    {[60, 75, 90].map((sc) => (
                      <Button
                        key={sc}
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px]"
                        disabled={record.isPending}
                        onClick={() => record.mutate({ studentId: sid, score: sc, question: q.q })}
                      >
                        {sc}
                      </Button>
                    ))}
                    {record.isPending && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {data && data.readiness > 0 && (
        <div className="mt-5">
          <Progress value={data.readiness} className="h-1.5" />
        </div>
      )}
    </div>
  );
}

export default InterviewPrepView;
