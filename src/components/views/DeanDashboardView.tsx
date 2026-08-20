"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  BarChart3,
  AlertTriangle,
  GraduationCap,
  ArrowRight,
  Loader2,
  Shield,
  FileText,
  TrendingUp,
} from "lucide-react";

interface DeanStats {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  activeCourses: number;
  atRiskStudents: number;
  avgGpa: number;
}

export function DeanDashboardView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["dean", "dashboard"],
    "/api/v1/dean/dashboard",
  );
  const error = queryError ? queryError.message : null;
  const stats = rawRes?.stats ?? rawRes ?? null;

  const quickActions = [
    { icon: Users, label: ar ? "الطلاب" : "Students", href: "/dean/students", color: "text-blue-500" },
    { icon: GraduationCap, label: ar ? "أعضاء هيئة التدريس" : "Faculty", href: "/dean/faculty", color: "text-[#0E6C3C]" },
    { icon: BarChart3, label: ar ? "التحليلات" : "Analytics", href: "/dean/analytics", color: "text-purple-500" },
    { icon: FileText, label: ar ? "التقارير" : "Reports", href: "/dean/reports", color: "text-amber-500" },
    { icon: Shield, label: ar ? "الامتثال" : "Compliance", href: "/dean/compliance", color: "text-red-500" },
    { icon: TrendingUp, label: ar ? "الميزانية" : "Budget", href: "/dean/budget", color: "text-teal-500" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader title={ar ? "لوحة العميد" : "Dean Dashboard"} description={ar ? "نظرة عامة على الكلية" : "College overview"} />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader title={ar ? "لوحة العميد" : "Dean Dashboard"} description={ar ? "نظرة عامة على الكلية" : "College overview"} />
        <Card><CardContent className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
        </CardContent></Card>
      </div>
    );
  }

  const s = stats || { totalStudents: 0, totalFaculty: 0, totalCourses: 0, activeCourses: 0, atRiskStudents: 0, avgGpa: 0 };

  return (
    <div className="flex flex-col gap-8 p-6 relative min-h-[calc(100vh-4rem)] rounded-3xl bg-slate-50/40 dark:bg-slate-950/40 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-2xl overflow-hidden before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-emerald-100/30 before:via-slate-50/10 before:to-transparent dark:before:from-emerald-900/20 dark:before:via-slate-950/10">
      <PageHeader
        title={ar ? "لوحة العميد" : "Dean Dashboard"}
        description={ar ? "نظرة عامة على الكلية" : "College overview"}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50"><Users className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{s.totalStudents}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">{ar ? "الطلاب" : "Students"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50"><GraduationCap className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /></div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{s.totalFaculty}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">{ar ? "أعضاء هيئة التدريس" : "Faculty"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50"><AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" /></div>
              <div>
                <p className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{s.atRiskStudents}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">{ar ? "طلاب معرضون للخطر" : "At-Risk Students"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-800 dark:text-slate-100">{ar ? "الإدارة" : "Management"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all shadow-sm cursor-pointer group">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 ml-auto group-hover:translate-x-1 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
