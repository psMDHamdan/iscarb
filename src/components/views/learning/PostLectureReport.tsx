"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Dumbbell,
  GraduationCap,
  Star,
  Clock,
  Target,
  HelpCircle,
} from "lucide-react";
import { bucketConcepts } from "@/lib/lecture/concept-buckets";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PostLectureReportProps {
  /** Raw concept-mastery map: conceptId → state string */
  conceptMastery: Record<string, string>;
  /** Raw misconception log: conceptId → count */
  misconceptionLog: Record<string, number>;

  // Session statistics
  /** Total XP earned during the session */
  totalXp: number;
  /** Number of correct answers */
  correctAnswers: number;
  /** Total number of questions presented */
  totalQuestions: number;
  /** Session duration in minutes */
  timeOnTaskMinutes: number;

  // Navigation callbacks
  /** Navigate to the first Review Concept slide */
  onRevisitWeakAreas: () => void;
  /** Start the lecture in Review Mode from slide 1 */
  onPracticeMode: () => void;

  ar?: boolean;
}

// ---------------------------------------------------------------------------
// Empty-state messages per bucket
// ---------------------------------------------------------------------------

const EMPTY_MESSAGES = {
  strong: {
    en: "Keep going — concepts will appear here as you master them.",
    ar: "استمر — ستظهر المفاهيم هنا عند إتقانها.",
  },
  developing: {
    en: "No developing concepts — you're either mastered or need review.",
    ar: "لا توجد مفاهيم قيد التطوير حالياً.",
  },
  review: {
    en: "No concepts to review — great work!",
    ar: "لا توجد مفاهيم تحتاج مراجعة — أحسنت!",
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostLectureReport({
  conceptMastery,
  misconceptionLog,
  totalXp,
  correctAnswers,
  totalQuestions,
  timeOnTaskMinutes,
  onRevisitWeakAreas,
  onPracticeMode,
  ar = false,
}: PostLectureReportProps) {
  const router = useRouter();

  // Bucket the concepts using the pure utility function
  const { strong, developing, review } = bucketConcepts(conceptMastery, misconceptionLog);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-full w-full flex-col items-center justify-start p-6 bg-slate-50/50 dark:bg-slate-950"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="max-w-4xl w-full space-y-10">

        {/* ── Page heading ─────────────────────────────────────────────── */}
        <div className="space-y-3 text-center">
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          >
            {ar ? "تم إكمال الدرس" : "Lecture Completed"}
          </Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {ar ? "تقرير جلسة التعلم" : "Your Learning Session Report"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {ar
              ? "إليك نظرة على ما أتقنته وما يحتاج إلى مراجعة"
              : "Here is a breakdown of what you mastered and what needs review"}
          </p>
        </div>

        {/* ── Session statistics ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<Star className="h-5 w-5 text-amber-500" />}
            value={String(totalXp)}
            label={ar ? "إجمالي النقاط" : "Total XP"}
            accent="amber"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            value={`${correctAnswers}/${totalQuestions}`}
            label={ar ? "إجابات صحيحة" : "Correct Answers"}
            accent="emerald"
          />
          <StatCard
            icon={<Target className="h-5 w-5 text-sky-500" />}
            value={totalQuestions > 0 ? `${Math.round((correctAnswers / totalQuestions) * 100)}%` : "—"}
            label={ar ? "نسبة الدقة" : "Accuracy"}
            accent="sky"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-violet-500" />}
            value={`${timeOnTaskMinutes}m`}
            label={ar ? "وقت الجلسة" : "Time on Task"}
            accent="violet"
          />
        </div>

        {/* ── Three concept lists ──────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Strong Concepts */}
          <section className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 space-y-3 shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              {ar ? "المفاهيم القوية" : "Strong Concepts"}
            </h2>
            {strong.length > 0 ? (
              <ul className="space-y-1.5 list-none">
                {strong.map((id) => (
                  <ConceptItem key={id} id={id} color="emerald" />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                {ar ? EMPTY_MESSAGES.strong.ar : EMPTY_MESSAGES.strong.en}
              </p>
            )}
          </section>

          {/* Developing Concepts */}
          <section className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-3 shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2 text-amber-700 dark:text-amber-500">
              <TrendingUp className="h-5 w-5 shrink-0" />
              {ar ? "المفاهيم قيد التطوير" : "Developing Concepts"}
            </h2>
            {developing.length > 0 ? (
              <ul className="space-y-1.5 list-none">
                {developing.map((id) => (
                  <ConceptItem key={id} id={id} color="amber" />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                {ar ? EMPTY_MESSAGES.developing.ar : EMPTY_MESSAGES.developing.en}
              </p>
            )}
          </section>

          {/* Review Concepts */}
          <section className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-5 space-y-3 shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {ar ? "مفاهيم تحتاج مراجعة" : "Review Concepts"}
            </h2>
            {review.length > 0 ? (
              <ul className="space-y-1.5 list-none">
                {review.map((id) => (
                  <ConceptItem key={id} id={id} color="rose" />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                {ar ? EMPTY_MESSAGES.review.ar : EMPTY_MESSAGES.review.en}
              </p>
            )}
          </section>

        </div>

        {/* ── Action buttons ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">

          <Button
            onClick={onRevisitWeakAreas}
            disabled={review.length === 0}
            variant="outline"
            className="w-full sm:w-auto gap-2 border-rose-500/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold rounded-2xl h-12 px-6 shadow-sm disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            {ar ? "مراجعة المناطق الضعيفة" : "Revisit Weak Areas"}
          </Button>

          <Button
            onClick={onPracticeMode}
            variant="outline"
            className="w-full sm:w-auto gap-2 border-sky-500/50 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 font-bold rounded-2xl h-12 px-6 shadow-sm"
          >
            <Dumbbell className="h-4 w-4" />
            {ar ? "وضع الممارسة" : "Practice Mode"}
          </Button>

          <Button
            onClick={() => router.push("/assessment/employability")}
            className="w-full sm:w-auto gap-2 bg-[#0E6C3C] hover:bg-[#0E6C3C]/90 text-white font-bold rounded-2xl h-12 px-6 shadow-lg"
          >
            <GraduationCap className="h-4 w-4" />
            {ar ? "أداء الاختبار" : "Take Assessment"}
          </Button>

        </div>

      </div>
    </motion.article>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: "amber" | "emerald" | "sky" | "violet";
}

const accentClasses: Record<StatCardProps["accent"], string> = {
  amber: "border-amber-200   dark:border-amber-900/50   bg-amber-50/60   dark:bg-amber-950/20",
  emerald: "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20",
  sky: "border-sky-200     dark:border-sky-900/50     bg-sky-50/60     dark:bg-sky-950/20",
  violet: "border-violet-200  dark:border-violet-900/50  bg-violet-50/60  dark:bg-violet-950/20",
};

function StatCard({ icon, value, label, accent }: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col items-center gap-1 shadow-sm ${accentClasses[accent]}`}>
      {icon}
      <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">{value}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}

interface ConceptItemProps {
  id: string;
  color: "emerald" | "amber" | "rose";
}

const bulletColor: Record<ConceptItemProps["color"], string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

function ConceptItem({ id, color }: ConceptItemProps) {
  // Concept IDs may be raw identifiers (e.g. "smart-grid-fundamentals") — humanise them
  const label = id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <li className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${bulletColor[color]}`} />
      {label}
    </li>
  );
}
