"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Search, Activity, Loader2, AlertTriangle, ArrowRight } from "lucide-react";

interface RecruiterMetrics {
  totalCandidates: number;
  activePipeline: number;
  interviewsScheduled: number;
  offersExtended: number;
  hired: number;
  conversionRate: number;
}

export function RecruiterDashboardView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: metrics, isLoading: loading, error: queryError, refetch } = useApiQuery<RecruiterMetrics>(
    ["recruiter", "metrics"],
    "/api/v1/recruiter/metrics",
  );
  const error = queryError ? queryError.message : null;

  const stats = [
    { title: ar ? "إجمالي المرشحين" : "Total Candidates", value: metrics?.totalCandidates?.toLocaleString() || "0", icon: Users, href: "/recruiter/candidates" },
    { title: ar ? "الوظائف المفتوحة" : "Active Pipeline", value: String(metrics?.activePipeline || 0), icon: Briefcase, href: "/recruiter/pipeline" },
    { title: ar ? "مقابلات مجدولة" : "Interviews Scheduled", value: String(metrics?.interviewsScheduled || 0), icon: Search, href: "/recruiter/interviews" },
    { title: ar ? "عروض العمل" : "Offers Extended", value: String(metrics?.offersExtended || 0), icon: Activity, href: "/recruiter/talent" },
  ];

  const quickActions = [
    { label: ar ? "بحث عن talent" : "Search Talent", href: "/recruiter/talent/search", color: "text-[#0E6C3C]" },
    { label: ar ? "نشر وظيفة" : "Post Job", href: "/recruiter/jobs/post", color: "text-blue-500" },
    { label: ar ? "إدارة الأنبوب" : "Manage Pipeline", href: "/recruiter/pipeline", color: "text-purple-500" },
    { label: ar ? "التقارير" : "Reports", href: "/recruiter/analytics", color: "text-amber-500" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={ar ? "لوحة تحكم التوظيف" : "Recruiter Dashboard"} description={ar ? "إدارة المرشحين والوظائف المفتوحة" : "Manage candidates and open positions"} breadcrumbs={[{ label: ar ? "الرئيسية" : "Home", href: "/" }, { label: ar ? "التوظيف" : "Recruiter", href: "/recruiter/dashboard" }]} />
        <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={ar ? "لوحة تحكم التوظيف" : "Recruiter Dashboard"} description={ar ? "إدارة المرشحين والوظائف المفتوحة" : "Manage candidates and open positions"} breadcrumbs={[{ label: ar ? "الرئيسية" : "Home", href: "/" }, { label: ar ? "التوظيف" : "Recruiter", href: "/recruiter/dashboard" }]} />
        <Card><CardContent className="py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6 relative min-h-[calc(100vh-4rem)] rounded-3xl bg-slate-50/40 dark:bg-slate-950/40 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-2xl overflow-hidden before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-violet-100/30 before:via-slate-50/10 before:to-transparent dark:before:from-violet-900/20 dark:before:via-slate-950/10">
      <PageHeader
        title={ar ? "لوحة تحكم التوظيف" : "Recruiter Dashboard"}
        description={ar ? "إدارة المرشحين والوظائف المفتوحة" : "Manage candidates and open positions"}
        breadcrumbs={[{ label: ar ? "الرئيسية" : "Home", href: "/" }, { label: ar ? "التوظيف" : "Recruiter", href: "/recruiter/dashboard" }]}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.href}>
            <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</span>
                    <div className="p-2.5 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-xl group-hover:scale-110 transition-transform">
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{stat.value}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
        <CardHeader className="pb-4"><CardTitle className="text-slate-800 dark:text-slate-100">{ar ? "إجراءات سريعة" : "Quick Actions"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all shadow-sm cursor-pointer group">
                  <span className={`text-sm font-semibold ${action.color}`}>{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400 ml-auto group-hover:translate-x-1 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all hover:-translate-y-0.5">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-violet-600 dark:text-violet-400">{metrics?.conversionRate || 0}%</p>
            <p className="text-sm font-medium text-slate-500 mt-2">{ar ? "معدل التحويل" : "Conversion Rate"}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all hover:-translate-y-0.5">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-blue-500">{metrics?.interviewsScheduled || 0}</p>
            <p className="text-sm font-medium text-slate-500 mt-2">{ar ? "مقابلات قادمة" : "Upcoming Interviews"}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all hover:-translate-y-0.5">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-emerald-500">{metrics?.hired || 0}</p>
            <p className="text-sm font-medium text-slate-500 mt-2">{ar ? "تم التوظيف" : "Hired"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
