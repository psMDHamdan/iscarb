"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit3,
  Tag,
  Clock,
  Sparkles,
  BookOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  FolderOpen,
  Pin,
  MoreHorizontal,
  Copy,
  Share2,
  Download,
  Star,
  Lightbulb,
  Filter,
  X,
  Save,
  Eye,
  EyeOff,
  Calendar,
  MessageSquare,
  Quote,
  ArrowRight,
  List,
  Grid3X3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

// ── Types ──────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  starred: boolean;
  category: string;
  source?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getExcerpt(text: string, max = 120): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "...";
}

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function LearningNotesView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState<string | null>(null);

  // New note form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function fetchNotes() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedTag) params.set("tag", selectedTag);
      const res = await fetch(`/api/v1/student/learning/notes?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setNotes(d.data || d.notes || []);
    } catch (e: any) {
      setError(e.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, [debouncedSearch, selectedCategory, selectedTag]);

  // Pinned + sorted notes
  const sortedNotes = useMemo(() => {
    const pinned = notes.filter((n) => n.pinned);
    const unpinned = notes.filter((n) => !n.pinned);
    return [
      ...pinned.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
      ...unpinned.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    ];
  }, [notes]);

  // All unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [notes]);

  // All categories
  const categories = useMemo(() => {
    const cats = new Set(notes.map((n) => n.category).filter(Boolean));
    return Array.from(cats);
  }, [notes]);

  // Stats
  const stats = useMemo(() => {
    const total = notes.length;
    const pinned = notes.filter((n) => n.pinned).length;
    const totalWords = notes.reduce((s, n) => s + (n.wordCount || countWords(n.content)), 0);
    return { total, pinned, totalWords };
  }, [notes]);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const tags = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/v1/student/learning/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent,
          tags,
          category: newCategory,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const d = await res.json();
      const newNote = d.data || d;
      setNotes((prev) => [newNote, ...prev]);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setNewCategory("general");
      setShowCreate(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/v1/student/learning/notes/${id}`, {
        method: "DELETE",
      });
    } catch {
      fetchNotes();
    }
  }

  async function handleTogglePin(id: string) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, pinned: !n.pinned } : n
      )
    );
    try {
      await fetch(`/api/v1/student/learning/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pinned: !notes.find((n) => n.id === id)?.pinned,
        }),
      });
    } catch {
      fetchNotes();
    }
  }

  async function handleSummarize(id: string) {
    setSummarizing(id);
    try {
      const res = await fetch("/api/v1/student/learning/notes/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: id }),
      });
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      alert(d.summary || d.data?.summary || "Summary ready");
    } catch {
      // ignore
    } finally {
      setSummarizing(null);
    }
  }

  return (
    <StudentPageTemplate title={ar ? "الملاحظات" : "Notes"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Header stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-3">
              <FileText className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {ar
                  ? `${stats.total} ملاحظة · ${stats.pinned} مثبتة · ${stats.totalWords.toLocaleString()} كلمة`
                  : `${stats.total} notes · ${stats.pinned} pinned · ${stats.totalWords.toLocaleString()} words`}
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
              onClick={() => setShowCreate(!showCreate)}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-sm hover:from-amber-600 hover:to-orange-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {ar ? "ملاحظة جديدة" : "New Note"}
            </Button>
          </div>
        </div>

        {/* Search & Category filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={ar ? "ابحث في الملاحظات..." : "Search notes..."}
              className="rounded-xl border-gray-200 pl-10 dark:border-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs"
              onClick={() => setSelectedCategory("all")}
            >
              {ar ? "الكل" : "All"}
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs"
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? "all" : cat)
                }
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "secondary"}
                className={`cursor-pointer rounded-md text-[11px] font-normal ${
                  selectedTag === tag
                    ? "bg-iscarb-green text-white"
                    : ""
                }`}
                onClick={() =>
                  setSelectedTag(selectedTag === tag ? null : tag)
                }
              >
                <Tag className="mr-1 h-2.5 w-2.5" />
                {tag}
              </Badge>
            ))}
            {selectedTag && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 rounded-md px-2 text-[11px]"
                onClick={() => setSelectedTag(null)}
              >
                <X className="mr-1 h-2.5 w-2.5" />
                {ar ? "مسح" : "Clear"}
              </Button>
            )}
          </div>
        )}

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                <CardContent className="p-5">
                  <h3 className="mb-4 text-sm font-semibold">
                    {ar ? "ملاحظة جديدة" : "New Note"}
                  </h3>
                  <div className="space-y-3">
                    <Input
                      placeholder={ar ? "عنوان الملاحظة" : "Note title"}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="rounded-xl border-gray-200 dark:border-gray-700"
                    />
                    <Textarea
                      placeholder={ar ? "اكتب ملاحظتك هنا..." : "Write your note here..."}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="min-h-[120px] rounded-xl border-gray-200 dark:border-gray-700"
                    />
                    <div className="flex gap-3">
                      <Input
                        placeholder={ar ? "وسوم (مفصولة بفواصل)" : "Tags (comma-separated)"}
                        value={newTags}
                        onChange={(e) => setNewTags(e.target.value)}
                        className="flex-1 rounded-xl border-gray-200 dark:border-gray-700"
                      />
                      <Input
                        placeholder={ar ? "تصنيف" : "Category"}
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-32 rounded-xl border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setShowCreate(false)}
                      >
                        {ar ? "إلغاء" : "Cancel"}
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-xl bg-amber-500 font-medium text-white hover:bg-amber-600"
                        onClick={handleCreate}
                        disabled={saving || !newTitle.trim()}
                      >
                        {saving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {ar ? "حفظ" : "Save"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && <LoadingSkeleton ar={ar} />}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
            <h3 className="text-lg font-semibold">
              {ar ? "خطأ في تحميل الملاحظات" : "Error loading notes"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={fetchNotes}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">
              {ar ? "لا توجد ملاحظات" : "No notes yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar
                ? "ابدأ بإنشاء ملاحظاتك الأولى"
                : "Start creating your first notes to capture your learning."}
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-xl bg-amber-500 font-semibold text-white hover:bg-amber-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {ar ? "إنشاء ملاحظة" : "Create Note"}
            </Button>
          </div>
        )}

        {/* Notes Grid / List */}
        {!loading && !error && notes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-2"
            }
          >
            {sortedNotes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card
                  className={`group relative rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:shadow-md dark:bg-gray-900 dark:ring-gray-800 ${
                    note.pinned ? "ring-amber-300/50" : ""
                  } ${viewMode === "list" ? "flex items-center gap-4 p-4" : ""}`}
                >
                  {viewMode === "grid" ? (
                    <CardContent className="p-5">
                      {/* Pin badge */}
                      {note.pinned && (
                        <div className="absolute right-3 top-3">
                          <Pin className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        </div>
                      )}

                      {/* Category */}
                      {note.category && (
                        <Badge
                          variant="secondary"
                          className="mb-2 rounded-md text-[10px] font-normal"
                        >
                          {note.category}
                        </Badge>
                      )}

                      {/* Title */}
                      <h4 className="mb-1 text-sm font-semibold leading-snug text-iscarb-ink dark:text-white line-clamp-2">
                        {note.title}
                      </h4>

                      {/* Content excerpt */}
                      <p className="mb-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {getExcerpt(note.content)}
                      </p>

                      {/* Tags */}
                      {note.tags?.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {note.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="rounded-md text-[10px] font-normal"
                            >
                              <Tag className="mr-0.5 h-2.5 w-2.5" />
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground self-center">
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        <span>{note.wordCount || countWords(note.content)} words</span>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3 dark:border-gray-800">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 flex-1 rounded-lg text-xs"
                          onClick={() => handleTogglePin(note.id)}
                        >
                          <Pin
                            className={`mr-1 h-3 w-3 ${
                              note.pinned ? "fill-amber-400 text-amber-400" : ""
                            }`}
                          />
                          {note.pinned
                            ? ar ? "إلغاء التثبيت" : "Unpin"
                            : ar ? "تثبيت" : "Pin"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 flex-1 rounded-lg text-xs"
                          onClick={() => handleSummarize(note.id)}
                          disabled={summarizing === note.id}
                        >
                          {summarizing === note.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="mr-1 h-3 w-3" />
                          )}
                          {ar ? "تلخيص" : "Summarize"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  ) : (
                    /* List view */
                    <>
                      {note.pinned && (
                        <Pin className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold truncate">
                            {note.title}
                          </h4>
                          {note.category && (
                            <Badge
                              variant="secondary"
                              className="rounded-md text-[10px] font-normal"
                            >
                              {note.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {getExcerpt(note.content, 80)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => handleTogglePin(note.id)}
                        >
                          <Pin
                            className={`h-3 w-3 ${
                              note.pinned ? "fill-amber-400 text-amber-400" : ""
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </StudentPageTemplate>
  );
}
