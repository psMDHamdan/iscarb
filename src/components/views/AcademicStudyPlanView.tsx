"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, AlertTriangle, BookOpen, Brain, Calendar, CheckCircle2, Circle, Clock, GraduationCap, Lightbulb, Sparkles, Target, TrendingUp } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

export function AcademicStudyPlanView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [expandedSem, setExpandedSem] = useState<string | null>(null);
  const [showAi, setShowAi] = useState(false);

  const { data, isLoading: loading, error } = useApiQuery<any>(
    ["academic", "study-plan"],
    "/api/v1/student/academic/study-plan"
  );

  if (loading) {
    return (
      <><PageHeader title={ar ? "خطة الدراسة" : "Study Plan"} />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1,2,3].map(i => <Card key={i}><CardContent className="p-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-iscarb-green" /></CardContent></Card>)}
        </div>
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <><PageHeader title={ar ? "خطة الدراسة" : "Study Plan"} />
        <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
        </CardContent></Card>
      </>
    );
  }

  const d = data.data;
  const curriculum = d.curriculum || {};
  const semesters = d.semesters || [];
  const recommendedCourses = d.recommendedCourses || [];
  const progress = d.progressPercentage || 0;

  const statusColor = (s: string) =>
    s === "completed" ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20" :
    s === "in-progress" ? "border-iscarb-cyan-300 bg-iscarb-cyan/5" : "border-border/40 bg-muted/20";

  const statusIcon = (s: string, size: number = 4) =>
    s === "completed" ? <CheckCircle2 className={`h-${size} w-${size} text-emerald-500`} /> :
    s === "in-progress" ? <Clock className={`h-${size} w-${size} text-iscarb-cyan`} /> :
    <Circle className={`h-${size} w-${size} text-muted-foreground`} />;

  return (
    <>
      <PageHeader title={ar ? "خطة الدراسة" : "Study Plan"}
        description={`${curriculum.name || ""} — ${progress}% ${ar ? "مكتمل" : "complete"}`} />

      <div className="space-y-6 pb-12">
        {/* Progress Overview */}
        <Card className="bg-gradient-to-br from-iscarb-green/5 to-transparent border-iscarb-green/20 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/20">
                  <GraduationCap className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold">{curriculum.name}</h3>
                  <p className="text-xs text-muted-foreground">{ar ? "منهج البكالوريوس" : "Bachelor's Curriculum"}</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{progress}%</Badge>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{curriculum.completedCredits || 0}</p>
                <p className="text-[10px] text-muted-foreground">{ar ? "مكتملة" : "Completed"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-iscarb-cyan">{(curriculum.totalCredits || 0) - (curriculum.completedCredits || 0)}</p>
                <p className="text-[10px] text-muted-foreground">{ar ? "متبقية" : "Remaining"}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{curriculum.totalCredits || 0}</p>
                <p className="text-[10px] text-muted-foreground">{ar ? "الإجمالي" : "Total"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        {recommendedCourses.length > 0 && (
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-iscarb-gold" />{ar ? "توصيات ذكية" : "AI Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              {recommendedCourses.map((rc: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:bg-accent/30 transition-colors">
                  <div className="p-1.5 rounded-lg bg-iscarb-cyan/10 mt-0.5">
                    <Target className="h-4 w-4 text-iscarb-cyan" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{rc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{rc.code} · {rc.semester}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 italic">"{rc.reason}"</p>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0 text-xs gap-1">
                    <BookOpen className="h-3 w-3" />{ar ? "عرض" : "View"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Semesters Timeline */}
        <div className="space-y-3">
          {semesters.map((sem: any, idx: number) => {
            const isExpanded = expandedSem === sem.semester;
            const completedCount = sem.courses.filter((c: any) => c.status === "completed").length;
            return (
              <Card key={idx} className={`border-l-4 ${statusColor(sem.status)} hover:shadow-md transition-all cursor-pointer`}
                onClick={() => setExpandedSem(isExpanded ? null : sem.semester)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {statusIcon(sem.status)}
                      <div>
                        <p className="font-semibold text-sm">{ar ? "الفصل" : "Semester"} {sem.semester}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {sem.courses.length} {ar ? "مقرر" : "courses"} · {completedCount} {ar ? "مكتمل" : "done"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      sem.status === "completed" ? "border-emerald-200 text-emerald-700" :
                      sem.status === "in-progress" ? "border-iscarb-cyan-200 text-iscarb-cyan" : ""
                    }>
                      {sem.status === "completed" ? (ar ? "مكتمل" : "Completed") :
                       sem.status === "in-progress" ? (ar ? "قيد التنفيذ" : "In Progress") :
                       (ar ? "قادم" : "Pending")}
                    </Badge>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5">
                      {sem.courses.map((course: any, ci: number) => (
                        <div key={ci} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{course.name}</p>
                            <p className="text-[10px] text-muted-foreground">{course.code} · {course.credits} {ar ? "وحدات" : "cr"}</p>
                          </div>
                          <Badge variant="outline" className={`text-[9px] shrink-0 ${
                            course.status === "completed" ? "border-emerald-200 text-emerald-700" :
                            course.status === "in-progress" ? "border-iscarb-cyan/30 text-iscarb-cyan" : ""
                          }`}>
                            {course.status === "completed" ? (ar ? "مكتمل" : "Done") :
                             course.status === "in-progress" ? (ar ? "جاري" : "Active") : (ar ? "قادم" : "Upcoming")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {semesters.length === 0 && (
            <Card><CardContent className="p-12 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">{ar ? "لا توجد خطة دراسية" : "No study plan"}</p>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "لم يتم تحديد خطة دراسية بعد" : "No study plan has been set yet"}</p>
            </CardContent></Card>
          )}
        </div>

        {/* AI Study Suggestions */}
        <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 cursor-pointer" onClick={() => setShowAi(!showAi)}>
              <Brain className="h-4 w-4 text-iscarb-cyan" /><Sparkles className="h-3 w-3 text-iscarb-gold" />
              {ar ? "اقتراحات iSCARB AI" : "iSCARB AI Suggestions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {ar
                ? `أنت في ${progress}% من الخطة الدراسية. ركز على ${recommendedCourses.length > 0 ? `المقررات الموصى بها (${recommendedCourses.map((r: any) => r.code).join("، ")})` : "المقررات المتبقية"} للتخرج في الوقت المحدد.`
                : `You're at ${progress}% of your study plan. Focus on ${recommendedCourses.length > 0 ? `recommended courses (${recommendedCourses.map((r: any) => r.code).join(", ")})` : "remaining courses"} to graduate on time.`}
            </p>
            {showAi && (
              <div className="pt-2 space-y-2">
                <div className="p-3 rounded-lg bg-white/60 dark:bg-background/40 border border-border/40">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    {ar ? "نصيحة دراسية" : "Study Tip"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {ar
                      ? `خصص ${Math.max(2, Math.ceil((curriculum.totalCredits - curriculum.completedCredits) / 3))} ساعة أسبوعياً للمقررات المتبقية.`
                      : `Allocate ${Math.max(2, Math.ceil((curriculum.totalCredits - curriculum.completedCredits) / 3))} hours weekly for remaining courses.`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
