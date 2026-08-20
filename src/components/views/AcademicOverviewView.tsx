"use client";

import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, Brain, TrendingUp, Award, BookOpen, Calendar, Clock, GraduationCap, Target, Sparkles, Star, ArrowRight, Activity, AlertTriangle } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Skeleton } from "@/components/ui/skeleton";

export function AcademicOverviewView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data, isLoading: loading, error } = useApiQuery<{
    data: {
      healthScore: number; gpa: number; cgpa: number; creditsCompleted: number;
      creditsRemaining: number; currentSemester: string; academicStanding: string;
      attendanceRate: number; enrolledCourses: number; completedCourses: number;
      graduationProgress: number; certificateProgress: number; learningRiskScore: number;
      aiSummary: string; metrics: { label: string; labelAr: string; value: string }[];
      upcomingExams: { title: string; date: string; course: string }[];
      upcomingAssignments: { title: string; dueDate: string; course: string }[];
      recentActivity: { action: string; date: string; detail: string }[];
      timeline: { semester: string; gpa: number; credits: number }[];
    }
  }>(["academic", "overview"], "/api/v1/student/academic/overview");

  if (loading) {
    return (
      <><PageHeader title={ar ? "نظرة عامة أكاديمية" : "Academic Overview"} />
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-9 w-16 ml-auto" />
                <Skeleton className="h-3 w-20 ml-auto" />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
                <Skeleton className="h-10 w-10 mx-auto rounded-xl" />
                <Skeleton className="h-7 w-16 mx-auto" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[1,2].map(i => (
              <div key={i} className="rounded-xl border border-border bg-card space-y-0">
                <div className="border-b border-border/50 p-4"><Skeleton className="h-4 w-40" /></div>
                <div className="p-5 space-y-3">
                  {[1,2,3].map(j => <Skeleton key={j} className="h-12 w-full rounded-lg" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <><PageHeader title={ar ? "نظرة عامة أكاديمية" : "Academic Overview"} />
        <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error Loading"}</h4>
            <p className="text-sm mt-1 text-muted-foreground">{error instanceof Error ? error.message : (ar ? "تعذر التحميل" : "Could not load data")}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
        </CardContent></Card>
      </>
    );
  }

  const d = data.data;

  return (
    <>
      <PageHeader title={ar ? "نظرة عامة أكاديمية" : "Academic Overview"}
        description={ar ? "ملخص حالتك الأكاديمية الشامل" : "Your comprehensive academic status"} />

      <div className="space-y-6 pb-12">
        {/* AI Summary */}
        <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-iscarb-cyan/10"><Brain className="h-6 w-6 text-iscarb-cyan" /></div>
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-iscarb-gold" />{ar ? "ملخص iSCARB AI الذكي" : "iSCARB AI Summary"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{d.aiSummary || (ar ? "تحليل أدائك الأكاديمي جارٍ..." : "Analyzing your academic performance...")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-bold text-iscarb-cyan">{d.healthScore}%</p>
                <p className="text-[10px] text-muted-foreground">{ar ? "الصحة الأكاديمية" : "Health Score"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-5 text-center">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 w-fit mx-auto mb-2"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
              <p className="text-2xl font-bold">{d.gpa.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{ar ? "المعدل التراكمي" : "CGPA"}</p>
              <Badge variant="outline" className={`text-[9px] mt-1 ${d.gpa >= 3 ? "text-green-600 border-green-200" : d.gpa >= 2 ? "text-amber-600 border-amber-200" : "text-red-600 border-red-200"}`}>
                {d.gpa >= 3 ? (ar ? "ممتاز" : "Excellent") : d.gpa >= 2 ? (ar ? "جيد" : "Good") : (ar ? "تحتاج تحسين" : "Needs Work")}
              </Badge>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-5 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 w-fit mx-auto mb-2"><GraduationCap className="h-5 w-5 text-emerald-600" /></div>
              <p className="text-2xl font-bold">{d.creditsCompleted}<span className="text-sm text-muted-foreground">/{d.creditsCompleted + d.creditsRemaining}</span></p>
              <p className="text-xs text-muted-foreground">{ar ? "الوحدات المكتملة" : "Credits Done"}</p>
              <Progress value={d.graduationProgress} className="h-1 mt-2" />
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-5 text-center">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 w-fit mx-auto mb-2"><BookOpen className="h-5 w-5 text-purple-600" /></div>
              <p className="text-2xl font-bold">{d.enrolledCourses}</p>
              <p className="text-xs text-muted-foreground">{ar ? "المساقات الحالية" : "Enrolled"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{d.completedCourses} {ar ? "مكتملة" : "completed"}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5">
            <CardContent className="p-5 text-center">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 w-fit mx-auto mb-2"><Activity className="h-5 w-5 text-amber-600" /></div>
              <p className="text-2xl font-bold">{d.attendanceRate}%</p>
              <p className="text-xs text-muted-foreground">{ar ? "الحضور" : "Attendance"}</p>
              {d.learningRiskScore > 50 && (
                <Badge variant="destructive" className="text-[9px] mt-1"><AlertTriangle className="h-2.5 w-2.5 mr-1" />{ar ? "مخاطر مرتفعة" : "High Risk"}</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Academic Standing + Learning Risk */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2"><Award className="h-5 w-5 text-iscarb-gold" />{ar ? "الوضع الأكاديمي" : "Academic Standing"}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm">{ar ? "الفصل الحالي" : "Current Semester"}</span>
                <Badge className="bg-iscarb-cyan/10 text-iscarb-cyan">{d.currentSemester}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm">{ar ? "الأكاديمية" : "Standing"}</span>
                <Badge className={d.academicStanding === "Good" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{d.academicStanding}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm">{ar ? "مخاطر التعلم" : "Risk Score"}</span>
                <div className="flex items-center gap-2">
                  <Progress value={100 - d.learningRiskScore} className="h-2 w-20" />
                  <span className={`text-xs font-semibold ${d.learningRiskScore > 50 ? "text-red-600" : d.learningRiskScore > 30 ? "text-amber-600" : "text-green-600"}`}>{d.learningRiskScore}/100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {d.timeline && d.timeline.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5 text-iscarb-cyan" />{ar ? "التقدم الأكاديمي" : "Academic Progress"}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {d.timeline.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border/40">
                    <div className="p-1.5 rounded-lg bg-iscarb-cyan/10"><TrendingUp className="h-4 w-4 text-iscarb-cyan" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{t.semester}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{ar ? "المعدل:" : "GPA:"} {t.gpa.toFixed(2)}</span>
                        <span>·</span>
                        <span>{t.credits} {ar ? "وحدة" : "cr"}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[9px]">{t.gpa >= 3 ? "A" : t.gpa >= 2.5 ? "B" : "C"}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Exams & Assignments */}
        <div className="grid gap-4 lg:grid-cols-2">
          {d.upcomingExams && d.upcomingExams.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-5 w-5 text-red-500" />{ar ? "الامتحانات القادمة" : "Upcoming Exams"}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-2">
                {d.upcomingExams.slice(0, 4).map((exam, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exam.title}</p>
                      <p className="text-[10px] text-muted-foreground">{exam.course}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{new Date(exam.date).toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {d.upcomingAssignments && d.upcomingAssignments.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" />{ar ? "الواجبات القادمة" : "Upcoming Assignments"}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-2">
                {d.upcomingAssignments.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-background/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground">{a.course}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{new Date(a.dueDate).toLocaleDateString(ar ? "ar-SA" : "en-US")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Button variant="outline" className="h-auto py-4 justify-start gap-3 bg-white dark:bg-background hover:bg-accent/50"
            onClick={() => window.location.href = "/student/academic/courses"}>
            <div className="p-2 rounded-lg bg-blue-50"><BookOpen className="h-4 w-4 text-blue-600" /></div>
            <div className="text-left"><p className="text-sm font-semibold">{ar ? "المساقات" : "Courses"}</p><p className="text-[10px] text-muted-foreground">{ar ? "عرض المساقات" : "View courses"}</p></div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start gap-3 bg-white dark:bg-background hover:bg-accent/50"
            onClick={() => window.location.href = "/student/academic/grades"}>
            <div className="p-2 rounded-lg bg-purple-50"><Star className="h-4 w-4 text-purple-600" /></div>
            <div className="text-left"><p className="text-sm font-semibold">{ar ? "الدرجات" : "Grades"}</p><p className="text-[10px] text-muted-foreground">{ar ? "عرض الدرجات" : "View grades"}</p></div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start gap-3 bg-white dark:bg-background hover:bg-accent/50"
            onClick={() => window.location.href = "/student/academic/graduation"}>
            <div className="p-2 rounded-lg bg-emerald-50"><GraduationCap className="h-4 w-4 text-emerald-600" /></div>
            <div className="text-left"><p className="text-sm font-semibold">{ar ? "التخرج" : "Graduation"}</p><p className="text-[10px] text-muted-foreground">{ar ? "تتبع تقدمك" : "Track progress"}</p></div>
            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
          </Button>
        </div>
      </div>
    </>
  );
}
