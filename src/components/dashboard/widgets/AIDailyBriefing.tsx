"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Loader2, AlertTriangle, Clock, Target,
  ChevronDown, ChevronUp, Brain,
} from "lucide-react";
import type { AIBriefingData } from "@/services/unified-dashboard.service";

interface Props {
  data: AIBriefingData | null;
  loading: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
  ar: boolean;
}

export function AIDailyBriefing({ data, loading, onGenerate, isGenerating, ar }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50/40 to-transparent dark:from-blue-950/15">
        <CardContent className="p-5 flex items-center justify-center h-24">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50/40 to-transparent dark:from-blue-950/15">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {ar ? "الملخص اليومي للذكاء الاصطناعي" : "AI Daily Briefing"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ar ? "احصل على ملخص مخصص ليومك" : "Get a personalized daily briefing"}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={onGenerate} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {ar ? "توليد" : "Generate"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const priorityColors: Record<string, string> = {
    high: "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200",
    medium: "text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200",
    low: "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200",
  };

  return (
    <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50/40 to-transparent dark:from-blue-950/15">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {ar ? "الملخص اليومي" : "Daily Briefing"}
              </h3>
              <p className="text-xs text-blue-600/70 font-medium">
                {ar ? data.greetingAr : data.greeting}
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} className="shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {data.briefing}
        </p>

        {/* Priorities */}
        {data.priorities.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
              {ar ? "الأولويات" : "Priorities"}
            </p>
            {data.priorities.slice(0, 3).map((p, i) => (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${priorityColors[p.priority] || "border-border/40"}`}>
                <Target className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground">{p.reason}</p>
                </div>
                <Badge variant={p.priority === "high" ? "destructive" : "secondary"} className="text-[9px] shrink-0">
                  {ar ? (p.priority === "high" ? "عالي" : p.priority === "medium" ? "متوسط" : "منخفض") : p.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {expanded && (
          <>
            {/* Deadlines */}
            {data.deadlines.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
                  {ar ? "المواعيد النهائية" : "Deadlines"}
                </p>
                {data.deadlines.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 text-orange-500 shrink-0" />
                    <span className="flex-1 truncate">{d.title}</span>
                    <span className={`shrink-0 font-medium ${d.daysLeft <= 1 ? "text-red-600" : d.daysLeft <= 3 ? "text-orange-600" : "text-green-600"}`}>
                      {d.daysLeft <= 0 ? (ar ? "متأخر!" : "Overdue!") : ar ? `${d.daysLeft} يوم` : `${d.daysLeft}d`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Risk Alerts */}
            {data.riskAlerts.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">
                  {ar ? "تنبيهات المخاطر" : "Risk Alerts"}
                </p>
                {data.riskAlerts.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">{r.course}</p>
                      <p className="text-[10px] text-muted-foreground">{r.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Study Order */}
            {data.studyOrder.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                  {ar ? "ترتيب الدراسة" : "Study Order"}
                </p>
                {data.studyOrder.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 font-bold text-[10px] shrink-0">
                      {s.order}
                    </span>
                    <span className="flex-1">{s.topic}</span>
                    <span className="text-[10px] text-muted-foreground">{s.reason}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Career Suggestion */}
            {data.careerSuggestion && (
              <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-3.5 w-3.5 text-purple-600" />
                  <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">
                    {ar ? "نصيحة مهنية" : "Career Insight"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{data.careerSuggestion}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
