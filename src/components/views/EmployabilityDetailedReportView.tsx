"use client";

import React, { useMemo, useState } from "react";
import {
  Award,
  ChevronDown,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThomasGauge } from "@/components/iscarb/ScoreMeter";
import { cn } from "@/lib/utils";
import {
  buildDimensionChapters,
  formatBandLabel,
} from "@/lib/assessment/dimension-report-sections";

const DIM_ACCENT: Record<string, string> = {
  core_professionalism: "bg-iscarb-green",
  business_digital: "bg-[#005f73]",
  job_fit: "bg-[#006838]",
  growth_potential: "bg-[#ca6702]",
};

function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uFFFD\u007F-\u009F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface EmployabilityAttemptSnapshot {
  id: string;
  kind: "employability";
  studentId: string;
  studentName?: string;
  specialization: string;
  computedAt: string;
  timedOut?: boolean;
  profile: {
    composite: number;
    band: string;
    passed: boolean;
    specialization: string | null;
    dimensions: Array<{
      dimension: "core_professionalism" | "business_digital" | "job_fit" | "growth_potential";
      label: string;
      labelAr: string;
      weight: number;
      score: number;
      band: string;
      moduleCount: number;
    }>;
    covered: string[];
    computedAt: string;
  };
  results: Array<{
    moduleCode: string;
    moduleTitle: string;
    dimension: string;
    score: number;
    band: string;
    passed: boolean;
    feedback: string;
    strengths: string[];
    improvements: string[];
    perCriterion?: Array<{ criterion: string; weight: number; score: number; max: number }>;
    isFallback?: boolean;
  }>;
  modules: Array<{
    code: string;
    title: string;
    titleAr: string | null;
    dimension: string;
    framework?: string;
    focus?: string;
    scenario: string;
    instructions: string;
  }>;
  answers: Record<string, string>;
  dimensionChapters?: Array<{
    id: string;
    label: string;
    labelAr: string | null;
    weight: number;
    score: number | null;
    band: string | null;
    passed: boolean | null;
    moduleCount: number;
    definition: string;
    narrative: string[];
    development: string[];
    strengths?: string[];
    improvements?: string[];
  }>;
}

