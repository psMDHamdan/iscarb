/**
 * iSCARB — classification anchoring helpers.
 * ===========================================================================
 * Turns iSCARB's free-text programmes and AI-generated career titles into
 * sovereign, auditable codes:
 *   - resolveProgrammeToSced(program)  → the SCED specialization for a programme
 *   - anchorTitleToSsco(title, cluster)→ the nearest SSCO occupation for a title
 *
 * Matching is deterministic keyword/alias matching (no model call) so it works
 * in the AI-disabled fallback path too. The point is NOT to replace the AI's
 * fluent phrasing — it is to ATTACH an official code to it, exactly like
 * validateAgainstCLOs attaches an official-CLO check. When nothing matches we
 * return null and the caller keeps the free-text value (never an invented code).
 * ===========================================================================
 */
import {
  SCED_SPECIALIZATIONS,
  SSCO_OCCUPATIONS,
  type ScedRow,
  type SsccoRow,
} from "./data";

/** Canonical programme → SCED specialization code map (iSCARB's seeded programmes). */
const PROGRAMME_TO_SCED: Record<string, string> = {
  accounting: "041101",
  "محاسبة": "041101",
  finance: "041201",
  "تمويل": "041201",
  "islamic finance": "041202",
  "التمويل الإسلامي": "041202",
  cybersecurity: "061203",
  "الأمن السيبراني": "061203",
  "أمن المعلومات": "061203",
  ai: "061901",
  "artificial intelligence": "061901",
  "الذكاء الاصطناعي": "061901",
  "data science": "061902",
  "علوم البيانات": "061902",
  "software engineering": "061302",
  "هندسة البرمجيات": "061302",
  "information technology": "061303",
  "تقنية المعلومات": "061303",
  "information systems": "061304",
  "نظم المعلومات": "061304",
  "management information systems": "041304",
  "نظم المعلومات الإدارية": "041304",
  "business administration": "041303",
  "إدارة الأعمال": "041303",
  "health management": "041305",
  "health services administration": "041305",
  "إدارة الخدمات الصحية": "041305",
  "health informatics": "068801",
  "المعلوماتية الصحية": "068801",
  "health information management": "041306",
  "إدارة المعلومات الصحية": "041306",
  "public health": "091240",
  "الصحة العامة": "091240",
  marketing: "041401",
  "التسويق": "041401",
};

/** Cluster → preferred SSCO occupation code (the seeded clusters → anchor target). */
const CLUSTER_TO_SSCO: Record<string, string> = {
  "financial services": "241301", // financial analyst
  "الخدمات المالية": "241301",
  cybersecurity: "252901", // information security specialist
  "الأمن السيبراني": "252901",
  "ai & data": "251904", // AI specialist
  "الذكاء الاصطناعي والبيانات": "251904",
  "healthcare quality": "134201", // health services manager
  "جودة الرعاية الصحية": "134201",
  "information technology": "133001",
  "تقنية المعلومات": "133001",
};

/**
 * Keyword → SSCO occupation code. Ordered roughly specific→general; the first
 * keyword found in the (normalized, lower-cased) title wins. Covers EN + AR
 * surface forms of the seeded occupations.
 *
 * `requiresFinancialContext`: a guard for over-broad words. "risk"/"مخاطر" alone
 * must NOT anchor to a *financial* risk analyst — "Clinical Risk & CBAHI
 * Compliance Officer" is a health role, not a finance one. The entry only matches
 * when the title also carries a financial signal (financial, credit, SAMA, bank…).
 */
const TITLE_KEYWORDS: { keywords: string[]; code: string; requiresFinancialContext?: boolean }[] = [
  { keywords: ["chief", "ceo", "executive officer", "رئيس تنفيذي"], code: "133001" },
  { keywords: ["information security", "cyber", "soc", "أمن المعلومات", "سيبراني", "أمن سيبراني"], code: "252901" },
  { keywords: ["data scientist", "data science", "عالم بيانات", "علوم بيانات"], code: "251902" },
  { keywords: ["artificial intelligence", "ai engineer", "machine learning", "ذكاء اصطناعي", "تعلم الآلة"], code: "251904" },
  { keywords: ["software engineer", "مهندس برمجيات"], code: "251205" },
  { keywords: ["software developer", "developer", "مطور"], code: "251201" },
  { keywords: ["database", "قواعد البيانات"], code: "252101" },
  { keywords: ["systems analyst", "محلل نظم"], code: "251101" },
  { keywords: ["ict manager", "it manager", "مدير تقنية"], code: "133001" },
  { keywords: ["health services manager", "hospital manager", "مدير خدمات صحية", "مدير مستشفى"], code: "134201" },
  { keywords: ["health information", "معلومات صحية", "معلوماتية صحية"], code: "226901" },
  { keywords: ["risk", "مخاطر"], code: "241305", requiresFinancialContext: true },
  { keywords: ["financial analyst", "credit", "محلل مالي", "ائتمان", "تمويل"], code: "241301" },
  { keywords: ["accountant", "audit", "محاسب", "مراجع"], code: "241101" },
  { keywords: ["business analyst", "محلل أعمال"], code: "242107" },
  { keywords: ["consultant", "مستشار"], code: "242101" },
  { keywords: ["marketing", "تسويق", "إعلان"], code: "243101" },
];

