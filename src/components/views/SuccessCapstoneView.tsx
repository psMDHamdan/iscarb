"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertCircle,
  BookOpen,
  Plus,
  CheckCircle2,
  Calendar,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAnalytics } from "@/hooks/useAnalytics";

interface CapstoneProject {
  id: string;
  title: string;
  description?: string;
  focusArea?: string;
  status: string;
  startDate: string;
  targetCompletionDate?: string;
  completedAt?: string;
  mentorId?: string;
  teamMembers: string;
  deliverables: string;
  milestones: string;
  grade?: string;
  feedback?: string;
}

interface CapstoneStats {
  totalProjects: number;
  inProgress: number;
  completed: number;
  avgGrade?: string;
}

export function SuccessCapstoneView() {
  const { lang } = useApp();
  const { trackEvent } = useAnalytics();
  const ar = lang === "ar";

  const [projects, setProjects] = useState<CapstoneProject[]>([]);
  const [stats, setStats] = useState<CapstoneStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<CapstoneProject | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    focusArea: "",
    targetCompletionDate: "",
  });

  useEffect(() => {
    fetchCapstoneProjects();
  }, []);

  const fetchCapstoneProjects = async () => {
    try {
      setLoading(true);
      trackEvent("page_view", { section: "success", page: "capstone" });

      const response = await fetch("/api/v1/student/capstone");
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      if (result.success) {
        setProjects(result.data?.projects || []);
        setStats(result.data?.stats || null);
        if (result.data?.projects?.length > 0) {
          setSelectedProject(result.data.projects[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      trackEvent("error", { section: "success", page: "capstone", error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.title.trim()) return;

    try {
      const response = await fetch("/api/v1/student/capstone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          targetCompletionDate: formData.targetCompletionDate || null,
        }),
      });

      if (response.ok) {
        trackEvent("capstone_created");
        setShowDialog(false);
        setFormData({ title: "", description: "", focusArea: "", targetCompletionDate: "" });
        fetchCapstoneProjects();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "ideation":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const breadcrumbs = [
    { label: ar ? "الرئيسية" : "Home", href: "/student" },
    { label: ar ? "النجاح" : "Success", href: "/student/success" },
    { label: ar ? "مشروع التخرج" : "Capstone", href: "/student/success/capstone" },
  ];

  if (loading) {
    return (
      <>
        <PageHeader title={ar ? "مشروع التخرج" : "Capstone Project"} breadcrumbs={breadcrumbs} />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "مشروع التخرج" : "Capstone Project"}
        description={ar ? "مستشار ومرشد مشروع التخرج" : "Your capstone project advisor"}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalProjects}</div>
                <p className="text-xs text-blue-600 mt-1">{ar ? "إجمالي المشاريع" : "Total Projects"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                <p className="text-xs text-orange-600 mt-1">{ar ? "قيد التنفيذ" : "In Progress"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-green-600 mt-1">{ar ? "مكتملة" : "Completed"}</p>
              </CardContent>
            </Card>
            {stats.avgGrade && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.avgGrade}</div>
                  <p className="text-xs text-purple-600 mt-1">{ar ? "متوسط التقدير" : "Avg Grade"}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {ar ? "مشروع جديد" : "New Project"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{ar ? "مشروع تخرج جديد" : "New Capstone Project"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={ar ? "عنوان المشروع" : "Project title"}
              />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={ar ? "الوصف" : "Description"}
                className="w-full border rounded-md p-2 text-sm"
                rows={3}
              />
              <Input
                value={formData.focusArea}
                onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
                placeholder={ar ? "مجال التركيز" : "Focus area"}
              />
              <Input
                type="date"
                value={formData.targetCompletionDate}
                onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  {ar ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleCreateProject}>{ar ? "إنشاء" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <Card className="lg:col-span-1">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">{ar ? "المشاريع" : "Projects"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{ar ? "لا توجد مشاريع" : "No projects"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`w-full text-left p-3 rounded-lg border transition ${selectedProject?.id === project.id
                        ? "bg-blue-50 border-blue-300"
                        : "hover:bg-gray-50"
                        }`}
                    >
                      <p className="text-sm font-medium line-clamp-2">{project.title}</p>
                      <p className={`text-xs mt-1 px-2 py-0.5 rounded w-fit ${getStatusColor(project.status)}`}>
                        {project.status}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Details */}
          {selectedProject && (
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedProject.title}</h2>
                  {selectedProject.description && (
                    <p className="text-gray-600 mb-4">{selectedProject.description}</p>
                  )}

                  <div className="space-y-3">
                    {selectedProject.focusArea && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">{ar ? "مجال التركيز" : "Focus Area"}</p>
                        <p className="text-sm">{selectedProject.focusArea}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {ar ? "البدء:" : "Started:"} {new Date(selectedProject.startDate).toLocaleDateString()}
                    </div>

                    {selectedProject.targetCompletionDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {ar ? "الموعد النهائي:" : "Due:"}{" "}
                        {new Date(selectedProject.targetCompletionDate).toLocaleDateString()}
                      </div>
                    )}

                    <div className={`text-sm px-3 py-1 rounded w-fit font-medium ${getStatusColor(selectedProject.status)}`}>
                      {ar
                        ? selectedProject.status === "completed"
                          ? "مكتملة"
                          : selectedProject.status === "in_progress"
                            ? "قيد التنفيذ"
                            : "في مرحلة الفكرة"
                        : selectedProject.status}
                    </div>
                  </div>

                  {selectedProject.grade && (
                    <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                      <p className="text-sm font-medium text-green-900">
                        {ar ? "التقدير" : "Grade"}: {selectedProject.grade}
                      </p>
                    </div>
                  )}

                  {selectedProject.feedback && (
                    <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-1">{ar ? "الملاحظات" : "Feedback"}</p>
                      <p className="text-sm text-blue-700">{selectedProject.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Capstone Tips */}
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">{ar ? "نصائح المشروع" : "Project Tips"}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm font-medium text-blue-900">1. {ar ? "حدد الهدف بوضوح" : "Define Clear Goals"}</p>
                  </div>
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm font-medium text-green-900">2. {ar ? "كسّر المشروع إلى خطوات" : "Break Down into Steps"}</p>
                  </div>
                  <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                    <p className="text-sm font-medium text-orange-900">3. {ar ? "اطلب المساعدة" : "Seek Feedback"}</p>
                  </div>
                  <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                    <p className="text-sm font-medium text-purple-900">4. {ar ? "تابع التقدم" : "Track Progress"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
