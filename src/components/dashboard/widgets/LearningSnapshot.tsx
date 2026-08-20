"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Flame, Brain, AlertTriangle, Loader2, ChevronRight, Target } from "lucide-react";
import type { LearningSnapshotData } from "@/services/unified-dashboard.service";

interface Props {
  data: LearningSnapshotData | null;
  loading: boolean;
  ar: boolean;
}

export function LearningSnapshot({ data, loading, ar }: Props) {
  if (loading) return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /></CardContent></Card>;
  if (!data) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          {ar ? "لمحة تعليمية" : "Learning Snapshot"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Streak + Progress */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200/50">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-xl font-bold text-orange-600">{data.streak}</p>
            <p className="text-[10px] text-muted-foreground">{ar ? "أيام متتالية" : "Day streak"}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/50">
            <Brain className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-xl font-bold text-emerald-600">{data.studyHoursThisWeek}h</p>
            <p className="text-[10px] text-muted-foreground">{ar ? "هذا الأسبوع" : "This week"}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox label={ar ? "المساقات" : "Courses"} value={data.activeCourses} color="text-blue-600" />
          <StatBox label={ar ? "البطاقات" : "Flashcards"} value={data.flashcardsDue} color="text-purple-600" />
          <StatBox label={ar ? "الملاحظات" : "Notes"} value={data.notes} color="text-indigo-600" />
        </div>

        {/* Intelligence */}
        {data.intelligence && (
          <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/50">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                {ar ? "ذكاء التعلم" : "Learning Intel"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{data.intelligence}</p>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "توصيات" : "Recommendations"}
            </p>
            {data.recommendations.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/30">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground truncate">{label}</p>
    </div>
  );
}