/** Title tokens that establish a FINANCIAL context (gates the "risk" keyword). */
const FINANCIAL_CONTEXT = [
  "financial", "finance", "credit", "sama", "bank", "banking", "investment", "loan", "treasury",
  "مالي", "مالية", "تمويل", "ائتمان", "مصرف", "مصرفي", "بنك", "استثمار", "خزينة",
];

/**
 * Clusters whose default occupation is AUTHORITATIVE and is checked BEFORE title
 * keywords. Titles in these domains routinely contain words ("risk", "analyst",
 * "officer") that would otherwise false-match a different sector's occupation, so
 * the cluster — which the AI already committed to — wins.
 */
const CLUSTER_FIRST = new Set<string>([
  "healthcare quality",
  "جودة الرعاية الصحية",
]);

const SCED_BY_CODE = new Map(SCED_SPECIALIZATIONS.map((r) => [r.code, r]));
const SSCO_BY_CODE = new Map(SSCO_OCCUPATIONS.map((r) => [r.code, r]));

/**
 * Normalize an Arabic/EN string for lookup: strip harakat (tashkeel), the
 * superscript alef and tatweel, then lower-case. So "مُحَاسَبَة" → "محاسبة" and
 * matches the undiacritized aliases below.
 */
function normalizeForLookup(s: string): string {
  return s
    .replace(/[\u064B-\u065F\u0670]/g, "") // harakat + superscript alef
    .replace(/\u0640/g, "") // tatweel
    .trim()
    .toLowerCase();
}

/** Resolve a programme name (EN or AR, any case, with/without diacritics) to its SCED specialization, or null. */
export function resolveProgrammeToSced(program: string | null | undefined): ScedRow | null {
  if (!program) return null;
  const key = normalizeForLookup(program);
  const code = PROGRAMME_TO_SCED[key];
  if (code) return SCED_BY_CODE.get(code) ?? null;
  // Substring fallback (e.g. "B.Sc. Accounting" contains "accounting").
  for (const [alias, c] of Object.entries(PROGRAMME_TO_SCED)) {
    if (key.includes(normalizeForLookup(alias))) return SCED_BY_CODE.get(c) ?? null;
  }
  return null;
}

/**
 * Anchor an AI-generated career title to an SSCO occupation. Order:
 *   0. authoritative cluster (healthcare) — wins over title keywords,
 *   1. title keyword match (with the financial-context guard on "risk"),
 *   2. any cluster's default occupation,
 * returning the matched SSCO occupation (with its ISCO-08 code) or null. A code
 * is never invented: no confident match → null and the free-text title stands.
 */
export function anchorTitleToSsco(
  title: string | null | undefined,
  cluster?: string | null,
): SsccoRow | null {
  const t = normalizeForLookup(title ?? "");
  const c = normalizeForLookup(cluster ?? "");

  // 0) Authoritative clusters win first (prevents title false-matches such as
  //    "Clinical Risk…" anchoring to a financial risk analyst).
  if (c && CLUSTER_FIRST.has(c)) {
    const code = CLUSTER_TO_SSCO[c];
    const hit = code ? SSCO_BY_CODE.get(code) : undefined;
    if (hit) return hit;
  }

  // 1) Title keywords — most specific signal about the actual role.
  const hasFinancialContext = FINANCIAL_CONTEXT.some((f) => t.includes(f));
  for (const { keywords, code, requiresFinancialContext } of TITLE_KEYWORDS) {
    if (requiresFinancialContext && !hasFinancialContext) continue;
    if (keywords.some((k) => t.includes(normalizeForLookup(k)))) {
      const hit = SSCO_BY_CODE.get(code);
      if (hit) return hit;
    }
  }

  // 2) Fall back to the cluster's default occupation (any cluster).
  if (c) {
    const code = CLUSTER_TO_SSCO[c];
    if (code) return SSCO_BY_CODE.get(code) ?? null;
  }
  return null;
}

/** ISCO major group (1 digit) for an SSCO occupation code. */
export function iscoMajorGroupOf(sscoCode: string | null | undefined): string | null {
  if (!sscoCode) return null;
  return sscoCode.charAt(0) || null;
}
