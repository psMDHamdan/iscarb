import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
  Line,
} from "@react-pdf/renderer";
import type { LiveEmployabilityReport } from "@/lib/assessment/live-employability-report";
import { formatBandLabel } from "@/lib/assessment/dimension-report-sections";
import path from "path";

const ISCARB_NAVY = "#00381e";
const ISCARB_TEAL = "#006838";
const ISCARB_MINT = "#10b981";
const ISCARB_GOLD = "#b45309";
const ISCARB_GREY = "#e2e8f0";
const ISCARB_TEXT = "#0f172a";
const ISCARB_MUTED = "#64748b";
const PAGE_BG = "#f8fafc";

type BandKey = "weak" | "developing" | "proficient" | "strong";

function resolveBandKey(band: string, score: number): BandKey {
  const key = formatBandLabel(band)
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, "");
  if (key === "strong" || key === "proficient" || key === "developing" || key === "weak") {
    return key;
  }
  if (score >= 80) return "strong";
  if (score >= 60) return "proficient";
  if (score >= 40) return "developing";
  return "weak";
}

const BAND_META: Record<
  BandKey,
  { label: string; stroke: string; pillBg: string; pillBorder: string; pillText: string }
> = {
  weak: {
    label: "Weak",
    stroke: "#dc2626",
    pillBg: "#fef2f2",
    pillBorder: "#fecaca",
    pillText: "#b91c1c",
  },
  developing: {
    label: "Developing",
    stroke: "#d97706",
    pillBg: "#fffbeb",
    pillBorder: "#fde68a",
    pillText: "#b45309",
  },
  proficient: {
    label: "Proficient",
    stroke: "#059669",
    pillBg: "#ecfdf5",
    pillBorder: "#a7f3d0",
    pillText: "#047857",
  },
  strong: {
    label: "Strong",
    stroke: "#006838",
    pillBg: "#ecfdf5",
    pillBorder: "#86efac",
    pillText: "#006838",
  },
};

/**
 * Half-circle gauge matching the on-screen ThomasGauge design
 * (track + ticks + rounded fill + score / 100 + band pill). PDF only.
 */
