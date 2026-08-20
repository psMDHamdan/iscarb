"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Plus, ArrowRight, BookOpen, Trash2, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectRow {
  id: string;
  title: string;
  status: string;
  currentVersion: number;
  updatedAt: string;
  courseProfile: { courseCode: string; title: string; specialty: string };
}

interface ProjectsResponse {
  projects: ProjectRow[];
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  draft: { color: "bg-muted text-muted-foreground", label: "Draft", icon: Clock },
  parsing: { color: "bg-blue-500/15 text-blue-500 border-blue-500/30", label: "Parsing", icon: RefreshCw },
  planning: { color: "bg-violet-500/15 text-violet-500 border-violet-500/30", label: "Planning", icon: RefreshCw },
  generating: { color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30", label: "Generating", icon: RefreshCw },
  review: { color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30", label: "Review", icon: Clock },
  approved_plan: { color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30", label: "Plan Approved", icon: CheckCircle2 },
  approved: { color: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30", label: "Approved", icon: CheckCircle2 },
  exported: { color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", label: "Exported", icon: CheckCircle2 },
  failed: { color: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30", label: "Failed", icon: Clock },
};

export default function LectureHomePage() {
  const { lang } = useApp();
  const ar = lang === "ar";
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useApiQuery<ProjectsResponse>(
    ["lecture", "projects"],
    "/api/iscarb/lecture/projects",
    { staleTime: 0 },
  );

  const deleteProject = useApiMutation<void, string>(
    (id) => `/api/iscarb/lecture/projects/${id}`,
    {
      method: "DELETE",
      invalidateKeys: () => [["lecture", "projects"]],
    }
  );

  const [projectToDelete, setProjectToDelete] = useState<ProjectRow | null>(null);

  const handleDelete = (e: React.MouseEvent, p: ProjectRow) => {
    e.stopPropagation();
    setProjectToDelete(p);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject.mutate(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={ar ? "محوّل المحاضرات" : "Lecture Compiler"}
        description={
          ar
            ? "حوّل مصادر مقررك إلى حزمة محاضرات iSCARB كاملة — خطة، شرائح، تقييمات، وأدلة اعتماد."
            : "Transform your course source into a complete iSCARB lecture package — plan, slides, assessments, and accreditation evidence."
        }
        actions={
          <Link href="/faculty/lecture/new">
            <Button size="lg" className="bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A] hover:opacity-90 transition-opacity shadow-lg shadow-[#0E6C3C]/20">
              <Plus className="mr-2 h-5 w-5" /> {ar ? "محاضرة جديدة" : "New Lecture"}
            </Button>
          </Link>
        }
      />

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-6 text-sm text-red-500 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="font-bold">!</span>
            </div>
            {ar ? "تعذر تحميل المحاضرات" : "Failed to load lectures"} — {error.message}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (data?.projects?.length ?? 0) === 0 && (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <div className="rounded-full bg-gradient-to-br from-[#0E6C3C]/15 to-[#0F7B8A]/15 p-6 animate-pulse">
              <BookOpen className="h-12 w-12 text-[#0E6C3C] dark:text-[#58CE95]" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">{ar ? "ابدأ أول تحويل" : "Start your first transformation"}</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                {ar
                  ? "ارفع ملف المقرر (PPTX/PDF/DOCX/HTML)، أدخل مخرجات التعلّم، واترك النظام يبني خطة المحاضرة."
                  : "Upload your course file (PPTX/PDF/DOCX/HTML), enter learning outcomes, and let the system build the lecture plan."}
              </p>
            </div>
            <Link href="/faculty/lecture/new" className="mt-4">
              <Button size="lg" className="bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A] hover:opacity-90 shadow-lg shadow-[#0E6C3C]/20">
                <Plus className="mr-2 h-5 w-5" /> {ar ? "إنشاء محاضرة" : "Create lecture"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(data?.projects ?? []).map((p) => {
          const config = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.draft;
          const StatusIcon = config.icon;
          return (
            <Card
              key={p.id}
              className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#0F7B8A]/40 flex flex-col cursor-pointer"
              onClick={() => router.push(`/faculty/lecture/${p.id}`)}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A] opacity-0 transition-opacity group-hover:opacity-100" />
              
              <CardHeader className="p-5 pb-0">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className={`flex items-center gap-1.5 border px-2.5 py-0.5 ${config.color}`}>
                    <StatusIcon className={`h-3 w-3 ${p.status.endsWith("ing") ? "animate-spin" : ""}`} />
                    <span className="font-medium text-[11px] uppercase tracking-wider">{config.label}</span>
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/50 hover:bg-red-500/10 hover:text-red-500 z-10 transition-colors"
                    onClick={(e) => handleDelete(e, p)}
                    title={ar ? "حذف" : "Delete"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardTitle className="mt-4 font-display text-lg font-bold leading-snug group-hover:text-[#0F7B8A] dark:group-hover:text-[#58CE95] line-clamp-2">
                  {p.title}
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  {p.courseProfile.courseCode} — {p.courseProfile.title}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 mt-auto pb-0">
                {p.courseProfile.specialty && (
                  <p className="text-xs text-muted-foreground truncate">
                    {ar ? "التخصص: " : "Specialty: "}{p.courseProfile.specialty}
                  </p>
                )}
              </CardContent>

              <CardFooter className="p-5 pt-4 mt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
                <div className="flex flex-col">
                  <span className="font-medium">v{p.currentVersion}</span>
                  <span className="text-[10px] opacity-70">{new Date(p.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-[#0F7B8A] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {ar ? "فتح" : "Open"} <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {ar ? "حذف المحاضرة؟" : "Delete Lecture?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {ar 
                ? `هل أنت متأكد أنك تريد حذف "${projectToDelete?.title}"؟ هذا الإجراء لا يمكن التراجع عنه وسيحذف جميع الملفات المرتبطة.`
                : `Are you sure you want to delete "${projectToDelete?.title}"? This action cannot be undone and will permanently remove all associated files and data.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProject.isPending}>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); confirmDelete(); }} 
              disabled={deleteProject.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteProject.isPending ? (ar ? "جاري الحذف..." : "Deleting...") : (ar ? "حذف" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
