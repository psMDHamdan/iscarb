"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { useApiQuery } from "@/lib/use-api-query";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Presentation,
  Calendar,
  ClipboardCheck,
  AlertTriangle,
  Microscope,
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  BookOpen,
  Target,
  TrendingUp,
  FileText,
  Loader2,
  CalendarDays,
  Lightbulb,
  MessageSquare,
} from "lucide-react";

interface DashboardData {
  classesToday: { id: string; name: string; time: string; room: string; students: number }[];
  meetingsToday: { id: string; student: string; time: string; type: string }[];
  pendingAssessments: { id: string; title: string; submissions: number; dueDate: string }[];
  studentAlerts: { id: string; student: string; type: string; severity: string; title: string }[];
  researchUpdates: { id: string; title: string; status: string; lastActivity: string }[];
  stats: {
    totalStudents: number;
    activeCourses: number;
    pendingGrades: number;
    openAlerts: number;
  };
}

interface BriefingData {
  greeting: string;
  greetingAr: string;
  summary: string;
  summaryAr: string;
  topPriority: string;
  topPriorityAr: string;
  focusArea: string;
  focusAreaAr: string;
  tip: string;
  tipAr: string;
  classesToday: number;
  meetingsToday: number;
  pendingGrades: number;
  studentAlerts: number;
}

