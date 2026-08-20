/**
 * ZTM-on-iSCARB visual theme (FR-021, §3.3).
 * ===========================================================================
 * Shared colors/typography for every renderer so PPTX, PDF, and HTML stay
 * visually consistent. Deterministic constants only — never generated.
 */
export const ZTM_THEME = {
  background: "F8FAFC",
  text: "0F172A",
  body: "334155",
  accent: "0F7B8A",
  muted: "64748B",
  progressHeight: 0.08,
  slideWidth: 10,
  slideHeight: 7.5,
  fontEnglish: "Inter",
  fontArabic: "Cairo",
  maxBullets: 5,
  bodyFontSize: 24,
} as const;

export type ZtmThemeName = "ztm";
