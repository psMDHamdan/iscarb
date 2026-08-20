"use client";

import { useApp } from "@/lib/store";
import { PageHeader } from "@/components/iscarb/PageHeader";
import { StudentDashboardHero } from "@/components/iscarb/StudentDashboardHero";
import { useApiQuery, useApiMutation } from "@/hooks/use-api-query";
import { Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { useMemo, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { UnifiedDashboardData, AIBriefingData } from "@/services/unified-dashboard.service";

// Import all 13 widget components
import {
  AIDailyBriefing,
  SmartActionCenter,
  AcademicSnapshot,
  LearningSnapshot,
  AssessmentSnapshot,
  CompetencySnapshot,
  CareerSnapshot,
  PortfolioSnapshot,
  ResearchSnapshot,
  CommunitySnapshot,
  WellnessSnapshot,
  KnowledgeSnapshot,
  NotificationsCenter,
} from "@/components/dashboard/widgets";

/* ──────────── Types ──────────── */

interface UnifiedResponse {
  success: boolean;
  data: UnifiedDashboardData;
}

interface BriefingResponse {
  success: boolean;
  data: AIBriefingData;
}

/* ──────────── Helpers ──────────── */

function greetingForHour(): { en: string; ar: string } {
  const h = new Date().getHours();
  if (h < 12) return { en: "Good morning", ar: "صباح الخير" };
  if (h < 17) return { en: "Good afternoon", ar: "مساء الخير" };
  return { en: "Good evening", ar: "مساء الخير" };
}

/* ──────────── Component ──────────── */

export function StudentDashboardView() {
  const { lang } = useApp();
  const ar = lang === "ar";

  // ── Fetch ALL dashboard data via the unified endpoint ──
  const { data: unifiedRes, isLoading } = useApiQuery<UnifiedResponse>(
    ["dashboard", "unified"],
    "/api/v1/student/dashboard/unified"
  );

  // ── AI Briefing mutation ──
  const briefingMutation = useApiMutation<BriefingResponse, Record<string, never>>(
    "/api/v1/student/dashboard/ai-briefing",
    { method: "POST" }
  );

  const unified = unifiedRes?.data;
  const g = greetingForHour();

  // ── Briefing data (prefer mutation result for re-generated briefing) ──
  const briefingData = useMemo(() => {
    if (briefingMutation.data?.data) return briefingMutation.data.data;
    return unified?.aiBriefing ?? null;
  }, [briefingMutation.data, unified?.aiBriefing]);

  const handleGenerateBriefing = useCallback(() => {
    briefingMutation.mutate({});
  }, [briefingMutation]);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title={ar ? "نظرة عامة" : "Overview"}
          description={ar ? "لوحة التحكم الذكية" : "Your intelligent command center"}
        />
        <div className="space-y-6 pb-12">
          {/* Hero skeleton */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                </div>
              </div>
            </div>
          </div>
          {/* Widget skeletons */}
          <div className="grid gap-6 lg:grid-cols-2">
            {[1,2,3,4].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {[1,2,3,4].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={ar ? "نظرة عامة" : "Overview"}
        description={unified ? `${g[lang]}, ${unified.student.name}` : (ar ? "لوحة التحكم الذكية" : "Your intelligent command center")}
      />
      <div className="space-y-6 pb-12">

        {/* ═══════ HERO ═══════ */}
        <StudentDashboardHero />

        {/* ═══════ SECTION 1: AI Briefing + Action Center ═══════ */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AIDailyBriefing
            data={briefingData}
            loading={false}
            onGenerate={handleGenerateBriefing}
            isGenerating={briefingMutation.isPending}
            ar={ar}
          />
          <SmartActionCenter
            data={unified?.actionCenter ?? null}
            loading={!unified}
            ar={ar}
          />
        </div>

        {/* ═══════ SECTION 2: Academic + Learning Snapshots ═══════ */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AcademicSnapshot
            data={unified?.academic ?? null}
            loading={!unified}
            ar={ar}
          />
          <LearningSnapshot
            data={unified?.learning ?? null}
            loading={!unified}
            ar={ar}
          />
        </div>

        {/* ═══════ SECTION 3: Assessment + Competency Snapshots ═══════ */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AssessmentSnapshot
            data={unified?.assessment ?? null}
            loading={!unified}
            ar={ar}
          />
          <CompetencySnapshot
            data={unified?.competency ?? null}
            loading={!unified}
            ar={ar}
          />
        </div>

        {/* ═══════ SECTION 4: Career + Portfolio Snapshots ═══════ */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CareerSnapshot
            data={unified?.career ?? null}
            loading={!unified}
            ar={ar}
          />
          <PortfolioSnapshot
            data={unified?.portfolio ?? null}
            loading={!unified}
            ar={ar}
          />
        </div>

        {/* ═══════ SECTION 5: Research + Community Snapshots ═══════ */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ResearchSnapshot
            data={unified?.research ?? null}
            loading={!unified}
            ar={ar}
          />
          <CommunitySnapshot
            data={unified?.community ?? null}
            loading={!unified}
            ar={ar}
          />
        </div>

        {/* ═══════ SECTION 7: Wellness + Knowledge Snapshots ═══════ */}
        <div className="grid gap-6 lg:grid-cols-2">
          <WellnessSnapshot
            data={unified?.wellness ?? null}
            loading={!unified}
            ar={ar}
          />
          <KnowledgeSnapshot
            data={unified?.knowledge ?? null}
            loading={!unified}
            ar={ar}
          />
        </div>

        {/* ═══════ SECTION 8: Notifications Center (full width) ═══════ */}
        <NotificationsCenter
          data={unified?.notifications ?? null}
          loading={!unified}
          ar={ar}
        />

        {/* ═══════ Risk Alerts Banner ═══════ */}
        {unified?.aiBriefing.riskAlerts && unified.aiBriefing.riskAlerts.length > 0 && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/80 dark:bg-red-950/20 dark:border-red-800/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-sm text-red-600">
                {ar ? "تنبيهات تحتاج إلى اهتمام" : "Alerts Needing Attention"}
              </h3>
            </div>
            <div className="space-y-2">
              {unified.aiBriefing.riskAlerts.slice(0, 3).map((alert, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Sparkles className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">{alert.course}</p>
                    <p className="text-[11px] text-red-600/70 dark:text-red-400/70">{alert.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
