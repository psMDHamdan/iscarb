"use client";

import { useMemo, useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { motion } from "framer-motion";
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Brain,
  Rocket,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Play,
  TrendingUp,
  Flag,
  Map,
  Compass,
  Medal,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

interface AssessmentPath {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  type: "skill" | "career" | "competency" | "certification";
  assessments: number;
  completed: number;
  progress: number;
  estimatedTime: string;
  skills: string[];
  milestones: { title: string; completed: boolean; required: boolean }[];
  recommended: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  skill: Brain,
  career: Rocket,
  competency: Target,
  certification: Medal,
};

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

export function AssessmentPathsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [levelFilter, setLevelFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pathQueryUrl = `/api/v1/student/assessment/paths${levelFilter !== "all" ? `?level=${levelFilter}` : ""}`;
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "assessment", "paths", levelFilter],
    pathQueryUrl,
  );
  const paths = useMemo(() => {
    const d = rawRes;
    return d?.data || d?.paths || [];
  }, [rawRes]);
  const error = queryError?.message ?? null;

  const stats = useMemo(() => ({
    total: paths.length,
    inProgress: paths.filter((p) => p.progress > 0 && p.progress < 100).length,
    completed: paths.filter((p) => p.progress >= 100).length,
    recommended: paths.filter((p) => p.recommended).length,
    overallProgress: paths.length ? Math.round(paths.reduce((s, p) => s + p.progress, 0) / paths.length) : 0,
  }), [paths]);

  return (
    <StudentPageTemplate title={ar ? "مسارات التقييم" : "Assessment Paths"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: ar ? "المسارات" : "Paths", value: stats.total, color: "text-violet-500" },
            { label: ar ? "قيد التنفيذ" : "In Progress", value: stats.inProgress, color: "text-amber-500" },
            { label: ar ? "مكتمل" : "Completed", value: stats.completed, color: "text-emerald-500" },
            { label: ar ? "مقترح لك" : "For You", value: stats.recommended, color: "text-iscarb-green" },
          ].map((s) => (
            <Card key={s.label} className="rounded-xl border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <CardContent className="p-4 text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Level filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: { en: "All", ar: "الكل" } },
            { value: "beginner", label: { en: "Beginner", ar: "مبتدئ" } },
            { value: "intermediate", label: { en: "Intermediate", ar: "متوسط" } },
            { value: "advanced", label: { en: "Advanced", ar: "متقدم" } },
          ].map((l) => (
            <Badge key={l.value} variant={levelFilter === l.value ? "default" : "outline"}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium"
              onClick={() => setLevelFilter(l.value)}>
              {ar ? l.label.ar : l.label.en}
            </Badge>
          ))}
        </div>

        {/* Loading/Error/Empty */}
        {loading && <LoadingSkeleton ar={ar} />}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-red-400" />
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />{ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}
        {!loading && !error && paths.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Compass className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{ar ? "لا توجد مسارات" : "No paths available"}</p>
          </div>
        )}

        {/* Path Cards */}
        {!loading && !error && paths.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {paths.map((path, i) => {
              const Icon = TYPE_ICONS[path.type] || Layers;
              const isExpanded = expandedId === path.id;
              return (
                <motion.div key={path.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className={`group relative rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md dark:bg-gray-900 dark:ring-gray-800 ${
                    path.recommended ? "ring-iscarb-green/30" : ""
                  }`}
                    onClick={() => setExpandedId(isExpanded ? null : path.id)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-gradient-to-br from-iscarb-green/20 to-emerald-500/10 p-2.5">
                            <Icon className="h-5 w-5 text-iscarb-green" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">{path.title}</h4>
                            <p className="text-xs text-muted-foreground">{path.description}</p>
                          </div>
                        </div>
                        {path.recommended && <Sparkles className="h-4 w-4 text-iscarb-green shrink-0" />}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className={`rounded-lg text-[10px] ${LEVEL_COLORS[path.level] || ""}`}>{path.level}</Badge>
                        <Badge variant="outline" className="rounded-lg text-[10px]">{ar ? "تقييمات" : "Assessments"}: {path.completed}/{path.assessments}</Badge>
                        <Badge variant="outline" className="rounded-lg text-[10px]">{path.estimatedTime}</Badge>
                      </div>

                      <Progress value={path.progress} className="h-1.5 mb-3" />

                      <div className="flex flex-wrap gap-1 mb-2">
                        {path.skills?.slice(0, 4).map((s) => (
                          <Badge key={s} variant="secondary" className="rounded-md text-[10px] font-normal">{s}</Badge>
                        ))}
                      </div>

                      {/* Milestones */}
                      {isExpanded && path.milestones?.length > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 space-y-2 border-t pt-3 dark:border-gray-800">
                          <p className="text-xs font-medium text-muted-foreground">{ar ? "المعالم" : "Milestones"}</p>
                          {path.milestones.map((m, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs">
                              {m.completed ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              ) : (
                                <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-gray-300" />
                              )}
                              <span className={m.completed ? "line-through text-muted-foreground" : ""}>{m.title}</span>
                              {m.required && <Badge className="rounded-md text-[8px] bg-amber-100 text-amber-700">{ar ? "إلزامي" : "Required"}</Badge>}
                            </div>
                          ))}
                        </motion.div>
                      )}

                      <Button className="mt-3 w-full rounded-lg bg-iscarb-green text-xs text-white hover:bg-iscarb-green-dark">
                        <Play className="mr-1 h-3 w-3" />{path.progress > 0 ? (ar ? "متابعة" : "Continue") : (ar ? "بدء المسار" : "Start Path")}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </StudentPageTemplate>
  );
}
