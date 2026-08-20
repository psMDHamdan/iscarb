"use client";

import { use, useState, useMemo, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/lib/use-api-query";
import { useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRoadmap } from "@/components/lecture/ProgressRoadmap";
import { GenerationProgress } from "@/components/lecture/GenerationProgress";
import { StemRenderer } from "@/components/ui/StemRenderer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Edit3,
  CheckCircle2,
  Flame,
  BookOpen,
  Zap,
  Target,
  Layers,
  BarChart2,
  ShieldCheck,
} from "lucide-react";

interface SlidePlan {
  id: string;
  slideNo: number;
  function: string;
  title: string;
  interactionType: string | null;
  visualIntent?: string;
  cloIds: string[];
  sourceBlockIds: string[];
  approved: boolean;
}

interface PlanResponse {
  slides: SlidePlan[];
  summary?: { total: number; approved: number; interactions: Record<string, number> };
  project: { status: string; courseProfile: { cloApprovedAt: string | null } };
}

const FUNCTION_TONE: Record<string, { color: string; label: string; labelAr: string }> = {
  // Legacy names
  hook: { color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", label: "Hook", labelAr: "التمهيد الجاذب" },
  domain_spine: { color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30", label: "Domain Spine", labelAr: "هيكل المجال" },
  clos: { color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", label: "CLOs", labelAr: "مخرجات التعلّم" },
  h_stack: { color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30", label: "H-Stack", labelAr: "مكدس المعرفة" },
  foundation: { color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30", label: "Foundation", labelAr: "التأسيس" },
  misconception: { color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30", label: "Misconception", labelAr: "الفهم الخاطئ" },
  deep_dive: { color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30", label: "Deep Dive", labelAr: "التحليل العميق" },
  application: { color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30", label: "Application", labelAr: "التطبيق العملي" },
  rubric: { color: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30", label: "Rubric", labelAr: "المعيار والتقييم" },
  evidence: { color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30", label: "Evidence", labelAr: "حزمة الأدلة" },
  readiness: { color: "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-600/30", label: "Readiness", labelAr: "جاهزية المقرر" },
  // New learning progression names
  problem: { color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", label: "Problem", labelAr: "فهم المشكلة" },
  mental_map: { color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30", label: "Mental Map", labelAr: "الخريطة الذهنية" },
  prior_knowledge: { color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30", label: "Prior Knowledge", labelAr: "المعرفة السابقة" },
  core_concept: { color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30", label: "Core Concept", labelAr: "المفهوم الأساسي" },
  mechanism: { color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30", label: "Mechanism", labelAr: "الآلية" },
  worked_example: { color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30", label: "Worked Example", labelAr: "مثال تطبيقي" },
  guided_practice: { color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30", label: "Guided Practice", labelAr: "تدريب موجّه" },
  independent_practice: { color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30", label: "Independent Practice", labelAr: "تدريب مستقل" },
  deeper_mechanism: { color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30", label: "Deeper Mechanism", labelAr: "آلية متعمقة" },
  trade_off: { color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30", label: "Trade-Off", labelAr: "المفاضلة" },
  real_case: { color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30", label: "Real Case", labelAr: "حالة واقعية" },
  guided_application: { color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30", label: "Guided Application", labelAr: "تطبيق موجّه" },
  independent_application: { color: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30", label: "Independent Application", labelAr: "تطبيق مستقل" },
  decision_challenge: { color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30", label: "Decision Challenge", labelAr: "تحدي القرار" },
  transfer_challenge: { color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30", label: "Transfer Challenge", labelAr: "تحدي النقل" },
};

const PHASE_BLOCKS = [
  { id: 1, title: "Phase 1: Orientation & Framework", titleAr: "المرحلة 1: التمهيد وتأطير المقرر", range: [1, 4], icon: Flame, color: "border-amber-500/30 bg-amber-500/5 text-amber-600" },
  { id: 2, title: "Phase 2: Foundation & Core Concepts", titleAr: "المرحلة 2: التأسيس والمعرفة المحورية", range: [5, 8], icon: BookOpen, color: "border-blue-500/30 bg-blue-500/5 text-blue-600" },
  { id: 3, title: "Phase 3: Deep Dive & Calculation", titleAr: "المرحلة 3: التحليل العميق والتطبيقات الحسابية", range: [9, 13], icon: Zap, color: "border-cyan-500/30 bg-cyan-500/5 text-cyan-600" },
  { id: 4, title: "Phase 4: Saudi Application & Context", titleAr: "المرحلة 4: التكييف مع الرؤية والواقع السعودي", range: [14, 17], icon: Target, color: "border-teal-500/30 bg-teal-500/5 text-teal-600" },
  { id: 5, title: "Phase 5: Evaluation & Sovereign Readiness", titleAr: "المرحلة 5: التقييم وجاهزية الاعتماد", range: [18, 20], icon: ShieldCheck, color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600" },
];

export default function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [jobId, setJobId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [editingSlide, setEditingSlide] = useState<SlidePlan | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editInteraction, setEditInteraction] = useState<string>("none");
  const [editVisualIntent, setEditVisualIntent] = useState("");

  const { data, isLoading, error } = useApiQuery<PlanResponse>(
    ["lecture", "plan", id],
    `/api/iscarb/lecture/projects/${id}/plan`,
    { enabled: !jobId, staleTime: 0 },
  );

  // Auto-resume progress tracking if page is refreshed while generation is running
  useEffect(() => {
    if (data?.project.status === "generating" && !jobId) {
      setJobId(id);
    }
  }, [data?.project.status, jobId, id]);

  const generate = useApiMutation<{ jobId: string; slideCount: number }, { regenerate?: boolean }>(
    `/api/iscarb/lecture/projects/${id}/plan`,
    { onSuccess: (r) => setJobId(r.jobId) },
  );

  const approve = useApiMutation<{ approvedAt: string }, Record<string, never>>(
    `/api/iscarb/lecture/projects/${id}/plan/approve`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["lecture", "plan", id] });
        queryClient.invalidateQueries({ queryKey: ["iscarb", "lecture", "plan", id] });
      },
      invalidateKeys: () => [
        ["lecture", "plan", id],
        ["iscarb", "lecture", "plan", id],
      ],
    }
  );

  const toggleSlide = useApiMutation<{ slide: SlidePlan }, { slideNo: number; approved: boolean }>(
    (vars) => `/api/iscarb/lecture/projects/${id}/plan/${vars.slideNo}`,
    {
      method: "PATCH",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["lecture", "plan", id] });
        queryClient.invalidateQueries({ queryKey: ["iscarb", "lecture", "plan", id] });
      },
      invalidateKeys: () => [
        ["lecture", "plan", id],
        ["iscarb", "lecture", "plan", id],
      ],
    }
  );

  const updateSlideDetails = useApiMutation<{ slide: SlidePlan }, { slideNo: number; title: string; interactionType: string | null; visualIntent?: string }>(
    (vars) => `/api/iscarb/lecture/projects/${id}/plan/${vars.slideNo}`,
    {
      method: "PATCH",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["lecture", "plan", id] });
        queryClient.invalidateQueries({ queryKey: ["iscarb", "lecture", "plan", id] });
        setEditingSlide(null);
      },
      invalidateKeys: () => [
        ["lecture", "plan", id],
        ["iscarb", "lecture", "plan", id],
      ],
    }
  );

  if (!isLoading && error && !data) {
    if (error.message.includes("404")) notFound();
  }

  const slides = data?.slides ?? [];
  const cloApproved = !!data?.project.courseProfile.cloApprovedAt;
  const allApproved = slides.length === 20 && slides.every((s) => s.approved);

  const pollCount = slides.filter((s) => s.interactionType === "poll").length;
  const pauseCount = slides.filter((s) => s.interactionType === "pause_discuss").length;

  const filteredSlides = useMemo(() => {
    if (activeFilter === "all") return slides;
    if (activeFilter === "poll") return slides.filter((s) => s.interactionType === "poll");
    if (activeFilter === "pause_discuss") return slides.filter((s) => s.interactionType === "pause_discuss");
    if (activeFilter === "worked_example") return slides.filter((s) => s.interactionType === "worked_example");
    if (activeFilter === "collaboration") return slides.filter((s) => s.interactionType === "collaboration");
    return slides;
  }, [slides, activeFilter]);

  const openEditor = (s: SlidePlan) => {
    setEditingSlide(s);
    setEditTitle(s.title);
    setEditInteraction(s.interactionType ?? "none");
    setEditVisualIntent(s.visualIntent ?? "");
  };

  const saveSlideChanges = () => {
    if (!editingSlide) return;
    updateSlideDetails.mutate({
      slideNo: editingSlide.slideNo,
      title: editTitle,
      interactionType: editInteraction === "none" ? null : editInteraction,
      visualIntent: editVisualIntent,
    });
  };

  return (
    <div className="space-y-8 pb-32">
      <PageHeader
        title={ar ? "خطة iSCARB" : "iSCARB Plan"}
        description={ar ? "الخطة المكوّنة من 20 شريحة S1–S20 حسب إطار iSCARB المكون من 5 مراحل." : "The 20-slide S1–S20 plan structured into the 5 core iSCARB pedagogical phases."}
        breadcrumbs={[{ label: ar ? "محاضراتي" : "My Lectures", href: "/faculty/lecture" }, { label: ar ? "الخطة" : "Plan" }]}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={!cloApproved || generate.isPending || !!jobId}
              onClick={() => generate.mutate({ regenerate: slides.length === 20 })}
            >
              {generate.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {slides.length > 0 ? (ar ? "إعادة توليد" : "Regenerate") : ar ? "توليد الخطة" : "Generate plan"}
            </Button>
            <Button
              disabled={slides.length === 0 || approve.isPending}
              onClick={() => approve.mutate({})}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            >
              <Check className="mr-2 h-4 w-4" /> {allApproved ? (ar ? "معتمد بالكامل" : "Plan Approved") : (ar ? "اعتماد الخطة بالكامل" : "Approve Full Plan")}
            </Button>
          </div>
        }
      />

      {!cloApproved && slides.length === 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6 flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-amber-700 dark:text-amber-400">
              {ar
                ? "اعتمد مخرجات التعلّم أولاً قبل توليد الخطة (الحد الأدنى مخرج واحد)."
                : "Approve the learning outcomes before generating the plan (min 1 CLO)."}
            </p>
          </CardContent>
        </Card>
      )}

      {jobId && (
        <Card>
          <CardContent className="p-4">
            <GenerationProgress
              jobId={jobId}
              onDone={() => {
                queryClient.invalidateQueries({ queryKey: ["iscarb", "lecture", "plan", id] });
                setJobId(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {isLoading && <Skeleton className="h-64 rounded-xl" />}

      {generate.isError && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 text-sm text-red-500" role="alert">{generate.error.message}</CardContent>
        </Card>
      )}

      {slides.length > 0 && (
        <>
          {/* Summary & Compliance Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-display font-bold tabular-nums text-slate-800">{slides.length}/20</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-0.5">{ar ? "الشرائح المخططة" : "Planned Slides"}</p>
                </div>
                <Layers className="h-8 w-8 text-slate-300" />
              </CardContent>
            </Card>

            <Card className="border-emerald-200/60 bg-emerald-50/50 backdrop-blur-md shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-display font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {data?.summary?.approved ?? 0}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600/70 mt-0.5">{ar ? "معتمدة" : "Approved"}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
              </CardContent>
            </Card>

            <Card className="border-cyan-200/60 bg-cyan-50/50 backdrop-blur-md shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-display font-bold tabular-nums text-cyan-700">
                    {Object.values(data?.summary?.interactions ?? {}).reduce((a, b) => a + b, 0)}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600/70 mt-0.5">{ar ? "التفاعلات الأكاديمية" : "Interactions"}</p>
                </div>
                <BarChart2 className="h-8 w-8 text-cyan-500/30" />
              </CardContent>
            </Card>
          </div>

          <ProgressRoadmap
            slots={slides.map((s) => ({ slideNo: s.slideNo, fn: s.function, approved: s.approved }))}
          />

          {/* Interaction Filters */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-muted-foreground uppercase mr-2">{ar ? "التصفية حسب التفاعل:" : "Filter:"}</span>
              {[
                { id: "all", label: ar ? "الكل (20)" : "All (20)" },
                { id: "poll", label: ar ? `استطلاعات (${pollCount})` : `Polls (${pollCount})` },
                { id: "pause_discuss", label: ar ? `مناقشات (${pauseCount})` : `Pause & Discuss (${pauseCount})` },
                { id: "worked_example", label: ar ? "تمرين حسابي" : "Worked Example" },
                { id: "collaboration", label: ar ? "تفاعل جماعي" : "Collaboration" },
              ].map((f) => (
                <Button
                  key={f.id}
                  variant={activeFilter === f.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(f.id)}
                  className="rounded-full text-xs"
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 5 Structural iSCARB Phases */}
          <div className="space-y-10">
            {PHASE_BLOCKS.map((phase) => {
              const phaseSlides = filteredSlides.filter(
                (s) => s.slideNo >= phase.range[0] && s.slideNo <= phase.range[1]
              );
              if (phaseSlides.length === 0) return null;

              const Icon = phase.icon;

              return (
                <div key={phase.id} className="space-y-4">
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${phase.color}`}>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0" />
                      <div>
                        <h3 className="font-display font-bold text-base">{ar ? phase.titleAr : phase.title}</h3>
                        <p className="text-xs opacity-80 mt-0.5">Slides S{phase.range[0]} – S{phase.range[1]}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-background/80 font-mono text-xs">
                      {phaseSlides.filter((s) => s.approved).length}/{phaseSlides.length} Approved
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {phaseSlides.map((s) => {
                      const config = FUNCTION_TONE[s.function] ?? { color: "", label: s.function, labelAr: s.function };
                      return (
                        <Card key={s.id} className="group border border-border/80 hover:border-[#0F7B8A]/40 transition-all shadow-sm">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-sm font-black text-muted-foreground group-hover:bg-[#0F7B8A]/10 group-hover:text-[#0F7B8A] transition-colors">
                                S{s.slideNo}
                              </div>

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="text-base font-bold text-foreground">
                                    <StemRenderer text={s.title} inline />
                                  </div>
                                  <Badge variant="outline" className={`text-xs capitalize ${config.color}`}>
                                    {ar ? config.labelAr : config.label}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-2.5 flex-wrap text-xs text-muted-foreground pt-0.5">
                                  {s.interactionType && (
                                    <span className="font-semibold text-[#0F7B8A] capitalize bg-[#0F7B8A]/10 px-2 py-0.5 rounded-md border border-[#0F7B8A]/20">
                                      {s.interactionType.replace("_", " ")}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                    {s.cloIds.length} {ar ? "مخرج تعلّم" : `CLO${s.cloIds.length !== 1 ? "s" : ""}`}
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                    {ar ? `مربوط بـ ${s.sourceBlockIds.length} كتل من PDF` : `Grounded in ${s.sourceBlockIds.length} PDF Block${s.sourceBlockIds.length !== 1 ? "s" : ""}`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditor(s)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                {ar ? "تعديل" : "Edit"}
                              </Button>

                              <button
                                type="button"
                                onClick={() => toggleSlide.mutate({ slideNo: s.slideNo, approved: !s.approved })}
                                disabled={toggleSlide.isPending}
                                className="focus:outline-none transition-transform active:scale-95"
                              >
                                {s.approved ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer py-1 px-3">
                                    ✓ {ar ? "معتمد" : "Approved"}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer py-1 px-3">
                                    {ar ? "قيد الانتظار" : "Pending"}
                                  </Badge>
                                )}
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-6">
            <Button
              onClick={() => router.push(`/faculty/lecture/${id}/studio`)}
              className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white shadow-lg shadow-[#0E6C3C]/20 rounded-xl px-6 py-6 text-base"
            >
              {ar ? "الانتقال إلى الاستوديو" : "Continue to Studio"} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </>
      )}

      {/* Slide Editing Modal */}
      <Dialog open={!!editingSlide} onOpenChange={(open) => !open && setEditingSlide(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-[#0F7B8A]" />
              {ar ? `تعديل الشريحة S${editingSlide?.slideNo}` : `Edit Slide S${editingSlide?.slideNo}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                {ar ? "عنوان الشريحة" : "Slide Title"}
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter slide title..."
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                {ar ? "نوع التفاعل الأكاديمي" : "Academic Interaction Type"}
              </label>
              <select
                value={editInteraction}
                onChange={(e) => setEditInteraction(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium"
              >
                <option value="none">None (Explanation standard)</option>
                <option value="poll">Poll (Active Recall)</option>
                <option value="pause_discuss">Pause & Discuss (Peer Learning)</option>
                <option value="worked_example">Worked Example (Calculation/Analysis)</option>
                <option value="collaboration">Collaborative Task</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                {ar ? "الرؤية البصرية الشاملة" : "Visual Intent / Layout Goal"}
              </label>
              <Textarea
                value={editVisualIntent}
                onChange={(e) => setEditVisualIntent(e.target.value)}
                placeholder="Describe intended layout, e.g. Split-screen calculation table..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSlide(null)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={saveSlideChanges}
              disabled={updateSlideDetails.isPending || !editTitle.trim()}
              className="bg-[#0F7B8A] text-white hover:bg-[#0F7B8A]/90"
            >
              {updateSlideDetails.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التغييرات" : "Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
