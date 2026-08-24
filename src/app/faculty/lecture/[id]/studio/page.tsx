"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRoadmap } from "@/components/lecture/ProgressRoadmap";
import { SlidePreviewCard } from "@/components/lecture/SlidePreviewCard";
import { GenerationProgress } from "@/components/lecture/GenerationProgress";
import {
  Sparkles,
  AlertCircle,
  Check,
  Edit3,
  Pencil,
  MessageSquare,
  RefreshCw,
  Eye,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import type { SlideContentJson } from "@/lib/lecture/generation/types";
import { StemRenderer } from "@/components/ui/StemRenderer";
import dynamic from "next/dynamic";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { StudentExperienceViewModel } from "@/lib/lecture/projections/types";

interface ArtifactsResponse {
  project: { id: string; status: string };
  plans: {
    id: string;
    slideNo: number;
    function: string;
    title: string;
    interactionType: string | null;
    approved: boolean;
  }[];
  artifacts: {
    id: string;
    slideNo: number;
    version: number;
    status: string;
    contentJson: SlideContentJson;
  }[];
}

const SLIDE_STATUS: Record<string, { color: string; label: string }> = {
  draft: { color: "text-amber-600 bg-amber-500/10 border-amber-500/30", label: "Draft" },
  generated: { color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30", label: "Generated" },
  edited: { color: "text-blue-600 bg-blue-500/10 border-blue-500/30", label: "Edited" },
  flagged: { color: "text-red-600 bg-red-500/10 border-red-500/30", label: "Flagged" },
};

// Deferred — ConceptContent pulls framer-motion into the bundle; it only
// renders behind the "Student Learning Experience" tab, so load it on demand.
const ConceptContent = dynamic(
  () =>
    import("@/components/views/experience/ConceptContent").then(
      (m) => m.ConceptContent
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-96 rounded-2xl" />,
  }
);

export default function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedSlideNo, setSelectedSlideNo] = useState<number>(1);
  const [regenSlideNo, setRegenSlideNo] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"slide" | "student_view" | "script">("slide");

  const { data, isLoading, error } = useApiQuery<ArtifactsResponse>(
    ["lecture", "artifacts", id],
    `/api/iscarb/lecture/projects/${id}/artifacts`,
    {
      enabled: !!id,
      staleTime: 30_000,
      refetchInterval: (query) => {
        if (query.state.status === "error" || query.state.error) return false;
        const artifacts = query.state.data?.artifacts ?? [];
        return !!jobId || (artifacts.length > 0 && artifacts.length < 20) ? 1500 : false;
      },
    },
  );

  // Live student projection — the SAME API + view model the student player renders,
  // so the faculty Studio preview always matches what students actually see.
  const experienceQuery = useApiQuery<StudentExperienceViewModel>(
    ["lecture", "experience", id],
    `/api/iscarb/lecture/experience/PREVIEW_${id}`,
    {
      // Fetch lazily — the projection is only rendered on the "Student Learning
      // Experience" tab, and live-refreshes there while a generation job runs.
      enabled: !!id && activeTab === "student_view",
      staleTime: 30_000,
      refetchInterval: (query) => {
        if (query.state.status === "error" || query.state.error) return false;
        return !!jobId ? 2000 : false;
      },
    },
  );
  const currentStudentConcept = useMemo(() => {
    const exp = experienceQuery.data;
    if (!exp) return undefined;
    return Object.values(exp.concepts).find((c) => c.orderIndex === selectedSlideNo);
  }, [experienceQuery.data, selectedSlideNo]);

  const [genError, setGenError] = useState<string | null>(null);

  const generate = useApiMutation<{ jobId: string; slidesQueued: number }, { slideNos?: number[] }>(
    `/api/iscarb/lecture/projects/${id}/generate`,
    {
      onSuccess: (r) => {
        setGenError(null);
        setJobId(r.jobId);
      },
      onError: (err) => {
        setRegenSlideNo(null);
        setGenError(err.message || "Generation failed. Please try again.");
      },
    }
  );

  const updateArtifact = useApiMutation<
    { success: boolean },
    { slideNo: number; contentJson: Record<string, any> }
  >(
    `/api/iscarb/lecture/projects/${id}/artifacts`,
    {
      method: "PATCH",
      invalidateKeys: () => [
        ["lecture", "artifacts", id],
        ["lecture", "experience", id],
      ],
    }
  );

  const [editingScript, setEditingScript] = useState(false);
  const [scriptDraft, setScriptDraft] = useState("");

  // Student-content editing (what students see in the player).
  const [editingStudent, setEditingStudent] = useState(false);
  const [studentDraft, setStudentDraft] = useState<{
    studentCoreInsight: string;
    studentAnalogy: string;
    studentFramework: string;
    studentMechanismExplanation: string;
    studentScenario: string;
    studentApplication: string;
  } | null>(null);

  const startStudentEdit = () => {
    setStudentDraft({
      studentCoreInsight: content?.studentCoreInsight ?? "",
      studentAnalogy: content?.studentAnalogy ?? "",
      studentFramework: content?.studentFramework ?? "",
      studentMechanismExplanation: content?.studentMechanismExplanation ?? "",
      studentScenario: content?.studentScenario ?? "",
      studentApplication: content?.studentApplication ?? "",
    });
    setEditingStudent(true);
  };

  const saveStudentContent = () => {
    if (!currentArtifact || !studentDraft) return;
    updateArtifact.mutate(
      {
        slideNo: selectedSlideNo,
        contentJson: {
          ...(currentArtifact.contentJson as Record<string, any>),
          ...studentDraft,
        },
      },
      {
        onSuccess: () => {
          setEditingStudent(false);
          setStudentDraft(null);
        },
      }
    );
  };

  if (!isLoading && error && !data) {
    if (error.message.includes("404")) notFound();
  }

  const plans = data?.plans ?? [];
  const bySlide = useMemo(() => new Map(data?.artifacts.map((a) => [a.slideNo, a]) ?? []), [data?.artifacts]);
  const experienceError = experienceQuery.error;
  const generatedCount = data?.artifacts.length ?? 0;

  const currentPlan = plans.find((p) => p.slideNo === selectedSlideNo) ?? plans[0];
  const currentArtifact = bySlide.get(selectedSlideNo);
  const content = currentArtifact?.contentJson;

  const handleSingleRegen = (slideNo: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRegenSlideNo(slideNo);
    generate.mutate({ slideNos: [slideNo] });
  };

  const handleSaveScript = () => {
    if (!currentArtifact) return;
    const existingContent = (currentArtifact.contentJson as Record<string, any>) || {};
    updateArtifact.mutate({
      slideNo: selectedSlideNo,
      contentJson: {
        ...existingContent,
        speakerNotes: scriptDraft,
      },
    });
    setEditingScript(false);
  };

  return (
    <div className="space-y-8 pb-32">
      <PageHeader
        title={ar ? "استوديو المحتوى" : "Content Studio"}
        description={
          ar
            ? "معاينة وتحرير محتوى الشرائح المولدة، سيناريو المحاضر، والمواءمة الوطنية."
            : "Preview and edit generated slide content, instructor scripts, and Saudi alignment slide-by-slide."
        }
        breadcrumbs={[
          { label: ar ? "محاضراتي" : "My Lectures", href: "/faculty/lecture" },
          { label: ar ? "الاستوديو" : "Studio" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/student/lecture/PREVIEW_${id}`} target="_blank">
              <Button
                variant="outline"
                disabled={bySlide.size === 0}
                className="border-[#0F7B8A]/40 text-[#0F7B8A] hover:bg-[#0F7B8A]/10 font-semibold"
              >
                <Eye className="mr-2 h-4 w-4" />
                {ar ? "معاينة تجربة الطالب" : "Preview as Student"}
              </Button>
            </Link>
            <Button
              variant="outline"
              disabled={plans.length === 0 || generate.isPending || !!jobId}
              onClick={() => handleSingleRegen(selectedSlideNo)}
              className="border-border hover:bg-muted font-semibold"
            >
              <RefreshCw className={`mr-2 h-4 w-4 text-[#0F7B8A] ${regenSlideNo === selectedSlideNo && (generate.isPending || !!jobId) ? "animate-spin" : ""}`} />
              {ar ? `توليد S${selectedSlideNo}` : `Regenerate S${selectedSlideNo}`}
            </Button>
            <Button
              disabled={plans.length === 0 || generate.isPending || !!jobId}
              onClick={() => {
                setRegenSlideNo(null);
                generate.mutate({});
              }}
              className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white shadow-lg shadow-[#0E6C3C]/20 font-bold"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {bySlide.size > 0
                ? ar
                  ? "إعادة توليد الـ 20 شريحة"
                  : "Regenerate All 20"
                : ar
                  ? "توليد محتوى الـ 20 شريحة"
                  : "Generate All 20 Slides"}
            </Button>
          </div>
        }
      />

      {jobId && (
        <Card>
          <CardContent className="p-4">
            <GenerationProgress
              jobId={jobId}
              onDone={() => {
                queryClient.invalidateQueries({ queryKey: ["iscarb", "lecture", "artifacts", id] });
                setJobId(null);
                setRegenSlideNo(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {genError && !jobId && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-red-700 dark:text-red-400 flex-1">{genError}</p>
            <button onClick={() => setGenError(null)} className="text-red-400 hover:text-red-600 text-xs underline shrink-0">Dismiss</button>
          </CardContent>
        </Card>
      )}

      {plans.length === 0 && !isLoading && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6 flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-amber-700 dark:text-amber-400">
              {ar
                ? "اعمل على خطة iSCARB المكوّنة من 20 شريحة أولاً قبل توليد المحتوى."
                : "Generate the 20-slide iSCARB plan first before generating content."}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && <Skeleton className="h-96 rounded-2xl" />}

      {data && plans.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border border-white/60 dark:border-slate-700/50 shadow-lg shadow-slate-200/40 dark:shadow-black/20 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
              <CardContent className="p-5 text-center relative z-10">
                <p className="text-3xl font-display font-black tabular-nums text-slate-900 dark:text-white">{generatedCount}/20</p>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mt-1">
                  {ar ? "شرائح مولدة" : "Slides Generated"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border border-emerald-200/60 dark:border-emerald-800/50 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/20 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-400/20 rounded-full blur-[30px] pointer-events-none" />
              <CardContent className="p-5 text-center relative z-10">
                <p className="text-3xl font-display font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                  {data.artifacts.filter((a) => a.status === "generated" || a.status === "edited").length}
                </p>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-500 mt-1">
                  {ar ? "جاهزة للاستخدام" : "Ready Artifacts"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border border-[#0F7B8A]/20 dark:border-[#0F7B8A]/30 shadow-lg shadow-[#0F7B8A]/10 dark:shadow-[#0F7B8A]/5 rounded-2xl bg-[#0F7B8A]/[0.03] dark:bg-[#0F7B8A]/10 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-[#0F7B8A]/20 hover:-translate-y-0.5">
              <CardContent className="p-5 text-center relative z-10">
                <p className="text-3xl font-display font-black tabular-nums text-[#0F7B8A] dark:text-[#38b2c4]">
                  {plans.filter((p) => p.interactionType).length}
                </p>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F7B8A]/70 dark:text-[#38b2c4]/70 mt-1">
                  {ar ? "تفاعلات نشطة" : "Active Tasks"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border border-slate-200/60 dark:border-slate-700/50 shadow-lg shadow-slate-200/40 dark:shadow-black/20 rounded-2xl bg-slate-50/70 dark:bg-slate-800/70 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
              <CardContent className="p-5 text-center relative z-10">
                <p className="text-3xl font-display font-black tabular-nums text-slate-800 dark:text-slate-200">
                  S{selectedSlideNo}
                </p>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mt-1">
                  {ar ? "الشريحة المحددة" : "Selected Slide"}
                </p>
              </CardContent>
            </Card>
          </div>



          {/* DUAL-PANE WORKBENCH */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT SIDEBAR: Slide Selector (4 Cols) */}
            <div className="lg:col-span-4 space-y-2 max-h-[750px] overflow-y-auto pr-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                {ar ? "قائمة الشرائح الـ 20" : "20-Slide Index"}
              </h3>
              {plans.map((p) => {
                const art = bySlide.get(p.slideNo);
                const isSelected = p.slideNo === selectedSlideNo;
                const statusConfig = SLIDE_STATUS[art?.status ?? "draft"] ?? SLIDE_STATUS.draft;
                const isThisRegen = regenSlideNo === p.slideNo && (generate.isPending || !!jobId);

                return (
                  <div
                    key={p.slideNo}
                    onClick={() => setSelectedSlideNo(p.slideNo)}
                    className={`group relative p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between ${isSelected
                      ? "border-[#0F7B8A]/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-900/20 dark:to-teal-900/10 shadow-md shadow-[#0F7B8A]/5"
                      : "border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 hover:border-[#0F7B8A]/30 hover:bg-white/80 dark:hover:bg-slate-800/80 backdrop-blur-sm shadow-sm"
                      }`}
                  >
                    {/* Spinner Overlay while this slide is regenerating */}
                    {isThisRegen && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10 shadow-inner">
                        <RefreshCw className="h-5 w-5 text-[#0F7B8A] animate-spin" />
                      </div>
                    )}

                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-xs shadow-sm transition-colors ${isSelected ? "bg-gradient-to-br from-emerald-500 to-[#0F7B8A] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}
                      >
                        S{p.slideNo}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-bold ${isSelected ? "text-emerald-800 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}>
                          {art?.contentJson?.title ?? p.title}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          <span>{p.function.replace(/_/g, " ")}</span>
                          {p.interactionType && <span>• {p.interactionType.replace(/_/g, " ")}</span>}
                          {art && (
                            <span className="text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40 px-1 rounded border border-teal-500/20">
                              Student Ready
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${statusConfig.color}`}>
                        {art ? `v${art.version}` : "Draft"}
                      </Badge>

                      {/* Hover-reveal per-slide inline regenerate button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleSingleRegen(p.slideNo, e)}
                        disabled={generate.isPending || !!jobId}
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#0F7B8A] hover:bg-[#0F7B8A]/10 hover:text-[#0F7B8A] shrink-0 cursor-pointer"
                        title={ar ? `إعادة توليد S${p.slideNo}` : `Regenerate S${p.slideNo}`}
                        aria-label={`Regenerate slide ${p.slideNo}`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isThisRegen ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT PANE: Slide Content & Inspector Workbench (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Inspection Tabs */}
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "slide", label: ar ? "معاينة الشريحة" : "Slide Canvas", icon: Eye },
                    { id: "student_view", label: ar ? "محتوى الطالب" : "Student Learning Experience", icon: GraduationCap },
                    { id: "script", label: ar ? "سيناريو المحاضر" : "Instructor Script", icon: MessageSquare },
                  ].map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={activeTab === tab.id ? "bg-[#0F7B8A] text-white hover:bg-[#0F7B8A]/90 font-bold" : ""}
                    >
                      <tab.icon className="mr-1.5 h-4 w-4" />
                      {tab.label}
                    </Button>
                  ))}
                </div>

                {currentArtifact && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      v{currentArtifact.version} • {currentArtifact.status}
                    </Badge>
                    {currentArtifact.status === "superseded" && (
                      <Badge className="bg-slate-600 text-white text-[10px]">superseded</Badge>
                    )}
                  </div>
                )}
              </div>

              {/* TAB 1: SLIDE CANVAS */}
              {activeTab === "slide" && (
                <div className="space-y-4">
                  {currentArtifact && (
                    <div className="flex justify-end">
                      <Link href={`/faculty/lecture/${id}/studio/${selectedSlideNo}`}>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
                          <Edit3 className="mr-1.5 h-3.5 w-3.5 text-[#0F7B8A]" />
                          {ar ? "تعديل الشريحة" : "Edit Slide"}
                        </Button>
                      </Link>
                    </div>
                  )}
                  <SlidePreviewCard
                    slideNo={selectedSlideNo}
                    content={content ? { ...content, fn: currentPlan.function } as any : null}
                    total={20}
                    className="shadow-2xl"
                    projectId={id}
                    onRegenerate={() => handleSingleRegen(selectedSlideNo)}
                    onRemoveFacultyImage={async () => {
                      queryClient.invalidateQueries({ queryKey: ["iscarb", "lecture", "artifacts", id] });
                    }}
                    onSaveVisual={async (visualData) => {
                      if (!currentArtifact) return;
                      // Faculty upload already persisted via the upload route — just refresh.
                      if (visualData.facultyUploaded) {
                        queryClient.invalidateQueries({ queryKey: ["iscarb", "lecture", "artifacts", id] });
                        return;
                      }
                      await fetch(`/api/iscarb/lecture/projects/${id}/artifacts`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          artifactId: currentArtifact.id,
                          slideNo: selectedSlideNo,
                          visualSpec: {
                            fetchedImageUrl: visualData.imageUrl,
                            imageUrl: visualData.imageUrl,
                            title: visualData.title,
                            caption: visualData.caption,
                          },
                        }),
                      });
                      queryClient.invalidateQueries({ queryKey: ["iscarb", "lecture", "artifacts", id] });
                    }}
                  />
                </div>
              )}

              {/* TAB 2: STUDENT LEARNING EXPERIENCE — live projection (identical to student player) */}
              {activeTab === "student_view" && (
                <div className="space-y-4">
                  {/* Top Bar with Live Preview Link */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#0F7B8A]/15 to-[#0E6C3C]/15 border border-[#0F7B8A]/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F7B8A] text-white shadow-md">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {ar ? "محتوى الطالب المولد لهذه الشريحة" : `Generated Student Experience for Slide ${selectedSlideNo}`}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {ar ? "نفس العرض الذي يراه الطالب تمامًا — تحقق من تطابق المحتوى قبل النشر." : "Exactly what the student sees — verify the content matches before publishing."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!editingStudent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={startStudentEdit}
                          disabled={!currentArtifact}
                          className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl"
                        >
                          <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                          {ar ? "تعديل محتوى الطالب" : "Edit Student Content"}
                        </Button>
                      )}
                      <Link href={`/student/lecture/PREVIEW_${id}`} target="_blank">
                        <Button size="sm" className="bg-[#0F7B8A] hover:bg-[#0F7B8A]/90 text-white font-bold text-xs shadow-md">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          {ar ? "فتح مشغل الطالب" : "Open Student Player"}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* EDIT MODE — faculty authors exactly what students see */}
                  {editingStudent && studentDraft ? (
                    <Card className="border border-emerald-300/80 bg-white shadow-sm">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2 border-b border-emerald-100">
                        <Edit3 className="h-4 w-4 text-[#0E6C3C]" />
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                          {ar ? "تحرير ما يراه الطالب — الشريحة" : "Edit What Students See — Slide"} {selectedSlideNo}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-3 space-y-3">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {ar
                            ? "احتفظ بأي حقل فارغًا لاستخدام المحتوى المُولَّد تلقائيًا. الحقول المملوءة تظهر للطلاب كما كتبتها تمامًا."
                            : "Leave a field empty to use the auto-generated content. Filled fields appear to students exactly as written."}
                        </p>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            {ar ? "الرؤية الجوهرية (Core Insight)" : "Core Insight"}
                          </Label>
                          <Textarea
                            value={studentDraft.studentCoreInsight}
                            onChange={(e) => setStudentDraft({ ...studentDraft, studentCoreInsight: e.target.value })}
                            rows={2}
                            className="text-xs rounded-xl border-emerald-200"
                            placeholder={ar ? "الفكرة الأساسية التي يجب أن يفهمها الطالب..." : "The single key idea the student should understand..."}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            {ar ? "تخيلها كالتالي (التشبيه)" : "Think of It Like This (Analogy)"}
                          </Label>
                          <Textarea
                            value={studentDraft.studentAnalogy}
                            onChange={(e) => setStudentDraft({ ...studentDraft, studentAnalogy: e.target.value })}
                            rows={3}
                            className="text-xs rounded-xl border-emerald-200"
                            placeholder={ar ? "تشبيه ملموس من الحياة الواقعية..." : "A concrete real-world metaphor students can picture..."}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            {ar ? "الإطار المفاهيمي (Framework)" : "Core Framework"}
                          </Label>
                          <Input
                            value={studentDraft.studentFramework}
                            onChange={(e) => setStudentDraft({ ...studentDraft, studentFramework: e.target.value })}
                            className="text-xs rounded-xl border-emerald-200"
                            placeholder={ar ? "ملخص خطوة بخطوة للمفهوم..." : "A short step-by-step summary of the concept..."}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            {ar ? "كيف تعمل الآلية (How It Works)" : "How It Works (Mechanism)"}
                          </Label>
                          <Textarea
                            value={studentDraft.studentMechanismExplanation}
                            onChange={(e) => setStudentDraft({ ...studentDraft, studentMechanismExplanation: e.target.value })}
                            rows={3}
                            className="text-xs rounded-xl border-emerald-200"
                            placeholder={ar ? "شرح الآلية خطوة بخطوة..." : "Explain the mechanism step by step..."}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            {ar ? "السيناريو الواقعي (Real-World Scenario)" : "Real-World Scenario"}
                          </Label>
                          <Textarea
                            value={studentDraft.studentScenario}
                            onChange={(e) => setStudentDraft({ ...studentDraft, studentScenario: e.target.value })}
                            rows={2}
                            className="text-xs rounded-xl border-emerald-200"
                            placeholder={ar ? "موقف واقعي يطبَّق فيه المفهوم..." : "A realistic situation where this concept is applied..."}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            {ar ? "التطبيق العملي (Application)" : "Application"}
                          </Label>
                          <Textarea
                            value={studentDraft.studentApplication}
                            onChange={(e) => setStudentDraft({ ...studentDraft, studentApplication: e.target.value })}
                            rows={2}
                            className="text-xs rounded-xl border-emerald-200"
                            placeholder={ar ? "كيف يُستخدم هذا في الممارسة..." : "How this is used in practice..."}
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-100">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingStudent(false);
                              setStudentDraft(null);
                            }}
                            className="text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                          >
                            {ar ? "إلغاء" : "Cancel"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveStudentContent}
                            disabled={updateArtifact.isPending}
                            className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white text-xs font-bold rounded-xl"
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            {updateArtifact.isPending
                              ? (ar ? "جارٍ الحفظ…" : "Saving…")
                              : (ar ? "حفظ محتوى الطالب" : "Save Student Content")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    /* Live projection of the selected concept (same API + component as the student player) */
                    experienceQuery.isLoading || (!experienceQuery.data && !experienceError) ? (
                      <Skeleton className="h-96 rounded-2xl" />
                    ) : experienceError &&
                      /NOT_GENERATED|not been generated/i.test((experienceError as Error)?.message ?? "") ? (
                      <Card className="border-amber-500/30 bg-amber-500/5">
                        <CardContent className="p-6 flex flex-col items-center gap-3 text-center text-sm">
                          <Sparkles className="h-6 w-6 text-amber-600" />
                          <p className="text-amber-800 dark:text-amber-300 font-semibold">
                            {ar
                              ? "لم يتم إنشاء محتوى الشرائح بعد."
                              : "No slide content has been generated yet."}
                          </p>
                          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 max-w-sm">
                            {ar
                              ? "شغّل توليد الشرائح ليرى الطلاب تجربة التعلم الكاملة هنا."
                              : "Run slide generation and the full student learning experience will appear here."}
                          </p>
                          <Button
                            size="sm"
                            disabled={generate.isPending || !!jobId}
                            onClick={() => generate.mutate({})}
                            className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white rounded-xl"
                          >
                            <Sparkles className="mr-1.5 h-4 w-4" />
                            {ar ? "توليد الشرائح" : "Generate Slides"}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : experienceError ? (
                      <Card className="border-red-500/30 bg-red-500/5">
                        <CardContent className="p-5 flex items-center gap-3 text-sm">
                          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                          <p className="text-red-700 dark:text-red-400 flex-1">
                            {ar ? "تعذر تحميل تجربة الطالب." : "Could not load the student experience."}{" "}
                            {(experienceError as Error)?.message}
                          </p>
                        </CardContent>
                      </Card>
                    ) : currentStudentConcept ? (
                      <div className="rounded-2xl border border-emerald-200/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                        <div className="max-h-[70vh] overflow-y-auto">
                          <ConceptContent concept={currentStudentConcept} ar={ar} />
                        </div>
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-6 text-sm text-slate-500 dark:text-slate-400">
                          {ar
                            ? `لا يوجد محتوى طالب معروض لهذه الشريحة بعد — قم بتوليد المحتوى أولاً.`
                            : `No student content to show for slide ${selectedSlideNo} yet — generate the slide content first.`}
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              )}

              {/* TAB 2: INSTRUCTOR SCRIPT (Green & White) */}
              {activeTab === "script" && (
                <Card className="border border-emerald-200/90 shadow-sm rounded-3xl overflow-hidden bg-white text-slate-900">
                  <CardHeader className="bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/50 border-b border-emerald-100 p-5 flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#0E6C3C]">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900">
                          {ar ? "سيناريو وشرح المحاضر" : "Instructor Script & Pedagogical Delivery"}
                        </CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Slide {selectedSlideNo} • {currentPlan.function.replace(/_/g, " ")} • {content?.title || "Slide Concept"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!editingScript ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setScriptDraft(content?.speakerNotes || "");
                            setEditingScript(true);
                          }}
                          className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl"
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          {ar ? "تعديل السيناريو" : "Edit Script"}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingScript(false)}
                            className="text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                          >
                            {ar ? "إلغاء" : "Cancel"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveScript}
                            disabled={updateArtifact.isPending}
                            className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white text-xs font-bold rounded-xl"
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            {updateArtifact.isPending ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ التعديلات" : "Save Script"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {editingScript ? (
                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-700">
                          {ar ? "نص سيناريو المحاضر المكتوب:" : "Verbatim Spoken Instructor Script:"}
                        </Label>
                        <Textarea
                          value={scriptDraft}
                          onChange={(e) => setScriptDraft(e.target.value)}
                          rows={6}
                          placeholder={ar ? "اكتب سيناريو الشرح والنقاط التوجيهية..." : "Enter instructor script, verbal cues, and delivery guide..."}
                          className="text-xs font-medium leading-relaxed rounded-xl border-emerald-200 focus-visible:ring-[#0E6C3C]"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/40 via-white to-emerald-50/20 text-xs sm:text-sm leading-[1.85] text-slate-800 whitespace-pre-wrap font-medium shadow-xs">
                          {content?.speakerNotes ? (
                            <StemRenderer content={content.speakerNotes} />
                          ) : (
                            <span className="text-slate-400 italic">
                              {ar ? "لا يوجد سيناريو شرح مولد لهذه الشريحة بعد." : `Introduce the central principle of ${content?.title || "this slide"}. Guide students to analyze the structural model and formulate their hypothesis before proceeding to the active task.`}
                            </span>
                          )}
                        </div>

                        {/* Structured Pedagogical Delivery Cue Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <div className="p-4 rounded-xl border border-emerald-100 bg-white space-y-1.5 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                              {ar ? "افتتاحية الشريحة وجذب الانتباه" : "Opening Verbal Hook"}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              "Look at how <strong className="text-slate-900">{content?.title || "this concept"}</strong> establishes the foundation. What happens when we analyze its primary mechanism?"
                            </p>
                          </div>

                          <div className="p-4 rounded-xl border border-emerald-100 bg-white space-y-1.5 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F7B8A]">
                              {ar ? "توجيه النظر للشكل التوضيحي" : "Visual Examination Cue"}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              "Direct students' attention to the central diagram to identify key components and sequence before starting the task."
                            </p>
                          </div>

                          <div className="p-4 rounded-xl border border-emerald-100 bg-white space-y-1.5 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                              {ar ? "سؤال التوقف والتفاعل الصفي" : "Formative Pause & Check"}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              {typeof content?.studentAction === "object"
                                ? (content?.studentAction as any)?.prompt || (content?.studentAction as any)?.task
                                : `Ask the room: "How does ${content?.title || "this principle"} behave under boundary conditions?"`}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl border border-emerald-100 bg-white space-y-1.5 shadow-xs">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                              {ar ? "جسر الانتقال للشريحة التالية" : "Bridge Transition (Next Step)"}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              "Now that we've mastered this mechanism, let's see how it connects directly to our next analytical milestone."
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
</CardContent>
                </Card>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
