"use client";

/**
 * iSCARB i18n — bilingual layer (EN / AR) with JSON locale files.
 * ===========================================================================
 * The product targets Saudi higher education, so Arabic is a first-class
 * language, not a label translation. Views read strings through `useI18n()`:
 *
 *   const { t, ar, dir } = useI18n();
 *   <h1>{t("assessment.player.title")}</h1>
 *
 * Document direction (RTL) is already applied globally from `app/page.tsx`
 * (sets `document.documentElement.dir`). This module only resolves strings.
 *
 * Keys are flat and namespaced by view: `"<view>.<section>.<name>"`. Each key
 * maps to a value in the locale JSON. `t()` falls back AR → EN → key,
 * so a missing Arabic string degrades to English rather than blanking the UI.
 * `t()` supports `{token}` interpolation: `t("profile.weight", { n: 2 })`.
 * ===========================================================================
 */
import { useApp } from "@/lib/store";

import assessmentAr from "@/i18n/locales/ar/assessment.json";
import modulesAr from "@/i18n/locales/ar/modules.json";
import rubricAr from "@/i18n/locales/ar/rubric.json";
import feedbackAr from "@/i18n/locales/ar/feedback.json";
import errorsAr from "@/i18n/locales/ar/errors.json";

import assessmentFr from "@/i18n/locales/fr/assessment.json";
import modulesFr from "@/i18n/locales/fr/modules.json";
import rubricFr from "@/i18n/locales/fr/rubric.json";
import feedbackFr from "@/i18n/locales/fr/feedback.json";
import errorsFr from "@/i18n/locales/fr/errors.json";

export type Lang = "en" | "ar" | "fr";

type Dict = Record<string, string>;

// ─────────────────────────────────────────────────────────────────────────────
//  Flatten nested JSON into a dot-separated key map
// ─────────────────────────────────────────────────────────────────────────────

