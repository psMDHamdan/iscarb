"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/lib/use-api-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Clock,
  Calendar,
  Users,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Timer,
  BookOpen,
  Coffee,
} from "lucide-react";

interface WorkloadData {
  coursesCount: number;
  adviseesCount: number;
  committeeHours: number;
  researchHours: number;
  totalLoadHours: number;
  maxLoadHours: number;
  status: string;
}

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  courseId: string;
}

export function FacultyAdminView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: workload, isLoading: wLoading } = useApiQuery<WorkloadData>(["faculty", "admin", "workload"], "/api/v1/faculty/admin/workload");
  const { data: timetableData, isLoading: tLoading, error: tError } = useApiQuery<TimetableEntry[] | { entries?: TimetableEntry[]; timetable?: TimetableEntry[] }>(["faculty", "admin", "timetable"], "/api/v1/faculty/admin/timetable");

  const loading = wLoading || tLoading;
  const error = tError;

  const today = new Date().getDay();
  const timetableEntries = timetableData
    ? Array.isArray(timetableData) ? timetableData : timetableData.entries || timetableData.timetable || []
    : [];
  const todayClasses = timetableEntries.filter((e) => e.dayOfWeek === today);

  const adminModules = [
    { icon: Briefcase, label: ar ? "عبء العمل" : "Workload", href: "/faculty/admin/workload", color: "text-blue-500", stat: workload ? `${workload.totalLoadHours}/${workload.maxLoadHours}h` : "-" },
    { icon: Coffee, label: ar ? "الساعات المكتبية" : "Office Hours", href: "/faculty/admin/office-hours", color: "text-[#0E6C3C]", stat: ar ? "متاح" : "Available" },
    { icon: Calendar, label: ar ? "الجدول الزمني" : "Timetable", href: "/faculty/admin/timetable", color: "text-purple-500", stat: `${todayClasses.length} ${ar ? "اليوم" : "today"}` },
    { icon: Users, label: ar ? "اللجان" : "Committees", href: "/faculty/admin/committees", color: "text-rose-500", stat: "" },
    { icon: Clock, label: ar ? "الإجازات" : "Leave", href: "/faculty/admin/leave", color: "text-amber-500", stat: "" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "الإدارة" : "Faculty Administration"} description={ar ? "إدارة عملك الأكاديمي" : "Manage your academic workload"} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "الإدارة" : "Faculty Administration"} description={ar ? "إدارة عملك الأكاديمي" : "Manage your academic workload"} />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>{ar ? "إعادة المحاولة" : "Retry"}</Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const w = workload || { coursesCount: 0, adviseesCount: 0, committeeHours: 0, researchHours: 0, totalLoadHours: 0, maxLoadHours: 40, status: "normal" };
  const loadPercent = w.maxLoadHours > 0 ? Math.round((w.totalLoadHours / w.maxLoadHours) * 100) : 0;

  return (
    <>
      <PageHeader
        title={ar ? "الإدارة" : "Faculty Administration"}
        description={ar ? "إدارة عملك الأكاديمي" : "Manage your academic workload"}
      />
      <div className="space-y-6 pb-12">
        {/* Workload Overview */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-5 w-5 text-blue-500" />
              {ar ? "نظرة عامة علىعبء العمل" : "Workload Overview"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{ar ? "عبء العمل الحالي" : "Current Load"}</span>
              <span className="text-sm font-bold">{w.totalLoadHours}/{w.maxLoadHours}h</span>
            </div>
            <Progress value={loadPercent} className="h-3" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{ar ? "المقررات" : "Courses"}</p>
                <p className="font-bold text-lg">{w.coursesCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{ar ? "المرشدون" : "Advisees"}</p>
                <p className="font-bold text-lg">{w.adviseesCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{ar ? "ساعات اللجان" : "Committee Hours"}</p>
                <p className="font-bold text-lg">{w.committeeHours}h</p>
              </div>
              <div>
                <p className="text-muted-foreground">{ar ? "ساعات البحث" : "Research Hours"}</p>
                <p className="font-bold text-lg">{w.researchHours}h</p>
              </div>
            </div>
            <Badge className={w.status === "overloaded" ? "bg-red-500/10 text-red-600" : w.status === "high" ? "bg-amber-500/10 text-amber-600" : "bg-[#0E6C3C]/10 text-[#0E6C3C]"}>
              {w.status === "overloaded" ? (ar ? "عبء زائد" : "Overloaded") : w.status === "high" ? (ar ? "عبء مرتفع" : "High Load") : (ar ? "عادي" : "Normal")}
            </Badge>
          </CardContent>
        </Card>

        {/* Today's Classes */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-purple-500" />
              {ar ? "فصول اليوم" : "Today's Classes"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد فصول اليوم" : "No classes today"}</p>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{cls.courseId}</p>
                      <p className="text-xs text-muted-foreground">{cls.room}</p>
                    </div>
                    <span className="text-sm font-mono">{cls.startTime} - {cls.endTime}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminModules.map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <Card className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted/50`}>
                    <mod.icon className={`h-5 w-5 ${mod.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{mod.label}</p>
                    {mod.stat && <p className="text-xs text-muted-foreground">{mod.stat}</p>}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