export function FacultyHomeView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: homeData, isLoading: homeLoading, error: homeError } = useApiQuery<{ classesToday?: any[]; meetingsToday?: any[]; pendingAssessments?: any[]; studentAlerts?: any[]; researchUpdates?: any[]; stats?: { totalStudents?: number; activeCourses?: number; pendingGrades?: number; openAlerts?: number } }>(["faculty", "home"], "/api/v1/faculty/home");
  const { data: briefing, isLoading: briefingLoading } = useApiQuery<BriefingData>(["faculty", "briefing"], "/api/v1/faculty/briefing");

  const loading = homeLoading || briefingLoading;
  const error = homeError;

  const quickActions = [
    { icon: Presentation, label: ar ? "إدارة الفصول" : "Manage Classes", href: "/faculty/teaching", color: "text-[#0E6C3C]" },
    { icon: ClipboardCheck, label: ar ? "إنشاء تقييم" : "Create Assessment", href: "/faculty/assessments/create", color: "text-blue-500" },
    { icon: Sparkles, label: ar ? "مساعد ذكي" : "AI Assistant", href: "/faculty/ai-assistant", color: "text-purple-500" },
    { icon: Users, label: ar ? "متابعة الطلاب" : "Track Students", href: "/faculty/students", color: "text-amber-500" },
    { icon: Target, label: ar ? "الإرشاد" : "Mentorship", href: "/faculty/mentorship", color: "text-rose-500" },
    { icon: Microscope, label: ar ? "البحث" : "Research", href: "/faculty/research", color: "text-teal-500" },
    { icon: BookOpen, label: ar ? "قاعدة المعرفة" : "Knowledge Base", href: "/faculty/knowledge", color: "text-indigo-500" },
    { icon: TrendingUp, label: ar ? "التحليلات" : "Analytics", href: "/faculty/analytics", color: "text-orange-500" },
  ];

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/10 text-red-600 border-red-500/20",
    high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "نظام الأستاذ" : "Faculty OS"} description={ar ? "لوحة التحكم الرئيسية" : "Your command center"} />
        <div className="flex items-center justify-center py-20" role="progressbar" aria-label={ar ? "جاري التحميل" : "Loading"}>
          <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={ar ? "نظام الأستاذ" : "Faculty OS"} description={ar ? "لوحة التحكم الرئيسية" : "Your command center"} />
        <Card>
          <CardContent className="py-12 text-center" role="alert">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
              {ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const data: DashboardData = {
    classesToday: homeData?.classesToday || [],
    meetingsToday: homeData?.meetingsToday || [],
    pendingAssessments: homeData?.pendingAssessments || [],
    studentAlerts: homeData?.studentAlerts || [],
    researchUpdates: homeData?.researchUpdates || [],
    stats: homeData?.stats || { totalStudents: 0, activeCourses: 0, pendingGrades: 0, openAlerts: 0 },
  };

  return (
    <>
      <PageHeader title={ar ? "نظام الأستاذ" : "Faculty OS"} description={ar ? "لوحة التحكم الرئيسية" : "Your command center"} />
      <div className="space-y-6 pb-12">
        {/* AI Daily Briefing */}
        {briefing && (
          <Card className="border-border/40 glass-panel shadow-brand animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
            
            <CardContent className="p-6 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl">
                    <Sparkles className="h-6 w-6 text-[#0E6C3C] dark:text-[#35A96A]" />
                  </div>
                  <h3 className="font-display text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                    {ar ? briefing.greetingAr : briefing.greeting}, {ar ? "الأستاذ" : "Professor"}
                  </h3>
                </div>
                <p className="text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-3xl">
                  {ar ? briefing.summaryAr : briefing.summary}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Badge className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200/50 px-3 py-1.5 font-bold uppercase tracking-widest text-[10px]">
                    <Target className="h-3.5 w-3.5 mr-1.5" />
                    {ar ? briefing.topPriorityAr : briefing.topPriority}
                  </Badge>
                  <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-[#0E6C3C] dark:text-[#35A96A] border-emerald-200/50 px-3 py-1.5 font-bold uppercase tracking-widest text-[10px]">
                    <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                    {ar ? briefing.tipAr : briefing.tip}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <h3 className="font-display text-sm font-black text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest">{ar ? "إجراءات سريعة" : "Quick Actions"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className="glass-card hover-lift cursor-pointer group border-white/60 dark:border-slate-700/50">
                    <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                      <div className={`p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ${action.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {action.label}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Classes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-5 w-5 text-[#0E6C3C]" />
                  {ar ? "فصول اليوم" : "Today's Classes"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.classesToday.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد فصول اليوم" : "No classes today"}</p>
                ) : (
                  <div className="space-y-3">
                    {data.classesToday.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#0E6C3C]/10">
                            <Presentation className="h-4 w-4 text-[#0E6C3C]" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">{cls.room} &middot; {cls.students} {ar ? "طالب" : "students"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{cls.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Assessments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-5 w-5 text-blue-500" />
                  {ar ? "تقييمات في انتظار التصحيح" : "Pending Assessments"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.pendingAssessments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد تقييمات معلقة" : "No pending assessments"}</p>
                ) : (
                  <div className="space-y-3">
                    {data.pendingAssessments.map((assessment) => (
                      <Link key={assessment.id} href={`/faculty/assessments/${assessment.id}/submissions`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                          <div>
                            <p className="font-medium text-sm">{assessment.title}</p>
                            <p className="text-xs text-muted-foreground">{assessment.submissions} {ar ? "تقديم في انتظار" : "submissions pending"}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {assessment.dueDate}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Research Updates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Microscope className="h-5 w-5 text-teal-500" />
                  {ar ? "تحديثات البحث" : "Research Updates"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.researchUpdates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد تحديثات بحثية" : "No research updates"}</p>
                ) : (
                  <div className="space-y-3">
                    {data.researchUpdates.map((research) => (
                      <div key={research.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                        <div>
                          <p className="font-medium text-sm">{research.title}</p>
                          <p className="text-xs text-muted-foreground">{ar ? "آخر نشاط:" : "Last activity:"} {research.lastActivity}</p>
                        </div>
                        <Badge className="bg-teal-500/10 text-teal-600 border-teal-500/20">{research.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Meetings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  {ar ? "اجتماعات اليوم" : "Today's Meetings"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.meetingsToday.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد اجتماعات" : "No meetings today"}</p>
                ) : (
                  <div className="space-y-3">
                    {data.meetingsToday.map((meeting) => (
                      <div key={meeting.id} className="p-3 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{meeting.student}</p>
                          <span className="text-xs font-mono text-muted-foreground">{meeting.time}</span>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{meeting.type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/faculty/mentorship/meetings" className="mt-3 flex items-center justify-center gap-1 text-sm text-[#0E6C3C] hover:underline">
                  {ar ? "عرض الكل" : "View All"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>

            {/* Student Alerts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  {ar ? "تنبيهات الطلاب" : "Student Alerts"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.studentAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{ar ? "لا توجد تنبيهات" : "No alerts"}</p>
                ) : (
                  <div className="space-y-3">
                    {data.studentAlerts.map((alert) => (
                      <div key={alert.id} className="p-3 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{alert.student}</p>
                          <Badge className={`text-xs border ${severityColors[alert.severity] || severityColors.medium}`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.title}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/faculty/students/at-risk" className="mt-3 flex items-center justify-center gap-1 text-sm text-amber-600 hover:underline">
                  {ar ? "عرض الكل" : "View All"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-[#0E6C3C]/20 bg-gradient-to-br from-[#0E6C3C]/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-[#0E6C3C]" />
                  {ar ? "رؤى ذكية" : "AI Insights"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xs font-medium text-[#0E6C3C] mb-1">{ar ? "توصية التدريس" : "Teaching Recommendation"}</p>
                  <p className="text-xs text-muted-foreground">{ar ? briefing?.focusAreaAr || "تابع تقدم طلابك وركز على Areas تحتاج تحسين." : briefing?.focusArea || "Track student progress and focus on areas needing improvement."}</p>
                </div>
                <Link href="/faculty/insights" className="flex items-center justify-center gap-1 text-sm text-[#0E6C3C] hover:underline">
                  {ar ? "عرض كل الرؤى" : "View All Insights"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