function PdfThomasGauge({
  score,
  band,
  size = "md",
}: {
  score: number;
  band: string;
  size?: "sm" | "md";
}) {
  const clamped = Math.min(Math.max(Math.round(score), 0), 100);
  const meta = BAND_META[resolveBandKey(band, clamped)];

  // ViewBox geometry mirrors ScoreMeter ThomasGauge (0–200 × 0–118)
  const vbW = 200;
  const vbH = 118;
  const r = 78;
  const cx = 100;
  const cy = 100;
  const startX = 22;
  const startY = 100;
  const endX = 178;
  const endY = 100;
  const trackPath = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
  const circumference = Math.PI * r;
  const scoreLength = (clamped / 100) * circumference;
  const strokeW = 14;

  const displayW = size === "sm" ? 118 : 148;
  const displayH = Math.round((displayW * vbH) / vbW);
  const scoreFont = size === "sm" ? 22 : 28;
  const subFont = size === "sm" ? 8 : 9;
  const scoreTop = size === "sm" ? 36 : 42;

  const ticks = [0.25, 0.5, 0.75].map((t) => {
    const a = Math.PI + t * Math.PI;
    return {
      key: t,
      x1: cx + (r - 11) * Math.cos(a),
      y1: cy + (r - 11) * Math.sin(a),
      x2: cx + (r + 11) * Math.cos(a),
      y2: cy + (r + 11) * Math.sin(a),
    };
  });

  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: displayW,
          height: displayH,
          position: "relative",
          alignItems: "center",
        }}
      >
        <Svg width={displayW} height={displayH} viewBox={`0 0 ${vbW} ${vbH}`}>
          {/* Track */}
          <Path
            d={trackPath}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          {/* Quiet band ticks */}
          {ticks.map((tick) => (
            <Line
              key={tick.key}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#cbd5e1"
              strokeWidth={1.5}
            />
          ))}
          {/* Score fill */}
          {clamped > 0 ? (
            <Path
              d={trackPath}
              fill="none"
              stroke={meta.stroke}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeDasharray={`${scoreLength} ${circumference}`}
            />
          ) : null}
        </Svg>
        <View
          style={{
            position: "absolute",
            top: scoreTop,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: scoreFont,
              fontFamily: "Helvetica-Bold",
              color: ISCARB_TEXT,
              letterSpacing: -0.5,
            }}
          >
            {clamped}
          </Text>
          <Text
            style={{
              fontSize: subFont,
              color: ISCARB_MUTED,
              marginTop: 2,
              fontFamily: "Helvetica",
            }}
          >
            / 100
          </Text>
        </View>
      </View>
      <View
        style={{
          marginTop: size === "sm" ? 8 : 10,
          paddingHorizontal: size === "sm" ? 12 : 16,
          paddingVertical: size === "sm" ? 4 : 5,
          borderRadius: 999,
          backgroundColor: meta.pillBg,
          borderWidth: 1,
          borderColor: meta.pillBorder,
          alignSelf: "center",
          minWidth: size === "sm" ? 88 : 100,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: size === "sm" ? 8 : 9,
            fontFamily: "Helvetica-Bold",
            color: meta.pillText,
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          {meta.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAGE_BG,
    fontFamily: "Helvetica",
    padding: 0,
  },
  coverContainer: {
    flex: 1,
    backgroundColor: ISCARB_NAVY,
    padding: 48,
    justifyContent: "space-between",
    position: "relative",
  },
  coverAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: ISCARB_MINT,
  },
  coverBottomAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: "#002814",
  },
  coverLogo: {
    width: 132,
    alignSelf: "flex-end",
  },
  coverTitleContainer: {
    marginTop: 64,
    marginBottom: 40,
  },
  coverHeaderBadge: {
    fontSize: 10,
    color: "#6ee7b7",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2.2,
    marginBottom: 16,
  },
  coverReportTitle: {
    fontSize: 28,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    marginBottom: 32,
    lineHeight: 1.25,
  },
  coverName: {
    fontSize: 30,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    marginBottom: 14,
  },
  coverMetaCard: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    maxWidth: 320,
  },
  coverDetails: {
    fontSize: 11,
    color: "#e2e8f0",
    lineHeight: 1.7,
  },
  contentPage: {
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: ISCARB_TEAL,
  },
  headerLogo: {
    width: 64,
  },
  headerText: {
    fontSize: 9,
    color: ISCARB_TEAL,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  pageTitle: {
    fontSize: 18,
    color: ISCARB_NAVY,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 10,
    color: ISCARB_MUTED,
    marginBottom: 18,
    lineHeight: 1.45,
  },
  tocItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tocLabel: {
    fontSize: 11,
    color: ISCARB_TEXT,
    fontFamily: "Helvetica",
    flex: 1,
    paddingRight: 12,
  },
  tocPage: {
    fontSize: 10,
    color: ISCARB_TEAL,
    fontFamily: "Helvetica-Bold",
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
  },
  dashboardGaugeBox: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ISCARB_GREY,
    paddingTop: 0,
    paddingHorizontal: 14,
    paddingBottom: 14,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardAccent: {
    height: 5,
    marginHorizontal: -14,
    marginBottom: 12,
  },
  weightBadge: {
    fontSize: 8,
    color: ISCARB_MUTED,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: "center",
  },
  sectionHeading: {
    fontSize: 12,
    color: ISCARB_NAVY,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  bodyText: {
    fontSize: 10,
    color: ISCARB_TEXT,
    lineHeight: 1.55,
    marginBottom: 8,
  },
  cardBox: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ISCARB_GREY,
    marginBottom: 14,
  },
  strengthCard: {
    backgroundColor: "#f0fdf4",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 14,
  },
  improveCard: {
    backgroundColor: "#fffbeb",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 14,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 12,
    fontSize: 10,
    color: ISCARB_MINT,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: ISCARB_TEXT,
    lineHeight: 1.45,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ISCARB_GREY,
    padding: 16,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: ISCARB_GREY,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: ISCARB_MUTED,
  },
});

