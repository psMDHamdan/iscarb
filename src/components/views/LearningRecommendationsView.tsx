"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Video,
  Target,
  Briefcase,
  Lightbulb,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  RefreshCw,
  BookMarked,
  TrendingUp,
  Clock,
  Brain,
  FileText,
  Zap,
  ExternalLink,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

// ── Types ──────────────────────────────────────────────────────────────────

interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: "course" | "book" | "video" | "skill" | "research" | "career" | "learning_path" | "article";
  reason: string;
  score: number;
  confidence: number;
  relevance: "high" | "medium" | "low";
  skills: string[];
  saved: boolean;
  dismissed: boolean;
  actionUrl?: string;
  estimatedTime?: string;
  prerequisites?: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const RECOMMENDATION_CATEGORIES = [
  { value: "all", label: { en: "All", ar: "الكل" }, icon: Sparkles },
  { value: "course", label: { en: "Courses", ar: "دورات" }, icon: BookOpen },
  { value: "book", label: { en: "Books", ar: "كتب" }, icon: BookMarked },
  { value: "video", label: { en: "Videos", ar: "فيديو" }, icon: Video },
  { value: "skill", label: { en: "Skills", ar: "مهارات" }, icon: Brain },
  { value: "research", label: { en: "Research", ar: "أبحاث" }, icon: FileText },
  { value: "career", label: { en: "Career", ar: "مهني" }, icon: Briefcase },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  course: BookOpen,
  book: BookMarked,
  video: Video,
  skill: Brain,
  research: FileText,
  career: Briefcase,
  learning_path: TrendingUp,
  article: FileText,
};