function flattenJson(obj: Record<string, any>, prefix = ""): Dict {
  const result: Dict = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "_meta") continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenJson(value, fullKey));
    } else if (typeof value === "string") {
      result[fullKey] = value;
    } else if (typeof value === "boolean" || typeof value === "number") {
      result[fullKey] = String(value);
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Build the merged Arabic dictionary from JSON locale files
// ─────────────────────────────────────────────────────────────────────────────

const arabicLocale: Dict = {
  ...flattenJson(assessmentAr as Record<string, any>),
  ...flattenJson(modulesAr as Record<string, any>),
  ...flattenJson(rubricAr as Record<string, any>),
  ...flattenJson(feedbackAr as Record<string, any>),
  ...flattenJson(errorsAr as Record<string, any>),
};

// ─────────────────────────────────────────────────────────────────────────────
//  Inline English strings (existing — kept for backward compatibility)
//  New English strings should go into en/*.json files when those are created.
// ─────────────────────────────────────────────────────────────────────────────

const STRINGS: Dict = {
  // ── COMMON (shared chrome) ────────────────────────────────────────────────
  "common.live.en": "live",
  "common.live.ar": "حيّ",
  "common.offline.en": "offline",
  "common.offline.ar": "غير متصل",
  "common.loading.en": "Loading…",
  "common.loading.ar": "جارٍ التحميل…",
  "common.retry.en": "Retry",
  "common.retry.ar": "إعادة المحاولة",

  // Toast / feedback messages (bilingual)
  "toast.generating.title.en": "Generating…",
  "toast.generating.title.ar": "جارٍ التوليد…",
  "toast.generating.body.en": "The AI is working. This can take 15–25 seconds.",
  "toast.generating.body.ar": "الذكاء الاصطناعي يعمل. قد يستغرق هذا 15–25 ثانية.",
  "toast.capstone.ok.title.en": "Capstone ready",
  "toast.capstone.ok.title.ar": "مشروع التخرّج جاهز",
  "toast.capstone.ok.body.en": "Your capstone has been generated.",
  "toast.capstone.ok.body.ar": "تم توليد مشروع تخرّجك.",
  "toast.career.ok.title.en": "Career mapped",
  "toast.career.ok.title.ar": "تم رسم المسار المهني",
  "toast.career.ok.body.en": "A precise, skills-evidenced title was generated.",
  "toast.career.ok.body.ar": "تم توليد عنوانٍ دقيقٍ موثَّقٍ بالمهارات.",
  "toast.error.title.en": "Something went wrong",
  "toast.error.title.ar": "حدث خطأ ما",
  "toast.error.body.en": "The request failed. Please try again.",
  "toast.error.body.ar": "فشل الطلب. يُرجى المحاولة مرة أخرى.",
  "toast.fallback.title.en": "Using offline mode",
  "toast.fallback.title.ar": "يعمل في الوضع دون اتصال",
  "toast.fallback.body.en": "AI was unavailable — a deterministic result was returned.",
  "toast.fallback.body.ar": "تعذّر الوصول للذكاء الاصطناعي — أُرجِعت نتيجةٌ حتميةٌ بديلة.",

  // ── HOME ───────────────────────────────────────────────────────────────────
  "home.hero.eyebrow.en": "Sovereign Readiness Engine",
  "home.hero.eyebrow.ar": "محرّك الجاهزية السيادي",
  "home.hero.titleLead.en": "We turn academic content into",
  "home.hero.titleLead.ar": "نحوّل المحتوى الأكاديمي إلى",
  "home.hero.titleHighlight.en": "capability you can prove",
  "home.hero.titleHighlight.ar": "قدرةٍ يمكنك إثباتها",
  "home.hero.subtitle.en":
    "iSCARB is the AI-bound curriculum layer for Saudi higher education. Every unit is generated, simulated, compliance-mapped, and zero-shot assessed — then branded into a career the market actually hires.",
  "home.hero.subtitle.ar":
    "آي-سكارب طبقةٌ منهجيةٌ مربوطةٌ بالذكاء الاصطناعي للتعليم العالي السعودي. كل وحدةٍ تُولَّد، وتُحاكى، وتُربَط بالامتثال، وتُقيَّم دون أمثلةٍ مرجعية — ثم تُحوَّل إلى مهنةٍ يوظّفها السوق فعلاً.",
  "home.hero.runSim.en": "Run a student simulation",
  "home.hero.runSim.ar": "شغّل محاكاة طالب",
  "home.hero.genCapstone.en": "Generate a capstone",
  "home.hero.genCapstone.ar": "ولّد مشروع تخرّج",
  "home.hero.badgeNcaaa.en": "NCAAA / ETEC aligned",
  "home.hero.badgeNcaaa.ar": "متوائم مع NCAAA / ETEC",
  "home.hero.badgeVision.en": "Vision 2030 workforce pillars",
  "home.hero.badgeVision.ar": "ركائز القوى العاملة لرؤية 2030",
  "home.hero.mottoEn.en": "I can, I will · The end of all excuses",
  "home.hero.mottoEn.ar": "أنا أستطيع، أنا سأفعل · نهاية كل الأعذار",

  "home.ticker.live.en": "Live market",
  "home.ticker.live.ar": "السوق الحيّ",

  "home.live.eyebrow.en": "Live operations",
  "home.live.eyebrow.ar": "العمليات الحيّة",
  "home.live.title.en": "The engine, right now",
  "home.live.title.ar": "المحرّك، الآن",
  "home.live.subtitle.en":
    "A live snapshot of every student, every challenge, every market signal flowing through iSCARB.",
  "home.live.subtitle.ar":
    "لقطةٌ حيّةٌ لكل طالب، وكل تحدٍّ، وكل إشارة سوقٍ تتدفّق عبر آي-سكارب.",

  "home.stat.avgReadiness.en": "Avg readiness",
  "home.stat.avgReadiness.ar": "متوسط الجاهزية",
  "home.stat.topDecile.en": "Top decile {n}",
  "home.stat.topDecile.ar": "العشير الأعلى {n}",
  "home.stat.studentsTracked.en": "Students tracked",
  "home.stat.studentsTracked.ar": "الطلاب المتابَعون",
  "home.stat.atRisk.en": "{n} at risk",
  "home.stat.atRisk.ar": "{n} معرّضون للخطر",
  "home.stat.openChallenges.en": "Open challenges",
  "home.stat.openChallenges.ar": "التحديات المفتوحة",
  "home.stat.challengeHint.en": "Aramco · stc · Al Rajhi",
  "home.stat.challengeHint.ar": "أرامكو · stc · الراجحي",
  "home.stat.liveSignals.en": "Live market signals",
  "home.stat.liveSignals.ar": "إشارات السوق الحيّة",
  "home.stat.refreshedHourly.en": "Refreshed hourly",
  "home.stat.refreshedHourly.ar": "تُحدَّث كل ساعة",

  "home.clf.eyebrow.en": "Sovereign anchoring",
  "home.clf.eyebrow.ar": "الإسناد السيادي",
  "home.clf.title.en": "Built on Saudi national classifications",
  "home.clf.title.ar": "مبنيّ على التصانيف الوطنية السعودية",
  "home.clf.subtitle.en":
    "Every programme and every AI-generated career title is anchored to an official code — auditable, comparable, and interoperable with national systems. Not free text.",
  "home.clf.subtitle.ar":
    "كل تخصص وكل مسمّى وظيفي يولّده الذكاء الاصطناعي مُسنَد إلى كودٍ رسمي — قابل للتدقيق والمقارنة والتشغيل البيني مع الأنظمة الوطنية. ليس نصًّا حرًّا.",
  "home.clf.sced.title.en": "Educational levels & specializations (SCED)",
  "home.clf.sced.title.ar": "المستويات والتخصصات التعليمية (SCED)",
  "home.clf.sced.basis.en": "Ministry of Education · built on UNESCO ISCED 2011 / ISCED-F 2013",
  "home.clf.sced.basis.ar": "وزارة التعليم · مبني على التصنيف الدولي ISCED 2011 / ISCED-F 2013",
  "home.clf.sced.body.en":
    "Each programme maps to a SCED specialization and an NQF education level — so readiness, gaps, and cross-university analytics all speak one national language.",
  "home.clf.sced.body.ar":
    "كل برنامج يُربط بتخصص SCED ومستوى تعليمي في الإطار الوطني للمؤهلات — لتتحدّث الجاهزية والفجوات وتحليلات الجامعات بلغةٍ وطنية واحدة.",
  "home.clf.sced.levels.en": "{n} education levels",
  "home.clf.sced.levels.ar": "{n} مستويات تعليمية",
  "home.clf.sced.fields.en": "{n} broad fields",
  "home.clf.sced.fields.ar": "{n} مجالات واسعة",
  "home.clf.sced.specs.en": "{n} specializations",
  "home.clf.sced.specs.ar": "{n} تخصصاً",
  "home.clf.ssco.title.en": "Occupations (SSCO)",
  "home.clf.ssco.title.ar": "المهن (SSCO)",
  "home.clf.ssco.basis.en": "GASTAT · built on ILO ISCO-08",
  "home.clf.ssco.basis.ar": "الهيئة العامة للإحصاء · مبني على التصنيف الدولي ISCO-08",
  "home.clf.ssco.body.en":
    "Every AI career title is mapped onto an official SSCO occupation and its ISCO-08 code — the same code used by MHRSD, GOSI and Qiwa. The title a graduate earns is the code an employer files.",
  "home.clf.ssco.body.ar":
    "كل مسمّى وظيفي يولّده الذكاء الاصطناعي يُربط بمهنة SSCO رسمية وبكودها الدولي ISCO-08 — وهو الكود ذاته في الموارد البشرية والتأمينات وقوى. المسمّى الذي يكسبه الخريج هو الكود الذي يسجّله صاحب العمل.",
  "home.clf.ssco.majors.en": "{n} major groups",
  "home.clf.ssco.majors.ar": "{n} مجموعات رئيسية",
  "home.clf.ssco.occs.en": "{n} occupations",
  "home.clf.ssco.occs.ar": "{n} مهنة",
  "home.clf.ssco.anchored.en": "{n}% titles anchored",
  "home.clf.ssco.anchored.ar": "{n}% من المسمّيات مُسنَدة",
  "home.clf.note.en":
    "Curated seed of both standards, extensible to the full national catalogue — and ready to sync with the live GASTAT platform.",
  "home.clf.note.ar":
    "نسخة منتقاة من المعيارين، قابلة للتوسّع إلى الكتالوج الوطني الكامل — وجاهزة للمزامنة مع منصة الهيئة العامة للإحصاء.",
  "home.clf.cta.en": "See it in Career Mapping",
  "home.clf.cta.ar": "شاهده في التصنيف الوظيفي",

  "home.pipeline.eyebrow.en": "The pipeline",
  "home.pipeline.eyebrow.ar": "خط الأنابيب",
  "home.pipeline.title.en": "Five stages. Every unit is AI-bound.",
  "home.pipeline.title.ar": "خمس مراحل. كل وحدةٍ مربوطةٌ بالذكاء الاصطناعي.",
  "home.pipeline.subtitle.en":
    "A unit is not 'taught' until it has passed Inform → Simulate → Comply → Assess → Brand. Each stage runs a real LLM call with a locked prompt and temperature.",
  "home.pipeline.subtitle.ar":
    "لا تُعدّ الوحدة «مُدرَّسة» حتى تجتاز: تعبئة ← محاكاة ← امتثال ← تقييم ← تمكين. كل مرحلةٍ تُنفّذ استدعاءً حقيقياً لنموذجٍ لغويٍّ بـprompt ودرجة حرارةٍ مقفلين.",
  "home.pipeline.inform.en":
    "AI strips filler, surfaces workplace-critical concepts, and flags the misconceptions students actually hold.",
  "home.pipeline.inform.ar":
    "يُزيل الذكاء الاصطناعي الحشو، ويُبرز المفاهيم الحاسمة لبيئة العمل، ويرصد المفاهيم الخاطئة التي يحملها الطلاب فعلاً.",
  "home.pipeline.simulate.en":
    "High-stakes workplace simulations grounded in Saudi regulation. Every decision has a defensible answer.",
  "home.pipeline.simulate.ar":
    "محاكاةٌ عاليةُ المخاطر لبيئة العمل، مؤصَّلةٌ في الأنظمة السعودية. لكل قرارٍ إجابةٌ قابلةٌ للدفاع.",
  "home.pipeline.comply.en":
    "Map every learning artifact to SAMA, NCA, SDAIA, SFDA, HRSD and CMA clauses — with citations.",
  "home.pipeline.comply.ar":
    "اربط كل مخرَجٍ تعليميٍّ ببنود ساما، والأمن السيبراني، وسدايا، والغذاء والدواء، والموارد البشرية، وهيئة السوق المالية — مع الاستشهادات.",
  "home.pipeline.assess.en":
    "Zero-shot rubric scoring. Strict. No reference solution. The end of all excuses.",
  "home.pipeline.assess.ar":
    "تقييمٌ بمعايير دون أمثلةٍ مرجعية. صارمٌ. بلا حلٍّ نموذجي. نهاية كل الأعذار.",
  "home.pipeline.brand.en":
    "AI-generated career titles and capstone portfolios that prove capability — never a static dropdown.",
  "home.pipeline.brand.ar":
    "عناوينٌ مهنيةٌ ومحافظ مشاريع تخرّجٍ يولّدها الذكاء الاصطناعي لتُثبت القدرة — لا قائمةً منسدلةً جامدة.",
  "home.pipeline.openViewer.en": "Open the pipeline viewer",
  "home.pipeline.openViewer.ar": "افتح عارض خط الأنابيب",

  "home.avg.badge.en": "Fear of being average",
  "home.avg.badge.ar": "الخوف من أن تكون متوسطاً",
  "home.avg.titleLead.en": "iSCARB exists to break the cycle of",
  "home.avg.titleLead.ar": "وُجِد آي-سكارب لكسر دورة",
  "home.avg.titleHighlight.en": "ordinary graduates",
  "home.avg.titleHighlight.ar": "الخريجين العاديين",
  "home.avg.body.en":
    "The market does not hire the average. It hires the proven. iSCARB ranks every student against the top decile of their cohort, names the three specific gaps that separate them, and refuses to soften the message. Softness is what produced the cycle in the first place.",
  "home.avg.body.ar":
    "السوق لا يوظّف المتوسط، بل يوظّف من أثبت قدرته. يُرتّب آي-سكارب كل طالبٍ مقابل العشير الأعلى في دفعته، ويُسمّي الفجوات الثلاث المحددة التي تفصله، ويرفض تليين الرسالة. التليين هو ما أنتج هذه الدورة من البداية.",
  "home.avg.iCanBig.en": "I can, I will",
  "home.avg.iCanBig.ar": "أنا أستطيع، أنا سأفعل",
  "home.avg.iCanSub.en": "أنا أستطيع، أنا سأفعل",
  "home.avg.iCanSub.ar": "I can, I will.",
  "home.avg.endBig.en": "The end of all excuses",
  "home.avg.endBig.ar": "نهاية كل الأعذار",
  "home.avg.endSub.en": "نهاية كل الأعذار",
  "home.avg.endSub.ar": "The end of all excuses.",
  "home.avg.seeScale.en": "See the readiness scale",
  "home.avg.seeScale.ar": "اطّلع على مقياس الجاهزية",

  "home.cohort.eyebrow.en": "Cohort distribution",
  "home.cohort.eyebrow.ar": "توزيع الدفعة",
  "home.cohort.title.en": "Where students land",
  "home.cohort.title.ar": "أين يقع الطلاب",
  "home.cohort.topDecile.en": "Top decile (88+)",
  "home.cohort.topDecile.ar": "العشير الأعلى (88+)",
  "home.cohort.careerReady.en": "Career-ready (70–87)",
  "home.cohort.careerReady.ar": "جاهز للمهنة (70–87)",
  "home.cohort.developing.en": "Developing (55–69)",
  "home.cohort.developing.ar": "في طور التطور (55–69)",
  "home.cohort.atRisk.en": "At risk (<55)",
  "home.cohort.atRisk.ar": "معرّض للخطر (<55)",
  "home.cohort.noteLead.en": "The average is not your friend.",
  "home.cohort.noteLead.ar": "المتوسط ليس صديقك.",
  "home.cohort.noteBody.en":
    "Two in five students sit in the developing-or-below band. iSCARB moves them up by naming the gap, not by inflating the grade.",
  "home.cohort.noteBody.ar":
    "اثنان من كل خمسة طلابٍ في نطاق «في طور التطور» أو أدنى. يرفعهم آي-سكارب بتسمية الفجوة، لا بتضخيم الدرجة.",

  "home.hero.panel.title.en": "National readiness",
  "home.hero.panel.title.ar": "الجاهزية الوطنية",
  "home.hero.panel.gap.en": "{gap}-point gap to top decile",
  "home.hero.panel.gap.ar": "فجوة {gap} نقطة عن العشير الأعلى",
  "home.hero.panel.topDecile.en": "Top decile: {n}",
  "home.hero.panel.topDecile.ar": "العشير الأعلى: {n}",

  "home.footer.ncaaa.en": "NCAAA quality assurance aligned",
  "home.footer.ncaaa.ar": "متوائم مع ضمان جودة NCAAA",
  "home.footer.etec.en": "ETEC standards",
  "home.footer.etec.ar": "معايير ETEC",
  "home.footer.vision.en": "Vision 2030 workforce pillars",
  "home.footer.vision.ar": "ركائز القوى العاملة لرؤية 2030",
  "home.footer.motto.en": "Knowledge bank · Skills development · Performance excellence",
  "home.footer.motto.ar": "بنك المعرفة · تطوير المهارات · التميز في الأداء",

  // Pipeline step short titles
  "home.step.inform.en": "Inform",
  "home.step.inform.ar": "تعبئة",
  "home.step.simulate.en": "Simulate",
  "home.step.simulate.ar": "محاكاة",
  "home.step.comply.en": "Comply",
  "home.step.comply.ar": "امتثال",
  "home.step.assess.en": "Assess",
  "home.step.assess.ar": "تقييم",
  "home.step.brand.en": "Brand",
  "home.step.brand.ar": "تمكين",

  // ── READINESS ──────────────────────────────────────────────────────────────
  "readiness.header.eyebrow.en": "Unified National Readiness Scale",
  "readiness.header.eyebrow.ar": "مقياس الجاهزية الوطني الموحَّد",
  "readiness.header.title.en": "Where you stand. What separates you.",
  "readiness.header.title.ar": "أين تقف. وما الذي يفصلك.",
  "readiness.header.subtitle.en":
    "A single sovereign 0–100 score, broken into four weighted dimensions, ranked against the cohort, and stripped of softness. The top decile is the contract; everything else is a gap with an action attached.",
  "readiness.header.subtitle.ar":
    "درجةٌ سياديةٌ واحدةٌ من 0–100، مقسّمةٌ إلى أربعة أبعادٍ مرجَّحة، ومرتَّبةٌ مقابل الدفعة، ومجرّدةٌ من التليين. العشير الأعلى هو العقد؛ وكل ما عداه فجوةٌ مرفقةٌ بإجراء.",

  "readiness.selector.label.en": "Student under review",
  "readiness.selector.label.ar": "الطالب قيد المراجعة",
  "readiness.selector.loading.en": "Loading students…",
  "readiness.selector.loading.ar": "جارٍ تحميل الطلاب…",
  "readiness.selector.placeholder.en": "Select student",
  "readiness.selector.placeholder.ar": "اختر طالباً",

  "readiness.banner.topThreshold.en": "Top decile threshold",
  "readiness.banner.topThreshold.ar": "عتبة العشير الأعلى",

  "readiness.err.students.en": "Could not load students. Showing the last known state.",
  "readiness.err.students.ar": "تعذّر تحميل الطلاب. عرض آخر حالة معروفة.",
  "readiness.err.detail.en": "Could not load readiness detail.",
  "readiness.err.detail.ar": "تعذّر تحميل تفاصيل الجاهزية.",
  "readiness.err.failed.en": "Failed to load",
  "readiness.err.failed.ar": "فشل التحميل",

  "readiness.ring.title.en": "Unified National Readiness Scale",
  "readiness.ring.title.ar": "مقياس الجاهزية الوطني الموحَّد",
  "readiness.ring.label.en": "Readiness",
  "readiness.ring.label.ar": "الجاهزية",
  "readiness.stat.you.en": "You",
  "readiness.stat.you.ar": "أنت",
  "readiness.stat.cohortAvg.en": "Cohort avg",
  "readiness.stat.cohortAvg.ar": "متوسط الدفعة",
  "readiness.stat.topDecile.en": "Top decile",
  "readiness.stat.topDecile.ar": "العشير الأعلى",
  "readiness.gap.reached.en": "Top decile reached. Hold the line.",
  "readiness.gap.reached.ar": "بلغتَ العشير الأعلى. اثبت.",
  "readiness.gap.points.en": "{n} points to top decile.",
  "readiness.gap.points.ar": "{n} نقطة للعشير الأعلى.",
  "readiness.gap.vsCohort.en": "You are {x} vs cohort.",
  "readiness.gap.vsCohort.ar": "أنت {x} مقابل الدفعة.",

  "readiness.pct.label.en": "Cohort percentile",
  "readiness.pct.label.ar": "المئين ضمن الدفعة",
  "readiness.pct.bottom.en": "Bottom",
  "readiness.pct.bottom.ar": "الأدنى",
  "readiness.pct.topCut.en": "Top 10% cutoff",
  "readiness.pct.topCut.ar": "حدّ أعلى 10%",

  "readiness.dims.title.en": "How the 100 breaks down",
  "readiness.dims.title.ar": "كيف تتوزّع الـ100",
  "readiness.dims.intro.en":
    "Four weighted dimensions. No red/green bars — a single brand gradient tells you where you sit, not whether you \"passed\".",
  "readiness.dims.intro.ar":
    "أربعة أبعادٍ مرجَّحة. بلا أشرطة حمراء/خضراء — تدرّجٌ لونيٌّ واحدٌ يخبرك أين تقف، لا إن كنت قد «نجحت».",
  "readiness.dims.emptyTitle.en": "Dimension breakdown not available yet",
  "readiness.dims.emptyTitle.ar": "تفصيل الأبعاد غير متاح بعد",
  "readiness.dims.emptyBody.en":
    "This student has no scored dimensions yet. Complete an assessment to populate the four weighted dimensions — no estimates are shown.",
  "readiness.dims.emptyBody.ar":
    "لا توجد لهذا الطالب أبعادٌ مُقيَّمةٌ بعد. أكمِل تقييماً لتعبئة الأبعاد الأربعة المرجَّحة — لا تُعرَض أي تقديرات.",
  "readiness.dims.wt.en": "{n}% wt",
  "readiness.dims.wt.ar": "{n}% وزن",

  "readiness.gaps.title.en": "What separates you from the top 10%",
  "readiness.gaps.title.ar": "ما الذي يفصلك عن أعلى 10%",
  "readiness.gaps.count.en": "{n} gaps",
  "readiness.gaps.count.ar": "{n} فجوات",
  "readiness.gaps.pts.en": "pts",
  "readiness.gaps.pts.ar": "نقطة",
  "readiness.gaps.emptyTitle.en": "Gap analysis not available yet",
  "readiness.gaps.emptyTitle.ar": "تحليل الفجوات غير متاح بعد",
  "readiness.gaps.emptyBody.en":
    "Specific gaps to the top decile appear here once your assessment and project evidence are scored. No placeholder gaps are shown.",
  "readiness.gaps.emptyBody.ar":
    "تظهر هنا الفجوات المحدّدة مقارنةً بأعلى 10% بمجرّد تقييم اختبارك وأدلّة مشاريعك. لا تُعرَض فجواتٌ افتراضية.",

  "readiness.career.title.en": "Branded career projection",
  "readiness.career.title.ar": "إسقاط مهنيٌّ مُمكَّن",
  "readiness.career.aiTitle.en": "AI-generated title (no static dropdowns)",
  "readiness.career.aiTitle.ar": "عنوانٌ مولَّدٌ بالذكاء الاصطناعي (بلا قوائم منسدلة)",
  "readiness.career.match.en": "Match score:",
  "readiness.career.match.ar": "درجة المطابقة:",
  "readiness.career.demand.en": "Live demand for your skills",
  "readiness.career.demand.ar": "طلبٌ حيٌّ على مهاراتك",

  "readiness.cohort.title.en": "Cohort placement",
  "readiness.cohort.title.ar": "ترتيب الدفعة",
  "readiness.cohort.showMore.en": "Show {n} more",
  "readiness.cohort.showMore.ar": "إظهار {n} أخرى",
  "readiness.cohort.showLess.en": "Show less",
  "readiness.cohort.showLess.ar": "إظهار أقل",

  "readiness.memo.title.en": "The score does not flatter you. It is the contract.",
  "readiness.memo.title.ar": "الدرجة لا تجاملك. إنها العقد.",
  "readiness.memo.body.en":
    "Close every gap before the next simulation. The market does not grade on a curve.",
  "readiness.memo.body.ar":
    "أغلِق كل فجوةٍ قبل المحاكاة التالية. السوق لا يصحّح على منحنى.",

  // ── PIPELINE ───────────────────────────────────────────────────────────────
  "pipeline.header.eyebrow.en": "Pipeline viewer",
  "pipeline.header.eyebrow.ar": "عارض خط الأنابيب",
  "pipeline.header.title.en": "The AI Engine Pipeline",
  "pipeline.header.title.ar": "خط أنابيب محرّك الذكاء الاصطناعي",
  "pipeline.header.subtitle.en":
    "Pick a course unit, walk through the five AI-bound stages, and run any stage live. Every prompt is locked — the curriculum is incomplete without its model.",
  "pipeline.header.subtitle.ar":
    "اختر وحدةً من المقرر، وتنقّل عبر المراحل الخمس المربوطة بالذكاء الاصطناعي، وشغّل أي مرحلةٍ مباشرةً. كل prompt مقفل — والمنهج ناقصٌ بدون نموذجه.",

  "pipeline.course.en": "Course",
  "pipeline.course.ar": "المقرر",
  "pipeline.loadingCourses.en": "Loading courses…",
  "pipeline.loadingCourses.ar": "جارٍ تحميل المقررات…",
  "pipeline.selectCourse.en": "Select course",
  "pipeline.selectCourse.ar": "اختر مقرراً",
  "pipeline.unit.en": "Unit",
  "pipeline.unit.ar": "الوحدة",
  "pipeline.selectUnit.en": "Select unit",
  "pipeline.selectUnit.ar": "اختر وحدة",

  "pipeline.err.courses.en": "Could not load courses. Showing offline mode.",
  "pipeline.err.courses.ar": "تعذّر تحميل المقررات. عرض الوضع دون اتصال.",
  "pipeline.err.prompt.en": "Prompt not found for this unit + stage.",
  "pipeline.err.prompt.ar": "لا يوجد prompt لهذه الوحدة والمرحلة.",
  "pipeline.domains.en": "Regulatory domains:",
  "pipeline.domains.ar": "المجالات التنظيمية:",

  "pipeline.promptEmpty.en": "Select a unit and stage to see the locked AiPrompt.",
  "pipeline.promptEmpty.ar": "اختر وحدةً ومرحلةً لرؤية الـAiPrompt المقفل.",
  "pipeline.promptLocked.en":
    "The prompt is locked at the schema level. Curriculum = content + model + prompt.",
  "pipeline.promptLocked.ar":
    "الـprompt مقفلٌ على مستوى الـschema. المنهج = محتوى + نموذج + prompt.",
  "pipeline.running.en": "Running…",
  "pipeline.running.ar": "جارٍ التشغيل…",
  "pipeline.run.en": "Run",
  "pipeline.run.ar": "شغّل",

  "pipeline.stageOutputTitle.en": "Stage output",
  "pipeline.stageOutputTitle.ar": "مخرَج المرحلة",
  "pipeline.calling.en": "Calling",
  "pipeline.calling.ar": "استدعاء",
  "pipeline.thisUnit.en": "this unit",
  "pipeline.thisUnit.ar": "هذه الوحدة",
  "pipeline.empty.en":
    "Run this stage to see live AI output — concepts, simulations, compliance clauses, rubric scores, or branded career titles.",
  "pipeline.empty.ar":
    "شغّل هذه المرحلة لرؤية مخرَج الذكاء الاصطناعي مباشرةً — مفاهيم، أو محاكاة، أو بنود امتثال، أو درجات معايير، أو عناوين مهنية مُمكَّنة.",

  "pipeline.sourceUnit.en": "Source unit content",
  "pipeline.sourceUnit.ar": "محتوى الوحدة المصدر",
  "pipeline.noUnit.en": "No unit selected.",
  "pipeline.noUnit.ar": "لم تُختَر أي وحدة.",
  "pipeline.stageOutput.en": "{stage} output",
  "pipeline.stageOutput.ar": "مخرَج {stage}",
  "pipeline.emptyOutput.en": "(empty output)",
  "pipeline.emptyOutput.ar": "(مخرَج فارغ)",
  "pipeline.sectionEmpty.en": "No data returned for this section.",
  "pipeline.sectionEmpty.ar": "لا توجد بياناتٌ لهذا القسم.",

  "pipeline.meta.model.en": "Model",
  "pipeline.meta.model.ar": "النموذج",
  "pipeline.meta.latency.en": "Latency",
  "pipeline.meta.latency.ar": "زمن الاستجابة",
  "pipeline.meta.tokens.en": "Tokens",
  "pipeline.meta.tokens.ar": "الرموز",
  "pipeline.meta.confidence.en": "Confidence",
  "pipeline.meta.confidence.ar": "الثقة",

  "pipeline.inform.concepts.en": "Concepts that matter",
  "pipeline.inform.concepts.ar": "المفاهيم المهمة",
  "pipeline.inform.misconceptions.en": "Misconceptions students hold",
  "pipeline.inform.misconceptions.ar": "مفاهيم خاطئة لدى الطلاب",
  "pipeline.inform.clos.en": "Course learning outcomes (CLOs)",
  "pipeline.inform.clos.ar": "مخرجات تعلّم المقرر (CLOs)",
  "pipeline.why.correct.en": "Correct",
  "pipeline.why.correct.ar": "الصحيح",
  "pipeline.why.bloom.en": "Bloom",
  "pipeline.why.bloom.ar": "بلوم",
  "pipeline.why.default.en": "Why",
  "pipeline.why.default.ar": "السبب",

  "pipeline.kv.title.en": "Title",
  "pipeline.kv.title.ar": "العنوان",
  "pipeline.kv.company.en": "Company",
  "pipeline.kv.company.ar": "الجهة",
  "pipeline.kv.role.en": "Role",
  "pipeline.kv.role.ar": "الدور",
  "pipeline.kv.success.en": "Success criteria",
  "pipeline.kv.success.ar": "معايير النجاح",
  "pipeline.kv.decisions.en": "Decision points",
  "pipeline.kv.decisions.ar": "نقاط القرار",
  "pipeline.kv.branches.en": "{n} branches",
  "pipeline.kv.branches.ar": "{n} مسارات",
  "pipeline.kv.rubricDims.en": "Rubric dimensions",
  "pipeline.kv.rubricDims.ar": "أبعاد المعيار",
  "pipeline.kv.axes.en": "{n} axes",
  "pipeline.kv.axes.ar": "{n} محاور",
  "pipeline.comply.clauses.en": "{n} clauses mapped",
  "pipeline.comply.clauses.ar": "{n} بنود مرتبطة",
  "pipeline.assess.zeroShot.en": "/ 100 · zero-shot",
  "pipeline.assess.zeroShot.ar": "/ 100 · دون أمثلة",

  // ── AGENT ──────────────────────────────────────────────────────────────────
  "agent.header.eyebrow.en": "Multi-Agent System",
  "agent.header.eyebrow.ar": "نظام الوكلاء المتعددين",
  "agent.header.titleLead.en": "Every student has a personal",
  "agent.header.titleLead.ar": "لكل طالبٍ",
  "agent.header.titleHighlight.en": "AI agent",
  "agent.header.titleHighlight.ar": "وكيلٌ ذكيٌّ شخصي",
  "agent.header.subtitle.en":
    "Each agent follows the student through the semester in a chosen voice — Challenger, Coach, or Scout — sending data-grounded nudges that keep the work moving.",
  "agent.header.subtitle.ar":
    "يرافق كل وكيلٍ الطالب طوال الفصل بصوتٍ مختار — التحدّي، أو المرشد، أو الكشّاف — ويرسل تنبيهاتٍ مؤصَّلةً بالبيانات تُبقي العمل متحركاً.",
  "agent.header.active.en": "{n} agents active",
  "agent.header.active.ar": "{n} وكيلاً نشطاً",
  "agent.header.challengers.en": "{n} challengers",
  "agent.header.challengers.ar": "{n} محدٍّ",
  "agent.header.coaches.en": "{n} coaches",
  "agent.header.coaches.ar": "{n} مرشد",
  "agent.header.scouts.en": "{n} scouts",
  "agent.header.scouts.ar": "{n} كشّاف",

  "agent.err.load.en": "Could not load agents. Showing the last known state.",
  "agent.err.load.ar": "تعذّر تحميل الوكلاء. عرض آخر حالة معروفة.",
  "agent.count.en": "{n} agents",
  "agent.count.ar": "{n} وكيل",
  "agent.countOne.en": "{n} agent",
  "agent.countOne.ar": "{n} وكيل",
  "agent.empty.en": "No agents have been provisioned yet.",
  "agent.empty.ar": "لم يُفعَّل أي وكيلٍ بعد.",

  "agent.card.agent.en": "Agent",
  "agent.card.agent.ar": "الوكيل",
  "agent.card.streak.en": "streak days",
  "agent.card.streak.ar": "أيام التتابع",
  "agent.card.readiness.en": "readiness",
  "agent.card.readiness.ar": "الجاهزية",
  "agent.card.fresh.en": "Fresh nudge",
  "agent.card.fresh.ar": "تنبيهٌ جديد",
  "agent.card.last.en": "Last nudge",
  "agent.card.last.ar": "آخر تنبيه",
  "agent.card.noNudge.en": "No nudge sent yet. Generate one in the persona's voice.",
  "agent.card.noNudge.ar": "لم يُرسَل أي تنبيهٍ بعد. ولّد واحداً بصوت الشخصية.",
  "agent.card.generating.en": "Generating…",
  "agent.card.generating.ar": "جارٍ التوليد…",
  "agent.card.send.en": "Send nudge",
  "agent.card.send.ar": "أرسل تنبيهاً",

  // ── CAREER ─────────────────────────────────────────────────────────────────
  "career.header.eyebrow.en": "AI Career Mapping",
  "career.header.eyebrow.ar": "التصنيف الوظيفي الذكي",
  "career.header.titleLead.en": "Your job title is",
  "career.header.titleLead.ar": "عنوانك المهني هو",
  "career.header.titleHighlight.en": "what you built",
  "career.header.titleHighlight.ar": "ما بنيته",
  "career.header.titleTail.en": " — not what you studied.",
  "career.header.titleTail.ar": " — لا ما درسته.",
  "career.header.subtitle.en":
    "Every student gets a precise, market-ready role generated from their demonstrated evidence — never a generic graduate label. Aligned to Vision 2030 and the National Qualifications Framework, with a full skills-evidence trail.",
  "career.header.subtitle.ar":
    "يحصل كل طالبٍ على دورٍ دقيقٍ جاهزٍ للسوق يُولَّد من أدلته المُثبَتة — لا تصنيفاً عاماً للخريجين. متوائمٌ مع رؤية 2030 وإطار المؤهلات الوطني، مع سجلّ أدلةٍ كاملٍ للمهارات.",
  "career.header.gloss.en":
    "Smart job classification — your career title is derived from your achievement, not from a dropdown.",
  "career.header.gloss.ar":
    "التصنيف الوظيفي الذكي — عنوانك المهني يُشتق من إنجازك، لا من قائمة منسدلة.",

  "career.strip.principle.en": "Core iSCARB principle",
  "career.strip.principle.ar": "مبدأ آي-سكارب الأساسي",
  "career.strip.titleLead.en": "We don't use drop-down lists.",
  "career.strip.titleLead.ar": "نحن لا نستخدم القوائم المنسدلة.",
  "career.strip.titleHighlight.en": "Your job title is generated from what you actually built.",
  "career.strip.titleHighlight.ar": "عنوانك المهني يُولَّد ممّا بنيته فعلاً.",
  "career.strip.body.en":
    "Pick any student below. The AI reads their full project corpus and proposes a precise, market-ready role — never \"Business Graduate\". Aligned to Vision 2030 and the National Qualifications Framework, with a skills-evidence trail.",
  "career.strip.body.ar":
    "اختر أي طالبٍ أدناه. يقرأ الذكاء الاصطناعي كامل حافظة مشاريعه ويقترح دوراً دقيقاً جاهزاً للسوق — لا «خرّيج إدارة أعمال». متوائمٌ مع رؤية 2030 وإطار المؤهلات الوطني، مع سجلّ أدلةٍ للمهارات.",

  "career.mapping.en": "Mapping…",
  "career.mapping.ar": "جارٍ الرسم…",
  "career.mapBtn.en": "Map my career",
  "career.mapBtn.ar": "ارسم مساري المهني",

  "career.err.students.en": "Could not load students. Pick one anyway and the engine will run.",
  "career.err.students.ar": "تعذّر تحميل الطلاب. اختر واحداً على أي حال وسيعمل المحرّك.",
  "career.err.mapping.en": "Career mapping failed.",
  "career.err.mapping.ar": "فشل رسم المسار المهني.",

  "career.loading.reading.en": "Reading {name}'s project corpus…",
  "career.loading.reading.ar": "قراءة حافظة مشاريع {name}…",
  "career.loading.theStudent.en": "the student",
  "career.loading.theStudent.ar": "الطالب",
  "career.loading.sub.en":
    "Aggregating skills · matching to cluster · drafting the precise title · aligning to Vision 2030 / NQF.",
  "career.loading.sub.ar":
    "تجميع المهارات · المطابقة مع العنقود · صياغة العنوان الدقيق · المواءمة مع رؤية 2030 / NQF.",

  "career.empty.title.en": "No career mapping yet.",
  "career.empty.title.ar": "لا يوجد رسمٌ مهنيٌّ بعد.",
  "career.empty.body.en":
    "Pick a student and run the engine. In ~8 seconds you get a precise AI-generated title, Arabic title, cluster, match score, alignment note, and a skills-evidence table — with a side-by-side precision upgrade against the generic graduate title.",
  "career.empty.body.ar":
    "اختر طالباً وشغّل المحرّك. خلال نحو 8 ثوانٍ تحصل على عنوانٍ دقيقٍ مولَّدٍ بالذكاء الاصطناعي، وعنوانٍ عربي، وعنقود، ودرجة مطابقة، وملاحظة مواءمة، وجدول أدلةٍ للمهارات — مع مقارنةٍ جنباً إلى جنبٍ لترقية الدقّة مقابل عنوان الخرّيج العام.",

  "career.card.aiTitle.en": "AI-generated precise title",
  "career.card.aiTitle.ar": "عنوانٌ دقيقٌ مولَّدٌ بالذكاء الاصطناعي",
  "career.card.fallback.en": "Deterministic fallback",
  "career.card.fallback.ar": "بديلٌ حتمي",
  "career.card.alignment.en": "Vision 2030 / NQF alignment",
  "career.card.alignment.ar": "المواءمة مع رؤية 2030 / NQF",
  "career.card.ssco.en": "Official occupation · SSCO {code}",
  "career.card.ssco.ar": "المهنة الرسمية · التصنيف السعودي {code}",
  "career.card.context.en": "Student context",
  "career.card.context.ar": "سياق الطالب",
  "career.card.readiness.en": "readiness {n}",
  "career.card.readiness.ar": "الجاهزية {n}",
  "career.card.unknown.en": "Unknown student",
  "career.card.unknown.ar": "طالبٌ غير معروف",
  "career.card.matchLabel.en": "Match",
  "career.card.matchLabel.ar": "المطابقة",
  "career.card.matchCaption.en": "title precision",
  "career.card.matchCaption.ar": "دقّة العنوان",
  "career.card.matchHint.en": "How tightly your evidence maps to this role.",
  "career.card.matchHint.ar": "مدى دقّة انطباق دليلك على هذا الدور.",

  "career.upgrade.title.en": "The precision upgrade",
  "career.upgrade.title.ar": "ترقية الدقّة",
  "career.upgrade.intro.en":
    "A dropdown hands every graduate the same title. iSCARB replaces it with a precise, authority-aligned role the market actually hires for.",
  "career.upgrade.intro.ar":
    "القائمة المنسدلة تمنح كل خرّيجٍ العنوان نفسه. يستبدلها آي-سكارب بدورٍ دقيقٍ متوائمٍ مع الجهات يوظّفه السوق فعلاً.",
  "career.upgrade.generic.en": "Generic title (other platforms)",
  "career.upgrade.generic.ar": "عنوانٌ عام (منصات أخرى)",
  "career.upgrade.genericNote.en": "Tells an employer nothing. Goes straight to the rejection pile.",
  "career.upgrade.genericNote.ar": "لا يخبر صاحب العمل بشيء. يذهب مباشرةً إلى كومة الرفض.",
  "career.upgrade.iscarb.en": "iSCARB title",
  "career.upgrade.iscarb.ar": "عنوان آي-سكارب",
  "career.upgrade.iscarbNote.en":
    "Specific · evidence-backed · authority-aligned. Skips the interview queue.",
  "career.upgrade.iscarbNote.ar":
    "محدّد · موثَّق بالأدلة · متوائم مع الجهات. يتخطّى طابور المقابلات.",

  "career.skills.title.en": "Skills evidence trail",
  "career.skills.title.ar": "سجلّ أدلة المهارات",
  "career.skills.count.en": "{n} evidence items",
  "career.skills.count.ar": "{n} عنصر دليل",
  "career.skills.intro.en":
    "Every skill in the AI-generated title is tied to a project the student actually built — with the proof in plain text. No skill is asserted without evidence.",
  "career.skills.intro.ar":
    "كل مهارةٍ في العنوان المولَّد مرتبطةٌ بمشروعٍ بناه الطالب فعلاً — مع الدليل بنصٍّ واضح. لا تُدَّعى مهارةٌ بلا دليل.",
  "career.skills.empty.en": "No evidence trail returned. Re-run the mapping to regenerate.",
  "career.skills.empty.ar": "لم يُرجَع سجلّ أدلة. أعِد الرسم لإعادة التوليد.",
  "career.skills.skill.en": "Skill",
  "career.skills.skill.ar": "المهارة",
  "career.skills.project.en": "Project",
  "career.skills.project.ar": "المشروع",
  "career.skills.proof.en": "Proof",
  "career.skills.proof.ar": "الدليل",
  "career.skills.showMore.en": "Show {n} more",
  "career.skills.showMore.ar": "إظهار {n} أخرى",
  "career.skills.showLess.en": "Show less",
  "career.skills.showLess.ar": "إظهار أقل",

  "career.cluster.title.en": "Cohort cluster distribution",
  "career.cluster.title.ar": "توزيع عناقيد الدفعة",
  "career.cluster.intro.en": "Where the cohort lands after the AI maps every student.",
  "career.cluster.intro.ar": "أين تقع الدفعة بعد أن يرسم الذكاء الاصطناعي كل طالب.",
  "career.cluster.yours.en": "Your cluster — {x} — is highlighted.",
  "career.cluster.yours.ar": "عنقودك — {x} — مُميَّز.",
  "career.cluster.students.en": "{n} students",
  "career.cluster.students.ar": "{n} طالب",
  "career.cluster.count.en": "Count",
  "career.cluster.count.ar": "العدد",
  "career.cluster.yourCluster.en": "your cluster",
  "career.cluster.yourCluster.ar": "عنقودك",
  "career.cluster.otherClusters.en": "other clusters",
  "career.cluster.otherClusters.ar": "العناقيد الأخرى",
  "career.cluster.max.en": "max = {n}",
  "career.cluster.max.ar": "الأقصى = {n}",

  // ── CAPSTONE ───────────────────────────────────────────────────────────────
  "capstone.header.eyebrow.en": "AI Project Builder · Step 1: Brief → Step 2: Code",
  "capstone.header.eyebrow.ar": "مولّد المشاريع الذكي · الخطوة 1: الفكرة ← الخطوة 2: الكود",
  "capstone.header.titleLead.en": "Ship a capstone the market is",
  "capstone.header.titleLead.ar": "أنجِز مشروع تخرّجٍ السوق",
  "capstone.header.titleHighlight.en": "already hiring for.",
  "capstone.header.titleHighlight.ar": "يوظّف له بالفعل.",
  "capstone.header.subtitle.en":
    "Pull a real Saudi employer problem off the live market board, scope it to the skills you have actually demonstrated, and walk away with a defensible deliverable — graded zero-shot before you submit it.",
  "capstone.header.subtitle.ar":
    "اسحب مشكلةً حقيقيةً لصاحب عملٍ سعوديٍّ من لوحة السوق الحيّة، وحدّد نطاقها وفق المهارات التي أثبتّها فعلاً، واخرج بمُخرَجٍ قابلٍ للدفاع — مُقيَّمٍ دون أمثلةٍ قبل أن تسلّمه.",
  "capstone.header.gloss.en":
    "One wizard, two steps: generate the project brief, then turn it into runnable starter code — no separate page.",
  "capstone.header.gloss.ar":
    "معالج واحد بخطوتين: ولّد فكرة المشروع، ثم حوّلها إلى كود ابتدائي قابل للتشغيل — دون صفحة منفصلة.",

  "capstone.readiness.en": "Readiness {n}",
  "capstone.readiness.ar": "الجاهزية {n}",
  "capstone.err.students.en": "Could not load students. The generator still works on the selected id.",
  "capstone.err.students.ar": "تعذّر تحميل الطلاب. لا يزال المولّد يعمل على المعرّف المحدد.",
  "capstone.err.gen.en": "Capstone generation failed.",
  "capstone.err.gen.ar": "فشل توليد مشروع التخرّج.",
  "capstone.err.eval.en": "Evaluation failed.",
  "capstone.err.eval.ar": "فشل التقييم.",

  "capstone.panel.eyebrow.en": "AI Engine · Capstone Stage",
  "capstone.panel.eyebrow.ar": "محرّك الذكاء · مرحلة التخرّج",
  "capstone.panel.title.en": "No more theoretical projects.",
  "capstone.panel.title.ar": "لا مزيد من المشاريع النظرية.",
  "capstone.panel.bodyLead.en":
    "We pull the top live market signal for this student's cluster, match it to the skills they have actually demonstrated, and ship a capstone that",
  "capstone.panel.bodyLead.ar":
    "نسحب أقوى إشارة سوقٍ حيّةٍ لعنقود هذا الطالب، ونطابقها مع المهارات التي أثبتها فعلاً، ونُنجِز مشروع تخرّجٍ",
  "capstone.panel.bodyHighlight.en": "solves a real problem an employer is hiring for right now.",
  "capstone.panel.bodyHighlight.ar": "يحلّ مشكلةً حقيقيةً يوظّف لها صاحب عملٍ الآن.",
  "capstone.panel.generating.en": "Generating…",
  "capstone.panel.generating.ar": "جارٍ التوليد…",
  "capstone.panel.generate.en": "Generate Capstone",
  "capstone.panel.generate.ar": "ولّد مشروع التخرّج",
  "capstone.panel.forStudent.en": "for {name}",
  "capstone.panel.forStudent.ar": "لـ {name}",
  "capstone.panel.selectFirst.en": "Select a student first",
  "capstone.panel.selectFirst.ar": "اختر طالباً أولاً",

  "capstone.gen.step.en": "Step {n}",
  "capstone.gen.step.ar": "خطوة {n}",
  "capstone.gen.step1.en": "Scanning live market signals",
  "capstone.gen.step1.ar": "فحص إشارات السوق الحيّة",
  "capstone.gen.step2.en": "Matching to your skill corpus",
  "capstone.gen.step2.ar": "المطابقة مع حافظة مهاراتك",
  "capstone.gen.step3.en": "Drafting the real problem",
  "capstone.gen.step3.ar": "صياغة المشكلة الحقيقية",
  "capstone.gen.step4.en": "Building deliverables & rubric",
  "capstone.gen.step4.ar": "بناء المُخرَجات والمعيار",
  "capstone.gen.reading.en":
    "Reading {name}'s project corpus against the live market board. Average latency: 6–14 s.",
  "capstone.gen.reading.ar":
    "قراءة حافظة مشاريع {name} مقابل لوحة السوق الحيّة. متوسط زمن الاستجابة: 6–14 ث.",
  "capstone.gen.theStudent.en": "the student",
  "capstone.gen.theStudent.ar": "الطالب",

  "capstone.market.real.en": "This solves a real problem.",
  "capstone.market.real.ar": "هذا يحلّ مشكلةً حقيقية.",
  "capstone.market.reporting.en": "is reporting",
  "capstone.market.reporting.ar": "يُبلِغ عن",
  "capstone.market.demandFor.en": "demand for",
  "capstone.market.demandFor.ar": "طلباً على",
  "capstone.market.tail.en": "right now. This capstone is wired to that signal — not a textbook exercise.",
  "capstone.market.tail.ar": "الآن. هذا المشروع موصولٌ بتلك الإشارة — لا تمريناً من كتاب.",
  "capstone.market.demandBadge.en": "{n}% demand",
  "capstone.market.demandBadge.ar": "{n}% طلب",
  "capstone.market.liveDemand.en": "Live market demand",
  "capstone.market.liveDemand.ar": "طلب السوق الحيّ",

  "capstone.eval.title.en": "Zero-shot evaluation",
  "capstone.eval.title.ar": "تقييمٌ دون أمثلة",
  "capstone.eval.badge.en": "capstone · {source}",
  "capstone.eval.badge.ar": "مشروع · {source}",
  "capstone.eval.intro.en":
    "The AI never sees a reference solution. It scores this capstone against the same four-axis rubric (analytical rigor · regulatory alignment · decision quality · communication) used in the simulation arena.",
  "capstone.eval.intro.ar":
    "لا يرى الذكاء الاصطناعي أي حلٍّ مرجعي. يُقيّم هذا المشروع مقابل المعيار الرباعي نفسه (الدقّة التحليلية · المواءمة التنظيمية · جودة القرار · التواصل) المستخدم في حلبة المحاكاة.",
  "capstone.eval.run.en": "Zero-shot evaluate this capstone",
  "capstone.eval.run.ar": "قيّم هذا المشروع دون أمثلة",
  "capstone.eval.scoring.en": "Scoring against the four-axis rubric…",
  "capstone.eval.scoring.ar": "التقييم مقابل المعيار الرباعي…",

  "capstone.card.liveEmployer.en": "Live employer",
  "capstone.card.liveEmployer.ar": "صاحب عملٍ حيّ",
  "capstone.card.aiGen.en": "AI-generated",
  "capstone.card.aiGen.ar": "مولَّد بالذكاء الاصطناعي",
  "capstone.card.fallback.en": "Deterministic fallback",
  "capstone.card.fallback.ar": "بديلٌ حتمي",
  "capstone.card.problem.en": "Problem statement",
  "capstone.card.problem.ar": "بيان المشكلة",
  "capstone.card.deliverables.en": "Deliverables",
  "capstone.card.deliverables.ar": "المُخرَجات",
  "capstone.card.noDeliverables.en": "No deliverables specified.",
  "capstone.card.noDeliverables.ar": "لم تُحدَّد مُخرَجات.",
  "capstone.card.timeline.en": "Timeline",
  "capstone.card.timeline.ar": "الجدول الزمني",
  "capstone.card.successMetric.en": "Success metric",
  "capstone.card.successMetric.ar": "مقياس النجاح",
  "capstone.card.skills.en": "Required skills (brand-mapped)",
  "capstone.card.skills.ar": "المهارات المطلوبة (مربوطة بالعلامة)",

  "capstone.evalRes.scoreLabel.en": "Score",
  "capstone.evalRes.scoreLabel.ar": "الدرجة",
  "capstone.evalRes.feedback.en": "Feedback",
  "capstone.evalRes.feedback.ar": "التغذية الراجعة",
  "capstone.evalRes.noFeedback.en": "No feedback returned.",
  "capstone.evalRes.noFeedback.ar": "لم تُرجَع تغذية راجعة.",
  "capstone.evalRes.confidence.en": "Confidence:",
  "capstone.evalRes.confidence.ar": "الثقة:",
  "capstone.evalRes.rubric.en": "Rubric breakdown",
  "capstone.evalRes.rubric.ar": "تفصيل المعيار",
  "capstone.evalRes.belowTitle.en": "Below standard. Close the gaps before you submit.",
  "capstone.evalRes.belowTitle.ar": "دون المستوى. أغلق الفجوات قبل التسليم.",
  "capstone.evalRes.belowBodyLead.en":
    "The market does not grade on a curve. Resubmit only when every rubric axis is",
  "capstone.evalRes.belowBodyLead.ar":
    "السوق لا يصحّح على منحنى. لا تُعِد التسليم إلا حين يكون كل محور معيارٍ",

  "capstone.empty.title.en": "No capstone generated yet.",
  "capstone.empty.title.ar": "لم يُولَّد أي مشروعٍ بعد.",
  "capstone.empty.body.en":
    "Pick a student above and run the engine. In ~10 seconds you get a market-backed title, problem, deliverables, skills, timeline, success metric — and a one-click zero-shot evaluation.",
  "capstone.empty.body.ar":
    "اختر طالباً أعلاه وشغّل المحرّك. خلال نحو 10 ثوانٍ تحصل على عنوانٍ مدعومٍ بالسوق، ومشكلة، ومُخرَجات، ومهارات، وجدولٍ زمني، ومقياس نجاح — وتقييمٍ دون أمثلةٍ بنقرةٍ واحدة.",
  "capstone.empty.aligned.en": "NCAAA / ETEC / Vision 2030 aligned",
  "capstone.empty.aligned.ar": "متوائم مع NCAAA / ETEC / رؤية 2030",

  // ── RECRUITER ──────────────────────────────────────────────────────────────
  "recruiter.header.eyebrow.en": "Recruiter Portal",
  "recruiter.header.eyebrow.ar": "بوابة التوظيف",
  "recruiter.header.title.en": "Hire proven capability, not résumés.",
  "recruiter.header.title.ar": "وظّف القدرة المُثبَتة، لا السِّيَر الذاتية.",
  "recruiter.header.subtitle.en":
    "Every candidate carries a precise AI-generated job title, a 4-D employability score, and skills verified against real projects — the proof travels with the badge. Search, filter, shortlist, and export.",
  "recruiter.header.subtitle.ar":
    "يحمل كل مرشّحٍ عنواناً وظيفياً دقيقاً مولَّداً بالذكاء الاصطناعي، ودرجة جاهزيةٍ توظيفيةٍ رباعية، ومهاراتٍ موثَّقةً مقابل مشاريع حقيقية — والدليل يرافق الشارة. ابحث، وصفِّ، وأنشئ قائمةً مختصرة، وصدِّر.",

  "recruiter.filter.search.en": "Search name, title, skill, cluster…",
  "recruiter.filter.search.ar": "ابحث بالاسم أو العنوان أو المهارة أو العنقود…",
  "recruiter.filter.allClusters.en": "All clusters",
  "recruiter.filter.allClusters.ar": "كل العناقيد",
  "recruiter.filter.allBands.en": "All bands",
  "recruiter.filter.allBands.ar": "كل الفئات",
  "recruiter.filter.minScore.en": "Min score",
  "recruiter.filter.minScore.ar": "أدنى درجة",
  "recruiter.filter.sortScore.en": "Top employability",
  "recruiter.filter.sortScore.ar": "الأعلى توظيفياً",
  "recruiter.filter.sortMatch.en": "Best title match",
  "recruiter.filter.sortMatch.ar": "أفضل مطابقة عنوان",
  "recruiter.filter.sortName.en": "Name (A–Z)",
  "recruiter.filter.sortName.ar": "الاسم (أ–ي)",
  "recruiter.filter.skillsLabel.en": "Verified skills in the pool",
  "recruiter.filter.skillsLabel.ar": "المهارات الموثَّقة في المجموعة",
  "recruiter.filter.clear.en": "Clear filters",
  "recruiter.filter.clear.ar": "مسح المرشّحات",

  "recruiter.band.exceptional.en": "Exceptional",
  "recruiter.band.exceptional.ar": "استثنائي",
  "recruiter.band.strong.en": "Strong",
  "recruiter.band.strong.ar": "قوي",
  "recruiter.band.developing.en": "Developing",
  "recruiter.band.developing.ar": "في طور التطور",
  "recruiter.band.early.en": "Early",
  "recruiter.band.early.ar": "مبكّر",

  "recruiter.results.matched.en": "{n} candidates",
  "recruiter.results.matched.ar": "{n} مرشّح",
  "recruiter.results.matched.zero.en": "No candidates",
  "recruiter.results.matched.zero.ar": "لا مرشّحين",
  "recruiter.results.matched.one.en": "1 candidate",
  "recruiter.results.matched.one.ar": "مرشّح واحد",
  "recruiter.results.matched.two.en": "2 candidates",
  "recruiter.results.matched.two.ar": "مرشّحان",
  "recruiter.results.matched.few.en": "{n} candidates",
  "recruiter.results.matched.few.ar": "{n} مرشّحين",
  "recruiter.results.matched.many.en": "{n} candidates",
  "recruiter.results.matched.many.ar": "{n} مرشّحاً",
  "recruiter.page.prev.en": "Previous",
  "recruiter.page.prev.ar": "السابق",
  "recruiter.page.next.en": "Next",
  "recruiter.page.next.ar": "التالي",
  "recruiter.page.indicator.en": "Page {page} of {total}",
  "recruiter.page.indicator.ar": "صفحة {page} من {total}",
  "recruiter.results.exportNote.en": "Export covers the current page.",
  "recruiter.results.exportNote.ar": "يشمل التصدير الصفحة الحالية.",
  "recruiter.results.export.en": "Export shortlist (CSV)",
  "recruiter.results.export.ar": "تصدير القائمة (CSV)",
  "recruiter.results.exported.en": "Shortlist exported",
  "recruiter.results.exported.ar": "تم تصدير القائمة",
  "recruiter.results.exportedBody.en": "A CSV of the filtered candidates was downloaded.",
  "recruiter.results.exportedBody.ar": "تم تنزيل ملف CSV بالمرشّحين المصفّين.",

  "recruiter.card.composite.en": "Employability",
  "recruiter.card.composite.ar": "الجاهزية التوظيفية",
  "recruiter.card.match.en": "{n}% title match",
  "recruiter.card.match.ar": "{n}% مطابقة العنوان",
  "recruiter.card.ssco.en": "SSCO {code}",
  "recruiter.card.ssco.ar": "تصنيف المهن {code}",
  "recruiter.card.verified.en": "{n} verified",
  "recruiter.card.verified.ar": "{n} موثَّقة",
  "recruiter.card.skills.en": "Verified skills",
  "recruiter.card.skills.ar": "المهارات الموثَّقة",
  "recruiter.card.projects.en": "Top evaluated projects",
  "recruiter.card.projects.ar": "أفضل المشاريع المُقيَّمة",
  "recruiter.card.noTitle.en": "Title pending — run career mapping",
  "recruiter.card.noTitle.ar": "العنوان قيد الإنشاء — شغّل التصنيف الوظيفي",
  "recruiter.card.viewEvidence.en": "View evidence",
  "recruiter.card.viewEvidence.ar": "عرض الأدلة",
  "recruiter.card.hideEvidence.en": "Hide evidence",
  "recruiter.card.hideEvidence.ar": "إخفاء الأدلة",
  "recruiter.card.dimensions.en": "Employability breakdown",
  "recruiter.card.dimensions.ar": "تفصيل الجاهزية التوظيفية",
  "recruiter.card.alignment.en": "Vision 2030 / NQF",
  "recruiter.card.alignment.ar": "رؤية 2030 / NQF",
  "recruiter.card.noProfile.en": "No assessment profile yet (showing readiness).",
  "recruiter.card.noProfile.ar": "لا يوجد ملف تقييمٍ بعد (تُعرَض الجاهزية).",
  "recruiter.card.verifiedBadge.en": "Verified against an evaluated project",
  "recruiter.card.verifiedBadge.ar": "موثَّقة مقابل مشروعٍ مُقيَّم",

  "recruiter.empty.title.en": "No candidates match these filters.",
  "recruiter.empty.title.ar": "لا يوجد مرشّحون يطابقون هذه المرشّحات.",
  "recruiter.empty.body.en": "Widen the score range, clear a filter, or change the cluster.",
  "recruiter.empty.body.ar": "وسّع نطاق الدرجة، أو امسح مرشّحاً، أو غيّر العنقود.",
  "recruiter.err.load.en": "Could not load the candidate pool.",
  "recruiter.err.load.ar": "تعذّر تحميل مجموعة المرشّحين.",
  "recruiter.consent.note.en":
    "Only students who opted in to employer discoverability are shown (PDPL-compliant).",
  "recruiter.consent.note.ar":
    "تُعرَض فقط بيانات الطلبة الذين وافقوا على ظهورهم لجهات التوظيف (متوافق مع نظام حماية البيانات).",
  "recruiter.results.sampled.en":
    "Skill facets are sampled from the first {n} candidates of a larger pool.",
  "recruiter.results.sampled.ar":
    "مرشّحات المهارات مأخوذة من أوّل {n} مرشّح من مجموعةٍ أكبر.",
  "recruiter.card.verifiedVia.en": "Verified by \"{project}\" (scored {score})",
  "recruiter.card.verifiedVia.ar": "موثَّقة عبر «{project}» (الدرجة {score})",
  "recruiter.card.claimed.en": "Claimed (no evaluated project yet)",
  "recruiter.card.claimed.ar": "مُعلَنة (لا يوجد مشروع مُقيَّم بعد)",

  // ── PORTFOLIO ──────────────────────────────────────────────────────────────
  "portfolio.header.eyebrow.en": "Student portfolio",
  "portfolio.header.eyebrow.ar": "ملفّ الطالب",
  "portfolio.header.subtitle.en":
    "Your AI-generated career title, the projects that prove it, and the regulatory domains you can defend on day one. No generic titles. No unverifiable claims.",
  "portfolio.header.subtitle.ar":
    "عنوانك المهني المولَّد بالذكاء الاصطناعي، والمشاريع التي تُثبته، والمجالات التنظيمية التي يمكنك الدفاع عنها من اليوم الأول. لا عناوين عامة. لا ادعاءاتٍ غير قابلةٍ للتحقق.",
  "portfolio.selector.label.en": "Student portfolio",
  "portfolio.selector.label.ar": "ملفّ الطالب",

  "portfolio.hero.eyebrow.en": "AI-generated precise career title",
  "portfolio.hero.eyebrow.ar": "عنوانٌ مهنيٌّ دقيقٌ مولَّدٌ بالذكاء الاصطناعي",
  "portfolio.hero.match.en": "{n}% match",
  "portfolio.hero.match.ar": "{n}% مطابقة",
  "portfolio.hero.proof.en": "Verifiable proof of capability",
  "portfolio.hero.proof.ar": "دليلٌ قابلٌ للتحقق على القدرة",
  "portfolio.hero.regen.en": "Regenerate title",
  "portfolio.hero.regen.ar": "أعِد توليد العنوان",
  "portfolio.hero.unified.en": "iSCARB Unified Readiness",
  "portfolio.hero.unified.ar": "جاهزية آي-سكارب الموحَّدة",

  "portfolio.proof.title.en": "Proof of capability",
  "portfolio.proof.title.ar": "دليل القدرة",
  "portfolio.proof.dayOne.en": "Day-one employable",
  "portfolio.proof.dayOne.ar": "جاهزٌ للتوظيف من اليوم الأول",
  "portfolio.proof.lead.en": "This is what you can show an employer on day one.",
  "portfolio.proof.lead.ar": "هذا ما يمكنك عرضه على صاحب العمل من اليوم الأول.",
  "portfolio.proof.topSkills.en": "Top 3 demonstrated skills — with proof",
  "portfolio.proof.topSkills.ar": "أفضل 3 مهاراتٍ مُثبَتة — مع الدليل",
  "portfolio.proof.noSkills.en": "No skill evidence mapped yet.",
  "portfolio.proof.noSkills.ar": "لم تُربَط أدلة مهاراتٍ بعد.",
  "portfolio.proof.readinessScore.en": "Readiness score",
  "portfolio.proof.readinessScore.ar": "درجة الجاهزية",
  "portfolio.proof.domains.en": "Regulatory domains demonstrated",
  "portfolio.proof.domains.ar": "المجالات التنظيمية المُثبَتة",

  "portfolio.projects.title.en": "Verified project corpus",
  "portfolio.projects.title.ar": "حافظة المشاريع المُتحقَّقة",
  "portfolio.projects.count.en": "{n} pieces of evidence",
  "portfolio.projects.count.ar": "{n} عنصر دليل",
  "portfolio.projects.empty.en": "No verified projects yet for this student.",
  "portfolio.projects.empty.ar": "لا توجد مشاريع مُتحقَّقة لهذا الطالب بعد.",

  "portfolio.achievements.title.en": "Hackathon & competition wins",
  "portfolio.achievements.title.ar": "إنجازات الهاكاثونات والمسابقات",
  "portfolio.achievements.lead.en": "Earned outside the classroom — and now part of your permanent record, equity, and recruiter profile.",
  "portfolio.achievements.lead.ar": "مُكتسَبة خارج القاعة — وأصبحت الآن جزءاً من سجلّك الدائم وقيمتك وملفّك لدى الموظِّفين.",
  "portfolio.achievements.entered.en": "{n} entered",
  "portfolio.achievements.entered.ar": "{n} مشاركة",
  "portfolio.achievements.wins.en": "{n} podium",
  "portfolio.achievements.wins.ar": "{n} على المنصّة",
  "portfolio.achievements.prize.en": "{n} SAR in prizes",
  "portfolio.achievements.prize.ar": "{n} ريال جوائز",
  "portfolio.achievements.rank.en": "#{n}",
  "portfolio.achievements.rank.ar": "#{n}",
  "portfolio.achievements.submitted.en": "Submitted",
  "portfolio.achievements.submitted.ar": "تم التسليم",
  "portfolio.achievements.score.en": "Score {n}/100",
  "portfolio.achievements.score.ar": "النتيجة {n}/100",
  "portfolio.achievements.won.en": "Won {n} SAR",
  "portfolio.achievements.won.ar": "ربح {n} ريال",
  "portfolio.achievements.repo.en": "Project",
  "portfolio.achievements.repo.ar": "المشروع",

  "portfolio.linkedin.title.en": "LinkedIn-ready headline summary",
  "portfolio.linkedin.title.ar": "ملخّصٌ جاهزٌ لـLinkedIn",
  "portfolio.linkedin.copied.en": "Copied",
  "portfolio.linkedin.copied.ar": "نُسِخ",
  "portfolio.linkedin.copy.en": "Copy summary",
  "portfolio.linkedin.copy.ar": "انسخ الملخّص",
  "portfolio.linkedin.save.en": "Save to portfolio",
  "portfolio.linkedin.save.ar": "احفظ في الملفّ",

  "portfolio.footer.notGeneric.en": "You are not a generic graduate.",
  "portfolio.footer.notGeneric.ar": "لستَ خرّيجاً عادياً.",
  "portfolio.footer.youAre.en": "You are {title}.",
  "portfolio.footer.youAre.ar": "أنت {title}.",

  "portfolio.type.capstone.en": "Capstone",
  "portfolio.type.capstone.ar": "مشروع تخرّج",
  "portfolio.type.challenge.en": "Challenge",
  "portfolio.type.challenge.ar": "تحدٍّ",
  "portfolio.type.course.en": "Course work",
  "portfolio.type.course.ar": "عمل مقرر",
  "portfolio.type.research.en": "Research",
  "portfolio.type.research.ar": "بحث",
  "portfolio.type.clinical.en": "Clinical case",
  "portfolio.type.clinical.ar": "حالة سريرية",
  "portfolio.type.business.en": "Business plan",
  "portfolio.type.business.ar": "خطة عمل",
  "portfolio.type.creative.en": "Creative",
  "portfolio.type.creative.ar": "عمل إبداعي",
  "portfolio.type.case-study.en": "Case brief",
  "portfolio.type.case-study.ar": "مذكّرة قضية",
  "portfolio.type.presentation.en": "Defence",
  "portfolio.type.presentation.ar": "مناقشة",
  "portfolio.card.eval.en": "Zero-shot eval",
  "portfolio.card.eval.ar": "تقييمٌ دون أمثلة",
  "portfolio.card.confidence.en": "confidence {x}",
  "portfolio.card.confidence.ar": "الثقة {x}",
  "portfolio.card.chipAssessed.en": "Zero-shot assessed",
  "portfolio.card.chipAssessed.ar": "مُقيَّمٌ دون أمثلة",
  "portfolio.card.chipAiBound.en": "AI-bound",
  "portfolio.card.chipAiBound.ar": "مربوطٌ بالذكاء",
  "portfolio.card.rubricFeedback.en": "Rubric feedback",
  "portfolio.card.rubricFeedback.ar": "تغذية المعيار",
  "portfolio.card.feedback.en": "Feedback:",
  "portfolio.card.feedback.ar": "التغذية الراجعة:",
  "portfolio.axis.technical.en": "Technical depth",
  "portfolio.axis.technical.ar": "العمق التقني",
  "portfolio.axis.regulatory.en": "Regulatory alignment",
  "portfolio.axis.regulatory.ar": "المواءمة التنظيمية",
  "portfolio.axis.decision.en": "Decision quality",
  "portfolio.axis.decision.ar": "جودة القرار",
  "portfolio.axis.market.en": "Market relevance",
  "portfolio.axis.market.ar": "ملاءمة السوق",

  // Lifelong Equity Ledger
  "equity.title.en": "Lifelong Equity Ledger",
  "equity.title.ar": "سجل القيمة التراكمية",
  "equity.subtitle.en": "Your accumulating market value — every project, challenge and skill compounds it.",
  "equity.subtitle.ar": "قيمتك السوقية المتراكمة — كل مشروع وتحدٍّ ومهارة يرفعها.",
  "equity.estimatedValue.en": "Estimated market value",
  "equity.estimatedValue.ar": "القيمة السوقية التقديرية",
  "equity.perYear.en": "estimated annual, SAR",
  "equity.perYear.ar": "تقديري سنوي، ريال سعودي",
  "equity.score.en": "Equity score",
  "equity.score.ar": "مؤشر القيمة",
  "equity.signals.en": "Signals",
  "equity.signals.ar": "المؤشرات",
  "equity.learningHours.en": "Learning hours",
  "equity.learningHours.ar": "ساعات التعلم",
  "equity.skills.en": "Skills",
  "equity.skills.ar": "المهارات",
  "equity.projects.en": "Projects avg",
  "equity.projects.ar": "متوسط المشاريع",
  "equity.breakdown.en": "Value breakdown",
  "equity.breakdown.ar": "تفصيل القيمة",
  "equity.breakdownNote.en": "The value is derived, not assigned — each component contributes transparently.",
  "equity.breakdownNote.ar": "القيمة مشتقّة لا مُسندة — كل مكوّن يساهم بشفافية.",
  "equity.recompute.en": "Recompute",
  "equity.recompute.ar": "إعادة الحساب",
  "equity.pts.en": "pts",
  "equity.pts.ar": "نقطة",
  "equity.events.en": "Recent ledger events",
  "equity.events.ar": "أحدث حركات السجل",
  "equity.events.showMore.en": "Show {n} more",
  "equity.events.showMore.ar": "إظهار {n} أخرى",
  "equity.events.showLess.en": "Show less",
  "equity.events.showLess.ar": "إظهار أقل",
  "equity.selectStudent.en": "Select a student to view their equity ledger.",
  "equity.selectStudent.ar": "اختر طالباً لعرض سجل قيمته التراكمية.",
  "equity.path.title.en": "Adaptive career path",
  "equity.path.title.ar": "المسار المهني التكيّفي",
  "equity.path.generate.en": "Generate path",
  "equity.path.generate.ar": "توليد المسار",
  "equity.path.empty.en": "Generate a 3-stage path toward a target occupation.",
  "equity.path.empty.ar": "ولّد مساراً من 3 مراحل نحو مهنة مستهدفة.",
  "equity.path.target.en": "Target: SSCO {code} · composite {n}",
  "equity.path.target.ar": "الهدف: تصنيف المهن {code} · جاهزية {n}",
  "equity.review.title.en": "AI portfolio review",
  "equity.review.title.ar": "تقييم المحفظة بالذكاء الاصطناعي",
  "equity.review.run.en": "Run review",
  "equity.review.run.ar": "تشغيل التقييم",
  "equity.review.empty.en": "Get a market valuation of your portfolio against Saudi employers.",
  "equity.review.empty.ar": "احصل على تقييم سوقي لمحفظتك مقابل جهات التوظيف السعودية.",
  "equity.review.strengths.en": "Strengths",
  "equity.review.strengths.ar": "نقاط القوة",
  "equity.review.gaps.en": "Gaps",
  "equity.review.gaps.ar": "الفجوات",

  // Saudi Job Match
  "jobs.title.en": "Saudi Job Match",
  "jobs.title.ar": "مطابقة الوظائف السعودية",
  "jobs.subtitle.en": "Roles ranked against your profile and the official occupation taxonomy.",
  "jobs.subtitle.ar": "وظائف مرتّبة وفق ملفّك والتصنيف الرسمي للمهن.",
  "jobs.weights.en": "Match = 40% occupation (SSCO) · 25% employability · 25% skills · 10% Vision 2030.",
  "jobs.weights.ar": "المطابقة = 40% المهنة (تصنيف المهن) · 25% الجاهزية · 25% المهارات · 10% رؤية 2030.",
  "jobs.empty.en": "No job postings available yet.",
  "jobs.empty.ar": "لا توجد وظائف متاحة بعد.",
  "jobs.match.en": "match",
  "jobs.match.ar": "مطابقة",
  "jobs.vision2030.en": "Vision 2030",
  "jobs.vision2030.ar": "رؤية 2030",
  "jobs.ssco.en": "Occupation · SSCO {code}",
  "jobs.ssco.ar": "المهنة · تصنيف المهن {code}",
  "jobs.factor.ssco.en": "Occupation",
  "jobs.factor.ssco.ar": "المهنة",
  "jobs.factor.composite.en": "Employability",
  "jobs.factor.composite.ar": "الجاهزية",
  "jobs.factor.skills.en": "Skills",
  "jobs.factor.skills.ar": "المهارات",
  "jobs.factor.vision.en": "Vision 2030",
  "jobs.factor.vision.ar": "رؤية 2030",

  // Requirement-to-Code Bridge (R2C)
  "r2c.title.en": "Requirement → Code Bridge",
  "r2c.title.ar": "من المتطلب إلى الكود",
  "r2c.subtitle.en": "Paste a requirement from your lecture — get a runnable starter: schema, diagram, Docker, tests, and a deploy checklist.",
  "r2c.subtitle.ar": "الصق متطلباً من محاضرتك — واحصل على بداية قابلة للتشغيل: مخطّط، رسم معماري، Docker، اختبارات، وقائمة نشر.",
  "r2c.placeholder.en": "e.g. Design a database for an e-learning system with ACID compliance",
  "r2c.placeholder.ar": "مثال: صمّم قاعدة بيانات لنظام تعلّم إلكتروني مع دعم خصائص ACID",
  "r2c.useExample.en": "Use an example",
  "r2c.useExample.ar": "استخدم مثالاً",
  "r2c.generate.en": "Generate starter",
  "r2c.generate.ar": "توليد البداية",
  "r2c.imageNote.en": "Tip: type or paste the requirement text. Generating from a photo of a slide (OCR) is coming with a vision model.",
  "r2c.imageNote.ar": "ملاحظة: اكتب أو الصق نص المتطلب. التوليد من صورة شريحة (OCR) قادم مع نموذج رؤية.",
  "r2c.fallbackBadge.en": "Template (offline)",
  "r2c.fallbackBadge.ar": "قالب (دون اتصال)",
  "r2c.tab.schema.en": "Prisma schema",
  "r2c.tab.schema.ar": "مخطّط Prisma",
  "r2c.tab.diagram.en": "Architecture",
  "r2c.tab.diagram.ar": "البنية",
  "r2c.tab.docker.en": "Docker",
  "r2c.tab.docker.ar": "Docker",
  "r2c.tab.tests.en": "Tests",
  "r2c.tab.tests.ar": "الاختبارات",
  "r2c.tab.checklist.en": "Deploy checklist",
  "r2c.tab.checklist.ar": "قائمة النشر",
  "r2c.copy.en": "Copy",
  "r2c.copy.ar": "نسخ",
  "r2c.copied.en": "Copied",
  "r2c.copied.ar": "تم النسخ",
  "r2c.mermaidNote.en": "Mermaid source — paste into any Mermaid-enabled viewer (e.g. mermaid.live) to render.",
  "r2c.mermaidNote.ar": "مصدر Mermaid — الصقه في أيّ عارض يدعم Mermaid (مثل mermaid.live) لعرضه.",
  "r2c.viewSource.en": "Source",
  "r2c.viewSource.ar": "المصدر",
  "r2c.viewDiagram.en": "Diagram",
  "r2c.viewDiagram.ar": "الرسم",
  "r2c.mermaidRendered.en": "Rendered from the Mermaid definition below.",
  "r2c.mermaidRendered.ar": "مُعراض من تعريف Mermaid أدناه.",
  "r2c.mermaidError.en": "Couldn't render the diagram here — showing the Mermaid source instead.",
  "r2c.mermaidError.ar": "تعذّر عرض الرسم هنا — هذا مصدر Mermaid بدلاً منه.",

  // Saudi Context Injector
  "saudi.title.en": "Saudi Context",
  "saudi.title.ar": "السياق السعودي",
  "saudi.subtitle.en": "Every technical concept, taught through a real Saudi system instead of Netflix or Stripe.",
  "saudi.subtitle.ar": "كل مفهوم تقني مشروحٌ عبر نظام سعودي حقيقي بدل نتفليكس أو سترايب.",
  "saudi.searchPlaceholder.en": "Search a concept (e.g. microservices, payments, SSO)",
  "saudi.searchPlaceholder.ar": "ابحث عن مفهوم (مثل الخدمات المصغّرة، المدفوعات، الدخول الموحّد)",
  "saudi.allCategories.en": "All categories",
  "saudi.allCategories.ar": "كل الفئات",
  "saudi.why.en": "Why this fits",
  "saudi.why.ar": "لماذا يناسب",
  "saudi.empty.en": "No concepts match your search.",
  "saudi.empty.ar": "لا توجد مفاهيم تطابق بحثك.",

  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  "onb.eyebrow.en": "First-year on-ramp",
  "onb.eyebrow.ar": "بداية السنة الأولى",
  "onb.title.en": "Start",
  "onb.title.ar": "ابدأ",
  "onb.titleHighlight.en": "where you are",
  "onb.titleHighlight.ar": "من حيث أنت",
  "onb.arTag.en": "Welcome aboard",
  "onb.arTag.ar": "أهلاً بك",
  "onb.subtitle.en":
    "No projects yet? That's exactly the point. This is a low-stakes tour to explore directions, try the tools, and start your portfolio from day one — no career target required.",
  "onb.subtitle.ar":
    "لا مشاريع بعد؟ هذا هو المقصود تماماً. هذه جولةٌ بلا ضغطٍ لاستكشاف الاتجاهات، وتجربة الأدوات، وبدء ملفّك من اليوم الأول — دون الحاجة لهدفٍ مهنيٍّ محدّد.",
  "onb.motto.en": "Start where you are",
  "onb.motto.ar": "ابدأ من حيث أنت",
  "onb.student.en": "Student",
  "onb.student.ar": "الطالب",
  "onb.year.label.en": "Your academic year",
  "onb.year.label.ar": "سنتك الدراسية",
  "onb.year.1.en": "Year 1",
  "onb.year.1.ar": "السنة 1",
  "onb.year.2.en": "Year 2",
  "onb.year.2.ar": "السنة 2",
  "onb.year.3.en": "Year 3",
  "onb.year.3.ar": "السنة 3",
  "onb.year.4plus.en": "Year 4+",
  "onb.year.4plus.ar": "السنة 4+",
  "onb.mode.exploratory.title.en": "Exploratory mode",
  "onb.mode.exploratory.title.ar": "وضع الاستكشاف",
  "onb.mode.exploratory.body.en":
    "You're early — so there's no fixed target yet. Wander, try things, and let your interests point the way.",
  "onb.mode.exploratory.body.ar":
    "أنت في البداية — فلا هدف ثابت بعد. تجوّل، جرّب، ودَع اهتماماتك تدلّك على الطريق.",
  "onb.mode.standard.title.en": "You're on the full journey",
  "onb.mode.standard.title.ar": "أنت على الرحلة الكاملة",
  "onb.mode.standard.body.en":
    "From year 4 the platform switches to a target-driven path: map a career, close skill gaps, and build job-ready evidence.",
  "onb.mode.standard.body.ar":
    "من السنة الرابعة تتحوّل المنصة إلى مسارٍ موجَّهٍ بهدف: ارسم مهنةً، وسُدَّ فجوات المهارات، وابنِ أدلةً جاهزةً للتوظيف.",
  "onb.profile.title.en": "A starting point (not a commitment)",
  "onb.profile.title.ar": "نقطة انطلاق (وليست التزاماً)",
  "onb.interests.label.en": "Interests that energize you",
  "onb.interests.label.ar": "اهتمامات تشدّك",
  "onb.interests.placeholder.en": "e.g. Data, Health, Design",
  "onb.interests.placeholder.ar": "مثل: بيانات، صحة، تصميم",
  "onb.interests.empty.en": "Add a few interests to guide your exploration.",
  "onb.interests.empty.ar": "أضف بعض الاهتمامات لتوجيه استكشافك.",
  "onb.strengths.label.en": "Things you're already good at",
  "onb.strengths.label.ar": "أمور تجيدها بالفعل",
  "onb.strengths.placeholder.en": "e.g. Math, Writing, Teamwork",
  "onb.strengths.placeholder.ar": "مثل: رياضيات، كتابة، عمل جماعي",
  "onb.strengths.empty.en": "Name a few strengths — everyone has them.",
  "onb.strengths.empty.ar": "اذكر بعض نقاط قوّتك — لكلٍّ منها نصيب.",
  "onb.save.en": "Save",
  "onb.save.ar": "حفظ",
  "onb.saved.en": "Saved",
  "onb.saved.ar": "تم الحفظ",
  "onb.progress.label.en": "Your exploration",
  "onb.progress.label.ar": "استكشافك",
  "onb.progress.steps.en": "{done} of {total} steps",
  "onb.progress.steps.ar": "{done} من {total} خطوات",
  "onb.tasks.title.en": "Your first steps",
  "onb.tasks.title.ar": "خطواتك الأولى",
  "onb.tasks.subtitle.en": "Do them in any order. Each one opens a part of the platform.",
  "onb.tasks.subtitle.ar": "نفّذها بأي ترتيب. كلٌّ منها يفتح جزءاً من المنصة.",
  "onb.tasks.showCompleted.en": "Show {n} completed",
  "onb.tasks.showCompleted.ar": "إظهار {n} مكتملة",
  "onb.tasks.hideCompleted.en": "Hide completed",
  "onb.tasks.hideCompleted.ar": "إخفاء المكتملة",
  "onb.task.open.en": "Open",
  "onb.task.open.ar": "افتح",
  "onb.task.markDone.en": "Mark explored",
  "onb.task.markDone.ar": "تمّ استكشافه",
  "onb.task.done.en": "Explored",
  "onb.task.done.ar": "تمّ",
  "onb.cat.explore.en": "Explore",
  "onb.cat.explore.ar": "استكشاف",
  "onb.cat.reflect.en": "Reflect",
  "onb.cat.reflect.ar": "تأمّل",
  "onb.cat.try.en": "Try",
  "onb.cat.try.ar": "تجربة",
  "onb.cat.connect.en": "Connect",
  "onb.cat.connect.ar": "تواصل",
  "onb.graduate.cta.en": "I'm ready for my full journey",
  "onb.graduate.cta.ar": "أنا جاهز لرحلتي الكاملة",
  "onb.graduate.hint.en": "Explore a few more steps to unlock your full journey.",
  "onb.graduate.hint.ar": "استكشف خطواتٍ أخرى لفتح رحلتك الكاملة.",
  "onb.graduated.title.en": "You're ready — the platform is yours",
  "onb.graduated.title.ar": "أنت جاهز — المنصة بين يديك",
  "onb.graduated.body.en":
    "Nice work exploring. Now map a career, run the readiness scale, and start turning coursework into proof.",
  "onb.graduated.body.ar":
    "أحسنت الاستكشاف. والآن ارسم مهنةً، وشغّل مقياس الجاهزية، وابدأ تحويل المقررات إلى دليل.",
  "onb.graduated.gotoCareer.en": "Map my career",
  "onb.graduated.gotoCareer.ar": "ارسم مهنتي",
  "onb.graduated.gotoReadiness.en": "See my readiness",
  "onb.graduated.gotoReadiness.ar": "شاهد جاهزيتي",
  "onb.graduated.reopen.en": "Back to exploration",
  "onb.graduated.reopen.ar": "العودة للاستكشاف",
  "onb.empty.en": "No students found for your university yet.",
  "onb.empty.ar": "لا يوجد طلاب لجامعتك بعد.",
  "onb.error.en": "Couldn't load onboarding. Showing the last known state.",
  "onb.error.ar": "تعذّر تحميل البداية. عرض آخر حالة معروفة.",

  // ── DEAN DASHBOARD ─────────────────────────────────────────────────────────
  "dean.header.eyebrow.en": "Leadership view",
  "dean.header.eyebrow.ar": "منظور القيادة",
  "dean.header.titleLead.en": "Dean",
  "dean.header.titleLead.ar": "لوحة",
  "dean.header.titleHighlight.en": "Dashboard",
  "dean.header.titleHighlight.ar": "العميد",
  "dean.header.subtitle.en":
    "Cohort readiness, employer demand, and the governance queue — all on one screen.",
  "dean.header.subtitle.ar":
    "جاهزية الدفعة، وطلب جهات التوظيف، وطابور الحوكمة — على شاشةٍ واحدة.",
  "dean.banner.title.en": "Raising the floor and the ceiling.",
  "dean.banner.title.ar": "نهاية كل الأعذار",
  "dean.banner.pulse.en": "Cohort pulse",
  "dean.banner.pulse.ar": "نبض الدفعة",
  "dean.error.en": "Could not load the dean dashboard. Showing the last known state.",
  "dean.error.ar": "تعذّر تحميل لوحة العميد. عرض آخر حالة معروفة.",
  "dean.kpi.readiness.en": "Avg readiness",
  "dean.kpi.readiness.ar": "متوسط الجاهزية",
  "dean.kpi.students.en": "Total students",
  "dean.kpi.students.ar": "إجمالي الطلاب",
  "dean.kpi.challenges.en": "Open challenges",
  "dean.kpi.challenges.ar": "التحديات المفتوحة",
  "dean.kpi.challengesHint.en": "Live market signals",
  "dean.kpi.challengesHint.ar": "إشارات سوقٍ حيّة",
  "dean.kpi.adjustments.en": "Open grade adjustments",
  "dean.kpi.adjustments.ar": "تعديلات الدرجات المفتوحة",
  "dean.kpi.adjustmentsHint.en": "Pending review",
  "dean.kpi.adjustmentsHint.ar": "بانتظار المراجعة",
  "dean.readiness.title.en": "Readiness distribution",
  "dean.readiness.title.ar": "توزيع الجاهزية",
  "dean.readiness.buckets.en": "4 buckets",
  "dean.readiness.buckets.ar": "4 شرائح",
  "dean.readiness.caption.en":
    "The gold band is the top decile. The muted slate band is the at-risk floor — that is where the dean raises the floor.",
  "dean.readiness.caption.ar":
    "الشريحة الذهبية هي العُشر الأعلى. والشريحة الرماديّة الباهتة هي أرضية المعرّضين للخطر — وهناك يرفع العميد الأرضية.",
  "dean.readiness.cohort.en": "Cohort",
  "dean.readiness.cohort.ar": "الدفعة",
  "dean.engagement.title.en": "Attendance vs Participation",
  "dean.engagement.title.ar": "الحضور مقابل المشاركة",
  "dean.engagement.badge.en": "separate by design",
  "dean.engagement.badge.ar": "منفصلان عمداً",
  "dean.engagement.noteLead.en": "These are measured separately by design.",
  "dean.engagement.noteLead.ar": "يُقاسان منفصلين عمداً.",
  "dean.engagement.noteBody.en":
    "Attendance = physical presence. Participation = quality of interaction with the AI curriculum. They are not the same and must never be merged.",
  "dean.engagement.noteBody.ar":
    "الحضور = التواجد الفعلي. المشاركة = جودة التفاعل مع المنهج الذكي. وهما ليسا الشيء نفسه ولا يجوز دمجهما أبداً.",
  "dean.engagement.attendance.en": "Avg attendance",
  "dean.engagement.attendance.ar": "متوسط الحضور",
  "dean.engagement.participation.en": "Avg participation",
  "dean.engagement.participation.ar": "متوسط المشاركة",
  "dean.engagement.score.en": "Score",
  "dean.engagement.score.ar": "الدرجة",
  "dean.engagement.legendAttendance.en": "Attendance = presence",
  "dean.engagement.legendAttendance.ar": "الحضور = التواجد",
  "dean.engagement.legendParticipation.en": "Participation = interaction quality",
  "dean.engagement.legendParticipation.ar": "المشاركة = جودة التفاعل",
  "dean.adjustments.title.en": "Open grade adjustments",
  "dean.adjustments.title.ar": "تعديلات الدرجات المفتوحة",
  "dean.adjustments.pending.en": "{n} pending",
  "dean.adjustments.pending.ar": "{n} بالانتظار",
  "dean.adjustments.empty.en": "No pending grade adjustments. The pipeline is clean.",
  "dean.adjustments.empty.ar": "لا تعديلات درجاتٍ معلّقة. الطابور نظيف.",
  "dean.adjustments.colStudent.en": "Student",
  "dean.adjustments.colStudent.ar": "الطالب",
  "dean.adjustments.colCourse.en": "Course",
  "dean.adjustments.colCourse.ar": "المقرر",
  "dean.adjustments.colFaculty.en": "Faculty",
  "dean.adjustments.colFaculty.ar": "عضو هيئة التدريس",
  "dean.adjustments.colScore.en": "Score",
  "dean.adjustments.colScore.ar": "الدرجة",
  "dean.adjustments.colReason.en": "Reason",
  "dean.adjustments.colReason.ar": "السبب",
  "dean.adjustments.colAction.en": "Action",
  "dean.adjustments.colAction.ar": "إجراء",
  "dean.adjustments.evidence.en": "Evidence",
  "dean.adjustments.evidence.ar": "الدليل",
  "dean.adjustments.approve.en": "Approve",
  "dean.adjustments.approve.ar": "اعتماد",
  "dean.adjustments.reject.en": "Reject",
  "dean.adjustments.reject.ar": "رفض",
  "dean.employers.title.en": "Top employers demanding skills",
  "dean.employers.title.ar": "أبرز جهات التوظيف طلباً للمهارات",
  "dean.employers.empty.en": "No employer demand signals available.",
  "dean.employers.empty.ar": "لا تتوفّر إشارات طلبٍ من جهات التوظيف.",
  "dean.employers.demandUnit.en": "demand",
  "dean.employers.demandUnit.ar": "طلب",
  "dean.employers.rolesUnit.en": "roles open",
  "dean.employers.rolesUnit.ar": "وظيفة شاغرة",
  "dean.employers.signal.en": "Signal",
  "dean.employers.signal.ar": "إشارة",
  "dean.clusters.title.en": "Career cluster distribution",
  "dean.clusters.title.ar": "توزيع المجموعات المهنية",
  "dean.clusters.empty.en": "No career clusters mapped yet.",
  "dean.clusters.empty.ar": "لم تُربط مجموعات مهنية بعد.",
  "dean.clusters.studentsUnit.en": "students",
  "dean.clusters.studentsUnit.ar": "طالب",
  "dean.studentsUnit.en": "students",
  "dean.studentsUnit.ar": "طالب",
  "dean.export.cta.en": "Export NCAAA report (PDF)",
  "dean.export.cta.ar": "تصدير تقرير NCAAA (PDF)",
  "dean.export.preparing.en": "Preparing…",
  "dean.export.preparing.ar": "جارٍ التحضير…",
};

// ─────────────────────────────────────────────────────────────────────────────
//  Resolution: JSON locale files (new) + legacy inline STRINGS
//  JSON keys take precedence over inline keys for Arabic.
// ─────────────────────────────────────────────────────────────────────────────

const frenchLocale: Dict = {
  ...flattenJson(assessmentFr as Record<string, any>),
  ...flattenJson(modulesFr as Record<string, any>),
  ...flattenJson(rubricFr as Record<string, any>),
  ...flattenJson(feedbackFr as Record<string, any>),
  ...flattenJson(errorsFr as Record<string, any>),
};

/** Resolve a key for an explicit language (use inside `t`). */
function resolve(key: string, lang: Lang): string {
  if (lang === "ar") {
    // Arabic: check JSON locale files first, then legacy inline, then key
    return arabicLocale[key] ?? STRINGS[`${key}.ar`] ?? STRINGS[`${key}.en`] ?? key;
  }
  if (lang === "fr") {
    return frenchLocale[key] ?? STRINGS[`${key}.fr`] ?? STRINGS[`${key}.en`] ?? key;
  }
  // English: legacy inline only (EN JSON files not yet created)
  return STRINGS[`${key}.en`] ?? STRINGS[`${key}.ar`] ?? key;
}

export interface I18n {
  t: (key: string, vars?: Record<string, string | number>) => string;
  lang: Lang;
  ar: boolean;
  dir: "rtl" | "ltr";
  /** Convert Western digits in a value to Arabic-Indic when lang is Arabic. */
  num: (n: number | string) => string;
  /** Return the Arabic plural category for a count (zero|one|two|few|many). */
  plural: (n: number) => "zero" | "one" | "two" | "few" | "many";
}

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Western → Arabic-Indic digits. */
export function toArabicNumerals(value: number | string): string {
  return String(value).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);
}

