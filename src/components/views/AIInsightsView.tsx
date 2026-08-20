"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Presentation,
  Users,
  BookOpen,
  Microscope,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  Loader2,
  BarChart,
  Brain,
} from "lucide-react";

interface TeachingInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
}

interface StudentRisk {
  id: string;
  studentName: string;
  riskLevel: string;
  factors: string[];
}

interface ResearchInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  relevanceScore: number;
}

export function AIInsightsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["faculty", "insights"],
    "/api/v1/faculty/insights",
  );
  const error = queryError ? queryError.message : null;
  const teachingInsights = rawRes?.teaching ?? [];
  const studentRisks = rawRes?.studentRisks ?? [];
  const researchInsights = rawRes?.research ?? [];

  const impactColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-600 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  const riskColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-600",
    critical: "bg-red-500/10 text-red-600",
    medium: "bg-amber-500/10 text-amber-600",
    low: "bg-green-500/10 text-green-600",
  };

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "الرؤى الذكية" : "AI Insights"} description={ar ? "تحليل ذكي لأداء التدريس والطلاب" : "AI-powered teaching and student analytics"} />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" /></div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "الرؤى الذكية" : "AI Insights"} description={ar ? "تحليل ذكي لأداء التدريس والطلاب" : "AI-powered teaching and student analytics"} />
        <Card><CardContent className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
        </CardContent></Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "الرؤى الذكية" : "AI Insights"}
        description={ar ? "تحليل ذكي لأداء التدريس والطلاب" : "AI-powered teaching and student analytics"}
      />
      <div className="space-y-6 pb-12">
        {/* Teaching Insights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-[#0E6C3C]" />
              {ar ? "رؤى التدريس" : "Teaching Insights"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teachingInsights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد رؤى حالياً" : "No insights available yet"}</p>
            ) : (
              <div className="space-y-3">
                {teachingInsights.map((insight) => (
                  <div key={insight.id} className="p-4 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{insight.title}</p>
                      <Badge className={`text-xs border ${impactColors[insight.impact] || impactColors.medium}`}>{insight.impact}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Risks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {ar ? "تنبيهات الطلاب" : "Student Risk Alerts"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentRisks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد تنبيهات" : "No risk alerts"}</p>
            ) : (
              <div className="space-y-3">
                {studentRisks.map((risk) => (
                  <div key={risk.id} className="p-3 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{risk.studentName}</p>
                      <Badge className={`text-xs ${riskColors[risk.riskLevel] || riskColors.medium}`}>{risk.riskLevel}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {risk.factors.map((f, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Research Insights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Microscope className="h-5 w-5 text-teal-500" />
              {ar ? "رؤى البحث" : "Research Insights"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {researchInsights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد رؤى بحثية" : "No research insights"}</p>
            ) : (
              <div className="space-y-3">
                {researchInsights.map((insight) => (
                  <div key={insight.id} className="p-3 rounded-lg border border-border/50">
                    <p className="font-medium text-sm mb-1">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
