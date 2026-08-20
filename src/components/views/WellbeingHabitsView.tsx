"use client";
import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card } from "@/components/ui/card";
import {
  Target, Loader2, Plus, AlertCircle, CheckCircle2, Flame, Trophy
} from "lucide-react";

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  targetCount: number;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number;
  thisWeekCount: number;
  lastCompletedAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface HabitsData {
  habits: Habit[];
  summary: {
    total: number;
    active: number;
    totalCompletions: number;
    avgStreak: number;
  };
}

export function WellbeingHabitsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const { data: rawRes, isLoading: loading, error: queryError, refetch } = useApiQuery<any>(
    ["student", "wellbeing", "habits"],
    "/api/v1/student/wellbeing/habits?activeOnly=false",
  );
  const data = rawRes?.data ?? rawRes as HabitsData | null;
  const error = queryError?.message ?? null;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    habitName: "",
    description: "",
    frequency: "daily",
    targetCount: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [completingHabit, setCompletingHabit] = useState<string | null>(null);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.habitName.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/v1/student/wellbeing/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create habit");
      const result = await response.json();

      if (result.success) {
        setFormData({ habitName: "", description: "", frequency: "daily", targetCount: 1 });
        setShowForm(false);
        refetch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating habit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    try {
      setCompletingHabit(habitId);
      const response = await fetch("/api/v1/student/wellbeing/habits/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId }),
      });

      if (!response.ok) throw new Error("Failed to complete habit");
      const result = await response.json();

      if (result.success) {
        refetch();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error completing habit");
    } finally {
      setCompletingHabit(null);
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "daily": return ar ? "يومي" : "Daily";
      case "weekly": return ar ? "أسبوعي" : "Weekly";
      case "monthly": return ar ? "شهري" : "Monthly";
      default: return freq;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={ar ? "تتبع العادات" : "Habits Tracker"}
          description={ar ? "بناء عادات صحية وتحسين حياتك" : "Build healthy habits and improve your life"}
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="h-4 w-4" />
          {ar ? "إضافة عادة" : "New Habit"}
        </button>
      </div>

      {/* Create Habit Form */}
      {showForm && (
        <Card className="p-6 bg-green-50 border-green-200">
          <form onSubmit={handleCreateHabit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "اسم العادة" : "Habit Name"}
              </label>
              <input
                type="text"
                value={formData.habitName}
                onChange={(e) => setFormData({ ...formData, habitName: e.target.value })}
                placeholder={ar ? "مثال: اشرب 8 أكواب ماء" : "E.g. Drink 8 glasses of water"}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "الوصف" : "Description"}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={ar ? "لماذا هذه العادة مهمة لك؟" : "Why is this habit important?"}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {ar ? "التكرار" : "Frequency"}
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="daily">{ar ? "يومي" : "Daily"}</option>
                  <option value="weekly">{ar ? "أسبوعي" : "Weekly"}</option>
                  <option value="monthly">{ar ? "شهري" : "Monthly"}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {ar ? "الهدف" : "Target"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.targetCount}
                  onChange={(e) => setFormData({ ...formData, targetCount: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                {ar ? "إنشاء" : "Create"}
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

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{data.summary.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {ar ? "إجمالي العادات" : "Total Habits"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{data.summary.active}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {ar ? "العادات النشطة" : "Active"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">{data.summary.totalCompletions}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {ar ? "الإكمالات الكلية" : "Completions"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-1">
              <Flame className="h-5 w-5 text-orange-500" />
              <div className="text-2xl font-bold text-orange-600">{data.summary.avgStreak}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {ar ? "متوسط السلسلة" : "Avg Streak"}
            </div>
          </Card>
        </div>
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
      ) : data && data.habits.length > 0 ? (
        <div className="space-y-4">
          {data.habits.map((habit) => (
            <Card key={habit.id} className={`p-6 border-l-4 ${habit.isActive ? "border-l-green-500" : "border-l-gray-300"}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{habit.name}</h3>
                  {habit.description && (
                    <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-xs font-medium text-gray-600">
                      {getFrequencyLabel(habit.frequency)}
                    </span>
                    {habit.currentStreak > 0 && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Flame className="h-4 w-4" />
                        <span className="font-medium">{habit.currentStreak}</span>
                      </div>
                    )}
                    {habit.bestStreak > 0 && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Trophy className="h-4 w-4" />
                        <span className="font-medium">{habit.bestStreak}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCompleteHabit(habit.id)}
                  disabled={completingHabit === habit.id}
                  className="p-3 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50 transition"
                >
                  {completingHabit === habit.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {/* This Week Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      {ar ? "هذا الأسبوع" : "This Week"}
                    </span>
                    <span className="text-sm font-medium">
                      {habit.thisWeekCount} / {habit.targetCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((habit.thisWeekCount / Math.max(1, habit.targetCount)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Overall Completion Rate */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      {ar ? "معدل الإكمال" : "Completion Rate"}
                    </span>
                    <span className="text-sm font-medium">{habit.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${habit.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-700">{habit.totalCompletions}</div>
                    <div className="text-xs text-muted-foreground">
                      {ar ? "الإكمالات" : "Completions"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-orange-600">{habit.currentStreak}</div>
                    <div className="text-xs text-muted-foreground">
                      {ar ? "السلسلة الحالية" : "Current Streak"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-yellow-600">{habit.bestStreak}</div>
                    <div className="text-xs text-muted-foreground">
                      {ar ? "أفضل سلسلة" : "Best Streak"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {ar ? "لم تقم بإنشاء أي عادات بعد" : "No habits created yet"}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="h-4 w-4" />
            {ar ? "ابدأ الآن" : "Create Your First Habit"}
          </button>
        </Card>
      )}
    </div>
  );
}