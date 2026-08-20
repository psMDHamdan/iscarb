"use client";

import { use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useApiQuery } from "@/lib/use-api-query";
import { useApp } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { NationalAlignmentBanner } from "@/components/lecture/NationalAlignmentBanner";
import { GATE_KEYS } from "@/lib/lecture/quality/types";
import {
  alignmentStageDetail,
  alignmentStageState,
  jaheziahStageDetail,
  jaheziahStageState,
} from "@/lib/lecture/review/hub-stage-state";
import {
  Map,
  ListChecks,
  Layers,
  Inbox,
  ShieldCheck,
  Target,
  BookOpen,
  FileText,
  Send,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Activity,
  RefreshCw,
  Clock,
  Lock,
} from "lucide-react";

interface ProjectDetail {
  project: {
    id: string;
    title: string;
    status: string;
    currentVersion: number;
    nationalAlignmentMode: string;
    updatedAt: string;
    courseProfile: {
      courseCode: string;
      title: string;
      specialty: string;
      cloApprovedAt: string | null;
      selectedLectureCloIds: string[];
    };
  };
}

interface ProjectStats {
  sourceParsed: boolean;
  planExists: boolean;
  planApproved: boolean;
  approvedSlides: number;
  artifactsGenerated: boolean;
  approvedArtifacts: number;
  pendingDecisions: number;
  allGatesPassed: boolean;
  failedGates: number;
  readinessApproved: number;
  readinessTotal: number;
  readinessTotalApproved: number;
  jaheziahDecided: boolean;
  jaheziahMode: string | null;
  ncaaaMet: number;
  ncaaaTotal: number;
  ncaaaGaps: number;
}

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  parsing: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  planning: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  generating: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  review: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  approved_plan: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
  approved: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  exported: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

