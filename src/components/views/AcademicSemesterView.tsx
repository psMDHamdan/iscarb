"use client";

import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, Calendar, Clock, BookOpen, GraduationCap, Target, TrendingUp, Star } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

export function AcademicSemesterView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data, isLoading: loading, error } = useApiQuery<{ data: any }>(["academic", "semester"], "/api/v1/student/academic/semester");

  if (loading || error || !data?.data) return loading ? skeleton(ar) : error ? errorState(ar) : null;

  const d = data.data;

  return (
    <>
      <PageHeader title={ar ? "الفصل الدراسي" : "Semester"} description={d.code} />

      <div className="space-y-6 pb-12">
        {/* Semester Status */}
        <Card className={`border ${d.status === "in-progress" ? "border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 to-transparent" : "border-emerald-200/50 bg-emerald-50/30"}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${d.status === "in-progress" ? "bg-iscarb-cyan/10" : "bg-emerald-100"}`}>
                  <GraduationCap className={`h-6 w-6 ${d.status === "in-progress" ? "text-iscarb-cyan" : "text-emerald-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{d.code}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(d.startDate).toLocaleDateString()}</span>
                    <span>→</span>
                    <span>{new Date(d.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <Badge className={d.status === "in-progress" ? "bg-iscarb-cyan/10 text-iscarb-cyan" : "bg-emerald-100 text-emerald-700"}>
                {d.status === "in-progress" ? (ar ? "قيد التنفيذ" : "In Progress") : (ar ? "مكتمل" : "Completed")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4 text-center"><BookOpen className="h-5 w-5 text-blue-500 mx-auto mb-1" /><p className="text-2xl font-bold">{d.enrolledCourses}</p><p className="text-[10px] text-muted-foreground">{ar ? "المساقات" : "Courses"}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Target className="h-5 w-5 text-purple-500 mx-auto mb-1" /><p className="text-2xl font-bold">{d.totalCredits}</p><p className="text-[10px] text-muted-foreground">{ar ? "الوحدات" : "Credits"}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" /><p className="text-2xl font-bold">{d.analytics?.gpa?.toFixed(2) || "—"}</p><p className="text-[10px] text-muted-foreground">{ar ? "المعدل" : "GPA"}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Star className="h-5 w-5 text-amber-500 mx-auto mb-1" /><p className="text-2xl font-bold">{d.analytics?.attendance || 0}%</p><p className="text-[10px] text-muted-foreground">{ar ? "الحضور" : "Attendance"}</p></CardContent></Card>
        </div>

        {/* Timeline / Milestones */}
        {d.milestones?.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50"><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-5 w-5 text-iscarb-gold" />{ar ? "المحطات الهامة" : "Milestones"}</CardTitle></CardHeader>
            <CardContent className="p-5">
              <div className="space-y-0">
                {d.milestones.map((m: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 pb-4 pl-4 border-l-2 border-border/60 last:pb-0 relative">
                    <div className={`absolute left-[-5px] top-1 w-2 h-2 rounded-full ${m.type === "exam" ? "bg-red-500" : m.type === "end" ? "bg-emerald-500" : "bg-iscarb-cyan"}`} />
                    <div className="flex-1 pl-3">
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString(ar ? "ar-SA" : "en-US", { month: "long", day: "numeric" })}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">{m.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Load */}
        {d.courseLoad?.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-5 w-5 text-iscarb-cyan" />{ar ? "العبء الدراسي" : "Course Load"}</CardTitle></CardHeader>
            <CardContent className="p-5 space-y-3">
              {d.courseLoad.map((cl: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40">
                  <div className="flex-1"><p className="text-sm font-medium">{cl.course}</p><p className="text-[10px] text-muted-foreground">{cl.credits} {ar ? "وحدات" : "credits"}</p></div>
                  <Badge variant="secondary" className="text-[9px]">{cl.workload}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function skeleton(ar: boolean) {
  return <><PageHeader title={ar ? "الفصل الدراسي" : "Semester"} /><div className="grid gap-4 sm:grid-cols-4">{ [1,2,3,4].map(i => <Card key={i}><CardContent className="p-8"><Loader2 className="h-5 w-5 animate-spin text-iscarb-green mx-auto" /></CardContent></Card>) }</div></>;
}
function errorState(ar: boolean) {
  return <><PageHeader title={ar ? "الفصل الدراسي" : "Semester"} />
    <Card className="border-red-200 bg-red-50/50"><CardContent className="p-5 flex items-start gap-3"><AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
      <div><h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4><Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button></div></CardContent></Card></>;
}
