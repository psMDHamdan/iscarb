/**
 * Vertical Alignment Validator & Taxonomy Engine
 * ===============================================
 * Validates course learning outcomes (CLOs) against Bloom's Revised Taxonomy
 * and curriculum progression rules:
 * - Detects courses lacking higher-order cognitive levels (Apply, Analyze, Evaluate, Create)
 * - Identifies upper-division courses (Semester >= 3 or NQF >= 6) lacking mapped prerequisites
 * - Detects cognitive regression across sequential prerequisite chains
 * - Calculates 6-tier Bloom taxonomy distributions and curriculum health metrics
 */

export type BloomLevel = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";

export const BLOOM_LEVELS: BloomLevel[] = [
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
];

export const BLOOM_WEIGHTS: Record<BloomLevel, number> = {
  remember: 1,
  understand: 2,
  apply: 3,
  analyze: 4,
  evaluate: 5,
  create: 6,
};

export const BLOOM_COLORS: Record<BloomLevel, { bg: string; text: string; border: string; barColor: string }> = {
  remember: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-300 dark:border-slate-700",
    barColor: "#94a3b8", // slate-400
  },
  understand: {
    bg: "bg-blue-100 dark:bg-blue-950/60",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-800",
    barColor: "#60a5fa", // blue-400
  },
  apply: {
    bg: "bg-emerald-100 dark:bg-emerald-950/60",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-800",
    barColor: "#34d399", // emerald-400
  },
  analyze: {
    bg: "bg-amber-100 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-800",
    barColor: "#fbbf24", // amber-400
  },
  evaluate: {
    bg: "bg-purple-100 dark:bg-purple-950/60",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-800",
    barColor: "#c084fc", // purple-400
  },
  create: {
    bg: "bg-rose-100 dark:bg-rose-950/60",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-300 dark:border-rose-800",
    barColor: "#fb7185", // rose-400
  },
};

export const BLOOM_LABELS: Record<BloomLevel, { en: string; ar: string; category: "foundational" | "higher" }> = {
  remember: { en: "Remember", ar: "تذكّر", category: "foundational" },
  understand: { en: "Understand", ar: "فهم", category: "foundational" },
  apply: { en: "Apply", ar: "تطبيق", category: "higher" },
  analyze: { en: "Analyze", ar: "تحليل", category: "higher" },
  evaluate: { en: "Evaluate", ar: "تقييم", category: "higher" },
  create: { en: "Create", ar: "ابتكار", category: "higher" },
};

export const HIGHER_ORDER_BLOOM_SET = new Set<string>(["apply", "analyze", "evaluate", "create"]);

export interface CourseLearningOutcomeItem {
  id?: string;
  number?: string;
  text: string;
  bloomLevel: string;
  weight?: number;
}

export interface PrerequisiteRef {
  id: string;
  code: string;
  name?: string;
  type?: string;
}

export interface CourseValidationInput {
  id: string;
  code: string;
  name?: string;
  semester: number;
  nqfLevel: number;
  clos: CourseLearningOutcomeItem[];
  prerequisites: PrerequisiteRef[];
}

export interface ValidationIssue {
  code: "MISSING_HIGHER_ORDER_BLOOM" | "UNMAPPED_PREREQUISITE" | "COGNITIVE_REGRESSION" | "NO_CLOS" | "WEIGHT_MISMATCH";
  severity: "warning" | "error";
  message: string;
  messageAr: string;
  details?: string;
}

export interface CourseValidationResult {
  isValid: boolean;
  hasMissingHigherOrder: boolean;
  hasUnmappedPrerequisite: boolean;
  issues: ValidationIssue[];
}

/**
 * Normalizes user-entered or legacy Bloom taxonomy string to standard 6-level taxonomy
 */
export function normalizeBloom(level: string): BloomLevel {
  const clean = (level || "").toLowerCase().trim();
  if (clean === "evaluation") return "evaluate";
  if (clean === "analysis") return "analyze";
  if (clean === "application") return "apply";
  if (clean === "comprehension" || clean === "understanding") return "understand";
  if (clean === "knowledge" || clean === "remembering" || clean === "recall") return "remember";
  if (clean === "synthesis" || clean === "creation" || clean === "creating") return "create";
  if (clean === "evaluating") return "evaluate";
  if (clean === "analyzing") return "analyze";
  if (clean === "applying") return "apply";

  if (BLOOM_LEVELS.includes(clean as BloomLevel)) {
    return clean as BloomLevel;
  }
  return "apply"; // standard default
}