// 9 BRD Stages sequentially
const ALL_STAGES = [
  { href: "source-map", key: "Source Map", icon: Map, desc: "Verify mapping coverage" },
  { href: "plan", key: "iSCARB Plan", icon: ListChecks, desc: "Approve 20-slide blueprint" },
  { href: "studio", key: "Studio", icon: Layers, desc: "Edit slide content & notes" },
  { href: "inbox", key: "Decision Inbox", icon: Inbox, desc: "Resolve AI ambiguities" },
  { href: "quality", key: "Quality Gates", icon: ShieldCheck, desc: "Check heuristics & claims" },
  { href: "alignment", key: "Readiness & Align", icon: Target, desc: "Review mapped practice checks" },
  { href: "jaheziah", key: "National Standards", icon: BookOpen, desc: "Official specialty alignment" },
  { href: "ncaaa", key: "NCAAA Evidence", icon: FileText, desc: "Accreditation artifacts" },
  { href: "publish", key: "Publish", icon: Send, desc: "Export final package" },
] as const;

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useApp();
  const ar = lang === "ar";
  const router = useRouter();

  const { data, isLoading, error } = useApiQuery<ProjectDetail>(
    ["lecture", "project", id],
    `/api/iscarb/lecture/projects/${id}`,
    { staleTime: 0 },
  );

  const isGenerating = ["parsing", "planning", "generating"].includes(data?.project?.status ?? "");

  const { data: statsData } = useApiQuery<ProjectStats>(
    ["lecture", "stats", id],
    `/api/iscarb/lecture/projects/${id}/stats`,
    { refetchInterval: isGenerating ? 5000 : false }
  );

  if (!isLoading && error && !data) {
    if (error.message.includes("404")) notFound();
  }

  const p = data?.project;
  const s = statsData;

  const stageState: Record<string, "complete" | "active" | "pending" | "locked"> = {
    "source-map": s?.sourceParsed ? "complete" : "active",
    plan: s?.planApproved ? "complete" : s?.planExists ? "active" : "pending",
    studio: s?.approvedArtifacts === 20 ? "complete" : s?.artifactsGenerated ? "active" : s?.planExists ? "pending" : "locked",
    inbox: s?.pendingDecisions === 0 && s?.planApproved ? "complete" : s?.pendingDecisions && s.pendingDecisions > 0 ? "active" : "pending",
    quality: s?.allGatesPassed ? "complete" : s?.failedGates && s.failedGates > 0 ? "active" : "pending",
    alignment: alignmentStageState(s),
    jaheziah: jaheziahStageState(s),
    ncaaa: s && s.ncaaaTotal > 0 && s.ncaaaMet === s.ncaaaTotal ? "complete" : "pending",
    publish: p?.status === "exported" || p?.status === "approved" ? "complete" : "pending",
  };

  const stageDetail: Record<string, string | undefined> = {
    "source-map": s?.sourceParsed ? (ar ? "تم التحليل" : "Parsed") : undefined,
    plan: s ? `${s.approvedSlides}/20 ${ar ? "معتمد" : "approved"}` : undefined,
    studio: s ? `${s.approvedArtifacts}/20 ${ar ? "معتمد" : "approved"}` : undefined,
    inbox: s ? (s.pendingDecisions > 0 ? `${s.pendingDecisions} ${ar ? "معلق" : "pending"}` : ar ? "مكتمل" : "Clear") : undefined,
    quality: s ? (s.allGatesPassed ? (ar ? "تم الانجاز" : `All ${GATE_KEYS.length} passed`) : `${s.failedGates} ${ar ? "عائق" : "blockers"}`) : undefined,
    alignment: alignmentStageDetail(s, ar),
    jaheziah: jaheziahStageDetail(s, ar),
    ncaaa: s
      ? s.ncaaaTotal === 0
        ? ar ? "لا توجد معايير" : "No catalog"
        : `${s.ncaaaMet}/${s.ncaaaTotal} ${ar ? "مستوفى" : "met"}`
      : undefined,
  };

  const STATE_STYLE = {
    complete: {
      ring: "border-emerald-500/50 bg-emerald-500/5",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
    },
    active: {
      ring: "border-amber-500/50 bg-amber-500/5",
      icon: <RefreshCw className="h-4 w-4 text-amber-500 animate-spin shrink-0" />,
    },
    pending: {
      ring: "border-border/50 bg-card",
      icon: <Clock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />,
    },
    locked: {
      ring: "border-border/30 bg-muted/20 opacity-50 cursor-not-allowed pointer-events-none",
      icon: <Lock className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />,
    },
  };

  const completedStages = Object.values(stageState).filter((st) => st === "complete").length;
  // BRD NFR-17 / AC-27: hide Jaheziah stage in COURSE_READINESS mode
  const isCourseReadiness = p?.nationalAlignmentMode === "COURSE_READINESS";
  const STAGES = isCourseReadiness
    ? ALL_STAGES.filter((s) => s.href !== "jaheziah")
    : ALL_STAGES;
  const totalStages = STAGES.length;
  const pct = Math.round((completedStages / totalStages) * 100);

  return (
    <div className="space-y-8">
      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {p && (
        <>
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                <Badge
                  variant="outline"
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${STATUS_TONE[p.status] ?? STATUS_TONE.draft
                    }`}
                >
                  {p.status}
                </Badge>
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Activity className="h-4 w-4" /> v{p.currentVersion}
                </span>
              </div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">{p.title}</h1>
              <p className="text-lg text-muted-foreground">
                <span className="font-medium text-foreground">{p.courseProfile.courseCode}</span> — {p.courseProfile.title}
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => router.push(`/faculty/lecture/${p.id}/studio`)}
              className="bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white shadow-lg shadow-[#0E6C3C]/20 font-bold rounded-xl"
            >
              <Layers className="mr-2 h-5 w-5" />
              {ar ? "فتح الاستوديو" : "Open Studio"}
            </Button>
          </div>

          <NationalAlignmentBanner mode={p.nationalAlignmentMode} />

          {/* Compact 9-Stage Progress Ring Banner */}
          <div className="flex items-center gap-5 p-5 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-muted/30 to-card shadow-sm">
            <svg className="h-16 w-16 shrink-0 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" stroke="currentColor" className="text-muted/40" />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                strokeWidth="3"
                stroke={pct === 100 ? "#10B981" : "#0F7B8A"}
                strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
              <text
                x="18"
                y="22"
                textAnchor="middle"
                className="fill-current text-[8px] font-bold"
                transform="rotate(90 18 18)"
              >
                {pct}%
              </text>
            </svg>
            <div>
              <p className="text-lg font-display font-bold text-foreground">
                {completedStages}/{totalStages} {ar ? "مراحل مكتملة" : "Stages Complete"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ar ? "استمر — المحاضرة تتشكل وفق معايير الجودة والاعتماد الوطني" : "Keep going — your lecture transformation pipeline is taking shape"}
              </p>
            </div>
          </div>

          {/* Pipeline Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-foreground">{ar ? "مراحل التحويل" : "Transformation Pipeline"}</h2>
              <Badge variant="outline" className="font-mono text-xs font-bold">
                {totalStages} Stages
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {STAGES.map((sItem, idx) => {
                const stState = stageState[sItem.href] ?? "pending";
                const detail = stageDetail[sItem.href];
                const { ring, icon } = STATE_STYLE[stState];
                const isLocked = stState === "locked";

                return (
                  <Link
                    key={sItem.href}
                    href={isLocked ? "#" : `/faculty/lecture/${p.id}/${sItem.href}`}
                    className={`group relative ${isLocked ? "pointer-events-none" : ""}`}
                  >
                    <Card
                      className={`h-full relative overflow-hidden transition-all duration-300 ${ring} hover:-translate-y-0.5 hover:shadow-xl`}
                    >
                      {/* Number Indicator */}
                      <div className="absolute top-0 right-0 w-8 h-8 rounded-bl-xl bg-muted/50 flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:bg-[#0F7B8A]/10 group-hover:text-[#0F7B8A] transition-colors">
                        {idx + 1}
                      </div>

                      <CardContent className="flex flex-col gap-3 p-5 h-full justify-between">
                        <div className="flex items-center justify-between pr-6">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#0E6C3C]/10 to-[#0F7B8A]/10 border border-[#0F7B8A]/10 group-hover:border-[#0F7B8A]/30 transition-colors">
                            <sItem.icon className="h-5 w-5 text-[#0F7B8A] dark:text-[#58CE95]" />
                          </div>
                          {icon}
                        </div>

                        <div className="space-y-1">
                          <span className="font-semibold text-base group-hover:text-[#0F7B8A] transition-colors text-foreground block">
                            {sItem.key}
                          </span>
                          <p className="text-xs text-muted-foreground">{sItem.desc}</p>
                        </div>

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                          {detail ? (
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">{detail}</span>
                          ) : (
                            <span className="text-[10px] font-mono capitalize text-muted-foreground">{stState}</span>
                          )}
                          {!isLocked && (
                            <span className="flex items-center text-xs font-semibold text-[#0F7B8A] opacity-0 group-hover:opacity-100 transition-opacity">
                              {ar ? "دخول" : "Enter"} <ArrowRight className="ml-1 h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Course Details Card */}
          <Card className="mt-8 border-dashed bg-muted/20">
            <CardContent className="grid gap-6 p-6 text-sm sm:grid-cols-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ar ? "التخصص" : "Specialty"}</p>
                <p className="font-medium text-foreground">{p.courseProfile.specialty || "—"}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ar ? "تحديث مخرجات التعلم" : "CLOs Verified"}</p>
                <p className="font-medium text-foreground">
                  {p.courseProfile.cloApprovedAt ? new Date(p.courseProfile.cloApprovedAt).toLocaleDateString() : ar ? "في الانتظار" : "Pending"}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ar ? "آخر تعديل" : "Last Modified"}</p>
                <p className="font-medium text-foreground">{new Date(p.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
