"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Brain,
  CheckCircle2,
  X,
  RotateCcw,
  Star,
  Clock,
  BarChart3,
  Target,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  ListChecks,
  Lightbulb,
  Repeat,
  Trophy,
  Medal,
  Play,
  Pause,
  Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentPageTemplate } from "@/components/student/StudentPageTemplate";
import { useApp } from "@/lib/store";

// ── Types ──────────────────────────────────────────────────────────────────

interface FlashcardDeck {
  id: string;
  title: string;
  description: string;
  cardCount: number;
  dueCount: number;
  masteredCount: number;
  category: string;
  progress: number;
  createdAt: string;
  lastStudied?: string;
  tags: string[];
}

interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hint?: string;
  difficulty: "easy" | "medium" | "hard";
  mastery: number;
  interval: number;
  nextReview: string;
  tags: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function LoadingSkeleton({ ar }: { ar: boolean }) {
  return (
    <div className="space-y-4" dir={ar ? "rtl" : "ltr"}>
      <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function LearningFlashcardsView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<"decks" | "cards" | "study">("decks");
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [search, setSearch] = useState("");

  // Create deck form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  // Generate with AI
  const [generating, setGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");

  // Stats
  const stats = useMemo(() => {
    const totalCards = decks.reduce((s, d) => s + d.cardCount, 0);
    const dueCards = decks.reduce((s, d) => s + d.dueCount, 0);
    const mastered = decks.reduce((s, d) => s + d.masteredCount, 0);
    const avgProgress = decks.length
      ? Math.round(decks.reduce((s, d) => s + d.progress, 0) / decks.length)
      : 0;
    return { totalCards, dueCards, mastered, avgProgress, deckCount: decks.length };
  }, [decks]);

  // Filtered decks
  const filteredDecks = useMemo(() => {
    if (!search) return decks;
    const q = search.toLowerCase();
    return decks.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [decks, search]);

  async function fetchDecks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/student/learning/flashcards");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setDecks(d.data || d.decks || []);
    } catch (e: any) {
      setError(e.message || "Failed to load flashcard decks");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCards(deckId: string) {
    try {
      const res = await fetch(`/api/v1/student/learning/flashcards/${deckId}/cards`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setCards(d.data || d.cards || []);
    } catch {
      setCards([]);
    }
  }

  useEffect(() => {
    fetchDecks();
  }, []);

  async function handleCreateDeck() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/student/learning/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc,
          category: newCategory || "general",
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const d = await res.json();
      const newDeck = d.data || d;
      setDecks((prev) => [newDeck, ...prev]);
      setNewTitle("");
      setNewDesc("");
      setNewCategory("");
      setShowCreate(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateWithAI() {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/v1/student/learning/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic.trim() }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const d = await res.json();
      const newDeck = d.data || d;
      if (newDeck) {
        setDecks((prev) => [newDeck, ...prev]);
      }
      setAiTopic("");
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeleteDeck(id: string) {
    setDecks((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`/api/v1/student/learning/flashcards/${id}`, {
        method: "DELETE",
      });
    } catch {
      fetchDecks();
    }
  }

  function handleStudyDeck(deck: FlashcardDeck) {
    setActiveDeck(deck);
    setViewMode("study");
    setCurrentCardIndex(0);
    setFlipped(false);
    fetchCards(deck.id);
  }

  function handleNextCard() {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFlipped(false);
    }
  }

  async function handleRateCard(cardId: string, difficulty: string) {
    try {
      await fetch(`/api/v1/student/learning/flashcards/${activeDeck?.id}/cards/${cardId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });
    } catch {
      // ignore
    }
    handleNextCard();
  }

  function handleBackToDecks() {
    setViewMode("decks");
    setActiveDeck(null);
    setCards([]);
    setCurrentCardIndex(0);
    setFlipped(false);
    fetchDecks();
  }

  const currentCard = cards[currentCardIndex];

  // ── STUDY MODE ───────────────────────────────────────────────────────
  if (viewMode === "study" && activeDeck) {
    return (
      <StudentPageTemplate title={activeDeck.title}>
        <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
          {/* Study header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="rounded-xl text-sm"
              onClick={handleBackToDecks}
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              {ar ? "العودة للقائمة" : "Back to Decks"}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {currentCardIndex + 1} / {cards.length}
              </span>
              <Progress
                value={(currentCardIndex / Math.max(cards.length, 1)) * 100}
                className="h-2 w-24"
              />
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Brain className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">
                {ar ? "لا توجد بطاقات في هذه المجموعة" : "No cards in this deck"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {ar ? "أضف بطاقات باستخدام الذكاء الاصطناعي" : "Generate cards using AI."}
              </p>
              <Button
                className="mt-4 rounded-xl bg-iscarb-green font-semibold text-white"
                onClick={handleBackToDecks}
              >
                {ar ? "العودة" : "Go Back"}
              </Button>
            </div>
          ) : currentCard ? (
            <div className="mx-auto max-w-2xl">
              {/* Flashcard */}
              <motion.div
                key={currentCard.id + (flipped ? "-back" : "-front")}
                initial={{ opacity: 0, rotateY: flipped ? -90 : 0 }}
                animate={{ opacity: 1, rotateY: 0 }}
                className="min-h-[300px] cursor-pointer"
                onClick={() => setFlipped(!flipped)}
              >
                <Card
                  className={`rounded-3xl border-0 bg-white shadow-lg ring-1 ring-gray-200 transition-all hover:shadow-xl dark:bg-gray-900 dark:ring-gray-800 ${
                    flipped ? "ring-iscarb-green/30" : ""
                  }`}
                >
                  <CardContent className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                    {/* Difficulty badge */}
                    {currentCard.difficulty && (
                      <Badge
                        className={`mb-4 rounded-lg text-xs ${
                          currentCard.difficulty === "easy"
                            ? "bg-emerald-100 text-emerald-700"
                            : currentCard.difficulty === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {currentCard.difficulty}
                      </Badge>
                    )}

                    {/* Card content */}
                    {!flipped ? (
                      <>
                        <Lightbulb className="mb-4 h-8 w-8 text-amber-400" />
                        <p className="text-xl font-semibold leading-relaxed text-iscarb-ink dark:text-white">
                          {currentCard.front}
                        </p>
                        {currentCard.hint && (
                          <p className="mt-4 text-sm text-muted-foreground">
                            💡 {currentCard.hint}
                          </p>
                        )}
                        <p className="mt-6 text-xs text-muted-foreground">
                          {ar ? "انقر للاطلاع على الإجابة" : "Tap to reveal answer"}
                        </p>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mb-4 h-8 w-8 text-emerald-500" />
                        <p className="text-xl font-semibold leading-relaxed text-iscarb-ink dark:text-white">
                          {currentCard.back}
                        </p>
                        <div className="mt-6 flex items-center gap-1 text-xs text-muted-foreground">
                          <Brain className="h-3 w-3" />
                          <span>
                            {ar ? "مستوى الإتقان" : "Mastery"}: {currentCard.mastery}%
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Rating buttons (shown after flip) */}
              {flipped && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex justify-center gap-3"
                >
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-900/20"
                    onClick={() => handleRateCard(currentCard.id, "hard")}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    {ar ? "صعب" : "Hard"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-800 dark:hover:bg-amber-900/20"
                    onClick={() => handleRateCard(currentCard.id, "medium")}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    {ar ? "متوسط" : "Medium"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                    onClick={() => handleRateCard(currentCard.id, "easy")}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    {ar ? "سهل" : "Easy"}
                  </Button>
                </motion.div>
              )}

              {/* Card navigation dots */}
              <div className="mt-6 flex justify-center gap-1.5">
                {cards.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-all ${
                      i === currentCardIndex
                        ? "w-6 bg-iscarb-green"
                        : i < currentCardIndex
                        ? "bg-emerald-200"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* All done! */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Trophy className="mb-4 h-16 w-16 text-amber-400" />
              <h2 className="text-2xl font-bold text-iscarb-ink dark:text-white">
                {ar ? "أحسنت! 🎉" : "Great job! 🎉"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {ar
                  ? `لقد أتممت ${cards.length} بطاقة في هذه الجلسة`
                  : `You've completed all ${cards.length} cards in this session.`}
              </p>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={handleBackToDecks}
                >
                  {ar ? "العودة للقائمة" : "Back to Decks"}
                </Button>
                <Button
                  className="rounded-xl bg-iscarb-green font-semibold text-white"
                  onClick={() => {
                    setCurrentCardIndex(0);
                    setFlipped(false);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {ar ? "مراجعة مرة أخرى" : "Review Again"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </StudentPageTemplate>
    );
  }

  // ── DECKS VIEW ────────────────────────────────────────────────────────
  return (
    <StudentPageTemplate title={ar ? "البطاقات التعليمية" : "Flashcards"}>
      <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="rounded-xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-iscarb-ink dark:text-white">{stats.deckCount}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "مجموعات" : "Decks"}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-iscarb-ink dark:text-white">{stats.totalCards}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "بطاقات" : "Cards"}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-amber-500">{stats.dueCards}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "للمراجعة" : "Due"}</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-emerald-500">{stats.mastered}</p>
              <p className="text-[10px] text-muted-foreground">{ar ? "متقن" : "Mastered"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={ar ? "ابحث في المجموعات..." : "Search decks..."}
              className="rounded-xl border-gray-200 pl-10 dark:border-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-xl bg-gradient-to-r from-iscarb-green to-emerald-600 font-semibold text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            {ar ? "مجموعة جديدة" : "New Deck"}
          </Button>
        </div>

        {/* Create deck / AI generate forms */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
                <CardContent className="p-5">
                  {/* Manual create */}
                  <h3 className="mb-3 text-sm font-semibold">
                    {ar ? "إنشاء مجموعة يدوياً" : "Create Deck Manually"}
                  </h3>
                  <div className="mb-4 space-y-3">
                    <Input
                      placeholder={ar ? "عنوان المجموعة" : "Deck title"}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="rounded-xl border-gray-200 dark:border-gray-700"
                    />
                    <Input
                      placeholder={ar ? "وصف (اختياري)" : "Description (optional)"}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="rounded-xl border-gray-200 dark:border-gray-700"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="rounded-xl bg-iscarb-green font-medium text-white hover:bg-iscarb-green-dark"
                        onClick={handleCreateDeck}
                        disabled={saving || !newTitle.trim()}
                      >
                        {saving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        {ar ? "إنشاء" : "Create"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setShowCreate(false)}
                      >
                        {ar ? "إلغاء" : "Cancel"}
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-2 text-xs text-muted-foreground dark:bg-gray-900">
                        {ar ? "أو استخدم الذكاء الاصطناعي" : "OR use AI"}
                      </span>
                    </div>
                  </div>

                  {/* AI generate */}
                  <h3 className="mb-3 text-sm font-semibold">
                    <Sparkles className="mr-1.5 inline h-4 w-4 text-amber-400" />
                    {ar ? "توليد بطاقات بالذكاء الاصطناعي" : "Generate with AI"}
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder={ar ? "أدخل موضوعاً..." : "Enter a topic..."}
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="flex-1 rounded-xl border-gray-200 dark:border-gray-700"
                    />
                    <Button
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-medium text-white hover:from-amber-600 hover:to-orange-600"
                      onClick={handleGenerateWithAI}
                      disabled={generating || !aiTopic.trim()}
                    >
                      {generating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {ar ? "توليد" : "Generate"}
                    </Button>
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
              {ar ? "خطأ في تحميل المجموعات" : "Error loading decks"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={fetchDecks}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {ar ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && decks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">
              {ar ? "لا توجد مجموعات" : "No flashcard decks yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar
                ? "أنشئ مجموعتك الأولى أو استخدم الذكاء الاصطناعي لتوليد بطاقات تلقائياً"
                : "Create your first deck or use AI to generate flashcards automatically."}
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-xl bg-iscarb-green font-semibold text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              {ar ? "إنشاء مجموعة" : "Create Deck"}
            </Button>
          </div>
        )}

        {/* Decks Grid */}
        {!loading && !error && decks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredDecks.map((deck, i) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="group relative rounded-2xl border-0 bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:shadow-md hover:ring-iscarb-green/20 dark:bg-gray-900 dark:ring-gray-800">
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-2.5">
                        <Brain className="h-5 w-5 text-purple-500" />
                      </div>
                      {deck.category && (
                        <Badge
                          variant="outline"
                          className="rounded-md text-[10px] font-normal"
                        >
                          {deck.category}
                        </Badge>
                      )}
                    </div>

                    {/* Title and description */}
                    <h4 className="mb-1 text-sm font-semibold text-iscarb-ink dark:text-white line-clamp-1">
                      {deck.title}
                    </h4>
                    {deck.description && (
                      <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                        {deck.description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {deck.cardCount} {ar ? "بطاقة" : "cards"}
                      </span>
                      {deck.dueCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Clock className="h-3 w-3" />
                          {deck.dueCount} {ar ? "للمراجعة" : "due"}
                        </span>
                      )}
                      {deck.masteredCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" />
                          {deck.masteredCount} {ar ? "متقن" : "mastered"}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{ar ? "التقدم" : "Progress"}</span>
                        <span>{deck.progress}%</span>
                      </div>
                      <Progress
                        value={deck.progress}
                        className="h-1.5 bg-purple-100 [&>div]:bg-purple-500"
                      />
                    </div>

                    {/* Tags */}
                    {deck.tags?.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {deck.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="rounded-md text-[10px] font-normal"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-lg bg-iscarb-green text-xs font-medium text-white hover:bg-iscarb-green-dark"
                        onClick={() => handleStudyDeck(deck)}
                      >
                        <Play className="mr-1 h-3.5 w-3.5" />
                        {ar ? "دراسة" : "Study"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteDeck(deck.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </StudentPageTemplate>
  );
}
