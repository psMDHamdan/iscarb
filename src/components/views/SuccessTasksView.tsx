"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  ListTodo,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours: number;
  actualHours: number;
  tags: string;
  dependencies: string;
  createdAt: string;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  backlog: number;
  highPriority: number;
}

export function SuccessTasksView() {
  const { lang } = useApp();
  const { trackEvent } = useAnalytics();
  const ar = lang === "ar";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    estimatedHours: 0,
  });

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      trackEvent("page_view", { section: "success", page: "tasks" });

      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);

      const response = await fetch(`/api/v1/student/tasks?${params}`);
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      if (result.success) {
        setTasks(result.data || []);

        const completed = result.data?.filter((t: Task) => t.status === "completed").length || 0;
        const inProgress = result.data?.filter((t: Task) => t.status === "in_progress").length || 0;
        const backlog = result.data?.filter((t: Task) => t.status === "backlog").length || 0;
        const highPriority = result.data?.filter((t: Task) => t.priority === "high").length || 0;

        setStats({
          total: result.meta?.total || result.data?.length || 0,
          completed,
          inProgress,
          backlog,
          highPriority,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      trackEvent("error", { section: "success", page: "tasks", error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) return;

    try {
      const response = await fetch("/api/v1/student/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
        }),
      });

      if (response.ok) {
        trackEvent("task_created");
        setShowDialog(false);
        setFormData({ title: "", description: "", priority: "medium", dueDate: "", estimatedHours: 0 });
        fetchTasks();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/v1/student/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", completedAt: new Date() }),
      });

      if (response.ok) {
        trackEvent("task_completed");
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to complete task:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm(ar ? "هل تريد حذف هذه المهمة؟" : "Delete this task?")) return;

    try {
      const response = await fetch(`/api/v1/student/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        trackEvent("task_deleted");
        fetchTasks();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "المهام" : "Tasks", href: "/student/success/tasks" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "المهام" : "Tasks"} breadcrumbs={breadcrumbs} />
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 flex items-start gap-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                  <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-24 rounded-full" /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "إدارة المهام" : "Task Management"}
        description={ar ? "تنظيم ومتابعة مهامك" : "Organize and track your tasks"}
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

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-xs text-blue-600 mt-1">{ar ? "إجمالي" : "Total"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-green-600 mt-1">{ar ? "مكتملة" : "Completed"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                <p className="text-xs text-orange-600 mt-1">{ar ? "قيد التنفيذ" : "In Progress"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-gray-50 to-slate-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.backlog}</div>
                <p className="text-xs text-gray-600 mt-1">{ar ? "معلق" : "Backlog"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-pink-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
                <p className="text-xs text-red-600 mt-1">{ar ? "عالي الأولوية" : "High Priority"}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              {ar ? "الكل" : "All"}
            </Button>
            <Button
              variant={filter === "backlog" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("backlog")}
            >
              {ar ? "معلق" : "Backlog"}
            </Button>
            <Button
              variant={filter === "in_progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("in_progress")}
            >
              {ar ? "قيد التنفيذ" : "In Progress"}
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
            >
              {ar ? "مكتملة" : "Completed"}
            </Button>
          </div>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {ar ? "مهمة جديدة" : "New Task"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{ar ? "مهمة جديدة" : "New Task"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={ar ? "عنوان المهمة" : "Task title"}
                />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={ar ? "الوصف" : "Description"}
                  className="w-full border rounded-md p-2 text-sm"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="border rounded-md p-2 text-sm"
                  >
                    <option value="low">{ar ? "منخفضة" : "Low"}</option>
                    <option value="medium">{ar ? "متوسطة" : "Medium"}</option>
                    <option value="high">{ar ? "عالية" : "High"}</option>
                  </select>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    {ar ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button onClick={handleCreateTask}>{ar ? "إنشاء" : "Create"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title={ar ? "لا توجد مهام" : "No tasks"}
              description={ar ? "أنشئ مهمتك الأولى لتنظيم أعمالك" : "Create your first task to get organized"}
              action={{
                label: ar ? "مهمة جديدة" : "New Task",
                onClick: () => setShowDialog(true),
              }}
            />
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className={`mt-1 flex-shrink-0 ${task.status === "completed"
                          ? "text-green-600"
                          : "text-gray-300 hover:text-green-600"
                          }`}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                            {ar
                              ? task.priority === "high"
                                ? "عالية"
                                : task.priority === "medium"
                                  ? "متوسطة"
                                  : "منخفضة"
                              : task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
