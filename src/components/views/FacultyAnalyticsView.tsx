"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/lib/use-api-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  GraduationCap,
  BookOpen,
  Target,
  Award,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Presentation,
  ClipboardCheck,
} from "lucide-react";

interface KPIData {
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: string;
}

interface AnalyticsSummary {
  totalStudents: number;
  averageGrade: number;
  completionRate: number;
  attendanceRate: number;
  coursesActive: number;
  studentSatisfaction: number;
  overallScore: number;
  kpis: KPIData[];
}

export function FacultyAnalyticsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawData, isLoading: loading, error, refetch } = useApiQuery<{ stats?: { totalStudents?: number; averageGrade?: number; completionRate?: number; attendanceRate?: number; coursesActive?: number; studentSatisfaction?: number; overallScore?: number }; kpis?: KPIData[] }>(["faculty", "analytics", "kpi"], "/api/v1/faculty/analytics/kpi");

  const data: AnalyticsSummary = rawData ? {
    totalStudents: rawData.stats?.totalStudents || 0,
    averageGrade: rawData.stats?.averageGrade || 0,
    completionRate: rawData.stats?.completionRate || 0,
    attendanceRate: rawData.stats?.attendanceRate || 0,
    coursesActive: rawData.stats?.coursesActive || 0,
    studentSatisfaction: rawData.stats?.studentSatisfaction || 0,
    overallScore: rawData.stats?.overallScore || 0,
    kpis: rawData.kpis || [],
  } : { totalStudents: 0, averageGrade: 0, completionRate: 0, attendanceRate: 0, coursesActive: 0, studentSatisfaction: 0, overallScore: 0, kpis: [] };

  const trendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-[#0E6C3C]" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "التحليلات" : "Analytics Dashboard"} description={ar ? "تحليل أداءك الأكاديمي والبحثي" : "Analyze your academic and research performance"} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "التحليلات" : "Analytics Dashboard"} description={ar ? "تحليل أداءك الأكاديمي والبحثي" : "Analyze your academic and research performance"} />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const d = data;

  return (
    <>
      <PageHeader
        title={ar ? "التحليلات" : "Analytics Dashboard"}
        description={ar ? "تحليل أداءك الأكاديمي والبحثي" : "Analyze your academic and research performance"}
      />
      <div className="space-y-6 pb-12">
        {/* Overall Score */}
        <Card className="border-border/60 bg-gradient-to-r from-[#0E6C3C]/5 via-background to-[#0F7B8A]/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{ar ? "النتيجة الإجمالية" : "Overall Performance Score"}</p>
                <p className="text-4xl font-bold text-[#0E6C3C]">{d.overallScore}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{ar ? "الطلاب" : "Students"}</p>
                <p className="text-2xl font-bold">{d.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: GraduationCap, label: ar ? "معدل الدرجات" : "Average Grade", value: `${d.averageGrade}%`, color: "text-blue-500" },
            { icon: Target, label: ar ? "معدل الإتمام" : "Completion Rate", value: `${d.completionRate}%`, color: "text-[#0E6C3C]" },
            { icon: Users, label: ar ? "معدل الحضور" : "Attendance Rate", value: `${d.attendanceRate}%`, color: "text-amber-500" },
            { icon: BookOpen, label: ar ? "المقررات النشطة" : "Active Courses", value: String(d.coursesActive), color: "text-purple-500" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted/50`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* KPIs */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-[#0E6C3C]" />
              {ar ? "مؤشرات الأداء الرئيسية" : "Key Performance Indicators"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {d.kpis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد بيانات" : "No KPI data available"}</p>
            ) : (
              <div className="space-y-4">
                {d.kpis.map((kpi) => (
                  <div key={kpi.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{kpi.label}</span>
                      <div className="flex items-center gap-2">
                        {trendIcon(kpi.trend)}
                        <span className="text-sm font-bold">{kpi.value}{kpi.unit}</span>
                        <span className="text-xs text-muted-foreground">/ {kpi.target}{kpi.unit}</span>
                      </div>
                    </div>
                    <Progress value={kpi.target > 0 ? Math.min((kpi.value / kpi.target) * 100, 100) : 0} className="h-2" />
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
