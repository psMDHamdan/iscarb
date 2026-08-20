"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Clock, CheckCircle2, AlertCircle, ArrowRight, TrendingUp, Trophy, Loader2, RefreshCw, Sparkles, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useMemo } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from "recharts";

interface OverviewData {
  stats: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    overallScore: number;
    competencyScore: number;
    careerReadiness: number;
    topStrengths: string[];
    topWeaknesses: string[];
  };
  recentAssessments: { id: string; title: string; score: number | null; submittedAt: string | null; status: string; competency: string }[];
  upcomingDeadlines: { id: string; title: string; daysRemaining: number; type: string; priority: string }[];
}

export function AssessmentHubDashboardView() {
  const { t, ar } = useI18n();
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "assessment", "overview"],
    "/api/iscarb/assessment/dashboard-stats",
  );
  const data = rawRes?.data ?? null;
  const error = queryError?.message ?? null;

  const { data: modulesRes } = useApiQuery<any>(
    ["student", "assessment", "allModules"],
    "/api/iscarb/assessment/modules?specialization=Computer Science",
  );

  const { data: responsesRes } = useApiQuery<any>(
    ["student", "assessment", "responses", "dashboard"],
    "/api/iscarb/assessment/responses",
  );

  const allModules: Array<{ code: string; title: string; dimension: string; estimateMinutes: number | null }> =
    modulesRes?.modules ?? [];

  const completedCodes = useMemo<Set<string>>(() => {
    const rows: Array<{ moduleCode: string }> = responsesRes?.data ?? [];
    return new Set(rows.map((r) => r.moduleCode));
  }, [responsesRes]);

  const remainingModules = useMemo(
    () => allModules.filter((m) => !completedCodes.has(m.code)),
    [allModules, completedCodes],
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  if (loading || !mounted) {
    return (
      <>
        <PageHeader
          title={ar ? "لوحة التقييمات" : "Assessment Dashboard"}
          description={ar ? "نظرة عامة على أدائك وجاهزيتك المهنية." : "Overview of your performance and career readiness."}
        />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-iscarb-green" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title={ar ? "لوحة التقييمات" : "Assessment Dashboard"}
          description={ar ? "نظرة عامة على أدائك وجاهزيتك المهنية." : "Overview of your performance and career readiness."}
        />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 size-4" />{ar ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      </>
    );
  }

  const s = data?.stats;
  const modulesCompleted = s?.totalCompleted ?? 0;
  const modulesPassed = s?.passed ?? 0;
  const avgScore = s?.avgScore ?? 0;
  const compositeScore = s?.composite ?? 0;
  const upcoming: { id: string; title: string; daysRemaining: number; type: string; priority: string }[] = [];
  const recentAssessments = (data?.recent ?? []).map((r: { id: string; moduleCode: string; title?: string; dimension: string; score: number; band: string; passed: boolean; createdAt: string }) => ({
    id: r.id,
    title: r.title ?? r.moduleCode,
    score: r.score,
    submittedAt: r.createdAt,
    status: r.passed ? "passed" : "failed",
    competency: r.dimension,
  }));
  const activeAssessment = upcoming[0];

  const radarData = (data?.radarData ?? []).map((d: { dimension: string; score: number }) => ({
    subject: d.dimension.replace(/_/g, ' '),
    A: d.score,
    fullMark: 100,
  }));

  return (
    <>
      <PageHeader
        title={ar ? "لوحة التقييمات" : "Assessment Dashboard"}
        description={ar ? "نظرة عامة على أدائك وجاهزيتك المهنية." : "Overview of your performance and career readiness."}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/student/dashboard" },
          { label: ar ? "لوحة التقييمات" : "Assessment Dashboard", href: "/assessment/dashboard" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pb-12">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div variants={item}>
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="size-12 rounded-full bg-iscarb-green/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="size-6 text-iscarb-green" />
                  </div>
                  <div className="text-3xl font-display font-bold text-foreground mb-1">{modulesCompleted}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{ar ? "مكتمل" : "Completed"}</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="size-12 rounded-full bg-iscarb-green/10 flex items-center justify-center mb-4">
                    <Trophy className="size-6 text-iscarb-green" />
                  </div>
                  <div className="text-3xl font-display font-bold text-foreground mb-1">{modulesPassed}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{ar ? "ناجح" : "Passed"}</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Target className="size-6 text-blue-500" />
                  </div>
                  <div className="text-3xl font-display font-bold text-foreground mb-1">{avgScore}%</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{ar ? "متوسط النتيجة" : "Avg Score"}</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="border-iscarb-gold/50 bg-gradient-to-br from-iscarb-gold/10 to-background">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="size-12 rounded-full bg-iscarb-gold/20 flex items-center justify-center mb-4">
                    <Trophy className="size-6 text-iscarb-gold-dark" />
                  </div>
                  <div className="text-3xl font-display font-bold text-foreground mb-1">{compositeScore}%</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-iscarb-gold-dark">{ar ? "المركب" : "Composite"}</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* Continue Assessment */}
            <motion.div variants={item} className="lg:col-span-2 space-y-6">
              {activeAssessment ? (
                <Card className="border-iscarb-cyan/30 bg-background shadow-sm overflow-hidden">
                  <div className="border-l-4 border-iscarb-cyan p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <Badge variant="outline" className="bg-iscarb-cyan/10 text-iscarb-cyan-dark border-iscarb-cyan/20">
                        {ar ? "القادم" : "Upcoming"}
                      </Badge>
                      <h3 className="font-display text-xl font-bold">{activeAssessment.title}</h3>
                      <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                        <span>{activeAssessment.daysRemaining} {ar ? "يوم متبقي" : "days left"}</span>
                        <Badge variant="outline">{activeAssessment.type}</Badge>
                      </div>
                    </div>
                    <div className="shrink-0 w-full md:w-auto">
                      <Link href="/assessment">
                        <Button className="w-full bg-iscarb-cyan hover:bg-iscarb-cyan-dark text-white font-bold px-8 shadow-md">
                          {ar ? "متابعة التقييم" : "Continue Assessment"} <ArrowRight className="ml-2 size-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border-iscarb-green/30 bg-gradient-to-r from-iscarb-green/5 to-transparent shadow-sm">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-bold">{ar ? "ابدأ رحلة التوظيف" : "Start your Employability Journey"}</h3>
                      <p className="text-sm font-medium text-[#181d26] dark:text-[#E6F0E9]">
                        {ar
                          ? `أجب على ${allModules.length || 47} سيناريو واحصل على ملف الكفاءات الكاملة`
                          : `Answer ${allModules.length || 47} real-world scenarios and build your full 4D competency profile`}
                      </p>
                    </div>
                    <Link href="/assessment/employability">
                      <Button className="bg-iscarb-green hover:bg-iscarb-green-dark text-white font-bold gap-2 shrink-0">
                        {ar ? "ابدأ الآن" : "Start Now"}
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Modules Remaining */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    {ar ? "الوحدات المتبقية" : "Modules Remaining"}
                    <Badge variant="outline" className="text-xs font-normal">
                      {remainingModules.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {remainingModules.length === 0 ? (
                    <div className="p-6 text-center space-y-3">
                      <Trophy className="mx-auto h-10 w-10 text-iscarb-gold" />
                      <p className="font-semibold text-sm">
                        {ar ? "أحسنت! أكملت جميع الوحدات" : "Well done! You've completed all modules"}
                      </p>
                      <Link href="/assessment/results">
                        <Button variant="outline" size="sm">
                          {ar ? "عرض النتائج" : "View Results"}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {remainingModules.slice(0, 6).map((m) => (
                        <div key={m.code} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                          <div className="flex-1 min-w-0 mr-3">
                            <div className="font-medium text-sm truncate">{m.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px]">
                                {m.dimension.replace(/_/g, " ")}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {m.estimateMinutes ?? 15} {ar ? "دقيقة" : "min"}
                              </span>
                            </div>
                          </div>
                          <Link href={`/assessment/employability?startModule=${m.code}`} className="shrink-0">
                            <Button size="sm" variant="outline" className="text-xs gap-1">
                              {ar ? "ابدأ" : "Start"}
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={item} className="space-y-6">
              <Card className="border-border/50 bg-gradient-to-br from-background to-muted/30 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="size-4" />
                    {ar ? "تحليل الكفاءات الأربعة" : "Four-Dimension Analysis"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 pb-6">
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="Student"
                          dataKey="A"
                          stroke="hsl(var(--iscarb-green))"
                          fill="hsl(var(--iscarb-green))"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle className="text-lg font-bold">{ar ? "النشاط الأخير" : "Recent Activity"}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {recentAssessments.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {ar ? "لا توجد نشاطات" : "No recent activity"}
                      </div>
                    ) : recentAssessments.slice(0, 3).map(r => (
                      <div key={r.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="size-5 text-iscarb-green shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm">{r.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ar ? "مكتمل" : "Completed"}
                            </div>
                          </div>
                        </div>
                        {r.score !== null && (
                          <Badge variant="outline" className="text-xs bg-iscarb-green/10 text-iscarb-green-dark border-iscarb-green/20">
                            {r.score}%
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-iscarb-cyan/5 shadow-sm border-iscarb-cyan/20">
                <CardContent className="p-6">
                  <div className="text-sm font-bold text-iscarb-cyan-dark mb-2 flex items-center gap-2">
                    <Sparkles className="size-4" />
                    {ar ? "الخطوات التالية الموصى بها" : "Recommended Next Steps"}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {ar ? "استمر في الأداء الممتاز! تصفح الدليل للمزيد." : "Keep up the excellent work! Browse the catalog for more."}
                  </div>
                  <Link href="/assessment/catalog">
                    <Button className="w-full font-bold bg-iscarb-cyan hover:bg-iscarb-cyan-dark text-white">
                      {ar ? "الذهاب لدليل التقييمات" : "Explore Catalog"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </>
  );
}
