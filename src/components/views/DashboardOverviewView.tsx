"use client";

import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, BookOpen, Target, TrendingUp, Sparkles, ArrowRight, Brain, Calendar, CheckCircle2, Circle, Clock, Activity, Award, Zap, Bell, BarChart3, GraduationCap, Star, Rocket } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

export function DashboardOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data, isLoading: loading, error } = useApiQuery<{
    data: {
      student: { name: string; email: string; program: string; cohort: string; readinessScore: number; totalStudyHours: number; currentStreak: number; enrollmentCount: number; universityName: string };
      academic: { gpa: number; creditsEnrolled: number; enrolledCourses: number; semester: string; completedCredits: number; totalCredits: number };
      assessments: { active: Array<{ id: string; title: string; dueDate: string; type: string; estimatedDurationMinutes: number }>; total: number; dueSoon: number; completedToday: number };
      competencies: { overview: Array<{ competencyId: string; competencyName: string; currentLevel: number; targetLevel: number; trend: number }>; averageLevel: number; count: number };
      aiBriefing: { greeting: string; priorities: string[]; riskAlerts: string[]; careerAdvice: string; studyRecommendations: Array<{ course: string; reason: string }> };
      weeklyActivity: { day: string; hours: number }[];
      milestones: string[];
    }
  }>(
    ["dashboard", "overview"],
    "/api/v1/student/dashboard/overview"
  );

  const overviewData = data?.data;

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "نظرة عامة" : "Overview"} description={ar ? "ملخص شامل لحالتك الأكاديمية" : "Comprehensive academic summary"} />
        <div className="space-y-4">
          <Card>
            <CardContent className="p-12 flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-iscarb-green mb-3" />
              <p className="text-sm text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !overviewData) {
    return (
      <>
        <PageHeader title={ar ? "نظرة عامة" : "Overview"} />
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{ar ? "خطأ في تحميل البيانات" : "Error Loading Data"}</h4>
              <p className="text-sm mt-1 text-muted-foreground">{error instanceof Error ? error.message : (ar ? "لم يتم العثور على بيانات" : "No data available")}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
                {ar ? "إعادة تحميل" : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const student = overviewData.student || { name: "", program: "", cohort: "", readinessScore: 0 };
  // The API returns 'stats' instead of 'academic', so we map it or provide a safe default.
  const stats = overviewData.stats || { gpa: 0 };
  const academic = overviewData.academic || { 
    gpa: stats.gpa || 0, 
    creditsEnrolled: 0, 
    enrolledCourses: 0, 
    semester: "", 
    completedCredits: 0, 
    totalCredits: 100 
  };
  const assessments = overviewData.assessments || { active: [] };
  const competencies = overviewData.competencies || { overview: [] };
  const aiBriefing = overviewData.aiBriefing || { greeting: "", priorities: [], riskAlerts: [], careerAdvice: "" };
  const weeklyActivity = overviewData.weeklyActivity || [];
  const milestones = overviewData.milestones || [];
  
  const graduationProgress = academic.totalCredits > 0 ? Math.round((academic.completedCredits / academic.totalCredits) * 100) : 0;

  return (
    <>
      <PageHeader
        title={ar ? "نظرة عامة" : "Overview"}
        description={ar ? `مرحباً، ${student.name}` : `Welcome, ${student.name}`}
      />

      <div className="space-y-6 pb-12">
        {/* AI Briefing Card */}
        <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-iscarb-cyan animate-pulse" />
                  {aiBriefing?.greeting || (ar ? `مرحباً، ${student.name}` : `Hello, ${student.name}`)}
                </h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="bg-iscarb-cyan/10 text-iscarb-cyan text-[10px]">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {student.program}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {ar ? "الفصل:" : "Semester:"} {academic.semester}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200 bg-purple-50/50">
                    <Star className="h-3 w-3 mr-1" />
                    {ar ? "المعدل:" : "GPA:"} {academic.gpa.toFixed(2)}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {aiBriefing?.priorities && aiBriefing.priorities.length > 0 && (
                    <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50">
                      <h3 className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3" />{ar ? "أولويات اليوم" : "Today's Priorities"}
                      </h3>
                      <div className="space-y-1.5">
                        {aiBriefing.priorities.slice(0, 3).map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Circle className="h-2 w-2 text-blue-500 shrink-0 fill-blue-500" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiBriefing?.riskAlerts && aiBriefing.riskAlerts.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50">
                      <h3 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                        <Bell className="h-3 w-3" />{ar ? "تنبيهات" : "Alerts"}
                      </h3>
                      <div className="space-y-1.5">
                        {aiBriefing.riskAlerts.slice(0, 2).map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-red-600/80">
                            <AlertCircle className="h-2.5 w-2.5 shrink-0" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {aiBriefing?.careerAdvice && (
                  <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-iscarb-gold/5 to-amber-50/50 border border-iscarb-gold/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="h-3.5 w-3.5 text-iscarb-gold" />
                      <span className="text-xs font-semibold text-iscarb-gold">{ar ? "نصيحة مهنية" : "Career Insight"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{aiBriefing.careerAdvice}</p>
                  </div>
                )}
              </div>

              <div className="text-right shrink-0 ml-4">
                <div className="relative">
                  <p className="text-4xl font-bold text-iscarb-cyan">{student.readinessScore}%</p>
                  <p className="text-[10px] text-muted-foreground">{ar ? "الجاهزية" : "Readiness"}</p>
                  <div className="mt-1 w-16 h-1 bg-muted rounded-full overflow-hidden ml-auto">
                    <div
                      className="h-full bg-iscarb-cyan rounded-full"
                      style={{ width: `${student.readinessScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Target} label={ar ? "المعدل التراكمي" : "GPA"} value={academic.gpa.toFixed(2)} sub={ar ? "من 4.0" : "out of 4.0"} color="text-iscarb-cyan" progress={academic.gpa / 4.0 * 100} />
          <MetricCard icon={BookOpen} label={ar ? "المساقات المسجلة" : "Courses"} value={`${academic.enrolledCourses}`} sub={ar ? "هذا الفصل" : "this semester"} color="text-iscarb-gold" />
          <MetricCard icon={TrendingUp} label={ar ? "سلسلة الدراسة" : "Streak"} value={`${student.currentStreak}`} sub={ar ? "أيام متتالية" : "days"} color="text-orange-500" />
          <MetricCard icon={Sparkles} label={ar ? "ساعات الدراسة" : "Study Hours"} value={`${student.totalStudyHours}`} sub={ar ? "إجمالي" : "total"} color="text-purple-500" />
        </div>

        {/* Graduation Progress + Weekly Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Graduation Progress */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-iscarb-cyan" />
                  {ar ? "التخرج" : "Graduation"}
                </CardTitle>
                <Badge variant="secondary" className="bg-iscarb-cyan/10 text-iscarb-cyan text-xs">
                  {graduationProgress}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-iscarb-cyan to-emerald-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${graduationProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {ar ? "الساعات المنجزة" : "Credits earned"}: {academic.completedCredits} / {academic.totalCredits}
                </span>
                <span className="text-xs font-medium text-emerald-600">
                  {ar ? "متبقي" : "Remaining"}: {academic.totalCredits - academic.completedCredits}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          {weeklyActivity && weeklyActivity.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    {ar ? "النشاط الأسبوعي" : "Weekly Activity"}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">{ar ? "ساعات" : "hours"}</span>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-end gap-2 h-20">
                  {weeklyActivity.map((day, i) => {
                    const maxHours = Math.max(...weeklyActivity.map(d => d.hours), 1);
                    const height = (day.hours / maxHours) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">{day.hours}h</span>
                        <div className="w-full bg-muted rounded-full overflow-hidden" style={{ height: "60px" }}>
                          <div
                            className="bg-gradient-to-t from-iscarb-cyan to-blue-400 w-full rounded-full transition-all duration-500"
                            style={{ height: `${height}%`, marginBlockStart: `${100 - height}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-muted-foreground uppercase">{day.day.slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Milestones */}
        {milestones && milestones.length > 0 && (
          <Card className="border-iscarb-gold/20 bg-gradient-to-br from-iscarb-gold/5 to-amber-50/30 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-iscarb-gold/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-iscarb-gold" />
                {ar ? "الإنجازات" : "Milestones"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-background/50 border border-iscarb-gold/10">
                    <Award className="h-4 w-4 text-iscarb-gold shrink-0" />
                    <span className="text-xs">{m}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competencies Overview */}
        {competencies.count > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-iscarb-cyan" />
                  {ar ? "الكفاءات" : "Competencies"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{ar ? "المتوسط:" : "Avg:"}</span>
                  <Badge variant="secondary" className="bg-iscarb-cyan/10 text-iscarb-cyan font-semibold">{competencies.averageLevel}%</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {competencies.overview.slice(0, 4).map((comp) => {
                  const progress = Math.min(Math.round((comp.currentLevel / Math.max(comp.targetLevel, 1)) * 100), 100);
                  return (
                    <div key={comp.competencyId} className="p-3 rounded-lg border border-border/60 bg-background/50 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-medium text-sm">{comp.competencyName}</h4>
                        <span className={`text-xs font-bold ${comp.trend > 0 ? "text-emerald-600" : comp.trend < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                          {comp.currentLevel}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{ar ? "الهدف:" : "Target:"} {comp.targetLevel}%</span>
                        {comp.trend > 0 && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Assessments */}
        {assessments.active.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-iscarb-gold" />
                  {ar ? "التقييمات النشطة" : "Active Assessments"}
                </CardTitle>
                <div className="flex items-center gap-3">
                  {assessments.completedToday > 0 && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[9px]">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1" />{assessments.completedToday} {ar ? "اليوم" : "today"}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-iscarb-gold/10 text-iscarb-gold-dark text-xs">
                    {assessments.dueSoon} {ar ? "قريباً" : "due soon"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              {assessments.active.slice(0, 4).map((a) => {
                const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 864e5);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/50 hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{a.title}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground" suppressHydrationWarning>
                          <Calendar className="h-3 w-3" />
                          {new Date(a.dueDate).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">· {a.estimatedDurationMinutes}{ar ? " دقيقة" : "min"}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          daysLeft <= 1 ? "text-red-600 bg-red-50" : daysLeft <= 3 ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50"
                        }`}>
                          {daysLeft <= 0 ? (ar ? "متأخر" : "Overdue") : ar ? `${daysLeft} يوم` : `${daysLeft}d left`}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 text-xs">
                      {ar ? "ابدأ" : "Start"} <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Quick Study Recommendations */}
        {aiBriefing?.studyRecommendations && aiBriefing.studyRecommendations.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Rocket className="h-5 w-5 text-emerald-500" />
                {ar ? "توصيات الدراسة" : "Study Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              {aiBriefing.studyRecommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/10">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{rec.course}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0 text-xs">
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Action Links */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            variant="outline"
            className="h-auto py-4 justify-start gap-3 bg-white dark:bg-background hover:bg-accent/50"
            onClick={() => window.location.href = "/student/career"}
          >
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">{ar ? "المسار المهني" : "Career Path"}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "استكشف الفرص" : "Explore opportunities"}</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 justify-start gap-3 bg-white dark:bg-background hover:bg-accent/50"
            onClick={() => window.location.href = "/student/readiness"}
          >
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">{ar ? "الجاهزية" : "Readiness"}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "قياس تقدمك" : "Track your progress"}</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 justify-start gap-3 bg-white dark:bg-background hover:bg-accent/50"
            onClick={() => window.location.href = "/student/assessments"}
          >
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <Brain className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">{ar ? "التقييمات" : "Assessments"}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "اختبر مهاراتك" : "Test your skills"}</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Button>
        </div>
      </div>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color, progress }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; color: string; progress?: number }) {
  return (
    <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-muted/50">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
            <p className="text-[10px] text-muted-foreground/60">{sub}</p>
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-3 w-full bg-muted rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all ${color.replace("text", "bg")}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
