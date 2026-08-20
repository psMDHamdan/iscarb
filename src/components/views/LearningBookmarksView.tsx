"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Search,
  FolderOpen,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Tag,
  Plus,
  X,
  Globe,
  FileText,
  Video,
  BookOpen,
  Link,
  MoreHorizontal,
  Edit3,
  Share2,
  Star,
  ChevronDown,
  ChevronUp,
  Clock,
  List,
  Grid3X3,
  BookMarked,
  Layers,
  FolderPlus,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

// ── Types ──────────────────────────────────────────────────────────────────

interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  description?: string;
  type: "article" | "video" | "course" | "document" | "link" | "research" | "resource";
  tags: string[];
  collection: string;
  favicon?: string;
  savedAt: string;
  lastVisited?: string;
  notes?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const BOOKMARK_TYPE_ICONS: Record<string, React.ElementType> = {
  article: FileText,
  video: Video,
  course: BookOpen,
  document: FileText,
  link: Link,
  research: BookMarked,
  resource: FolderOpen,
};

const BOOKMARK_TYPES = [
  { value: "all", label: { en: "All", ar: "الكل" } },
  { value: "article", label: { en: "Articles", ar: "مقالات" } },
  { value: "video", label: { en: "Videos", ar: "فيديو" } },
  { value: "course", label: { en: "Courses", ar: "دورات" } },
  { value: "document", label: { en: "Documents", ar: "مستندات" } },
  { value: "research", label: { en: "Research", ar: "أبحاث" } },
  { value: "link", label: { en: "Links", ar: "روابط" } },
];

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function LearningBookmarksView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function fetchBookmarks() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedType !== "all") params.set("type", selectedType);
      if (selectedCollection) params.set("collection", selectedCollection);
      const res = await fetch(`/api/v1/student/learning/bookmarks?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setBookmarks(d.data || d.bookmarks || []);
    } catch (e: any) {
      setError(e.message || "Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookmarks();
  }, [debouncedSearch, selectedType, selectedCollection]);

  // Collections
  const collections = useMemo(() => {
    const cols = new Set(bookmarks.map((b) => b.collection).filter(Boolean));
    return Array.from(cols);
  }, [bookmarks]);

  // Collection counts
  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookmarks.forEach((b) => {
      if (b.collection) counts[b.collection] = (counts[b.collection] || 0) + 1;
    });
    return counts;
  }, [bookmarks]);

  // Tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    bookmarks.forEach((b) => b.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [bookmarks]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: bookmarks.length,
      collections: collections.length,
      tags: allTags.length,
    };
  }, [bookmarks, collections, allTags]);

  async function handleDelete(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    try {
      await fetch(`/api/v1/student/learning/bookmarks/${id}`, {
        method: "DELETE",
      });
    } catch {
      fetchBookmarks();
    }
  }

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    // Just filter the view
    setSelectedCollection(newCollectionName.trim());
    setNewCollectionName("");
    setShowNewCollection(false);
  }

  return (
    <StudentPageTemplate title={ar ? "الإشارات المرجعية" : "Bookmarks"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Header Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 p-3">
              <Bookmark className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {ar
                  ? `${stats.total} إشارة · ${stats.collections} مجموعة · ${stats.tags} وسماً`
                  : `${stats.total} bookmarks · ${stats.collections} collections · ${stats.tags} tags`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setShowNewCollection(!showNewCollection)}
            >
              <FolderPlus className="mr-1.5 h-4 w-4" />
              {ar ? "مجموعة جديدة" : "New Collection"}
            </Button>
          </div>
        </div>

        {/* New collection form */}
        <AnimatePresence>
          {showNewCollection && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder={ar ? "اسم المجموعة" : "Collection name"}
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="max-w-xs rounded-xl border-gray-200 dark:border-gray-700"
              />
              <Button
                size="sm"
                className="rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                {ar ? "إنشاء" : "Create"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowNewCollection(false)}
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={ar ? "ابحث في الإشارات المرجعية..." : "Search bookmarks..."}
            className="rounded-xl border-gray-200 pl-10 dark:border-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Collections bar */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={!selectedCollection ? "default" : "outline"}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium"
            onClick={() => setSelectedCollection(null)}
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            {ar ? "الكل" : "All"}
          </Badge>
          {collections.map((col) => (
            <Badge
              key={col}
              variant={selectedCollection === col ? "default" : "outline"}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium ${
                selectedCollection === col
                  ? "bg-blue-500 text-white"
                  : "hover:bg-muted"
              }`}
              onClick={() =>
                setSelectedCollection(selectedCollection === col ? null : col)
              }
            >
              <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
              {col}
              <span className="ml-1 text-[10px] opacity-70">
                ({collectionCounts[col] || 0})
              </span>
            </Badge>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-1.5">
          {BOOKMARK_TYPES.map((t) => (
            <Badge
              key={t.value}
              variant={selectedType === t.value ? "default" : "secondary"}
              className={`cursor-pointer rounded-md text-[11px] font-normal ${
                selectedType === t.value
                  ? "bg-iscarb-green text-white"
                  : ""
              }`}
              onClick={() => setSelectedType(t.value)}
            >
              {ar ? t.label.ar : t.label.en}
            </Badge>
          ))}
        </div>

        {/* Loading */}
        {loading && <LoadingSkeleton ar={ar} />}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
            <h3 className="text-lg font-semibold">
              {ar ? "خطأ في تحميل الإشارات" : "Error loading bookmarks"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={fetchBookmarks}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && bookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bookmark className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">
              {ar ? "لا توجد إشارات مرجعية" : "No bookmarks yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar
                ? "احفظ المحتوى المهم لتعود إليه لاحقاً"
                : "Save important content to revisit later."}
            </p>
          </div>
        )}

        {/* Bookmarks Grid / List */}
        {!loading && !error && bookmarks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-2"
            }
          >
            {bookmarks.map((bookmark, i) => {
              const Icon = BOOKMARK_TYPE_ICONS[bookmark.type] || Link;
              return (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card
                    className={`group relative rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:shadow-md hover:ring-blue-500/20 dark:bg-gray-900 dark:ring-gray-800 ${
                      viewMode === "list" ? "flex items-center gap-4 p-4" : ""
                    }`}
                  >
                    {viewMode === "grid" ? (
                      <CardContent className="p-5">
                        {/* Header */}
                        <div className="mb-3 flex items-start justify-between">
                          <div className="rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 p-2">
                            <Icon className="h-4 w-4 text-blue-500" />
                          </div>
                          {bookmark.collection && (
                            <Badge
                              variant="outline"
                              className="rounded-md text-[10px] font-normal"
                            >
                              <FolderOpen className="mr-1 h-2.5 w-2.5" />
                              {bookmark.collection}
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="mb-1 text-sm font-semibold leading-snug text-iscarb-ink dark:text-white line-clamp-2">
                          {bookmark.title}
                        </h4>

                        {bookmark.description && (
                          <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
                            {bookmark.description}
                          </p>
                        )}

                        {/* Tags */}
                        {bookmark.tags?.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-1">
                            {bookmark.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="rounded-md text-[10px] font-normal"
                              >
                                <Tag className="mr-0.5 h-2.5 w-2.5" />
                                {tag}
                              </Badge>
                            ))}
                            {bookmark.tags.length > 3 && (
                              <span className="text-[10px] text-muted-foreground self-center">
                                +{bookmark.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                            {new Date(bookmark.savedAt).toLocaleDateString()}
                          </span>
                          {bookmark.lastVisited && (
                            <span>
                              {ar ? "آخر زيارة" : "Last"}:{" "}
                              {new Date(bookmark.lastVisited).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3 dark:border-gray-800">
                          {bookmark.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 flex-1 rounded-lg text-xs"
                              onClick={() => window.open(bookmark.url, "_blank")}
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              {ar ? "فتح" : "Open"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(bookmark.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    ) : (
                      /* List view */
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10">
                          <Icon className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold truncate">
                              {bookmark.title}
                            </h4>
                            {bookmark.collection && (
                              <Badge
                                variant="outline"
                                className="rounded-md text-[10px] font-normal shrink-0"
                              >
                                {bookmark.collection}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {bookmark.url || bookmark.description}
                          </p>
                        </div>
                        {bookmark.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => window.open(bookmark.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(bookmark.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </StudentPageTemplate>
  );
}
