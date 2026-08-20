"use client";
import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card } from "@/components/ui/card";
import {
  Heart, Brain, Moon, Zap, AlertCircle, TrendingUp, TrendingDown,
  CheckCircle2, Clock, Target, Loader2
} from "lucide-react";

interface WellbeingData {
  mood: {
    current: number;
    average: number;
    trend: "improving" | "stable" | "declining";
    entries: number;
  };
  energy: {
    average: number;
    recentValue: number;
  };
  stress: {
    average: number;
    recentValue: number;
    level: "high" | "moderate" | "low";
  };
  burnout: {
    riskScore: number;
    riskLevel: "low" | "moderate" | "high" | "critical";
    factors: {
      stressLevel: number;
      workloadHours: number;
      sleepQuality: number;
      studyBalance: number;
    };
  };
  habits: {
    total: number;
    completed: number;
    completionRate: number;
  };
  studyBalance: {
    score: number;
    hours: number;
    restHours: number;
  };
}

export function WellbeingOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "wellbeing", "overview"],
    "/api/v1/student/wellbeing/overview",
  );
  const data = rawRes?.data ?? rawRes as WellbeingData | null;
  const error = queryError?.message ?? null;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader
          title={ar ? "نظرة عامة على الصحة والعافية" : "Wellbeing Overview"}
          description={ar ? "تحليل شامل لصحتك الجسدية والنفسية" : "Comprehensive analysis of your wellbeing"}
        />
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader
          title={ar ? "نظرة عامة على الصحة والعافية" : "Wellbeing Overview"}
        />
        <Card className="p-6 border-red-200 bg-red-50">
          <p className="text-red-700">{error || (ar ? "فشل تحميل البيانات" : "Failed to load data")}</p>
        </Card>
      </div>
    );
  }

  const getBurnoutColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-50 border-red-200";
      case "high": return "bg-orange-50 border-orange-200";
      case "moderate": return "bg-yellow-50 border-yellow-200";
      case "low": return "bg-green-50 border-green-200";
      default: return "bg-gray-50";
    }
  };

  const getBurnoutIcon = (level: string) => {
    switch (level) {
      case "critical": return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "high": return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "moderate": return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "low": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={ar ? "نظرة عامة على الصحة والعافية" : "Wellbeing Overview"}
        description={ar ? "تحليل شامل لصحتك الجسدية والنفسية" : "Comprehensive analysis of your wellbeing"}
      />

      {/* Burnout Risk Card */}
      <Card className={`p-6 ${getBurnoutColor(data.burnout.riskLevel)}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getBurnoutIcon(data.burnout.riskLevel)}
              <h3 className="font-semibold text-lg">
                {ar ? "مخاطر الإرهاق" : "Burnout Risk"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {ar ? `مستوى المخاطر: ${data.burnout.riskLevel}` : `Risk Level: ${data.burnout.riskLevel}`}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full"
                style={{ width: `${data.burnout.riskScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {ar ? `النقاط: ${data.burnout.riskScore}` : `Score: ${data.burnout.riskScore}`}
            </p>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mood */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">
              {ar ? "المزاج" : "Mood"}
            </span>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">{data.mood.average}</div>
            <div className="text-xs text-muted-foreground">
              {ar ? `الاتجاه: ${data.mood.trend}` : `Trend: ${data.mood.trend}`}
            </div>
            <div className="flex items-center gap-1">
              {data.mood.trend === "improving" && (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
              {data.mood.trend === "declining" && (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </Card>

        {/* Energy */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span className="text-xs font-medium text-muted-foreground">
              {ar ? "الطاقة" : "Energy"}
            </span>
          </div>
          <div className="text-2xl font-bold">{data.energy.average}</div>
          <div className="text-xs text-muted-foreground mt-2">
            {ar ? `الأخير: ${data.energy.recentValue}` : `Recent: ${data.energy.recentValue}`}
          </div>
        </Card>

        {/* Stress */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Brain className="h-5 w-5 text-purple-500" />
            <span className="text-xs font-medium text-muted-foreground">
              {ar ? "الإجهاد" : "Stress"}
            </span>
          </div>
          <div className="text-2xl font-bold">{data.stress.average}</div>
          <div className="text-xs text-muted-foreground mt-2">
            {ar ? `المستوى: ${data.stress.level}` : `Level: ${data.stress.level}`}
          </div>
        </Card>

        {/* Sleep Quality */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Moon className="h-5 w-5 text-blue-500" />
            <span className="text-xs font-medium text-muted-foreground">
              {ar ? "جودة النوم" : "Sleep Quality"}
            </span>
          </div>
          <div className="text-2xl font-bold">{data.burnout.factors.sleepQuality}</div>
          <div className="text-xs text-muted-foreground mt-2">
            {ar ? "من 100" : "out of 100"}
          </div>
        </Card>
      </div>

      {/* Study Balance and Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Balance */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">
              {ar ? "توازن الدراسة" : "Study Balance"}
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">{ar ? "ساعات الدراسة" : "Study Hours"}</span>
                <span className="font-medium">{data.studyBalance.hours}h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min(data.studyBalance.hours / 30 * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">{ar ? "ساعات الراحة" : "Rest Hours"}</span>
                <span className="font-medium">{data.studyBalance.restHours}h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(data.studyBalance.restHours / 50 * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{ar ? "درجة التوازن" : "Balance Score"}</span>
                <span className="text-2xl font-bold text-blue-600">{data.studyBalance.score}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Habits Progress */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">
              {ar ? "تقدم العادات" : "Habits Progress"}
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">{ar ? "العادات المكتملة" : "Completed Habits"}</span>
                <span className="font-medium">{data.habits.completed} / {data.habits.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: data.habits.total > 0
                      ? `${(data.habits.completed / data.habits.total) * 100}%`
                      : "0%"
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{ar ? "معدل الإنجاز" : "Completion Rate"}</span>
                <span className="text-2xl font-bold text-green-600">{data.habits.completionRate}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Risk Factors */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">
          {ar ? "عوامل المخاطر" : "Risk Factors"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.burnout.factors.stressLevel}</div>
            <div className="text-xs text-muted-foreground mt-1">{ar ? "مستوى الإجهاد" : "Stress Level"}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.burnout.factors.workloadHours}h</div>
            <div className="text-xs text-muted-foreground mt-1">{ar ? "ساعات العمل" : "Workload Hours"}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.burnout.factors.sleepQuality}</div>
            <div className="text-xs text-muted-foreground mt-1">{ar ? "جودة النوم" : "Sleep Quality"}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.burnout.factors.studyBalance}</div>
            <div className="text-xs text-muted-foreground mt-1">{ar ? "توازن الدراسة" : "Study Balance"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
