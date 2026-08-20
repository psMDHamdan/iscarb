"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, BookOpen, Clock, Users, Calendar, GraduationCap, Brain, Sparkles, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export function AcademicCoursesView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [askAi, setAskAi] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [tab, setTab] = useState<"current" | "completed">("current");

  const { data, isLoading: loading, error } = useApiQuery<{
    data: { courses: any[]; total: number; current: number; completed: number }
  }>(["academic", "courses"], "/api/v1/student/academic/courses");

  if (loading) return (
    <><PageHeader title={ar ? "المقررات الدراسية" : "Courses"} />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex justify-between">
                <div className="space-y-2 flex-1"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-48" /></div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div></>
  );
  if (error || !data?.data) return errorState(ar);

  const { courses, current, completed } = data.data;

  return (
    <>
      <PageHeader title={ar ? "المقررات الدراسية" : "Courses"} description={ar ? `${current} مقرر حالي، ${completed} مكتمل` : `${current} current, ${completed} completed`} />

      <div className="space-y-6 pb-12">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-3">
          <Card className="border-blue-200/50 bg-blue-50/30"><CardContent className="p-4 text-center">
            <BookOpen className="h-5 w-5 text-blue-600 mx-auto mb-1" /><p className="text-2xl font-bold text-blue-600">{current}</p>
            <p className="text-[10px] text-muted-foreground">{ar ? "حالية" : "Current"}</p></CardContent></Card>
          <Card className="border-emerald-200/50 bg-emerald-50/30"><CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" /><p className="text-2xl font-bold text-emerald-600">{completed}</p>
            <p className="text-[10px] text-muted-foreground">{ar ? "مكتملة" : "Completed"}</p></CardContent></Card>
          <Card className="border-purple-200/50 bg-purple-50/30"><CardContent className="p-4 text-center">
            <GraduationCap className="h-5 w-5 text-purple-600 mx-auto mb-1" /><p className="text-2xl font-bold text-purple-600">{courses.length}</p>
            <p className="text-[10px] text-muted-foreground">{ar ? "الإجمالي" : "Total"}</p></CardContent></Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button size="sm" variant={tab === "current" ? "default" : "outline"} onClick={() => setTab("current")}
            className={tab === "current" ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90" : ""}>{ar ? "الحالية" : "Current"}</Button>
          <Button size="sm" variant={tab === "completed" ? "default" : "outline"} onClick={() => setTab("completed")}
            className={tab === "completed" ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90" : ""}>{ar ? "المكتملة" : "Completed"}</Button>
        </div>

        {/* Course Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {courses.filter((c: any) => tab === "current" ? c.status === "in-progress" : c.status === "completed").length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={BookOpen}
                title={tab === "current" ? (ar ? "لا توجد مقررات حالية" : "No current courses") : (ar ? "لا توجد مقررات مكتملة" : "No completed courses")}
                description={tab === "current" ? (ar ? "لم تسجل في أي مقرر بعد" : "You haven't enrolled in any courses yet") : (ar ? "ستظهر هنا المقررات التي أكملتها" : "Completed courses will appear here")}
              />
            </div>
          ) : (
            courses.filter((c: any) => tab === "current" ? c.status === "in-progress" : c.status === "completed").map((course: any, idx: number) => (
            <Card key={idx} className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer" onClick={() => setSelectedCourse(selectedCourse?.id === course.id ? null : course)}>
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground">{course.code}</p>
                    <CardTitle className="text-base mt-0.5 truncate">{ar && course.nameAr ? course.nameAr : course.name}</CardTitle>
                  </div>
                  <Badge className={course.status === "in-progress" ? "bg-iscarb-cyan/10 text-iscarb-cyan" : "bg-emerald-100 text-emerald-700"}>
                    {course.status === "in-progress" ? (ar ? "قيد" : "Active") : (ar ? "مكتمل" : "Done")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.instructor}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.credits} {ar ? "وحدات" : "cr"}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{course.semester}</span>
                </div>
                {course.status === "in-progress" && course.progress > 0 && (
                  <div><div className="flex justify-between text-xs mb-1"><span>{ar ? "التقدم" : "Progress"}</span><span className="font-medium">{course.progress}%</span></div>
                    <Progress value={course.progress} className="h-1.5" /></div>
                )}
                {/* Expanded details */}
                {selectedCourse?.id === course.id && (
                  <div className="pt-3 border-t border-border/40 space-y-3">
                    {course.syllabus?.length > 0 && (
                      <div><p className="text-xs font-semibold text-muted-foreground mb-1">{ar ? "المنهج" : "Syllabus"}</p>
                        <div className="flex flex-wrap gap-1">{course.syllabus.slice(0, 5).map((s: string, j: number) => (
                          <Badge key={j} variant="outline" className="text-[9px]">{s}</Badge>))}</div></div>
                    )}
                    {course.assignments?.length > 0 && (
                      <div><p className="text-xs font-semibold text-muted-foreground mb-1">{ar ? "الواجبات" : "Assignments"}</p>
                        {course.assignments.slice(0, 3).map((a: any, j: number) => (
                          <div key={j} className="flex items-center justify-between text-xs py-1"><span>{a.title}</span>
                            <Badge variant="outline" className="text-[9px]">{a.status}</Badge></div>))}</div>
                    )}
                    <Button size="sm" variant="outline" className="w-full gap-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        const question = prompt(ar ? "اسأل عن هذا المقرر:" : "Ask about this course:");
                        if (!question) return;
                        setAskAi(question);
                        setAiResult(ar ? "جاري تحليل استفسارك..." : "Analyzing your question...");
                        fetch("/api/v1/student/academic/ai-coach", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ courseId: course.id, question }),
                        }).then(r => r.json()).then(res => {
                          setAiResult(res?.data?.response || res?.response || (ar ? "المساعد غير متاح حالياً" : "AI assistant unavailable"));
                        }).catch(() => {
                          setAiResult(ar ? "تعذر الاتصال بالمساعد الذكي" : "Could not reach AI assistant");
                        });
                      }}>
                      <Brain className="h-3 w-3" />{ar ? "اسأل المساعد الذكي" : "Ask AI Assistant"}
                    </Button>
                    {aiResult && askAi && selectedCourse?.id === course.id && (
                      <div className="p-3 rounded-lg bg-iscarb-cyan/5 border border-iscarb-cyan/20">
                        <p className="text-[10px] font-semibold text-iscarb-cyan flex items-center gap-1 mb-1">
                          <Sparkles className="h-3 w-3" />{ar ? "رد المساعد" : "AI Response"}
                        </p>
                        <p className="text-xs text-muted-foreground">{aiResult}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )))}
        </div>
      </div>
    </>
  );
}

function errorState(ar: boolean) {
  return <><PageHeader title={ar ? "المقررات الدراسية" : "Courses"} />
    <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3"><AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
      <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div>
    </CardContent></Card></>;
}