const RELEVANCE_COLORS: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function LearningRecommendationsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  async function fetchRecommendations() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/student/learning/recommendations");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setRecommendations(d.data || d.recommendations || []);
    } catch (e: any) {
      setError(e.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }

  async function generateRecommendations() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/student/learning/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setRecommendations(d.data || d.recommendations || []);
    } catch (e: any) {
      setError(e.message || "Failed to generate recommendations");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // Filter by category tab
  const filtered = useMemo(() => {
    let list = recommendations.filter((r) => !r.dismissed);
    if (showSaved) list = list.filter((r) => r.saved);
    if (activeTab !== "all") list = list.filter((r) => r.type === activeTab);
    return list.sort((a, b) => b.score - a.score);
  }, [recommendations, activeTab, showSaved]);

  // Stats
  const stats = useMemo(() => {
    const high = recommendations.filter((r) => r.relevance === "high").length;
    const saved = recommendations.filter((r) => r.saved).length;
    const avgScore = recommendations.length
      ? Math.round(
          recommendations.reduce((s, r) => s + r.score, 0) / recommendations.length
        )
      : 0;
    return { high, saved, avgScore, total: recommendations.length };
  }, [recommendations]);

  async function handleToggleSave(id: string) {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, saved: !r.saved } : r))
    );
    try {
      await fetch(`/api/v1/student/learning/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: !recommendations.find((r) => r.id === id)?.saved }),
      });
    } catch {
      // revert
      setRecommendations((prev) => prev);
    }
  }

  async function handleDismiss(id: string) {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, dismissed: true } : r))
    );
    try {
      await fetch(`/api/v1/student/learning/recommendations/${id}`, {
        method: "DELETE",
      });
    } catch {
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, dismissed: false } : r))
      );
    }
  }

  return (
    <StudentPageTemplate title={ar ? "التوصيات الذكية" : "AI Recommendations"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Header Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-iscarb-green/20 to-emerald-500/10 p-3">
              <Sparkles className="h-6 w-6 text-iscarb-green" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-iscarb-ink dark:text-white">
                {ar ? "توصيات مخصصة لك" : "Personalized For You"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {ar ? `${stats.total} توصية متاحة` : `${stats.total} recommendations available`}
              </p>
            </div>
          </div>
          <Button
            onClick={generateRecommendations}
            disabled={generating}
            className="rounded-xl bg-gradient-to-r from-iscarb-green to-emerald-600 font-semibold text-white shadow-sm hover:from-iscarb-green-dark hover:to-emerald-700"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {ar ? "جارٍ الإنشاء..." : "Generating..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {ar ? "توليد توصيات جديدة" : "Generate New"}
              </>
            )}
          </Button>
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                <Star className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {ar ? "أولوية عالية" : "High Priority"}
                </p>
                <p className="text-lg font-bold">{stats.high}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                <Bookmark className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {ar ? "محفوظة" : "Saved"}
                </p>
                <p className="text-lg font-bold">{stats.saved}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {ar ? "متوسط التوافق" : "Avg Match"}
                </p>
                <p className="text-lg font-bold">{stats.avgScore}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-4 flex items-center justify-between">
            <TabsList className="overflow-x-auto rounded-xl bg-muted/50 p-1">
              {RECOMMENDATION_CATEGORIES.map((cat) => (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="gap-1.5 rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  {ar ? cat.label.ar : cat.label.en}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-lg text-xs ${showSaved ? "text-iscarb-green" : ""}`}
              onClick={() => setShowSaved(!showSaved)}
            >
              <Bookmark className="mr-1 h-3.5 w-3.5" />
              {ar ? "المحفوظة" : "Saved"}
            </Button>
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Loading */}
            {loading && <LoadingSkeleton ar={ar} />}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
                <h3 className="text-lg font-semibold">
                  {ar ? "خطأ في تحميل التوصيات" : "Error loading recommendations"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={fetchRecommendations}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {ar ? "إعادة المحاولة" : "Retry"}
                </Button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Lightbulb className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold">
                  {ar ? "لا توجد توصيات" : "No recommendations yet"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ar
                    ? "انقر على 'توليد توصيات جديدة' للحصول على توصيات مخصصة"
                    : "Click 'Generate New' to get personalized recommendations based on your learning."}
                </p>
                <Button
                  onClick={generateRecommendations}
                  disabled={generating}
                  className="mt-4 rounded-xl bg-iscarb-green font-semibold text-white"
                >
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {ar ? "توليد توصيات" : "Generate Recommendations"}
                </Button>
              </div>
            )}

            {/* Recommendations List */}
            {!loading && !error && filtered.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <AnimatePresence>
                  {filtered.map((rec, i) => {
                    const Icon = TYPE_ICONS[rec.type] || Lightbulb;
                    return (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.03 }}
                        layout
                      >
                        <Card
                          className={`group relative cursor-pointer rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:shadow-md dark:bg-gray-900 dark:ring-gray-800 ${
                            rec.relevance === "high"
                              ? "ring-lime-500/30 hover:ring-lime-500/50"
                              : rec.relevance === "medium"
                              ? "ring-amber-500/20 hover:ring-amber-500/40"
                              : ""
                          }`}
                          onClick={() =>
                            setExpandedId(expandedId === rec.id ? null : rec.id)
                          }
                        >
                          <CardContent className="p-5">
                            {/* Header row */}
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="rounded-lg bg-gradient-to-br from-iscarb-green/20 to-emerald-500/10 p-2">
                                  <Icon className="h-4 w-4 text-iscarb-green" />
                                </div>
                                <Badge
                                  className={`rounded-lg text-[10px] font-medium ${
                                    RELEVANCE_COLORS[rec.relevance] || ""
                                  }`}
                                >
                                  {rec.relevance === "high"
                                    ? ar ? "أولوية عالية" : "High priority"
                                    : rec.relevance === "medium"
                                    ? ar ? "متوسط" : "Medium"
                                    : ar ? "منخفض" : "Low"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 rounded-lg p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSave(rec.id);
                                  }}
                                >
                                  <Bookmark
                                    className={`h-3.5 w-3.5 ${
                                      rec.saved
                                        ? "fill-amber-400 text-amber-400"
                                        : ""
                                    }`}
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 rounded-lg p-0 text-muted-foreground hover:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismiss(rec.id);
                                  }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Title & description */}
                            <h4 className="mb-1 text-sm font-semibold leading-snug text-iscarb-ink dark:text-white">
                              {rec.title}
                            </h4>
                            <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                              {rec.description}
                            </p>

                            {/* Skills */}
                            {rec.skills?.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-1">
                                {rec.skills.slice(0, 3).map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="rounded-md text-[10px] font-normal"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                                {rec.skills.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground self-center">
                                    +{rec.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Score bar */}
                            <div className="mb-2">
                              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                <span>{ar ? "نسبة التوافق" : "Match"}</span>
                                <span>{rec.score}%</span>
                              </div>
                              <Progress
                                value={rec.score}
                                className={`h-1.5 ${
                                  rec.score >= 80
                                    ? "bg-emerald-100 [&>div]:bg-emerald-500"
                                    : rec.score >= 50
                                    ? "bg-amber-100 [&>div]:bg-amber-500"
                                    : "bg-blue-100 [&>div]:bg-blue-500"
                                }`}
                              />
                            </div>

                            {/* Expanded: Reason + Prerequisites */}
                            {expandedId === rec.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800"
                              >
                                <div className="flex items-start gap-2 rounded-lg bg-amber-50/50 p-3 dark:bg-amber-900/10">
                                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                  <div>
                                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                                      {ar ? "لماذا هذه التوصية؟" : "Why this recommendation?"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {rec.reason}
                                    </p>
                                  </div>
                                </div>

                                {rec.prerequisites?.length ? (
                                  <div>
                                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                                      {ar ? "المتطلبات السابقة:" : "Prerequisites:"}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {rec.prerequisites.map((pr) => (
                                        <Badge
                                          key={pr}
                                          variant="outline"
                                          className="rounded-md text-[10px]"
                                        >
                                          {pr}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                <Button
                                  size="sm"
                                  className="mt-2 w-full rounded-lg bg-iscarb-green text-xs font-medium text-white hover:bg-iscarb-green-dark"
                                >
                                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                  {rec.type === "course"
                                    ? ar ? "عرض الدورة" : "View Course"
                                    : rec.type === "book"
                                    ? ar ? "عرض الكتاب" : "View Book"
                                    : rec.type === "video"
                                    ? ar ? "مشاهدة الفيديو" : "Watch Video"
                                    : ar ? "عرض التفاصيل" : "View Details"}
                                </Button>
                              </motion.div>
                            )}

                            {/* Expand hint */}
                            <div className="flex items-center justify-center">
                              {expandedId === rec.id ? (
                                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudentPageTemplate>
  );
}
