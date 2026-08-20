"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card } from "@/components/ui/card";
import {
  BookOpen, Loader2, Plus, AlertCircle
} from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface WellnessData {
  entries: JournalEntry[];
  moodStats: Record<string, number>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function WellbeingWellnessView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<WellnessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mood: "neutral",
    tags: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/student/wellbeing/wellness");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading entries");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/v1/student/wellbeing/wellness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create entry");
      const result = await response.json();

      if (result.success) {
        setFormData({ title: "", content: "", mood: "neutral", tags: [] });
        setShowForm(false);
        fetchEntries();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating entry");
    } finally {
      setSubmitting(false);
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case "happy": return "bg-yellow-100 text-yellow-800";
      case "motivated": return "bg-green-100 text-green-800";
      case "calm": return "bg-blue-100 text-blue-800";
      case "anxious": return "bg-red-100 text-red-800";
      case "frustrated": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={ar ? "مذكرة الصحة والعافية" : "Wellness Journal"}
          description={ar ? "تتبع مشاعرك وتحسن صحتك النفسية" : "Track your feelings and improve your mental health"}
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          {ar ? "إضافة مدخل" : "New Entry"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "العنوان" : "Title"}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={ar ? "اختر عنواناً لمدخلك" : "Title for your entry"}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "المحتوى" : "Content"}
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={ar ? "اكتب أفكارك ومشاعرك..." : "Write your thoughts and feelings..."}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "المزاج" : "Mood"}
              </label>
              <select
                value={formData.mood}
                onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="happy">{ar ? "سعيد" : "Happy"}</option>
                <option value="motivated">{ar ? "متحفز" : "Motivated"}</option>
                <option value="calm">{ar ? "هادئ" : "Calm"}</option>
                <option value="neutral">{ar ? "محايد" : "Neutral"}</option>
                <option value="anxious">{ar ? "قلق" : "Anxious"}</option>
                <option value="frustrated">{ar ? "محبط" : "Frustrated"}</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                {ar ? "حفظ" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                {ar ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Mood Statistics */}
      {data && Object.keys(data.moodStats).length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            {ar ? "إحصائيات المزاج" : "Mood Statistics"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {Object.entries(data.moodStats).map(([mood, count]) => (
              <div key={mood} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">{mood}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data && data.entries.length > 0 ? (
        <div className="space-y-4">
          {data.entries.map((entry) => (
            <Card key={entry.id} className="p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{entry.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {entry.mood && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMoodColor(entry.mood)}`}>
                    {entry.mood}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 line-clamp-3 mb-3">{entry.content}</p>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {ar ? "لم تقم بكتابة أي مدخلات بعد" : "No journal entries yet"}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            {ar ? "ابدأ الآن" : "Start Writing"}
          </button>
        </Card>
      )}
    </div>
  );
}
