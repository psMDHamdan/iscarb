"use client";

import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, AlertCircle, BookOpen, CheckCircle2, Circle,
  GraduationCap, Lock, Unlock, ArrowRight, Target, TrendingUp,
} from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";

interface ProgramCourse {
  code: string;
  name: string;
  credits: number;
  status: string;
  prerequisites: string[];
  canEnroll: boolean;
}

interface ProgramData {
  program: {
    name: string;
    totalCredits: number;
    completedCredits: number;
    progressPercentage: number;
  };
  completed: { code: string; name: string; credits: number }[];
  remaining: ProgramCourse[];
  recommendations: string[];
}

export function AcademicProgramView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data, isLoading: loading, error } = useApiQuery<{ data: ProgramData }>(
    ["academic", "program"],
    "/api/v1/student/academic/program"
  );

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "خطة الدراسة" : "Program Plan"} />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-12 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-iscarb-green" />
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (error || !data?.data) {
    return (
      <>
        <PageHeader title={ar ? "خطة الدراسة" : "Program Plan"} />
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">{ar ? "خطأ" : "Error"}</h4>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
                {ar ? "إعادة تحميل" : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const d = data.data;
  const { program, completed, remaining, recommendations } = d;
  const availableToEnroll = remaining.filter((c) => c.canEnroll);
  const locked = remaining.filter((c) => !c.canEnroll);

  return (
    <>
      <PageHeader
        title={ar ? "خطة الدراسة" : "Program Plan"}
        description={
          ar
            ? `${program.name} — ${remaining.length} مقرر متبقٍ`
            : `${program.name} — ${remaining.length} courses remaining`
        }
      />

      <div className="space-y-6 pb-12">
        {/* Progress Overview */}
        <Card className="bg-gradient-to-br from-iscarb-green/5 to-transparent border-iscarb-green/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-iscarb-green/10">
                  <GraduationCap className="h-6 w-6 text-iscarb-green" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{program.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {program.completedCredits}/{program.totalCredits} {ar ? "وحدة مكتملة" : "credits completed"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-iscarb-green">{program.progressPercentage}%</p>
                <p className="text-[10px] text-muted-foreground">{ar ? "التقدم" : "Progress"}</p>
              </div>
            </div>
            <Progress value={program.progressPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-600">{completed.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "مكتملة" : "Completed"}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Unlock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{availableToEnroll.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "متاحة للتسجيل" : "Available"}</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Lock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-600">{locked.length}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "تتطلب متطلبات سابقة" : "Prerequisites Needed"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Available to Enroll */}
        {availableToEnroll.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Unlock className="h-5 w-5 text-blue-600" />
                {ar ? "متاحة للتسجيل" : "Available to Enroll"}
                <Badge variant="outline" className="ml-auto text-[9px] text-blue-600 border-blue-200">
                  {availableToEnroll.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              {availableToEnroll.map((course, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 shrink-0">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{course.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {course.code} · {course.credits} {ar ? "وحدات" : "cr"}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] shrink-0">
                    {ar ? "متاح" : "Available"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Locked (prerequisites) */}
        {locked.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-600" />
                {ar ? "تتطلب متطلبات سابقة" : "Requires Prerequisites"}
                <Badge variant="outline" className="ml-auto text-[9px] text-amber-600 border-amber-200">
                  {locked.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              {locked.map((course, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-amber-200/40 bg-amber-50/20"
                >
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 shrink-0 mt-0.5">
                    <Lock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{course.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {course.code} · {course.credits} {ar ? "وحدات" : "cr"}
                    </p>
                    {course.prerequisites.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[9px] text-amber-700">{ar ? "يتطلب:" : "Requires:"}</span>
                        {course.prerequisites.map((pre, j) => (
                          <Badge key={j} variant="outline" className="text-[9px] border-amber-300 text-amber-700">
                            {pre}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Completed Courses */}
        {completed.length > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                {ar ? "المقررات المكتملة" : "Completed Courses"}
                <Badge variant="outline" className="ml-auto text-[9px] text-emerald-600 border-emerald-200">
                  {completed.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-2">
                {completed.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">{c.code}</span>
                    <span className="text-[9px] text-emerald-600">·{c.credits}cr</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card className="border-iscarb-cyan/20 bg-gradient-to-br from-iscarb-cyan/5 via-blue-50/30 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-iscarb-cyan" />
                {ar ? "توصيات iSCARB AI" : "iSCARB AI Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 text-iscarb-cyan shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