export function EmployabilityDetailedReportView({
  attempt,
  lang = "en",
  ar: arProp,
}: {
  attempt: EmployabilityAttemptSnapshot;
  lang?: "en" | "ar" | "fr";
  /** @deprecated prefer lang — kept for call sites passing ar={boolean} */
  ar?: boolean;
}) {
  const ar = arProp ?? lang === "ar";

  const t = (en: string, arStr: string, frStr: string) => {
    if (lang === "fr") return frStr;
    if (ar) return arStr;
    return en;
  };
  const { profile } = attempt;
  const specialization = attempt.specialization || profile.specialization;
  const studentName = (attempt.studentName || "").trim();

  const chapters = useMemo(() => {
    if (attempt.dimensionChapters && attempt.dimensionChapters.length > 0) {
      return attempt.dimensionChapters;
    }
    return buildDimensionChapters(
      attempt.results.map((r) => ({
        moduleCode: r.moduleCode,
        moduleTitle: r.moduleTitle,
        dimension: r.dimension,
        score: r.score,
        band: r.band,
        strengths: r.strengths || [],
        improvements: r.improvements || [],
        feedback: r.feedback,
      })),
      profile.dimensions,
    );
  }, [attempt.dimensionChapters, attempt.results, profile.dimensions]);

  const certUrl = `/api/iscarb/assessment/certificate?studentId=${encodeURIComponent(attempt.studentId)}${specialization ? `&specialization=${encodeURIComponent(specialization)}` : ""}&score=${encodeURIComponent(attempt.profile.composite)}&name=${encodeURIComponent(studentName)}`;

  const [isDownloading, setIsDownloading] = useState(false);
  const [openDimension, setOpenDimension] = useState<string | null>(null);

  const toggleDimension = (dimensionId: string) => {
    setOpenDimension((current) => (current === dimensionId ? null : dimensionId));
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(`/api/iscarb/assessment/report?format=pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: attempt.studentId,
          specialization: attempt.specialization,
          overrideAttempt: {
            ...attempt,
            studentName: studentName || undefined,
            dimensionChapters: chapters,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${attempt.studentId}_employability_report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(ar ? "فشل تنزيل ملف PDF." : "Failed to download PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans antialiased text-foreground print:bg-white print:text-black">
      <header className="relative border-b border-border/50 bg-gradient-to-b from-iscarb-green/10 via-background to-background px-4 py-8 sm:px-6 sm:py-10 lg:px-8 print:py-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-10">
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-iscarb-green/30 bg-iscarb-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-iscarb-green">
              <ShieldCheck className="size-3.5 shrink-0" />
              {t("Detailed Report", "تقرير مفصل", "Rapport Détaillé")}
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-iscarb-ink dark:text-white sm:text-3xl md:text-4xl">
              {t("Employability Exam Detailed Report", "تقرير امتحان القابلية للتوظيف المفصل", "Rapport Détaillé de l'Examen d'Employabilité")}
            </h1>
            {studentName ? (
              <p className="mt-2 break-words text-base font-medium text-iscarb-ink dark:text-white sm:text-lg">
                {studentName}
              </p>
            ) : null}
            <p className="mt-1 break-words text-sm text-muted-foreground">
              {specialization ? `${specialization} · ` : ""}
              {new Date(attempt.computedAt).toLocaleDateString(ar ? "ar-SA" : "en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="mt-5 print:hidden">
              <Button
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="h-11 w-full gap-2 rounded-xl bg-iscarb-green font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-iscarb-green-dark hover:shadow-md hover:shadow-iscarb-green/25 active:translate-y-0 active:scale-[0.99] disabled:hover:translate-y-0 disabled:hover:shadow-sm sm:w-auto sm:min-w-[11rem]"
              >
                <Download className="size-4 shrink-0" />
                {isDownloading
                  ? t("Downloading...", "جاري التنزيل...", "Téléchargement...")
                  : t("Download PDF", "تنزيل PDF", "Télécharger le PDF")}
              </Button>
            </div>
          </div>

          <div
            className="mx-auto w-full max-w-[240px] shrink-0 md:mx-0"
            aria-label={
              lang === "fr" 
                ? `Score final ${Math.round(profile.composite)} sur 100`
                : ar
                ? `الدرجة النهائية ${Math.round(profile.composite)} من 100`
                : `Final score ${Math.round(profile.composite)} out of 100`
            }
          >
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {t("Final Score", "الدرجة النهائية", "Score Final")}
            </p>
            <ThomasGauge
              score={profile.composite}
              label={formatBandLabel(profile.band)}
              className="mt-1"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:space-y-12 sm:px-6 sm:py-10 lg:space-y-14 lg:px-8">
        {/* Certificate — above Four-Dimension Summary */}
        <section className="rounded-2xl border border-emerald-800/40 bg-gradient-to-r from-[#002b16] via-[#004d28] to-[#006838] p-4 text-white shadow-md sm:rounded-3xl sm:p-6 md:p-8 print:hidden">
          <div className="flex flex-col gap-6 md:gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 max-w-xl space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                <Award className="size-4 shrink-0 text-emerald-200" />
                {t("Official Certification", "شهادة الاعتماد الرسمية", "Certification Officielle")}
              </div>
              <h2 className="font-display text-xl font-light tracking-tight text-white sm:text-2xl md:text-3xl">
                {t("Certificate of Employability", "شهادة القابلية للتوظيف", "Certificat d'Employabilité")}
              </h2>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
                {t("Assessment", "تقييم", "Évaluation")}
              </p>
              <p className="text-sm leading-relaxed text-white/90">
                {t("An official credential confirming completion of the employability assessment against national benchmarks.", "شهادة رسمية موثقة تثبت إكمال تقييم الجدارات المهنية وفق المعايير الوطنية.", "Un certificat officiel confirmant l'achèvement de l'évaluation d'employabilité selon les normes nationales.")}
              </p>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  className="h-11 w-full min-h-11 min-w-[10rem] gap-2 rounded-full bg-white font-bold text-[#004d28] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-[#00381e] hover:shadow-md active:translate-y-0 active:bg-emerald-100 active:scale-[0.99] sm:w-auto"
                >
                  <a href={certUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4 shrink-0" />
                    {t("View Full Certificate", "عرض الشهادة كاملة", "Voir le Certificat Complet")}
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full min-h-11 min-w-[10rem] gap-2 rounded-full border-2 border-white/80 bg-transparent font-semibold text-white shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/25 hover:text-white hover:shadow-sm active:translate-y-0 active:bg-white/35 active:scale-[0.99] sm:w-auto"
                >
                  <a href={certUrl} download={`certificate_${attempt.studentId}.png`}>
                    <Download className="size-4 shrink-0" />
                    {t("Download Certificate Image", "تنزيل صورة الشهادة", "Télécharger l'Image du Certificat")}
                  </a>
                </Button>
              </div>
            </div>

            <a
              href={certUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mx-auto block w-full max-w-[420px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/25 shadow-2xl transition-all duration-200 hover:border-white/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:rounded-2xl lg:mx-0"
              aria-label={t("Open certificate", "فتح الشهادة", "Ouvrir le certificat")}
            >
              <div className="aspect-[1200/630] w-full bg-[#00381e]/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={certUrl}
                  alt={t("Certificate preview", "معاينة الشهادة", "Aperçu du certificat")}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            </a>
          </div>
        </section>

        {/* Four-Dimension Summary — score + analysis per category */}
        <section className="space-y-4 sm:space-y-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-iscarb-ink dark:text-white sm:text-2xl">
              {t("Four-Dimension Performance Summary", "ملخص الأبعاد الأربعة", "Résumé de la Performance des Quatre Dimensions")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Each category with its score, performance analysis, strengths, and areas for improvement.", "متوسط كل فئة مع تحليل الأداء ونقاط القوة ومجالات التحسين.", "Chaque catégorie avec son score, analyse de performance, points forts et axes d'amélioration.")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {profile.dimensions.map((dimMeta) => {
              const chap = chapters.find((c) => c.id === dimMeta.dimension);
              const score = chap?.score ?? dimMeta.score;
              const band = formatBandLabel(chap?.band ?? dimMeta.band);
              const narrative = lang === "fr" && (chap as any).narrativeFr?.length 
                ? (chap as any).narrativeFr 
                : lang === "ar" && (chap as any).narrativeAr?.length 
                ? (chap as any).narrativeAr 
                : chap?.narrative?.length
                  ? chap.narrative
                  : [
                      ar
                        ? `متوسط الفئة ${Math.round(score ?? 0)}/100.`
                        : `Category average ${Math.round(score ?? 0)}/100.`,
                    ];
              const strengths =
                chap?.strengths && chap.strengths.length > 0
                  ? chap.strengths
                  : ["Category performance recorded under assessment conditions."];
              const development = lang === "fr" && (chap as any).developmentFr?.length
                ? (chap as any).developmentFr
                : lang === "ar" && (chap as any).developmentAr?.length
                ? (chap as any).developmentAr
                : chap?.development;
              const improvements =
                chap?.improvements && chap.improvements.length > 0
                  ? chap.improvements
                  : development?.slice(0, 3) ?? [];

              return (
                <div
                  key={dimMeta.dimension}
                  className="relative flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-1.5 rounded-t-2xl",
                      DIM_ACCENT[dimMeta.dimension] ?? "bg-iscarb-green",
                    )}
                  />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t(
                      `Weight ${(dimMeta.weight * 100).toFixed(0)}%`,
                      `الوزن ${(dimMeta.weight * 100).toFixed(0)}%`,
                      `Poids ${(dimMeta.weight * 100).toFixed(0)}%`
                    )}
                  </p>
                  <h3 className="mt-1 font-display text-base font-semibold leading-snug text-iscarb-ink dark:text-white sm:text-lg">
                    {t(
                      dimMeta.label, 
                      dimMeta.labelAr, 
                      {
                        "core_professionalism": "Professionnalisme de base",
                        "business_digital": "Compétences numériques et commerciales",
                        "job_fit": "Adéquation technique",
                        "growth_potential": "Potentiel de croissance"
                      }[dimMeta.dimension] || dimMeta.label
                    )}
                  </h3>
                  <div className="mx-auto my-3 w-full max-w-[180px] sm:my-4">
                    <ThomasGauge score={score ?? 0} label={band} />
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    <span>
                      {t(`${dimMeta.moduleCount} modules`, `${dimMeta.moduleCount} وحدات`, `${dimMeta.moduleCount} modules`)}
                    </span>
                    <span className="font-bold uppercase tracking-wider text-iscarb-green">
                      {band}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-border/50 pt-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t("Performance Analysis", "تحليل الأداء", "Analyse de Performance")}
                    </h4>
                    <div className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/90">
                      {narrative.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-iscarb-green/20 bg-iscarb-green/5 p-3.5">
                    <h4 className="text-sm font-semibold text-iscarb-green">
                      {t("Strengths", "نقاط القوة", "Points Forts")}
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {strengths.map((str, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-iscarb-ink/85 dark:text-white/85"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-iscarb-green" />
                          <span className="min-w-0 break-words">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#ca6702]/20 bg-[#ca6702]/5 p-3.5">
                    <h4 className="text-sm font-semibold text-[#ca6702]">
                      {t("Areas for Improvement", "مجالات التحسين", "Axes d'Amélioration")}
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {improvements.map((imp, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-iscarb-ink/85 dark:text-white/85"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#ca6702]" />
                          <span className="min-w-0 break-words">{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Folded category rows — name only, questions on expand */}
        <section className="space-y-3 sm:space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-iscarb-ink dark:text-white sm:text-2xl">
              {t("Questions by Category", "أسئلة الفئات", "Questions par Catégorie")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Open a category to view its questions.", "اضغط على الفئة لعرض أسئلتها.", "Ouvrez une catégorie pour voir ses questions.")}
            </p>
          </div>
          {profile.dimensions.map((dimMeta) => {
            const isOpen = openDimension === dimMeta.dimension;
            const questionsId = `dimension-questions-${dimMeta.dimension}`;

            return (
              <div
                key={dimMeta.dimension}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 print:break-inside-avoid",
                  isOpen
                    ? "border-iscarb-green/40 shadow-md"
                    : "border-border/70 hover:border-iscarb-green/30 hover:shadow-md",
                )}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-controls={questionsId}
                  onClick={() => toggleDimension(dimMeta.dimension)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleDimension(dimMeta.dimension);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 px-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-iscarb-green sm:px-5 sm:py-5"
                >
                  <span
                    className={cn(
                      "h-8 w-1.5 shrink-0 rounded-full",
                      DIM_ACCENT[dimMeta.dimension] ?? "bg-iscarb-green",
                    )}
                    aria-hidden
                  />
                  <h3 className="min-w-0 flex-1 font-display text-base font-semibold text-iscarb-ink dark:text-white sm:text-lg">
                    {t(
                      dimMeta.label, 
                      dimMeta.labelAr, 
                      {
                        "core_professionalism": "Professionnalisme de base",
                        "business_digital": "Compétences numériques et commerciales",
                        "job_fit": "Adéquation technique",
                        "growth_potential": "Potentiel de croissance"
                      }[dimMeta.dimension] || dimMeta.label
                    )}
                  </h3>
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 text-muted-foreground transition-transform duration-200 print:hidden",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden
                  />
                </div>

                <div
                  id={questionsId}
                  aria-hidden={!isOpen}
                  className={cn(
                    "space-y-6 border-t border-border/50 px-4 pb-4 pt-5 sm:px-5 sm:pb-5 print:block print:px-0 print:pb-0 print:pt-4",
                    !isOpen && "hidden",
                  )}
                >
                  {attempt.results
                    .filter((r) => r.dimension === dimMeta.dimension)
                    .map((result) => {
                      const mod = attempt.modules.find((m) => m.code === result.moduleCode);
                      if (!mod) return null;
                      const rawStudentAnswer = attempt.answers[mod.code];
                      const studentAnswer = cleanText(rawStudentAnswer);

                      let displayFeedback = cleanText(result.feedback);
                      if (ar) {
                        if (displayFeedback.includes("Selected the validated correct option")) {
                          displayFeedback = "إجابة صحيحة. تم اختيار الخيار المعتمد بنجاح وفق معايير الكفاءة القياسية.";
                        } else if (displayFeedback.includes("Did not select the validated correct option")) {
                          displayFeedback = "الإجابة المختارة غير صحيحة. يرجى مراجعة المعيار القياسي لتجنب الخطأ في المرات القادمة.";
                        }
                      }

                      return (
                        <div
                          key={result.moduleCode}
                          className="rounded-xl border border-border/70 bg-background p-4 shadow-sm sm:p-5 print:break-inside-avoid print:shadow-none"
                        >
                          <h4 className="mb-2 font-semibold text-iscarb-ink dark:text-white">
                            {cleanText(t(mod.title, mod.titleAr || mod.title, (mod as any).titleFr || mod.title))}
                          </h4>
                          <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                            {cleanText(t(mod.scenario, mod.scenarioAr || mod.scenario, (mod as any).scenarioFr || mod.scenario))}
                          </p>

                          <div className="mb-4 rounded-lg bg-muted/50 p-3">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {t("Decision Question", "سؤال القرار", "Question de Décision")}
                            </p>
                            <p className="text-sm font-medium">
                              {cleanText(t(mod.instructions, mod.instructionsAr || mod.instructions, (mod as any).instructionsFr || mod.instructions))}
                            </p>
                          </div>

                          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                              {t("Your Answer", "إجابتك", "Votre Réponse")}
                            </p>
                            <p className="text-sm font-medium">
                              {studentAnswer || t("Not answered", "لم يتم الإجابة", "Pas de réponse")}
                            </p>
                          </div>

                          <div className="rounded-lg bg-secondary/20 p-3">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground">
                              {t("Assessment Feedback & Explanation", "تفسير النتيجة وملاحظات التقييم", "Retours d'Évaluation")}
                            </p>
                            <p className="text-sm leading-relaxed text-secondary-foreground/90">
                              {displayFeedback}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
