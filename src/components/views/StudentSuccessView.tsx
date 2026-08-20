"use client";

import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  FileText,
  Target,
  GraduationCap,
  ArrowRight,
  ShieldAlert,
  BookOpen,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

const dashboardStats = [
  {
    labelEn: "Total Students",
    labelAr: "إجمالي الطلاب",
    value: 342,
    change: "+12",
    icon: Users,
    color: "bg-iscarb-cyan/10 text-iscarb-cyan",
  },
  {
    labelEn: "At Risk",
    labelAr: "في خطر",
    value: 28,
    change: "-3",
    icon: AlertTriangle,
    color: "bg-red-500/10 text-red-500",
  },
  {
    labelEn: "Avg GPA",
    labelAr: "متوسط المعدل",
    value: 3.15,
    change: "+0.08",
    icon: TrendingUp,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    labelEn: "Avg Attendance",
    labelAr: "متوسط الحضور",
    value: "89%",
    change: "+2%",
    icon: Clock,
    color: "bg-amber-500/10 text-amber-500",
  },
];

const quickLinks = [
  {
    labelEn: "Student Profiles",
    labelAr: "ملفات الطلاب",
    href: "/faculty/students/profiles",
    icon: Users,
    description: "View all student profiles",
    descriptionAr: "عرض ملفات جميع الطلاب",
  },
  {
    labelEn: "At-Risk Students",
    labelAr: "الطلاب المعرضون للخطر",
    href: "/faculty/students/at-risk",
    icon: ShieldAlert,
    description: "Students requiring attention",
    descriptionAr: "الطلاب الذين يحتاجون اهتمام",
    badge: 28,
  },
  {
    labelEn: "Recommendations",
    labelAr: "التوصيات",
    href: "/faculty/students/recommendations",
    icon: Lightbulb,
    description: "AI-powered recommendations",
    descriptionAr: "توصيات مدعومة بالذكاء الاصطناعي",
  },
  {
    labelEn: "Student Timeline",
    labelAr: "الجدول الزمني للطلاب",
    href: "/faculty/students/timeline",
    icon: Clock,
    description: "Track student activities",
    descriptionAr: "تتبع أنشطة الطلاب",
  },
  {
    labelEn: "Portfolio",
    labelAr: "المحفظة",
    href: "/faculty/students/portfolio",
    icon: BookOpen,
    description: "Student work portfolios",
    descriptionAr: "محفظات أعمال الطلاب",
  },
  {
    labelEn: "Reports",
    labelAr: "التقارير",
    href: "/faculty/students/reports",
    icon: FileText,
    description: "Individual student reports",
    descriptionAr: "تقارير فردية للطلاب",
  },
];

const recentAlerts = [
  {
    student: "Ahmed Al-Saeed",
    studentAr: "أحمد السعيد",
    alert: "Attendance dropped below 70%",
    alertAr: "انخفض الحضور عن 70%",
    severity: "high",
    time: "2 hours ago",
    timeAr: "منذ ساعتين",
  },
  {
    student: "Fatima Hassan",
    studentAr: "فاطمة حسن",
    alert: "Missed 2 consecutive assessments",
    alertAr: "غابت عن تقييمين متتاليين",
    severity: "critical",
    time: "1 day ago",
    timeAr: "منذ يوم",
  },
  {
    student: "Mohammed Al-Qahtani",
    studentAr: "محمد القحطاني",
    alert: "GPA dropped by 0.5 points",
    alertAr: "انخفض المعدل بنقطة 0.5",
    severity: "medium",
    time: "3 days ago",
    timeAr: "منذ 3 أيام",
  },
];

const topRecommendations = [
  {
    title: "Schedule tutoring session for Ahmed",
    titleAr: "جدولة جلسة دراسة لأحمد",
    type: "tutoring",
    priority: "high",
  },
  {
    title: "Send progress report to Fatima's advisor",
    titleAr: "إرسال تقرير التقدم لمرشد فاطمة",
    type: "meeting",
    priority: "high",
  },
  {
    title: "Provide additional practice materials",
    titleAr: "توفير مواد تدريبية إضافية",
    type: "resource",
    priority: "medium",
  },
];

