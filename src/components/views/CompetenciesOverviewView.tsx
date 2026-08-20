"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  Target,
  CheckCircle2,
  Sparkles,
  Star,
  ArrowRight,
  BookOpen,
} from "lucide-react";

interface CompetencyItem {
  id: string;
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  evidenceCount: number;
}

interface OverviewData {
  stats: {
    total: number;
    verified: number;
    unverified: number;
    avgMastery: number;
    gapsCount: number;
  };
  topSkills: CompetencyItem[];
  nextRecommended: {
    id: string;
    name: string;
    category: string;
    currentLevel: number;
    targetLevel: number;
    aiReasoning: string;
  } | null;
  byCategory: Record<string, CompetencyItem[]>;
}

export function CompetenciesOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "competencies", "overview"],
    "/api/v1/student/competencies/overview",
  );
  const data = rawRes?.data ?? rawRes as OverviewData | null;
  const error = queryError?.message ?? null;

  if (loading) {
    return (
      <>
        <PageHeader
          title={ar ? "نظرة عامة على الكفاءات" : "Competencies Overview"}
          description={ar ? "عرض شامل لمستويات كفاءاتك" : "Comprehensive overview of your competency levels"}
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
            <p className="text-sm text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <PageHeader title={ar ? "نظرة عامة على الكفاءات" : "Competencies Overview"} />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <p className="text-sm mt-1">{error || "No data available"}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                {ar ? "إعادة المحاولة" : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "نظرة عامة على الكفاءات" : "Competencies Overview"}
        description={ar ? "عرض شامل لمستويات كفاءاتك وتقدمك" : "Your competency levels and progress at a glance"}
      />

      <div className="space-y-6 pb-12">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {ar ? "إجمالي الكفاءات" : "Total Competencies"}
                  </p>
                  <p className="text-2xl font-bold mt-2">{data.stats.total}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-iscarb-green/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {ar ? "موثقة" : "Verified"}
                  </p>
                  <p className="text-2xl font-bold mt-2 text-green-600">{data.stats.verified}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {ar ? "غير موثقة" : "Unverified"}
                  </p>
                  <p className="text-2xl font-bold mt-2 text-amber-600">{data.stats.unverified}</p>
                </div>
                <Target className="h-8 w-8 text-amber-400/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {ar ? "متوسط الإتقان" : "Avg Mastery"}
                  </p>
                  <p className="text-2xl font-bold mt-2">{data.stats.avgMastery}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-iscarb-blue/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Recommended Skill */}
        {data.nextRecommended && (
          <Card className="border-iscarb-green/20 bg-gradient-to-r from-iscarb-green/5 to-iscarb-blue/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {ar ? "المهارة المقترحة التالية" : "Next Recommended Skill"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1">{data.nextRecommended.name}</h3>
                  <Badge variant="outline" className="text-xs capitalize mb-3">
                    {data.nextRecommended.category}
                  </Badge>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{ar ? "التقدم الحالي" : "Current progress"}</span>
                      <span className="font-semibold">{data.nextRecommended.currentLevel}% / {data.nextRecommended.targetLevel}%</span>
                    </div>
                    <Progress value={(data.nextRecommended.currentLevel / data.nextRecommended.targetLevel) * 100} className="h-2" />
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50/80 dark:bg-amber-900/10 rounded-lg">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{data.nextRecommended.aiReasoning}</p>
                  </div>
                </div>
                <Button size="sm" className="shrink-0 bg-iscarb-green text-white hover:bg-iscarb-green/90">
                  <ArrowRight className="h-3.5 w-3.5 mr-1" />
                  {ar ? "ابدأ" : "Start"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Skills */}
        {data.topSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                {ar ? "أفضل المهارات" : "Top Skills"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topSkills.map((skill) => (
                  <div key={skill.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">{skill.category}</Badge>
                          <span className="text-xs font-semibold">{skill.currentLevel}%</span>
                        </div>
                      </div>
                      <Progress value={skill.currentLevel} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* By Category */}
        {Object.keys(data.byCategory).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {ar ? "حسب الفئة" : "By Category"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(data.byCategory).map(([category, items]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <h4 className="font-semibold capitalize text-sm mb-3">{category}</h4>
                    <div className="space-y-2">
                      {items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground truncate mr-2">{item.name}</span>
                          <Badge variant="secondary">{Math.round(item.currentLevel)}%</Badge>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-xs text-muted-foreground pt-1">
                          +{items.length - 3} {ar ? "آخرى" : "more"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {data.stats.total === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{ar ? "لا توجد كفاءات بعد" : "No competencies yet"}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {ar ? "ابدأ بإضافة أدلة لكفاءاتك" : "Start adding evidence for your competencies"}
              </p>
              <Button variant="outline" onClick={() => window.location.href = "/student/competency-radar"}>
                {ar ? "استعرض الكفاءات" : "Browse Competencies"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
