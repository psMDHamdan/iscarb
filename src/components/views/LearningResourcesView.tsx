"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  ExternalLink,
  FileText,
  Video,
  BookOpen,
  File,
  Loader2,
  AlertCircle,
  Sparkles,
  X,
  SlidersHorizontal,
  Grid3X3,
  List,
  BookMarked,
  Clock,
  Eye,
  FileType,
  Link,
  RefreshCw,
  Bookmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

// ── Types ──────────────────────────────────────────────────────────────────

interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: "video" | "document" | "article" | "link" | "book" | "paper" | "course";
  category: string;
  url?: string;
  fileUrl?: string;
  duration?: string;
  pages?: number;
  author?: string;
  source?: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  rating: number;
  saved: boolean;
  completed: boolean;
  progress?: number;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const RESOURCE_TYPES = [
  { value: "all", label: { en: "All", ar: "الكل" } },
  { value: "video", label: { en: "Videos", ar: "فيديو" } },
  { value: "document", label: { en: "Documents", ar: "مستندات" } },
  { value: "article", label: { en: "Articles", ar: "مقالات" } },
  { value: "book", label: { en: "Books", ar: "كتب" } },
  { value: "paper", label: { en: "Papers", ar: "أبحاث" } },
  { value: "course", label: { en: "Courses", ar: "دورات" } },
  { value: "link", label: { en: "Links", ar: "روابط" } },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function ResourceIcon({ type }: { type: string }) {
  const className = "h-4 w-4";
  switch (type) {
    case "video":
      return <Video className={className} />;
    case "document":
      return <FileText className={className} />;
    case "article":
      return <FileType className={className} />;
    case "book":
      return <BookOpen className={className} />;
    case "paper":
      return <File className={className} />;
    case "course":
      return <BookMarked className={className} />;
    default:
      return <Link className={className} />;
  }
}

function TypeBadge({ type, ar }: { type: string; ar: boolean }) {
  const t = RESOURCE_TYPES.find((r) => r.value === type);
  return (
    <Badge
      variant="outline"
      className="gap-1 rounded-lg text-xs font-normal"
    >
      <ResourceIcon type={type} />
      {t ? (ar ? t.label.ar : t.label.en) : type}
    </Badge>
  );
}

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function LearningResourcesView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function fetchResources() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/v1/student/learning/resources?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setResources(d.data || d.resources || []);
    } catch (e: any) {
      setError(e.message || "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResources();
  }, [debouncedSearch, typeFilter]);

  // Categories derived from data
  const categories = useMemo(() => {
    const cats = new Set(resources.map((r) => r.category).filter(Boolean));
    return Array.from(cats);
  }, [resources]);

  // Counts per type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return counts;
  }, [resources]);

  async function handleSummarize(resourceId: string) {
    setSummarizing(resourceId);
    setSummary(null);
    try {
      const res = await fetch("/api/v1/student/learning/resources/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      if (!res.ok) throw new Error("Failed to summarize");
      const d = await res.json();
      setSummary(d.summary || d.data?.summary || "Summary not available");
    } catch {
      setSummary(ar ? "تعذر إنشاء الملخص" : "Could not generate summary");
    } finally {
      setSummarizing(null);
    }
  }

  return (
    <StudentPageTemplate title={ar ? "الموارد التعليمية" : "Learning Resources"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Search and Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={ar ? "ابحث في الموارد..." : "Search resources..."}
              className="rounded-xl border-gray-200 pl-10 dark:border-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {ar ? "تصفية" : "Filters"}
            </Button>
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                className="rounded-l-xl rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-r-xl rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap gap-2">
          {RESOURCE_TYPES.map((t) => (
            <Badge
              key={t.value}
              variant={typeFilter === t.value ? "default" : "outline"}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                typeFilter === t.value
                  ? "bg-iscarb-green text-white"
                  : "hover:bg-muted"
              }`}
              onClick={() => setTypeFilter(t.value)}
            >
              {ar ? t.label.ar : t.label.en}
              {typeCounts[t.value] ? ` (${typeCounts[t.value]})` : ""}
            </Badge>
          ))}
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="rounded-md text-[11px] font-normal"
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingSkeleton ar={ar} />}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
            <h3 className="text-lg font-semibold">
              {ar ? "خطأ في تحميل الموارد" : "Error loading resources"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={fetchResources}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && resources.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">
              {ar ? "لا توجد موارد" : "No resources found"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar
                ? "لم يتم العثور على موارد تطابق بحثك"
                : "No resources match your search. Try different keywords."}
            </p>
          </div>
        )}

        {/* Resource Grid/List */}
        {!loading && !error && resources.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }
          >
            {resources.map((resource, i) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className={`group cursor-pointer rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:shadow-md hover:ring-iscarb-green/20 dark:bg-gray-900 dark:ring-gray-800 ${
                    viewMode === "list" ? "flex items-center gap-4 p-4" : ""
                  }`}
                  onClick={() => setSelectedResource(resource)}
                >
                  {viewMode === "grid" ? (
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="mb-3 flex items-start justify-between">
                        <ResourceIcon type={resource.type} />
                        {resource.saved && (
                          <Bookmark className="h-4 w-4 fill-amber-400 text-amber-400" />
                        )}
                      </div>

                      {/* Content */}
                      <h4 className="mb-1 text-sm font-semibold leading-snug text-iscarb-ink dark:text-white line-clamp-2">
                        {resource.title}
                      </h4>
                      <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>

                      {/* Meta */}
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        <TypeBadge type={resource.type} ar={ar} />
                        <Badge
                          className={`rounded-lg text-[10px] font-medium ${
                            DIFFICULTY_COLORS[resource.difficulty] || ""
                          }`}
                        >
                          {resource.difficulty}
                        </Badge>
                        {resource.duration && (
                          <Badge
                            variant="outline"
                            className="rounded-lg text-[10px] font-normal"
                          >
                            {resource.duration}
                          </Badge>
                        )}
                      </div>

                      {/* Progress bar for completed */}
                      {resource.progress !== undefined && resource.progress > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{ar ? "التقدم" : "Progress"}</span>
                            <span>{resource.progress}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-full rounded-full bg-iscarb-green transition-all"
                              style={{ width: `${resource.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 flex-1 rounded-lg bg-iscarb-green text-xs font-medium text-white hover:bg-iscarb-green-dark"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (resource.url) window.open(resource.url, "_blank");
                          }}
                        >
                          {resource.completed ? (
                            <>
                              <Eye className="mr-1 h-3 w-3" />
                              {ar ? "عرض" : "View"}
                            </>
                          ) : (
                            <>
                              <Download className="mr-1 h-3 w-3" />
                              {ar ? "فتح" : "Open"}
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSummarize(resource.id);
                          }}
                          disabled={summarizing === resource.id}
                        >
                          {summarizing === resource.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  ) : (
                    /* List view */
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-iscarb-green/10">
                        <ResourceIcon type={resource.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold truncate">
                          {resource.title}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.description}
                        </p>
                      </div>
                      <Badge
                        className={`rounded-lg text-[10px] ${
                          DIFFICULTY_COLORS[resource.difficulty] || ""
                        }`}
                      >
                        {resource.difficulty}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSummarize(resource.id);
                        }}
                        disabled={summarizing === resource.id}
                      >
                        {summarizing === resource.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* AI Summary Modal */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-800 dark:bg-amber-900/20"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold">
                  {ar ? "ملخص ذكي" : "AI Summary"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 rounded-full p-0"
                onClick={() => setSummary(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm leading-relaxed">{summary}</p>
          </motion.div>
        )}
      </div>
    </StudentPageTemplate>
  );
}
