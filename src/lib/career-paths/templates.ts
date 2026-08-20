/**
 * iSCARB — Career-Path Fallback Templates (per specialization)
 * ===========================================================================
 * The adaptive career path is normally AI-generated (see
 * `/api/iscarb/career-paths/generate`). But when no `ZAI_API_KEY` is set — the
 * DEFAULT state today — the route falls back to a deterministic plan. The old
 * fallback was a single, tech-leaning, generic 3-stage plan, so a Medicine or
 * Law student saw an engineering-flavoured ladder. That is a quality defect for
 * a platform whose promise is "every Saudi student, from university to a job."
 *
 * This module supplies a *specialization-aware* fallback. It is intentionally
 * PURE (no DB / no AI / no `server-only`) so it is unit-testable and import-safe
 * from anywhere. The route stays the owner of persistence and of SSCO anchoring;
 * this module only decides the qualitative content of the three stages.
 *
 * Adaptivity is preserved: every template receives the student's *current*
 * composite and *target* composite and the per-stage thresholds are computed
 * from them — the plan is grounded in where the student actually is, not a
 * static brochure. Each stage is bilingual (EN / AR) and anchored to the
 * relevant Saudi authority (SCFHS, the Saudi Bar, SOCPA/CFA, ETEC ...).
 * ===========================================================================
 */

export type PathActivityType = "challenge" | "project" | "simulation";

export interface PathActivity {
  type: PathActivityType;
  labelEn: string;
  labelAr: string;
}

export interface PathStage {
  titleEn: string;
  titleAr: string;
  focusEn?: string;
  focusAr?: string;
  activities: PathActivity[];
  targetComposite: number;
}

export interface PathShape {
  titleEn: string;
  titleAr: string;
  targetSscoCode: string | null;
  targetComposite: number;
  rationaleEn?: string;
  rationaleAr?: string;
  stages: PathStage[];
}

/** The discipline buckets we ship a tailored fallback for. */
export type TemplateKey =
  | "medicine"
  | "law"
  | "business"
  | "education"
  | "engineering"
  | "computing"
  | "generic";

/** Stable list (handy for tests + exhaustiveness checks). */
export const CAREER_PATH_TEMPLATE_KEYS: TemplateKey[] = [
  "medicine",
  "law",
  "business",
  "education",
  "engineering",
  "computing",
  "generic",
];

// ───────────────────────────────────────────────────────────────────────────
//  Specialization detection
//  Keyword match over the student's free-text program / specialization, in both
//  English and Arabic. Order matters: the first bucket that matches wins, and
//  the more specific disciplines are tested before the broad fallbacks.
// ───────────────────────────────────────────────────────────────────────────

