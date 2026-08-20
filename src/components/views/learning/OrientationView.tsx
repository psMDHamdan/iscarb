"use client";

/**
 * OrientationView — Pre-lecture gateway shown before the student starts.
 *
 * Design goals (per student-experience redesign):
 *  - Lead with a high-stakes framing question (hook), not just a title.
 *  - Show what the student will DO, not just what they will "learn".
 *  - Display the 6 learning phases as a concrete journey with action verbs.
 *  - List CLOs as "By the end you can…" capability statements.
 *  - Show the four readiness checks as a visible promise, not a footnote.
 *  - Replace raw numbers (20 slides, 5 practice) with meaningful descriptions.
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  PlayCircle,
  Target,
  CheckCircle2,
  Zap,
  Brain,
  FlaskConical,
  Layers,
  Rocket,
  Award,
  Clock,
  MessageSquare,
} from "lucide-react";
import { CourseLearningOutcome } from "@/lib/assessment/ai-question-generation.service";

// ─── types ────────────────────────────────────────────────────────────────────

interface OrientationViewProps {
  title: string;
  courseName: string;
  clos: CourseLearningOutcome[];
  conceptCount: number;
  practiceCount: number;
  onStart: () => void;
  ar?: boolean;
}

// ─── phase definitions ────────────────────────────────────────────────────────

const PHASES_EN = [
  { icon: MessageSquare, label: "Hook & Context", desc: "Why this matters — a high-stakes question", color: "bg-blue-500", range: "S1–4" },
  { icon: Brain, label: "Core Concepts", desc: "Build the mental model, term by term", color: "bg-teal-500", range: "S5–7" },
  { icon: FlaskConical, label: "Practice", desc: "Worked calculation + misconception fix", color: "bg-purple-500", range: "S8–10" },
  { icon: Layers, label: "Deep Cases", desc: "Real scenarios, trade-offs, worked examples", color: "bg-cyan-500", range: "S11–13" },
  { icon: Rocket, label: "Apply & Transfer", desc: "Workshop, collaboration, career context", color: "bg-emerald-500", range: "S14–17" },
  { icon: Award, label: "Mastery Gate", desc: "Rubric, evidence pack, final readiness check", color: "bg-amber-500", range: "S18–20" },
];

const PHASES_AR = [
  { icon: MessageSquare, label: "السياق والسؤال", desc: "لماذا يهمك هذا — سؤال عالي الرهانات", color: "bg-blue-500", range: "S1–4" },
  { icon: Brain, label: "المفاهيم الأساسية", desc: "بناء النموذج الذهني خطوة بخطوة", color: "bg-teal-500", range: "S5–7" },
  { icon: FlaskConical, label: "التدريب", desc: "حساب تطبيقي + تصحيح المفاهيم الخاطئة", color: "bg-purple-500", range: "S8–10" },
  { icon: Layers, label: "الحالات والعمق", desc: "سيناريوهات حقيقية، مقايضات، أمثلة مفصّلة", color: "bg-cyan-500", range: "S11–13" },
  { icon: Rocket, label: "التطبيق والنقل", desc: "ورشة عمل، تعاون، سياق مهني", color: "bg-emerald-500", range: "S14–17" },
  { icon: Award, label: "بوابة الإتقان", desc: "معيار التقييم، حزمة الأدلة، فحص الجاهزية", color: "bg-amber-500", range: "S18–20" },
];

// ─── sub-components ───────────────────────────────────────────────────────────

function PhaseStep({
  icon: Icon,
  label,
  desc,
  color,
  range,
  index,
  isLast,
}: {
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  range: string;
  index: number;
  isLast: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.25 }}
      className="flex items-start gap-3 relative"
    >
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[17px] top-9 w-0.5 h-full bg-slate-200 dark:bg-slate-700 -z-0" />
      )}

      {/* Phase dot */}
      <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color} text-white shadow-sm`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Phase text */}
      <div className="pb-4 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</span>
          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{range}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

export function OrientationView({
  title,
  courseName,
  clos,
  conceptCount,
  practiceCount,
  onStart,
  ar = false,
}: OrientationViewProps) {
  const phases = ar ? PHASES_AR : PHASES_EN;
  const slides = conceptCount || 20;
  const interactions = practiceCount || Math.max(4, Math.round(slides * 0.3));
  const mins = Math.round(slides * 1.5);

  return (
    <div
      className="flex h-full w-full items-start justify-center overflow-y-auto p-4 sm:p-8 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="max-w-4xl w-full space-y-8 pb-8">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3 text-center"
        >
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold px-4 py-1 text-xs"
          >
            {courseName}
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center justify-center flex-wrap gap-4 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              {ar ? `~${mins} دقيقة` : `~${mins} min`}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              {ar ? `${interactions} تفاعل` : `${interactions} activities`}
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-cyan-500" />
              {ar ? "4 فحوصات جاهزية" : "4 readiness checks"}
            </span>
          </div>
        </motion.div>

        {/* ── Two-column layout ─────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* LEFT — Learning Journey */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm p-5 space-y-1"
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              {ar ? "رحلة التعلم — 6 مراحل" : "Your learning journey — 6 phases"}
            </h2>

            {phases.map((phase, i) => (
              <PhaseStep
                key={i}
                icon={phase.icon}
                label={phase.label}
                desc={phase.desc}
                color={phase.color}
                range={phase.range}
                index={i}
                isLast={i === phases.length - 1}
              />
            ))}
          </motion.div>

          {/* RIGHT — CLOs + CTA */}
          <div className="flex flex-col gap-5">

            {/* CLOs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="rounded-2xl border border-emerald-200/60 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 space-y-3 flex-1"
            >
              <h2 className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                <Target className="h-4 w-4" />
                {ar ? "بنهاية هذا الدرس ستستطيع…" : "By the end of this lecture you can…"}
              </h2>

              {clos && clos.length > 0 ? (
                <ul className="space-y-2.5">
                  {clos.map((clo, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                        {clo.text}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-2.5">
                  {(ar
                    ? [
                      "شرح المفهوم الأساسي بكلماتك الخاصة",
                      "تطبيق الخطوات بشكل مستقل على مسائل جديدة",
                      "تحليل المقايضات وتبرير قرارات التصميم",
                      "ربط المفهوم بسياق مهني واقعي",
                    ]
                    : [
                      "Explain the core concept in your own words",
                      "Apply the steps independently on new problems",
                      "Analyse trade-offs and justify design decisions",
                      "Connect the concept to a real professional context",
                    ]
                  ).map((text, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>

            {/* Readiness checks promise */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="rounded-2xl border border-amber-200/60 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-3"
            >
              <Zap className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {ar ? "4 فحوصات جاهزية مدمجة" : "4 built-in readiness checks"}
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
                  {ar
                    ? "بعد كل مرحلة رئيسية ستجيب على سؤال مباشر. الإجابة الصحيحة تفتح المرحلة التالية."
                    : "After each major phase you answer a direct question. Getting it right unlocks the next stage."}
                </p>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.25 }}
            >
              <Button
                size="lg"
                className="w-full h-14 text-base font-bold bg-[#0F7B8A] hover:bg-[#0c626e] text-white rounded-2xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                onClick={onStart}
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                {ar ? "ابدأ الرحلة" : "Start the Journey"}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2">
                {ar
                  ? "يمكنك الإيقاف المؤقت والعودة في أي وقت — تقدمك محفوظ."
                  : "You can pause and return at any time — your progress is saved."}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
