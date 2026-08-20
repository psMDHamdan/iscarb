"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card } from "@/components/ui/card";
import {
  Clock, Loader2, Plus, AlertCircle, PlayCircle, PauseCircle,
  CheckCircle2, BarChart3
} from "lucide-react";

interface FocusSession {
  id: string;
  title: string;
  type: "general" | "review" | "practice" | "exam_prep";
  plannedMinutes: number;
  actualMinutes?: number;
  focusScore?: number;
  status: "in_progress" | "completed" | "abandoned";
  startedAt: string;
  completedAt?: string;
  notes?: string;
}

interface FocusSessionsData {
  sessions: FocusSession[];
  statistics: {
    totalSessions: number;
    completedSessions: number;
    totalPlannedMinutes: number;
    totalActualMinutes: number;
    avgFocusScore: number;
    avgSessionDuration: number;
  };
}

export function WellbeingFocusSessionsView() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const [data, setData] = useState<FocusSessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "general",
    plannedMinutes: 25,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionTimer, setSessionTimer] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTimer(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key]--;
          if (updated[key] <= 0) delete updated[key];
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async (status?: string) => {
    try {
      setLoading(true);
      const url = new URL("/api/v1/student/wellbeing/focus-sessions", window.location.origin);
      if (status) url.searchParams.append("status", status);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch("/api/v1/student/wellbeing/focus-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create session");
      const result = await response.json();

      if (result.success) {
        setActiveSessionId(result.data.id);
        setSessionTimer(prev => ({
          ...prev,
          [result.data.id]: result.data.plannedMinutes * 60
        }));
        setFormData({ title: "", type: "general", plannedMinutes: 25, notes: "" });
        setShowForm(false);
        fetchSessions();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSession = async (sessionId: string, actualMinutes: number, focusScore: number) => {
    try {
      const response = await fetch("/api/v1/student/wellbeing/focus-sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          actualMinutes,
          focusScore,
          status: "completed",
        }),
      });

      if (!response.ok) throw new Error("Failed to complete session");
      const result = await response.json();

      if (result.success) {
        setActiveSessionId(null);
        setSessionTimer(prev => {
          const updated = { ...prev };
          delete updated[sessionId];
          return updated;
        });
        fetchSessions();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error completing session");
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "general": return ar ? "عام" : "General";
      case "review": return ar ? "مراجعة" : "Review";
      case "practice": return ar ? "ممارسة" : "Practice";
      case "exam_prep": return ar ? "تحضير امتحان" : "Exam Prep";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "exam_prep": return "bg-red-100 text-red-800";
      case "practice": return "bg-green-100 text-green-800";
      case "review": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={ar ? "جلسات التركيز" : "Focus Sessions"}
          description={ar ? "إدارة جلسات الدراسة المركزة وتحسين الإنتاجية" : "Manage focused study sessions and boost productivity"}
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="h-4 w-4" />
          {ar ? "بدء جلسة" : "Start Session"}
        </button>
      </div>

      {/* Create Session Form */}
      {showForm && (
        <Card className="p-6 bg-purple-50 border-purple-200">
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "عنوان الجلسة" : "Session Title"}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={ar ? "مثال: مراجعة الرياضيات" : "E.g. Math Review"}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {ar ? "النوع" : "Type"}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="general">{ar ? "عام" : "General"}</option>
                  <option value="review">{ar ? "مراجعة" : "Review"}</option>
                  <option value="practice">{ar ? "ممارسة" : "Practice"}</option>
                  <option value="exam_prep">{ar ? "تحضير امتحان" : "Exam Prep"}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {ar ? "المدة (دقيقة)" : "Duration (minutes)"}
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={formData.plannedMinutes}
                  onChange={(e) => setFormData({ ...formData, plannedMinutes: parseInt(e.target.value) || 25 })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {ar ? "ملاحظات" : "Notes"}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={ar ? "ملاحظات إضافية..." : "Additional notes..."}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-16 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                {ar ? "بدء" : "Start"}
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

      {/* Statistics */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">{data.statistics.completedSessions}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {ar ? "جلسات مكتملة" : "Completed"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{data.statistics.totalActualMinutes}m</div>
            <div className="text-xs text-muted-foreground mt-1">
              {ar ? "وقت الدراسة" : "Study Time"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{data.statistics.avgSessionDuration}m</div>
            <div className="text-xs text-muted-foreground mt-1">
              {ar ? "متوسط الجلسة" : "Avg Duration"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{(data.statistics.avgFocusScore * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {ar ? "متوسط التركيز" : "Avg Focus"}
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
      ) : data && data.sessions.length > 0 ? (
        <div className="space-y-4">
          {data.sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            const timerValue = sessionTimer[session.id];

            return (
              <Card
                key={session.id}
                className={`p-6 border-l-4 ${
                  session.status === "completed"
                    ? "border-l-green-500 bg-green-50"
                    : "border-l-purple-500"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{session.title}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(session.type)}`}>
                        {getTypeLabel(session.type)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {isActive && timerValue !== undefined && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600 font-mono">
                        {formatTime(timerValue)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {ar ? "الوقت المتبقي" : "Time Left"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Session Details */}
                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {ar ? "المدة المخطط لها" : "Planned"}
                    </div>
                    <div className="text-lg font-semibold">{session.plannedMinutes}m</div>
                  </div>
                  {session.actualMinutes && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {ar ? "الوقت الفعلي" : "Actual"}
                      </div>
                      <div className="text-lg font-semibold">{session.actualMinutes}m</div>
                    </div>
                  )}
                  {session.focusScore !== undefined && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {ar ? "درجة التركيز" : "Focus Score"}
                      </div>
                      <div className="text-lg font-semibold">{(session.focusScore * 100).toFixed(0)}%</div>
                    </div>
                  )}
                </div>

                {/* Session Notes */}
                {session.notes && (
                  <p className="text-sm text-gray-600 mb-4 italic">{session.notes}</p>
                )}

                {/* Status Badge and Action */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {session.status === "completed" && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">{ar ? "مكتملة" : "Completed"}</span>
                      </div>
                    )}
                    {session.status === "in_progress" && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-medium">{ar ? "قيد التنفيذ" : "In Progress"}</span>
                      </div>
                    )}
                  </div>

                  {session.status === "in_progress" && isActive && (
                    <button
                      onClick={() => {
                        const plannedMinutes = session.plannedMinutes;
                        const actualMinutes = Math.round(
                          (plannedMinutes - (timerValue || 0) / 60)
                        );
                        handleCompleteSession(session.id, actualMinutes, 0.8);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {ar ? "إنهاء" : "Finish"}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {ar ? "لم تقم ببدء أي جلسات بعد" : "No focus sessions started yet"}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="h-4 w-4" />
            {ar ? "ابدأ الآن" : "Start Your First Session"}
          </button>
        </Card>
      )}
    </div>
  );
}