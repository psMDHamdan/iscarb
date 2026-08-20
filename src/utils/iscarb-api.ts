/**
 * iSCARB API shared helpers — used by all /api/iscarb route handlers.
 * Pure functions only. No DB or AI calls here (keep this module import-safe).
 */
import { NextResponse } from "next/server";

/** Parse a JSON string field that may be missing / malformed. Returns fallback. */
export function safeJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Clamp a number into [min, max]. */
export function clamp(n: number, min = 0, max = 100): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/** Compute participationScore per iSCARB rule: avgInputQuality*0.6 + aiConfidence*0.4 (0-100). */
export function participationScore(avgInputQuality: number, aiConfidence: number): number {
  const q = clamp(avgInputQuality ?? 0, 0, 1);
  const c = clamp(aiConfidence ?? 0, 0, 1);
  return Math.round((q * 0.6 + c * 0.4) * 100);
}

/** Compute attendanceRate (0-100) from a list of attendance status strings. */
export function attendanceRate(statuses: string[]): { present: number; total: number; rate: number } {
  const total = statuses.length;
  const present = statuses.filter((s) => s === "present" || s === "late").length;
  const rate = total === 0 ? 0 : Math.round((present / total) * 100);
  return { present, total, rate };
}

/** Compute a 0-100 heat value for a market signal cluster from demandIndex, rolesOpen, and trend. */
export function marketHeat(demandIndex: number, rolesOpen: number, trend: string): number {
  const d = clamp(demandIndex ?? 0, 0, 100);
  const r = clamp(Math.min(rolesOpen ?? 0, 100), 0, 100);
  const trendBoost = trend === "rising" ? 8 : trend === "falling" ? -8 : 0;
  return clamp(Math.round(d * 0.7 + r * 0.3 + trendBoost), 0, 100);
}

/** Title-case a kebab/snake string. */
export function titleCase(s: string): string {
  return s
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** iSCARB personas + fallback nudge text (Arabic + English). */
export const PERSONA_FALLBACK_NUDGE: Record<string, string> = {
  challenger:
    "أنا أستطيع، أنا سأفعل — لكن الأفعال وحدها تُثبت ذلك. جاهزيتك انخفضت. الليلة تُسلّم المحاكاة. هذه نهاية كل الأعذار.",
  coach:
    "أنا أستطيع، أنا سأفعل. لقد بنيت زخماً جيداً هذا الأسبوع — خطوة واحدة أخرى: أنهي تقييم المشروع قبل المساء.",
  scout:
    "سوق العمل يتحرك الآن: أرامكو رفعت الطلب على مهارتك الأقوى. راجع إشارات اليوم وادفع مشروعك إلى التحدي المناسب.",
};

/** Map a student program to a default Vision-2030 cluster + title (fallback only). */
export const PROGRAM_FALLBACK: Record<
  string,
  { generatedTitle: string; titleAr: string; cluster: string; alignment: string }
> = {
  Accounting: {
    generatedTitle: "SME Credit Risk Analyst — SAMA-Aligned",
    titleAr: "محلل مخاطر ائتمان الشركات الصغيرة — متوافق مع SAMA",
    cluster: "Financial Services",
    alignment: "Aligned to Vision 2030 Financial Sector Development Program and NQF level 7.",
  },
  Cybersecurity: {
    generatedTitle: "Sovereign SOC Lead — NCA ECC-1",
    titleAr: "قائد عمليات الأمن السيبراني السيادي — NCA ECC-1",
    cluster: "Cybersecurity",
    alignment: "Aligned to Vision 2030 National Cybersecurity Strategy and NCA ECC-1:2018.",
  },
  "Health Management": {
    generatedTitle: "Clinical Risk & CBAHI Compliance Officer",
    titleAr: "مسؤول المخاطر السريرية والامتثال CBAHI",
    cluster: "Healthcare Quality",
    alignment: "Aligned to Vision 2030 Health Sector Transformation Program and CBAHI standards.",
  },
  AI: {
    generatedTitle: "Industrial AI Engineer — Vision 2030 Megaprojects",
    titleAr: "مهندس ذكاء اصطناعي صناعي — مشاريع رؤية 2030",
    cluster: "AI & Data",
    alignment: "Aligned to Vision 2030 National Strategy for Data & AI (NSDAI).",
  },
  Finance: {
    generatedTitle: "Islamic Finance Quant Analyst",
    titleAr: "محلل كمّي للتمويل الإسلامي",
    cluster: "Financial Services",
    alignment: "Aligned to Vision 2030 Financial Sector Development Program.",
  },
};

/** Generic fallback for an unknown program. */
export function fallbackCareer(program: string) {
  return (
    PROGRAM_FALLBACK[program] ?? {
      generatedTitle: `${program} Specialist — Vision 2030 Ready`,
      titleAr: `أخصائي ${program} — جاهز لرؤية 2030`,
      cluster: titleCase(program),
      alignment: "Aligned to Vision 2030 workforce pillars.",
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SOVEREIGN POLICY CONSTANTS (Master Handover Document)
//  These are NON-NEGOTIABLE architectural invariants, enforced at the helper
//  layer so no route can bypass them.
// ─────────────────────────────────────────────────────────────────────────────

/** §2 — Attendance and ActiveParticipation must NEVER be merged. */
export const ENFORCE_SEPARATION = true;
export const SEPARATION_NOTE =
  "Attendance (presence) and ActiveParticipation (interaction quality) are measured in SEPARATE tables and must never be combined into a single engagement metric.";

/**
 * §3 — When grade adjustments for a single course section exceed this % of
 * enrolled students, the governance middleware notifies the Dean.
 */
export const DEAN_NOTIFICATION_THRESHOLD_PCT = 20; // 20% of section

/**
 * §3 — Static job-title lists are FORBIDDEN. This blocklist catches any
 * generic/drop-down-style title returned by the AI so the career/map route
 * can reject it and demand a precise, skills-evidenced title.
 */
export const GENERIC_TITLE_BLOCKLIST = [
  "business graduate",
  "it specialist",
  "computer scientist",
  "engineer", // standalone "Engineer" is too generic
  "graduate",
  "student",
  "intern",
  "analyst", // standalone
  "developer",
  "manager",
  "specialist",
  "officer",
  "coordinator",
  "assistant",
];

/** Returns true if a title is too generic to ship (§3 enforcement). */
export function isGenericTitle(title: string): boolean {
  const t = title.trim().toLowerCase();
  if (t.length < 12) return true; // too short to be precise
  // strip trailing "— ..." qualifier, check the core
  const core = t.split("—")[0].split("-")[0].trim();
  return GENERIC_TITLE_BLOCKLIST.includes(core) || GENERIC_TITLE_BLOCKLIST.includes(t);
}

/** §4 — Motivational mottos reused across views. */
export const MOTTO = {
  I_CAN_I_WILL_EN: "I can, I will",
  I_CAN_I_WILL_AR: "أنا أستطيع، أنا سأفعل",
  END_OF_EXCUSES_EN: "The end of all excuses",
  END_OF_EXCUSES_AR: "نهاية كل الأعذار",
  BREAK_THE_AVERAGE_EN: "Break the average",
  BREAK_THE_AVERAGE_AR: "اكسر حاجز العادي",
} as const;

/** Promise wrapper that rejects after `ms` — used to race AI calls. */
export function withTimeout<T>(p: Promise<T>, ms: number, label = "ai-call"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