export function StudentSuccessView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const severityColor = (s: string) => {
    switch (s) {
      case "critical":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    }
  };

  return (
    <>
      <PageHeader
        title={ar ? "نجاح الطلاب" : "Student Success"}
        description={ar ? "متابعة أداء الطلاب وتحديد المعرضين للخطر وتوجيههم" : "Track student performance, identify at-risk students, and guide interventions."}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Home", href: "/faculty/dashboard" },
          { label: ar ? "الطلاب" : "Students", href: "/faculty/students" },
        ]}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6 pb-12"
      >
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
            <motion.div key={stat.labelEn} variants={item}>
              <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {ar ? stat.labelAr : stat.labelEn}
                      </p>
                      <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`flex size-10 items-center justify-center rounded-lg ${stat.color}`}>
                      <stat.icon className="size-5" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{stat.change}</span> {ar ? "هذا الشهر" : "this month"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <Target className="size-5 text-iscarb-cyan" />
                <CardTitle className="text-lg">{ar ? "التنقل السريع" : "Quick Navigation"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-3 rounded-lg border border-border/50 p-4 transition-colors hover:border-iscarb-cyan/50 hover:bg-iscarb-cyan/5"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors group-hover:bg-iscarb-cyan/10 group-hover:text-iscarb-cyan">
                      <link.icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{ar ? link.labelAr : link.labelEn}</span>
                        {link.badge && (
                          <Badge variant="destructive" className="text-xs">{link.badge}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {ar ? link.descriptionAr : link.description}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts & Recommendations */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div variants={item}>
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-red-500" />
                    <CardTitle className="text-lg">{ar ? "التنبيهات الأخيرة" : "Recent Alerts"}</CardTitle>
                  </div>
                  <Link href="/faculty/students/at-risk">
                    <Button variant="ghost" size="sm">
                      {ar ? "عرض الكل" : "View All"} <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {recentAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${severityColor(alert.severity)}`}
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{alert.student}</p>
                      <p className="text-xs opacity-80">{ar ? alert.alertAr : alert.alert}</p>
                      <p className="mt-1 text-xs opacity-60">{ar ? alert.timeAr : alert.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="size-5 text-amber-500" />
                    <CardTitle className="text-lg">{ar ? "التوصيات" : "Recommendations"}</CardTitle>
                  </div>
                  <Link href="/faculty/students/recommendations">
                    <Button variant="ghost" size="sm">
                      {ar ? "عرض الكل" : "View All"} <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {topRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border/50 p-3"
                  >
                    <div className={`mt-0.5 size-2 rounded-full shrink-0 ${
                      rec.priority === "high" ? "bg-red-500" : "bg-amber-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{ar ? rec.titleAr : rec.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{rec.type}</Badge>
                        <Badge variant={rec.priority === "high" ? "destructive" : "outline"} className="text-xs">
                          {rec.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Performance Overview */}
        <motion.div variants={item}>
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-iscarb-cyan" />
                <CardTitle className="text-lg">{ar ? "نظرة عامة على الأداء" : "Performance Overview"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-iscarb-cyan">72%</div>
                  <p className="mt-1 text-sm text-muted-foreground">{ar ? "معدل التحسن" : "Improvement Rate"}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[72%] rounded-full bg-iscarb-cyan" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-500">85%</div>
                  <p className="mt-1 text-sm text-muted-foreground">{ar ? "معدل إكمال التوصيات" : "Recommendation Completion"}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[85%] rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500">91%</div>
                  <p className="mt-1 text-sm text-muted-foreground">{ar ? "رضا الطلاب" : "Student Satisfaction"}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[91%] rounded-full bg-amber-500" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
}