interface Props {
  report: LiveEmployabilityReport;
}

export function PremiumEmployabilityReportPDF({ report }: Props) {
  const logoPath = path.join(process.cwd(), "public", "iscarb-logo.png");
  const logoSrc = `file://${logoPath.replace(/\\/g, "/")}`;
  const chapters = report.dimensionChapters ?? [];
  const dims = report.profile.dimensions;
  const studentName = (report.studentName || "").trim() || "Candidate";

  const renderDashboardCard = (
    score: number,
    title: string,
    weight: number,
    moduleCount: number,
    band: string,
  ) => {
    const clamped = Math.min(Math.max(Math.round(score), 0), 100);
    const meta = BAND_META[resolveBandKey(band, clamped)];

    return (
      <View style={styles.dashboardGaugeBox} wrap={false}>
        <View style={[styles.cardAccent, { backgroundColor: meta.stroke }]} />
        <Text style={styles.weightBadge}>Weight {(weight * 100).toFixed(0)}%</Text>
        <Text
          style={{
            fontSize: 11,
            color: ISCARB_NAVY,
            fontFamily: "Helvetica-Bold",
            marginBottom: 6,
            textAlign: "center",
            minHeight: 26,
          }}
        >
          {title}
        </Text>
        <PdfThomasGauge score={clamped} band={band} size="sm" />
        <Text
          style={{
            fontSize: 8,
            color: ISCARB_MUTED,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          {moduleCount} modules assessed
        </Text>
      </View>
    );
  };

  const tocEntries = [
    { label: "Four-Dimension Performance Summary", page: "3" },
    ...dims.map((d, i) => ({
      label: d.label,
      page: String(4 + i),
    })),
  ];

  const PageFooter = ({ pageLabel }: { pageLabel: string }) => (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>iSCARB Employability Assessment</Text>
      <Text style={styles.footerText}>{pageLabel}</Text>
    </View>
  );

  return (
    <Document>
      {/* 1. Cover — title, name, specialization, date. No overall score. */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverContainer}>
          <View style={styles.coverAccentBar} />
          <Image src={logoSrc} style={styles.coverLogo} />
          <View style={styles.coverTitleContainer}>
            <Text style={styles.coverHeaderBadge}>iSCARB Sovereign Assessment</Text>
            <Text style={styles.coverReportTitle}>Employability Exam Detailed Report</Text>
            <Text style={styles.coverName}>{studentName}</Text>
            <View style={styles.coverMetaCard}>
              {report.specialization ? (
                <Text style={styles.coverDetails}>
                  Specialization: {report.specialization}
                </Text>
              ) : null}
              <Text style={styles.coverDetails}>
                Date Generated:{" "}
                {new Date(report.computedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>
          <View style={styles.coverBottomAccent} />
        </View>
      </Page>

      {/* 2. Table of Contents */}
      <Page size="A4" style={[styles.page, styles.contentPage]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Contents</Text>
          <Image src={logoSrc} style={styles.headerLogo} />
        </View>
        <Text style={styles.pageTitle}>Table of Contents</Text>
        <Text style={styles.pageSubtitle}>
          Category-level employability performance. Individual question pages are not included.
        </Text>
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: ISCARB_GREY,
            paddingHorizontal: 14,
            paddingVertical: 4,
          }}
        >
          {tocEntries.map((entry) => (
            <View key={`${entry.page}-${entry.label}`} style={styles.tocItem}>
              <Text style={styles.tocLabel}>{entry.label}</Text>
              <Text style={styles.tocPage}>{entry.page}</Text>
            </View>
          ))}
        </View>
        <PageFooter pageLabel="2" />
      </Page>

      {/* 3. Four-Dimension Performance Summary */}
      <Page size="A4" style={[styles.page, styles.contentPage]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Four-Dimension Performance Summary</Text>
          <Image src={logoSrc} style={styles.headerLogo} />
        </View>
        <Text style={styles.pageTitle}>Four-Dimension Performance Summary</Text>
        <Text style={styles.pageSubtitle}>
          At-a-glance category averages. Each score is the mean of modules in that dimension.
        </Text>
        <View style={styles.dashboardGrid}>
          {dims.map((dim) => (
            <React.Fragment key={dim.dimension}>
              {renderDashboardCard(
                dim.score,
                dim.label,
                dim.weight,
                dim.moduleCount,
                dim.band,
              )}
            </React.Fragment>
          ))}
        </View>
        <PageFooter pageLabel="3" />
      </Page>

      {/* 4. One detailed section per category — no per-question pages */}
      {dims.map((dim, idx) => {
        const chap = chapters.find((c) => c.id === dim.dimension);
        const band = chap?.band ?? dim.band;
        const score = chap?.score ?? dim.score;
        const narrative = chap?.narrative?.length
          ? chap.narrative
          : [
              `Category average ${Math.round(score)}/100 (${formatBandLabel(band)}) across ${dim.moduleCount} modules in ${dim.label}.`,
            ];
        const strengths = chap?.strengths?.length
          ? chap.strengths
          : ["Category performance recorded under assessment conditions."];
        const improvements = chap?.improvements?.length
          ? chap.improvements
          : chap?.development?.slice(0, 3) ?? [];
        const accent = BAND_META[resolveBandKey(band, Math.round(score))].stroke;

        return (
          <Page key={dim.dimension} size="A4" style={[styles.page, styles.contentPage]}>
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>Category Performance</Text>
              <Image src={logoSrc} style={styles.headerLogo} />
            </View>

            <View style={styles.categoryHeader}>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 5,
                  backgroundColor: accent,
                  borderTopLeftRadius: 14,
                  borderTopRightRadius: 14,
                }}
              />
              <View style={{ flex: 1, paddingRight: 12, paddingTop: 6 }}>
                <Text style={[styles.weightBadge, { textAlign: "left" }]}>
                  Weight {(dim.weight * 100).toFixed(0)}% · {dim.moduleCount} modules
                </Text>
                <Text style={styles.pageTitle}>{dim.label}</Text>
                <Text style={[styles.pageSubtitle, { marginBottom: 0 }]}>
                  {chap?.definition ||
                    `Category average for ${dim.label}. Individual question detail is omitted from this report.`}
                </Text>
              </View>
              <View style={{ width: 150, alignItems: "center", paddingTop: 4 }}>
                <PdfThomasGauge score={score} band={band} size="md" />
              </View>
            </View>

            <Text style={styles.sectionHeading}>Performance Analysis</Text>
            <View style={styles.cardBox}>
              {narrative.map((p, i) => (
                <Text key={i} style={styles.bodyText}>
                  {p}
                </Text>
              ))}
            </View>

            <Text style={[styles.sectionHeading, { color: ISCARB_TEAL }]}>Strengths</Text>
            <View style={styles.strengthCard}>
              {strengths.map((str, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{str}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionHeading, { color: ISCARB_GOLD }]}>
              Areas for Improvement
            </Text>
            <View style={styles.improveCard}>
              {improvements.map((imp, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={[styles.bulletDot, { color: ISCARB_GOLD }]}>•</Text>
                  <Text style={styles.bulletText}>{imp}</Text>
                </View>
              ))}
            </View>
            <PageFooter pageLabel={String(4 + idx)} />
          </Page>
        );
      })}
    </Document>
  );
}