/**
 * Arabic plural category (CLDR-aligned): 0 → zero, 1 → one, 2 → two,
 * 3–10 → few, 11+ → many. Western/English callers fall back to one/other via
 * the one|many split, so a single helper serves both languages.
 */
export function arabicPlural(n: number): "zero" | "one" | "two" | "few" | "many" {
  const abs = Math.abs(Math.trunc(n));
  if (abs === 0) return "zero";
  if (abs === 1) return "one";
  if (abs === 2) return "two";
  const mod100 = abs % 100;
  if (mod100 >= 3 && mod100 <= 10) return "few";
  return "many";
}

/**
 * Hook: read the active language from the store and return a `t()` resolver.
 * Re-renders the calling view whenever the language toggles. In Arabic, numeric
 * interpolation values are rendered in Arabic-Indic digits automatically.
 */
export function useI18n(): I18n {
  const lang = useApp((s) => s.lang);
  const ar = lang === "ar";
  const num = (n: number | string): string => (ar ? toArabicNumerals(n) : String(n));
  const t = (key: string, vars?: Record<string, string | number>): string => {
    const raw = resolve(key, lang);
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
      vars[k] != null ? (typeof vars[k] === "number" ? num(vars[k] as number) : String(vars[k])) : `{${k}}`,
    );
  };
  return { t, lang, ar, dir: ar ? "rtl" : "ltr", num, plural: arabicPlural };
}