// Each pattern combines English word-STEM matches (leading word-boundary, no
// trailing boundary so "pharmac" matches "Pharmacy" and "cyber" matches
// "Cybersecurity") with Arabic substring matches (JS `\b` is ASCII-only, so we
// match Arabic stems as plain substrings). Two-letter abbreviations (ai/it/hr)
// keep both boundaries so they don't fire inside unrelated words.
const KEYWORDS: Record<Exclude<TemplateKey, "generic">, RegExp> = {
  medicine:
    /\b(?:medicine|medical|clinical|nursing|pharmac|dentist|dental|physician|surger|surgical|health\s*scien|public\s*health|midwif|physiotherap|radiolog|biomed)|طب|سريري|تمريض|صيدل|أسنان|جراح|علاج\s*طبيعي|صحة\s*عام|أشعة/i,
  law:
    /\b(?:law|legal|jurisprud|shari'?ah|attorney|paralegal|llb|judicial|litigation)|قانون|حقوق|شريع|أنظمة|قضاء|محاماة|محامي|فقه|ترافع/i,
  education:
    /\b(?:educat|teaching|teacher|pedagog|curricul|early\s*childhood|special\s*needs|tefl|tesol|instructional|didactic)|تربية|تعليم|تدريس|معلم|منهج|طفولة/i,
  business:
    /\b(?:business|management|account|financ|marketing|econom|mba|commerc|entrepreneur|supply\s*chain|human\s*resources|logistic|banking)|\bhr\b|أعمال|إدارة|محاسبة|تمويل|مالية|تسويق|اقتصاد|تجارة|ريادة|موارد\s*بشرية|مصرفي|لوجستيات/i,
  engineering:
    /\b(?:engineer|mechanic|electric|civil|chemical|industrial|aerospace|aeronautic|petroleum|architect|mechatron)|هندسة|ميكانيك|كهربا|مدني|كيميائي|صناعي|عمارة|بترول|طيران/i,
  computing:
    /\b(?:comput|software|information\s*technolog|informatic|cyber|data\s*scien|data\s*analyt|artificial\s*intelligence|programming|network|web\s*develop)|\bai\b|\bit\b|حاسب|حاسوب|برمج|تقنية\s*معلومات|معلوماتية|سيبراني|ذكاء\s*اصطناعي|بيانات|شبكات/i,
};

/**
 * Pick the template bucket for a student. We look at the explicit
 * `specialization` first (when the caller has resolved a SCED specialization
 * name), then the free-text `program`. Falls back to "generic".
 */
export function selectTemplateKey(program: string, specialization?: string | null): TemplateKey {
  const hay = `${specialization ?? ""} ${program ?? ""}`.trim();
  if (!hay) return "generic";
  // Test specific disciplines before broad ones (computing/engineering are broad).
  const order: Exclude<TemplateKey, "generic">[] = [
    "medicine",
    "law",
    "education",
    "business",
    "engineering",
    "computing",
  ];
  for (const key of order) {
    if (KEYWORDS[key].test(hay)) return key;
  }
  return "generic";
}

// ───────────────────────────────────────────────────────────────────────────
//  Threshold helper — keeps the plan adaptive to the real student composite.
//  Stage 1 nudges just above the current score; stage 2 sits at the midpoint;
//  stage 3 is the target. Mirrors the semantics of the route's old fallback.
// ───────────────────────────────────────────────────────────────────────────

function thresholds(composite: number, targetComposite: number): [number, number, number] {
  const lo = Math.max(0, Math.min(100, Math.round(composite)));
  const hi = Math.max(lo, Math.min(100, Math.round(targetComposite)));
  const mid = Math.round((lo + hi) / 2);
  return [Math.min(lo + 6, mid), mid, hi];
}

// ───────────────────────────────────────────────────────────────────────────
//  Templates
//  Each builder returns the qualitative content; thresholds are injected so the
//  numbers always reflect this student. `title*` default to the resolved career
//  title but can be overridden by the caller (e.g. an AI/heuristic mapping).
// ───────────────────────────────────────────────────────────────────────────

interface BuildArgs {
  titleEn: string;
  titleAr: string;
  composite: number;
  targetComposite: number;
  sscoCode: string | null;
}

type TemplateBuilder = (a: BuildArgs) => PathShape;

const medicine: TemplateBuilder = (a) => {
  const [t1, t2, t3] = thresholds(a.composite, a.targetComposite);
  return {
    titleEn: `Path to ${a.titleEn}`,
    titleAr: `مسار نحو ${a.titleAr}`,
    targetSscoCode: a.sscoCode,
    targetComposite: t3,
    rationaleEn:
      "A clinical progression from foundations to supervised practice to an SCFHS-ready profile — each stage produces verifiable, patient-safe evidence.",
    rationaleAr:
      "تدرّجٌ سريريٌّ من الأساسيات إلى الممارسة تحت إشراف إلى ملفٍّ جاهزٍ لهيئة التخصصات الصحية (SCFHS) — كل مرحلةٍ تُنتج دليلاً موثَّقاً يحافظ على سلامة المريض.",
    stages: [
      {
        titleEn: "Pre-clinical foundations",
        titleAr: "الأساسيات قبل السريرية",
        focusEn: "Lock basic & clinical sciences and safe clinical reasoning.",
        focusAr: "إتقان العلوم الأساسية والسريرية والاستدلال السريري الآمن.",
        targetComposite: t1,
        activities: [
          {
            type: "simulation",
            labelEn: "Clinical reasoning OSCE-style case simulation",
            labelAr: "محاكاة حالة سريرية بأسلوب OSCE للاستدلال السريري",
          },
          {
            type: "project",
            labelEn: "Structured case write-up (history → differential → plan)",
            labelAr: "توثيق حالة منظَّم (تاريخ مرضي ← تشخيص تفريقي ← خطة)",
          },
        ],
      },
      {
        titleEn: "Clinical rotations",
        titleAr: "التدريب السريري (الدوران)",
        focusEn: "Apply skills on supervised wards with CBAHI-aligned quality.",
        focusAr: "تطبيق المهارات في أقسامٍ تحت إشرافٍ بجودةٍ متوائمةٍ مع CBAHI.",
        targetComposite: t2,
        activities: [
          {
            type: "challenge",
            labelEn: "Hospital quality & patient-safety challenge (CBAHI/SFDA)",
            labelAr: "تحدّي جودة المستشفى وسلامة المرضى (CBAHI/SFDA)",
          },
          {
            type: "project",
            labelEn: "Audited clinical logbook with reflective evidence",
            labelAr: "سجل سريري مُدقَّق مع أدلة تأمّلية",
          },
        ],
      },
      {
        titleEn: "Residency match (SCFHS)",
        titleAr: "مطابقة الإقامة (SCFHS)",
        focusEn: "Reach an SMLE-ready composite and a match-competitive portfolio.",
        focusAr: "بلوغ درجةٍ جاهزةٍ لاختبار SMLE ومحفظةٍ تنافسيةٍ للمطابقة.",
        targetComposite: t3,
        activities: [
          {
            type: "simulation",
            labelEn: "SMLE-style high-yield assessment simulation",
            labelAr: "محاكاة تقييم بأسلوب SMLE عالية العائد",
          },
          {
            type: "project",
            labelEn: "Residency-application portfolio (research + electives)",
            labelAr: "محفظة تقديم الإقامة (بحث + تدريبات اختيارية)",
          },
        ],
      },
    ],
  };
};

const law: TemplateBuilder = (a) => {
  const [t1, t2, t3] = thresholds(a.composite, a.targetComposite);
  return {
    titleEn: `Path to ${a.titleEn}`,
    titleAr: `مسار نحو ${a.titleAr}`,
    targetSscoCode: a.sscoCode,
    targetComposite: t3,
    rationaleEn:
      "From legal foundations to a chosen specialization to Saudi Bar admission — every stage produces a written work-product a firm can assess.",
    rationaleAr:
      "من الأساسيات القانونية إلى تخصّصٍ مختارٍ إلى القيد في الهيئة السعودية للمحامين — كل مرحلةٍ تُنتج عملاً مكتوباً يمكن لمكتب المحاماة تقييمه.",
    stages: [
      {
        titleEn: "Legal foundations",
        titleAr: "الأساسيات القانونية",
        focusEn: "Master Saudi statutes, Sharia basis, and legal drafting.",
        focusAr: "إتقان الأنظمة السعودية والأساس الشرعي والصياغة القانونية.",
        targetComposite: t1,
        activities: [
          {
            type: "project",
            labelEn: "Case brief using the IRAC method (Arabic)",
            labelAr: "مذكّرة قضية بطريقة IRAC (بالعربية)",
          },
          {
            type: "simulation",
            labelEn: "Statute-interpretation simulation (Saudi regulations)",
            labelAr: "محاكاة تفسير نص نظامي (الأنظمة السعودية)",
          },
        ],
      },
      {
        titleEn: "Specialization",
        titleAr: "التخصّص",
        focusEn: "Go deep in commercial, corporate, or labour law with real drafting.",
        focusAr: "التعمّق في القانون التجاري أو الشركات أو العمل مع صياغةٍ واقعية.",
        targetComposite: t2,
        activities: [
          {
            type: "challenge",
            labelEn: "Contract-drafting & dispute challenge (commercial law)",
            labelAr: "تحدّي صياغة العقود والنزاعات (القانون التجاري)",
          },
          {
            type: "project",
            labelEn: "Full legal memorandum on a Saudi commercial dispute",
            labelAr: "مذكّرة قانونية كاملة في نزاعٍ تجاريٍّ سعودي",
          },
        ],
      },
      {
        titleEn: "Bar admission",
        titleAr: "القيد في هيئة المحامين",
        focusEn: "Reach a bar-ready composite and a litigation-grade portfolio.",
        focusAr: "بلوغ درجةٍ جاهزةٍ للقيد ومحفظةٍ بمستوى الترافع.",
        targetComposite: t3,
        activities: [
          {
            type: "simulation",
            labelEn: "Moot-court / pleadings simulation (Najiz workflow)",
            labelAr: "محاكاة مرافعة / لائحة دعوى (مسار ناجز)",
          },
          {
            type: "project",
            labelEn: "Pupillage portfolio (memos + signed pleadings)",
            labelAr: "محفظة التدريب (مذكّرات + لوائح موقَّعة)",
          },
        ],
      },
    ],
  };
};

const business: TemplateBuilder = (a) => {
  const [t1, t2, t3] = thresholds(a.composite, a.targetComposite);
  return {
    titleEn: `Path to ${a.titleEn}`,
    titleAr: `مسار نحو ${a.titleAr}`,
    targetSscoCode: a.sscoCode,
    targetComposite: t3,
    rationaleEn:
      "Core business fluency, then a market-tested specialization, then a Vision-2030-aligned launch with a recognised credential (SOCPA / CFA / PMP).",
    rationaleAr:
      "إتقان أساسيات الأعمال، ثم تخصّصٌ مُختبَرٌ في السوق، ثم انطلاقةٌ متوائمةٌ مع رؤية 2030 باعتمادٍ معترفٍ به (SOCPA / CFA / PMP).",
    stages: [
      {
        titleEn: "Core business",
        titleAr: "أساسيات الأعمال",
        focusEn: "Build fluency in finance, operations, and data-driven decisions.",
        focusAr: "بناء إتقانٍ في المالية والعمليات والقرارات المبنيّة على البيانات.",
        targetComposite: t1,
        activities: [
          {
            type: "simulation",
            labelEn: "Business decision simulation (P&L trade-offs)",
            labelAr: "محاكاة قرار أعمال (مفاضلات الأرباح والخسائر)",
          },
          {
            type: "project",
            labelEn: "Financial model for a Saudi SME (3-statement)",
            labelAr: "نموذج مالي لمنشأة سعودية صغيرة (ثلاث قوائم)",
          },
        ],
      },
      {
        titleEn: "Specialization",
        titleAr: "التخصّص",
        focusEn: "Specialize in finance, marketing, or supply chain on a real brief.",
        focusAr: "التخصّص في المالية أو التسويق أو سلاسل الإمداد على مهمةٍ واقعية.",
        targetComposite: t2,
        activities: [
          {
            type: "challenge",
            labelEn: "Corporate case challenge with a Vision-2030 employer",
            labelAr: "تحدّي حالة مؤسسية مع صاحب عملٍ من رؤية 2030",
          },
          {
            type: "project",
            labelEn: "Go-to-market plan with market sizing & unit economics",
            labelAr: "خطة دخول السوق مع تقدير الحجم واقتصاديات الوحدة",
          },
        ],
      },
      {
        titleEn: "Career launch",
        titleAr: "انطلاقة المهنة",
        focusEn: "Hit the target composite and earn a recognised credential.",
        focusAr: "بلوغ الدرجة المستهدفة والحصول على اعتمادٍ معترفٍ به.",
        targetComposite: t3,
        activities: [
          {
            type: "challenge",
            labelEn: "Capstone consulting challenge for a named firm",
            labelAr: "تحدّي استشاري ختامي لشركةٍ محدَّدة",
          },
          {
            type: "project",
            labelEn: "Credential-prep portfolio (CFA / SOCPA / PMP track)",
            labelAr: "محفظة إعداد للاعتماد (مسار CFA / SOCPA / PMP)",
          },
        ],
      },
    ],
  };
};

const education: TemplateBuilder = (a) => {
  const [t1, t2, t3] = thresholds(a.composite, a.targetComposite);
  return {
    titleEn: `Path to ${a.titleEn}`,
    titleAr: `مسار نحو ${a.titleAr}`,
    targetSscoCode: a.sscoCode,
    targetComposite: t3,
    rationaleEn:
      "Pedagogical foundations, then supervised field practice, then the ETEC Teacher Professional Licence — each stage produces classroom-ready evidence.",
    rationaleAr:
      "أسسٌ تربوية، ثم تدريبٌ ميدانيٌّ تحت إشراف، ثم الرخصة المهنية للمعلمين من هيئة تقويم التعليم والتدريب (ETEC) — كل مرحلةٍ تُنتج دليلاً جاهزاً للصف.",
    stages: [
      {
        titleEn: "Pedagogical foundations",
        titleAr: "الأسس التربوية",
        focusEn: "Master learning theory, curriculum design, and assessment.",
        focusAr: "إتقان نظريات التعلّم وتصميم المناهج والتقويم.",
        targetComposite: t1,
        activities: [
          {
            type: "project",
            labelEn: "Standards-aligned lesson-plan unit (with rubrics)",
            labelAr: "وحدة خطط دروس متوائمة مع المعايير (مع أدوات تقويم)",
          },
          {
            type: "simulation",
            labelEn: "Classroom-management scenario simulation",
            labelAr: "محاكاة سيناريو إدارة صف",
          },
        ],
      },
      {
        titleEn: "Teaching practice",
        titleAr: "التربية الميدانية",
        focusEn: "Teach supervised lessons and act on observation feedback.",
        focusAr: "تدريس حصصٍ تحت إشرافٍ والعمل على ملاحظات الزيارات الصفية.",
        targetComposite: t2,
        activities: [
          {
            type: "challenge",
            labelEn: "Field-placement teaching challenge (real classroom)",
            labelAr: "تحدّي التدريب الميداني (صف حقيقي)",
          },
          {
            type: "project",
            labelEn: "Reflective teaching portfolio with evidence of impact",
            labelAr: "محفظة تدريس تأمّلية مع أدلة الأثر",
          },
        ],
      },
      {
        titleEn: "Professional licence (ETEC)",
        titleAr: "الرخصة المهنية (ETEC)",
        focusEn: "Reach a licence-ready composite and pass the professional standards.",
        focusAr: "بلوغ درجةٍ جاهزةٍ للرخصة واجتياز المعايير المهنية.",
        targetComposite: t3,
        activities: [
          {
            type: "simulation",
            labelEn: "Teacher Professional Licence exam-style simulation",
            labelAr: "محاكاة بأسلوب اختبار الرخصة المهنية للمعلمين",
          },
          {
            type: "project",
            labelEn: "Licence portfolio (subject + pedagogy evidence)",
            labelAr: "محفظة الرخصة (أدلة التخصّص + الممارسة التربوية)",
          },
        ],
      },
    ],
  };
};

const engineering: TemplateBuilder = (a) => {
  const [t1, t2, t3] = thresholds(a.composite, a.targetComposite);
  return {
    titleEn: `Path to ${a.titleEn}`,
    titleAr: `مسار نحو ${a.titleAr}`,
    targetSscoCode: a.sscoCode,
    targetComposite: t3,
    rationaleEn:
      "Engineering fundamentals, then applied design, then a Saudi Council of Engineers (SCE) professional profile — each stage ships a build a panel can review.",
    rationaleAr:
      "أساسيات الهندسة، ثم التصميم التطبيقي، ثم ملفٌّ مهنيٌّ لدى الهيئة السعودية للمهندسين (SCE) — كل مرحلةٍ تُسلّم نتاجاً يمكن للجنةٍ مراجعته.",
    stages: [
      {
        titleEn: "Engineering fundamentals",
        titleAr: "أساسيات الهندسة",
        focusEn: "Lock the maths, modelling, and core domain fundamentals.",
        focusAr: "إتقان الرياضيات والنمذجة وأساسيات التخصّص.",
        targetComposite: t1,
        activities: [
          {
            type: "simulation",
            labelEn: "Engineering design-decision simulation",
            labelAr: "محاكاة قرار تصميم هندسي",
          },
          {
            type: "project",
            labelEn: "Foundational design/analysis project with calculations",
            labelAr: "مشروع تصميم/تحليل تأسيسي مع الحسابات",
          },
        ],
      },
      {
        titleEn: "Applied design",
        titleAr: "التصميم التطبيقي",
        focusEn: "Deliver a standards-compliant design on a realistic brief.",
        focusAr: "تسليم تصميمٍ مطابقٍ للمعايير على مهمةٍ واقعية.",
        targetComposite: t2,
        activities: [
          {
            type: "challenge",
            labelEn: "Industry design challenge (Vision-2030 megaproject)",
            labelAr: "تحدّي تصميم صناعي (مشروع عملاق من رؤية 2030)",
          },
          {
            type: "project",
            labelEn: "Capstone build with a safety & compliance dossier",
            labelAr: "مشروع تخرّج مع ملف سلامةٍ وامتثال",
          },
        ],
      },
      {
        titleEn: "Professional profile (SCE)",
        titleAr: "الملف المهني (SCE)",
        focusEn: "Reach the target composite and an SCE-ready engineering portfolio.",
        focusAr: "بلوغ الدرجة المستهدفة ومحفظةٍ هندسيةٍ جاهزةٍ للهيئة (SCE).",
        targetComposite: t3,
        activities: [
          {
            type: "challenge",
            labelEn: "Advanced engineering challenge with a named employer",
            labelAr: "تحدٍّ هندسيٌّ متقدّم مع صاحب عمل",
          },
          {
            type: "project",
            labelEn: "Signature engineering project for your portfolio",
            labelAr: "مشروع هندسي مميّز لمحفظتك",
          },
        ],
      },
    ],
  };
};

const computing: TemplateBuilder = (a) => {
  const [t1, t2, t3] = thresholds(a.composite, a.targetComposite);
  return {
    titleEn: `Path to ${a.titleEn}`,
    titleAr: `مسار نحو ${a.titleAr}`,
    targetSscoCode: a.sscoCode,
    targetComposite: t3,
    rationaleEn:
      "Computing fundamentals, then shipped software, then an SDAIA/NCA-aware professional profile — each stage produces a runnable, reviewable artifact.",
    rationaleAr:
      "أساسيات الحوسبة، ثم برمجياتٌ مُسلَّمة، ثم ملفٌّ مهنيٌّ واعٍ بـSDAIA/NCA — كل مرحلةٍ تُنتج مُخرَجاً قابلاً للتشغيل والمراجعة.",
    stages: [
      {
        titleEn: "Computing fundamentals",
        titleAr: "أساسيات الحوسبة",
        focusEn: "Lock data structures, systems thinking, and clean code.",
        focusAr: "إتقان هياكل البيانات والتفكير النظمي والكود النظيف.",
        targetComposite: t1,
        activities: [
          {
            type: "simulation",
            labelEn: "System-design decision simulation",
            labelAr: "محاكاة قرار تصميم نظام",
          },
          {
            type: "project",
            labelEn: "Foundational software project with tests",
            labelAr: "مشروع برمجي تأسيسي مع اختبارات",
          },
        ],
      },
      {
        titleEn: "Applied build",
        titleAr: "البناء التطبيقي",
        focusEn: "Ship a real, secure application on an evaluated brief.",
        focusAr: "تسليم تطبيقٍ حقيقيٍّ آمنٍ على مهمةٍ مُقيَّمة.",
        targetComposite: t2,
        activities: [
          {
            type: "challenge",
            labelEn: "Corporate engineering challenge (sector-aligned)",
            labelAr: "تحدٍّ هندسيٌّ مؤسسيٌّ متوائمٌ مع القطاع",
          },
          {
            type: "project",
            labelEn: "Deployed app with a security & PDPL checklist",
            labelAr: "تطبيق منشور مع قائمة أمنٍ وحماية بيانات (PDPL)",
          },
        ],
      },
      {
        titleEn: "Market readiness",
        titleAr: "الجاهزية للسوق",
        focusEn: "Reach the target composite and a job-ready engineering portfolio.",
        focusAr: "بلوغ الدرجة المستهدفة ومحفظةٍ هندسيةٍ جاهزةٍ للتوظيف.",
        targetComposite: t3,
        activities: [
          {
            type: "challenge",
            labelEn: "Advanced challenge with a named employer",
            labelAr: "تحدٍّ متقدّم مع صاحب عمل",
          },
          {
            type: "project",
            labelEn: "Signature project for your portfolio",
            labelAr: "مشروع مميّز لمحفظتك",
          },
        ],
      },
    ],
  };
};

/** Generic fallback (discipline-agnostic) — mirrors the route's original plan. */
const generic: TemplateBuilder = (a) => {
  const [t1, t2, t3] = thresholds(a.composite, a.targetComposite);
  return {
    titleEn: `Path to ${a.titleEn}`,
    titleAr: `مسار نحو ${a.titleAr}`,
    targetSscoCode: a.sscoCode,
    targetComposite: t3,
    rationaleEn:
      "A staged plan that compounds evidence: each stage produces an artifact that raises your equity.",
    rationaleAr:
      "خطة متدرّجة تراكم الأدلة: كل مرحلة تُنتج مخرَجاً يرفع قيمتك التراكمية.",
    stages: [
      {
        titleEn: "Foundations",
        titleAr: "الأساسيات",
        focusEn: "Close core gaps and demonstrate fundamentals.",
        focusAr: "سدّ الفجوات الأساسية وإثبات الأساسيات.",
        targetComposite: t1,
        activities: [
          { type: "simulation", labelEn: "Decision simulation in your domain", labelAr: "محاكاة قرار في مجالك" },
          { type: "project", labelEn: "Foundational portfolio project", labelAr: "مشروع محفظة تأسيسي" },
        ],
      },
      {
        titleEn: "Applied practice",
        titleAr: "الممارسة التطبيقية",
        focusEn: "Apply skills on a realistic, evaluated brief.",
        focusAr: "تطبيق المهارات على مهمة واقعية مُقيَّمة.",
        targetComposite: t2,
        activities: [
          { type: "challenge", labelEn: "Corporate challenge (sector-aligned)", labelAr: "تحدٍّ مؤسسي متوائم مع القطاع" },
          { type: "project", labelEn: "Capstone with regulatory grounding", labelAr: "مشروع تخرّج بأساس نظامي" },
        ],
      },
      {
        titleEn: "Market readiness",
        titleAr: "الجاهزية للسوق",
        focusEn: "Reach the target composite and a job-ready portfolio.",
        focusAr: "بلوغ الدرجة المستهدفة ومحفظة جاهزة للتوظيف.",
        targetComposite: t3,
        activities: [
          { type: "challenge", labelEn: "Advanced challenge with a named employer", labelAr: "تحدٍّ متقدّم مع صاحب عمل" },
          { type: "project", labelEn: "Signature project for your portfolio", labelAr: "مشروع مميّز لمحفظتك" },
        ],
      },
    ],
  };
};

const BUILDERS: Record<TemplateKey, TemplateBuilder> = {
  medicine,
  law,
  business,
  education,
  engineering,
  computing,
  generic,
};

// ───────────────────────────────────────────────────────────────────────────
//  Public API
// ───────────────────────────────────────────────────────────────────────────

export interface CareerPathTemplateInput {
  /** Student's free-text program (e.g. "Accounting", "Medicine"). */
  program: string;
  /** Optional resolved SCED specialization name (more authoritative). */
  specialization?: string | null;
  /** The career title to anchor the plan around (defaults to program). */
  titleEn?: string;
  titleAr?: string;
  /** The student's current composite (0-100). */
  composite: number;
  /** The target composite to reach (0-100). */
  targetComposite: number;
  /** The official SSCO occupation code the path aims at, if any. */
  sscoCode?: string | null;
}

/**
 * Build a specialization-aware, adaptive fallback career path.
 *
 * Pure & deterministic: same inputs → same plan. The route uses this whenever
 * the AI path is unavailable, so a Medicine student gets a clinical ladder and a
 * Law student gets a litigation ladder instead of a generic tech plan.
 */
export function getCareerPathTemplate(input: CareerPathTemplateInput): PathShape {
  const key = selectTemplateKey(input.program, input.specialization);
  const titleEn = input.titleEn?.trim() || input.program;
  const titleAr = input.titleAr?.trim() || input.program;
  return BUILDERS[key]({
    titleEn,
    titleAr,
    composite: input.composite,
    targetComposite: input.targetComposite,
    sscoCode: input.sscoCode ?? null,
  });
}

/** Exposed for diagnostics/tests: which bucket a program resolves to. */
export function resolveTemplateKey(program: string, specialization?: string | null): TemplateKey {
  return selectTemplateKey(program, specialization);
}
