"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, TrendingUp, Brain, Loader2, Target } from "lucide-react";
import type { AssessmentSnapshotData } from "@/services/unified-dashboard.service";

interface Props {
  data: AssessmentSnapshotData | null;
  loading: boolean;
  ar: boolean;
}

export function AssessmentSnapshot({ data, loading, ar }: Props) {
  if (loading) return <Card><CardContent className="p-5 flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-purple-600" /></CardContent></Card>;
  if (!data) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 border-b border-border/40">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            {ar ? "لمحة التقييمات" : "Assessment Snapshot"}
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {ar ? "جاهزية" : "Readiness"}: {data.readinessPrediction}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/15 border border-purple-200/50">
            <p className="text-lg font-bold text-purple-600">{data.upcoming}</p>
            <p className="text-[10px] text-muted-foreground">{ar ? "قادمة" : "Upcoming"}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/50">
            <p className="text-lg font-bold text-emerald-600">{data.completed}</p>
            <p className="text-[10px] text-muted-foreground">{ar ? "مكتملة" : "Completed"}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/50">
            <p className="text-lg font-bold text-amber-600">{data.averageScore}%</p>
            <p className="text-[10px] text-muted-foreground">{ar ? "المعدل" : "Avg Score"}</p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/10 dark:to-blue-950/10 border border-purple-200/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-semibold">{ar ? "ثقة التقييم" : "Confidence Score"}</span>
            </div>
            <span className={`text-sm font-bold ${data.confidenceScore >= 70 ? "text-emerald-600" : data.confidenceScore >= 40 ? "text-amber-600" : "text-red-600"}`}>
              {data.confidenceScore}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                data.confidenceScore >= 70 ? "bg-emerald-500" : data.confidenceScore >= 40 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${data.confidenceScore}%` }}
            />
          </div>
        </div>

        {/* Recommendations */}
        {data.practiceRecommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {ar ? "توصيات الممارسة" : "Practice Recommendations"}
            </p>
            {data.practiceRecommendations.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-3 w-3 text-purple-500 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
