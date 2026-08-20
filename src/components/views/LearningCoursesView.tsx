"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  BookOpen, GraduationCap, Clock, Star, Search, Loader2, AlertCircle,
  ArrowRight, CheckCircle2, PlayCircle, Bot, Sparkles, BarChart3,
} from "lucide-react";

interface CourseData {
  id: string;
  code: string;
  name: string;
  nqfLevel: number;
  programType: string;
  status: string;
  progress: number;
  credits: number;
  instructor?: string;
  schedule?: string;
}

export function LearningCoursesView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "learning", "courses"],
    "/api/v1/student/learning/courses",
  );
  const courses = rawRes?.data || rawRes?.courses || [];
  const error = queryError?.message ?? null;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = courses.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "active" && c.status !== "active") return false;
    if (filter === "completed" && c.status !== "completed") return false;
    return true;
  });

  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === "active" || c.status === "enrolled").length,
    completed: courses.filter(c => c.status === "completed" || c.status === "passed").length,
    avgProgress: courses.length > 0 ? Math.round(courses.reduce((s, c) => s + (c.progress || 0), 0) / courses.length) : 0,
  };

  const LoadingSkeleton = () => (
    <StudentPageTemplate title={ar ? "المساقات" : "Courses"} breadcrumbs={[{ label: ar ? "التعلم" : "Learning", href: "/student/learning" }, { label: ar ? "المساقات" : "Courses" }]}>
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      </div>
    </StudentPageTemplate>
  );

  const ErrorState = () => (
    <StudentPageTemplate title={ar ? "المساقات" : "Courses"} breadcrumbs={[{ label: ar ? "التعلم" : "Learning", href: "/student/learning" }, { label: ar ? "المساقات" : "Courses" }]}>
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">{ar ? "خطأ في تحميل المساقات" : "Error Loading Courses"}</h4>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة تحميل" : "Retry"}</Button>
          </div>
        </CardContent>
      </Card>
    </StudentPageTemplate>
  );

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState />;

  return (
    <StudentPageTemplate title={ar ? "المساقات" : "Courses"} breadcrumbs={[{ label: ar ? "التعلم" : "Learning", href: "/student/learning" }, { label: ar ? "المساقات" : "Courses" }]}>
      <div className="space-y-6 pb-12">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-4">
          {[
            { icon: BookOpen, label: ar ? "الإجمالي" : "Total", value: stats.total, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
            { icon: PlayCircle, label: ar ? "النشطة" : "Active", value: stats.active, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
            { icon: CheckCircle2, label: ar ? "المكتملة" : "Completed", value: stats.completed, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20" },
            { icon: BarChart3, label: ar ? "متوسط التقدم" : "Avg Progress", value: `${stats.avgProgress}%`, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
          ].map((s, i) => (
            <Card key={i} className="hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={ar ? "بحث عن مساق..." : "Search courses..."} className="pl-9 h-9 text-sm" />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: ar ? "الكل" : "All" },
              { key: "active", label: ar ? "النشطة" : "Active" },
              { key: "completed", label: ar ? "المكتملة" : "Completed" },
            ].map(f => (
              <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} onClick={() => setFilter(f.key)}
                className={`text-xs ${filter === f.key ? "bg-iscarb-cyan hover:bg-iscarb-cyan/90" : ""}`}>{f.label}</Button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => (
              <motion.div key={c.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-[10px] font-mono">{c.code}</Badge>
                      <Badge variant={c.status === "active" || c.status === "enrolled" ? "default" : "secondary"} className="text-[10px]">
                        {c.status === "active" || c.status === "enrolled" ? (ar ? "نشط" : "Active") : c.status === "completed" || c.status === "passed" ? (ar ? "مكتمل" : "Completed") : c.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm mt-2 line-clamp-2">{c.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />NQF {c.nqfLevel}</span>
                      <span className="flex items-center gap-1">{ar ? "ساعات" : "Credits"}: {c.credits || '-'}</span>
                    </div>
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{ar ? "التقدم" : "Progress"}</span>
                        <span>{c.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-iscarb-cyan h-2 rounded-full transition-all" style={{ width: `${c.progress || 0}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" className="flex-1 h-8 text-xs bg-iscarb-cyan hover:bg-iscarb-cyan/90">
                        {(c.status === "active" || c.status === "enrolled") ? (ar ? "متابعة" : "Continue") : (ar ? "عرض" : "View")}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Bot className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 flex flex-col items-center text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {search ? (ar ? "لا توجد نتائج للبحث" : "No courses match your search") : (ar ? "لم تسجل في أي مساق بعد" : "No courses enrolled yet")}
              </p>
              <Button size="sm" variant="outline" className="mt-3">{ar ? "تصفح المساقات" : "Browse Courses"}</Button>
            </CardContent>
          </Card>
        )}

        {/* AI Assistant */}
        <Card className="bg-gradient-to-br from-purple-50/30 to-transparent border-purple-200/50">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{ar ? "مساعد المساقات الذكي" : "AI Course Assistant"}</h4>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "اسأل عن أي مساق، احصل على ملخص أو خطة مراجعة." : "Ask about any course, get a summary or revision plan."}</p>
              <Button size="sm" variant="link" className="h-7 text-xs px-0 mt-1 text-purple-600">{ar ? "اسأل الآن" : "Ask Now"} <ArrowRight className="h-3 w-3 ml-1" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentPageTemplate>
  );
}