/**
 * Validates course vertical alignment, higher-order Bloom coverage, and prerequisite progression
 */
export function validateCourseAlignment(
  course: CourseValidationInput,
  allCoursesMap: Map<string, { semester: number; clos: CourseLearningOutcomeItem[]; code?: string }> = new Map()
): CourseValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Check for empty CLOs
  if (!course.clos || course.clos.length === 0) {
    issues.push({
      code: "NO_CLOS",
      severity: "error",
      message: "Course has no defined Course Learning Outcomes (CLOs).",
      messageAr: "المقرر لا يحتوي على مخرجات تعلم معرفة.",
    });
  } else {
    // 2. Check for missing higher-order Bloom levels
    const hasHigherOrder = course.clos.some((c) =>
      HIGHER_ORDER_BLOOM_SET.has(normalizeBloom(c.bloomLevel))
    );
    if (!hasHigherOrder) {
      issues.push({
        code: "MISSING_HIGHER_ORDER_BLOOM",
        severity: "warning",
        message: "Missing higher-order Bloom levels (Apply/Analyze). Course outcomes only target foundational cognitive levels.",
        messageAr: "غياب المستويات العليا في تصنيف بلوم (التطبيق/التحليل). مخرجات المقرر تقتصر على المستويات الأولية.",
      });
    }
  }

  // 3. Check for unmapped prerequisites on upper-division courses (Semester >= 3 or NQF >= 6)
  if (
    (course.semester >= 3 || course.nqfLevel >= 6) &&
    (!course.prerequisites || course.prerequisites.length === 0)
  ) {
    issues.push({
      code: "UNMAPPED_PREREQUISITE",
      severity: "warning",
      message: "Upper-division course has no prerequisites mapped in the curriculum progression.",
      messageAr: "مقرر في مستوى متقدم بدون متطلبات سابقة مرتبطة في تسلسل المنهج.",
    });
  }

  // 4. Check for cognitive regression against direct prerequisites
  if (course.clos && course.clos.length > 0) {
    const courseMaxBloom = Math.max(
      0,
      ...course.clos.map((c) => BLOOM_WEIGHTS[normalizeBloom(c.bloomLevel)] || 0)
    );

    for (const prereq of course.prerequisites || []) {
      const prereqCourse = allCoursesMap.get(prereq.id) || allCoursesMap.get(prereq.code);
      if (prereqCourse && prereqCourse.clos && prereqCourse.clos.length > 0) {
        const prereqMaxBloom = Math.max(
          0,
          ...prereqCourse.clos.map((c) => BLOOM_WEIGHTS[normalizeBloom(c.bloomLevel)] || 0)
        );
        if (prereqMaxBloom > courseMaxBloom && courseMaxBloom > 0) {
          issues.push({
            code: "COGNITIVE_REGRESSION",
            severity: "warning",
            message: `Cognitive regression: Prerequisite (${prereq.code}) achieves higher Bloom level than dependent course (${course.code}).`,
            messageAr: `تراجع معرفي: المقرر السابق (${prereq.code}) يحقق مستوى بلوم أعلى من هذا المقرر التابع (${course.code}).`,
            details: `Prerequisite max level: ${prereqMaxBloom}, course max level: ${courseMaxBloom}`,
          });
        }
      }
    }
  }

  const hasMissingHigherOrder = issues.some((i) => i.code === "MISSING_HIGHER_ORDER_BLOOM");
  const hasUnmappedPrerequisite = issues.some((i) => i.code === "UNMAPPED_PREREQUISITE");

  return {
    isValid: issues.length === 0,
    hasMissingHigherOrder,
    hasUnmappedPrerequisite,
    issues,
  };
}

/**
 * Calculates counts and percentages for all 6 Revised Bloom Taxonomy levels
 */
export function calculateBloomDistribution(
  clos: Array<{ bloomLevel: string }>
): Record<BloomLevel, { count: number; percentage: number }> {
  const counts: Record<BloomLevel, number> = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0,
  };

  const total = clos.length;
  for (const clo of clos) {
    const norm = normalizeBloom(clo.bloomLevel);
    counts[norm] = (counts[norm] || 0) + 1;
  }

  const result = {} as Record<BloomLevel, { count: number; percentage: number }>;
  for (const level of BLOOM_LEVELS) {
    const count = counts[level] || 0;
    const percentage = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
    result[level] = { count, percentage };
  }

  return result;
}
