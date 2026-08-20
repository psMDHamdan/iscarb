"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import {
  Briefcase,
  Award,
  TrendingUp,
  Target,
  Brain,
  Star,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Lightbulb,
  Users,
  MessageSquare,
  FileText,
  GraduationCap,
  Rocket,
  Zap,
  BookOpen,
  Medal,
  Globe,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface EmployabilityData {
  employabilityScore: number;
  industryReadiness: number;
  careerMatch: number;
  interviewReadiness: number;
  communicationScore: number;
  problemSolving: number;
  leadership: number;
  teamwork: number;
  portfolioStrength: number;
  resumeReadiness: number;
  placementProbability: number;
  skillGaps: { skill: string; current: number; required: number; priority: string }[];
  competencyMapping: { competency: string; mastery: number; relevance: string }[];
  improvementPlan: string[];
  certifications: string[];
  recommendedProjects: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ScoreGauge({ value, label, color, ar }: { value: number; label: string; color: string; ar: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
      <div className="relative mb-2 flex h-20 w-20 items-center justify-center">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="32"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${(value / 100) * 201} 201`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute text-lg font-bold">{value}%</span>
      </div>
      <p className="text-xs font-medium text-center">{label}</p>
    </div>
  );
}

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AssessmentEmployabilityView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "assessment", "report"],
    "/api/iscarb/assessment/report",
  );
  // the API returns { success: true, report: LiveEmployabilityReport, attempt: ... }
  // we need to map LiveEmployabilityReport to EmployabilityData
  const data = rawRes?.report ? {
    employabilityScore: rawRes.report.profile.composite,
    industryReadiness: rawRes.report.profile.composite, // approximation
    careerMatch: rawRes.report.profile.composite, // approximation
    interviewReadiness: rawRes.report.profile.composite, // approximation
    communicationScore: rawRes.report.profile.dimensions.find((d: any) => d.dimension === 'core_professionalism')?.score ?? 0,
    problemSolving: rawRes.report.profile.dimensions.find((d: any) => d.dimension === 'business_digital')?.score ?? 0,
    leadership: rawRes.report.profile.dimensions.find((d: any) => d.dimension === 'growth_potential')?.score ?? 0,
    teamwork: rawRes.report.profile.dimensions.find((d: any) => d.dimension === 'job_fit')?.score ?? 0,
    portfolioStrength: rawRes.report.profile.composite,
    resumeReadiness: rawRes.report.profile.composite,
    placementProbability: rawRes.report.profile.composite,
    skillGaps: [],
    competencyMapping: [],
    improvementPlan: [],
    certifications: [],
    recommendedProjects: []
  } : null;
  const error = queryError?.message ?? null;

  if (loading) {
    return (
      <StudentPageTemplate title={ar ? "قابلية التوظيف" : "Employability"}>
        <LoadingSkeleton ar={ar} />
      </StudentPageTemplate>
    );
  }

  if (error) {
    return (
      <StudentPageTemplate title={ar ? "قابلية التوظيف" : "Employability"}>
        <div className="flex flex-col items-center justify-center py-20 text-center" role="alert">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <h3 className="text-lg font-semibold">{ar ? "خطأ في التحميل" : "Error loading"}</h3>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />{ar ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      </StudentPageTemplate>
    );
  }

  const d = data;
  const radarData = [
    { metric: ar ? "التواصل" : "Communication", value: d?.communicationScore ?? 0 },
    { metric: ar ? "حل المشكلات" : "Problem Solving", value: d?.problemSolving ?? 0 },
    { metric: ar ? "القيادة" : "Leadership", value: d?.leadership ?? 0 },
    { metric: ar ? "العمل الجماعي" : "Teamwork", value: d?.teamwork ?? 0 },
    { metric: ar ? "المقابلات" : "Interviews", value: d?.interviewReadiness ?? 0 },
    { metric: ar ? "المحفظة" : "Portfolio", value: d?.portfolioStrength ?? 0 },
  ];

  return (
    <StudentPageTemplate title={ar ? "قابلية التوظيف" : "Employability"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Main Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-gradient-to-br from-iscarb-green/10 via-emerald-50/50 to-white p-6 text-center ring-1 ring-iscarb-green/20 dark:from-iscarb-green/5 dark:via-emerald-900/10 dark:to-gray-900"
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-1">
            {ar ? "درجة قابلية التوظيف" : "Employability Score"}
          </h2>
          <div className="text-5xl font-bold text-iscarb-green">{d?.employabilityScore ?? 0}%</div>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Rocket className="h-3.5 w-3.5 text-iscarb-green" />{ar ? "جاهزية الصناعة" : "Industry"}: {d?.industryReadiness ?? 0}%</span>
            <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-blue-500" />{ar ? "توافق مهني" : "Career Match"}: {d?.careerMatch ?? 0}%</span>
          </div>
        </motion.div>

        {/* Score Gauges */}
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
          <ScoreGauge value={d?.industryReadiness ?? 0} label={ar ? "جاهزية الصناعة" : "Industry"} color="#10b981" ar={ar} />
          <ScoreGauge value={d?.interviewReadiness ?? 0} label={ar ? "المقابلات" : "Interviews"} color="#6366f1" ar={ar} />
          <ScoreGauge value={d?.resumeReadiness ?? 0} label={ar ? "السيرة الذاتية" : "Resume"} color="#f59e0b" ar={ar} />
          <ScoreGauge value={d?.placementProbability ?? 0} label={ar ? "فرص التوظيف" : "Placement"} color="#ef4444" ar={ar} />
        </div>

        {/* Radar + Skills */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-iscarb-green" />
                {ar ? "الملف المهاري" : "Skill Profile"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Skills" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Skill Gaps */}
          <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-amber-500" />
                {ar ? "الفجوات المهارية" : "Skill Gaps"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {d?.skillGaps?.length ? d.skillGaps.map((gap, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{gap.skill}</span>
                    <span className="text-muted-foreground">{gap.current}% / {gap.required}%</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${gap.current}%` }} />
                    <div className="absolute right-0 top-0 h-full rounded-full bg-red-300 opacity-40" style={{ width: `${Math.max(0, gap.required - gap.current)}%`, left: `${gap.current}%` }} />
                  </div>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground py-4 text-center">{ar ? "لا توجد فجوات" : "No skill gaps"}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Competency Mapping */}
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Brain className="h-4 w-4 text-iscarb-green" />
              {ar ? "ربط الكفاءات" : "Competency Mapping"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d?.competencyMapping?.length ? d.competencyMapping.map((c, i) => (
              <div key={i} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">{c.competency}</span>
                  <Badge variant="outline" className="rounded-md text-[10px]">{c.relevance}</Badge>
                </div>
                <Progress value={c.mastery} className="h-1.5" />
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">{ar ? "لا تبيانات" : "No data"}</p>
            )}
          </CardContent>
        </Card>

        {/* Improvement Plan */}
        <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {ar ? "خطة التحسين" : "Improvement Plan"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d?.improvementPlan?.length ? d.improvementPlan.map((step, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-iscarb-green/20 text-xs font-bold text-iscarb-green">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed">{step}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">{ar ? "لا توجد خطة بعد" : "No plan yet"}</p>}
          </CardContent>
        </Card>

        {/* Certifications */}
        {d?.certifications?.length ? (
          <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Medal className="h-4 w-4 text-amber-500" />
                {ar ? "الشهادات المقترحة" : "Recommended Certifications"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {d.certifications.map((cert, i) => (
                <Badge key={i} variant="secondary" className="rounded-lg px-3 py-1.5 text-xs">{cert}</Badge>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </StudentPageTemplate>
  );
}
