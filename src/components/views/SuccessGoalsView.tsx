"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Target,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: "pending" | "in_progress" | "completed" | "abandoned";
  priority: number;
  progress: number;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
  milestones: string;
  relatedCompetencies: string;
}

interface GoalStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  abandoned: number;
  avgProgress: number;
}

export function SuccessGoalsView() {
  const { lang } = useApp();
  const { trackEvent } = useAnalytics();
  const ar = lang === "ar";

  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState<string>("");

  // Form state
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "academic",
    priority: 3,
    targetDate: "",
  });

  useEffect(() => {
    fetchGoals();
  }, [page, filter]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      trackEvent("page_view", { section: "success", page: "goals" });

      const params = new URLSearchParams({ page: String(page) });
      if (filter) params.append("status", filter);

      const response = await fetch(`/api/v1/student/goals?${params}`);
      if (!response.ok) throw new Error("Failed to fetch goals");

      const result = await response.json();
      if (result.success) {
        setGoals(result.data || []);
        setTotalPages(result.meta?.totalPages || 0);

        // Calculate stats
        const completed = result.data?.filter((g: Goal) => g.status === "completed").length || 0;
        const inProgress = result.data?.filter((g: Goal) => g.status === "in_progress").length || 0;
        const pending = result.data?.filter((g: Goal) => g.status === "pending").length || 0;
        const abandoned = result.data?.filter((g: Goal) => g.status === "abandoned").length || 0;
        const avgProgress = result.data
          ? Math.round(result.data.reduce((sum: number, g: Goal) => sum + g.progress, 0) / result.data.length)
          : 0;

        setStats({
          total: result.meta?.total || 0,
          completed,
          inProgress,
          pending,
          abandoned,
          avgProgress,
        });
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      trackEvent("error", { section: "success", page: "goals", error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.title.trim()) {
      setError(ar ? "أدخل عنوان الهدف" : "Please enter a goal title");
      return;
    }

    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/v1/student/goals/${editingId}`
        : "/api/v1/student/goals";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          targetDate: formData.targetDate || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save goal");

      const result = await response.json();
      if (result.success) {
        trackEvent("goal_action", { action: editingId ? "update" : "create" });
        setShowDialog(false);
        setFormData({ title: "", description: "", category: "academic", priority: 3, targetDate: "" });
        setEditingId(null);
        fetchGoals();
      } else {
        throw new Error(result.error || "Failed to save goal");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(ar ? "هل أنت متأكد من حذف هذا الهدف؟" : "Are you sure you want to delete this goal?")) return;

    try {
      const response = await fetch(`/api/v1/student/goals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete goal");

      trackEvent("goal_action", { action: "delete" });
      fetchGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const openEditDialog = (goal: Goal) => {
    setFormData({
      title: goal.title,
      description: goal.description || "",
      category: goal.category,
      priority: goal.priority,
      targetDate: goal.targetDate?.split("T")[0] || "",
    });
    setEditingId(goal.id);
    setShowDialog(true);
  };

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "الأهداف" : "Goals", href: "/student/success/goals" },
  ];

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-green-50 border-green-200 text-green-700";
      case 2:
        return "bg-blue-50 border-blue-200 text-blue-700";
      case 3:
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case 4:
        return "bg-orange-50 border-orange-200 text-orange-700";
      default:
        return "bg-red-50 border-red-200 text-red-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "الأهداف" : "Goals"} breadcrumbs={breadcrumbs} />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "أهدافي" : "My Goals"}
        description={ar ? "تعيين وتتبع أهدافك" : "Set and track your goals"}
        breadcrumbs={breadcrumbs}
      />

      <div className="space-y-6 pb-12">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-xs text-blue-700 mt-1">{ar ? "إجمالي الأهداف" : "Total Goals"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-green-700 mt-1">{ar ? "مكتملة" : "Completed"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                <p className="text-xs text-orange-700 mt-1">{ar ? "قيد التنفيذ" : "In Progress"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-purple-600">{stats.pending}</div>
                <p className="text-xs text-purple-700 mt-1">{ar ? "معلق" : "Pending"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-teal-600">{stats.avgProgress}%</div>
                <p className="text-xs text-teal-700 mt-1">{ar ? "متوسط التقدم" : "Avg Progress"}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-2">
            <Button
              variant={filter === "" ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter(""); setPage(0); }}
            >
              {ar ? "الكل" : "All"}
            </Button>
            <Button
              variant={filter === "in_progress" ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter("in_progress"); setPage(0); }}
            >
              {ar ? "قيد التنفيذ" : "In Progress"}
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter("completed"); setPage(0); }}
            >
              {ar ? "مكتملة" : "Completed"}
            </Button>
          </div>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setFormData({ title: "", description: "", category: "academic", priority: 3, targetDate: "" });
                  setEditingId(null);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {ar ? "هدف جديد" : "New Goal"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? (ar ? "تحديث الهدف" : "Update Goal") : (ar ? "هدف جديد" : "New Goal")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{ar ? "العنوان" : "Title"}</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={ar ? "أدخل عنوان الهدف" : "Enter goal title"}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{ar ? "الوصف" : "Description"}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={ar ? "أدخل وصف الهدف" : "Enter description"}
                    className="mt-1 w-full border rounded-md p-2 text-sm"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">{ar ? "الفئة" : "Category"}</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 w-full border rounded-md p-2 text-sm"
                    >
                      <option value="academic">{ar ? "أكاديمي" : "Academic"}</option>
                      <option value="career">{ar ? "مهني" : "Career"}</option>
                      <option value="personal">{ar ? "شخصي" : "Personal"}</option>
                      <option value="health">{ar ? "صحة" : "Health"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{ar ? "الأولوية" : "Priority"}</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="mt-1 w-full border rounded-md p-2 text-sm"
                    >
                      <option value="1">{ar ? "منخفضة جداً" : "Very Low"}</option>
                      <option value="2">{ar ? "منخفضة" : "Low"}</option>
                      <option value="3">{ar ? "متوسطة" : "Medium"}</option>
                      <option value="4">{ar ? "عالية" : "High"}</option>
                      <option value="5">{ar ? "عالية جداً" : "Very High"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{ar ? "التاريخ المستهدف" : "Target Date"}</label>
                    <Input
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    {ar ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button onClick={handleCreateOrUpdate}>
                    {editingId ? (ar ? "تحديث" : "Update") : (ar ? "إنشاء" : "Create")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="pt-12 text-center pb-12">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  {ar ? "لم تقم بإنشاء أي أهداف بعد" : "No goals created yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <div className="mt-1">
                          {goal.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Target className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{goal.title}</h3>
                          {goal.description && <p className="text-sm text-gray-600 mt-1">{goal.description}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(goal)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityColor(goal.priority)}`}>
                      {ar
                        ? goal.priority === 1
                          ? "منخفضة جداً"
                          : goal.priority === 2
                            ? "منخفضة"
                            : goal.priority === 3
                              ? "متوسطة"
                              : goal.priority === 4
                                ? "عالية"
                                : "عالية جداً"
                        : ["Very Low", "Low", "Medium", "High", "Very High"][goal.priority - 1]}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(goal.status)}`}>
                      {ar
                        ? goal.status === "completed"
                          ? "مكتملة"
                          : goal.status === "in_progress"
                            ? "قيد التنفيذ"
                            : goal.status === "pending"
                              ? "معلقة"
                              : "مهجورة"
                        : goal.status}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {goal.category}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{ar ? "التقدم" : "Progress"}</span>
                      <span className="font-semibold">{goal.progress || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                        style={{ width: `${goal.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {goal.targetDate && (
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ar ? "الموعد النهائي:" : "Due:"} {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              {ar ? "السابق" : "Previous"}
            </Button>
            <span className="px-3 py-2 text-sm">
              {ar ? "الصفحة" : "Page"} {page + 1} {ar ? "من" : "of"} {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              {ar ? "التالي" : "Next"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
