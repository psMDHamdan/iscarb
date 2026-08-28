import { NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { apiError } from "@/lib/iscarb-api";
import { parseJSON, jsonErrorResponse } from "@/lib/api-helpers";
import {
  buildLiveEmployabilityReport,
  toAttemptSnapshotView,
  type LiveEmployabilityReport,
} from "@/lib/assessment/live-employability-report";
import { assertCertificateEligibility } from "@/lib/assessment/certificate-eligibility";
import { resolveOwnedStudentId } from "@/lib/assessment/resolve-student";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PremiumEmployabilityReportPDF } from "@/components/pdf/PremiumEmployabilityReportPDF";

function isErrorResult(
  r: LiveEmployabilityReport | { error: string; status: number },
): r is { error: string; status: number } {
  return "error" in r && "status" in r && !("kind" in r);
}

/**
 * GET /api/iscarb/assessment/report?studentId=&specialization=
 *
 * Live JSON score report for the HTML detailed view. Always recomputes from
 * this student's own isCurrent + source!=seed rows — never returns a
 * client/localStorage snapshot, and never borrows another student's data
 * (REPORT_GENERATION_SPEC_2026-08-03 §1.1).
 */
export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (req, ctx) => {
    const url = new URL(req.url);
    const requestedStudentId = url.searchParams.get("studentId")?.trim() ?? undefined;
    const resolved = await resolveOwnedStudentId(ctx.session, requestedStudentId);
    if (!resolved.ok) return apiError(resolved.error, resolved.status);

    const studentId = resolved.studentId;
    const specialization = url.searchParams.get("specialization")?.trim() || null;

    const report = await buildLiveEmployabilityReport(studentId, specialization);
    if (isErrorResult(report)) return apiError(report.error, report.status);

    if (url.searchParams.get("format") === "pdf") {
      try {
        const pdfComponent = React.createElement(PremiumEmployabilityReportPDF, { report });
        const buffer = await renderToBuffer(pdfComponent);

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${studentId}_employability_report.pdf"`,
            "Cache-Control": "private, no-store",
            "X-IsCarb-Report-Modules": String(report.results.length),
            "X-IsCarb-Report-Composite": String(report.profile.composite),
          },
        });
      } catch (e: any) {
        console.error("PDF generation error:", e);
        return apiError("Report generation failed. Please try again.", 500);
      }
    }

    const snapshot = toAttemptSnapshotView(report);
    const eligibility = await assertCertificateEligibility(studentId);
    if (eligibility.ok) snapshot.id = eligibility.attemptId;

    return NextResponse.json(
      {
        success: true,
        report,
        /** Drop-in shape for EmployabilityDetailedReportView */
        attempt: snapshot,
      },
      {
        headers: {
          // Allow short browser cache (60s) to avoid hammering the report endpoint
          // on rapid tab-switches / re-renders. Data is always recomputed server-side
          // on cache miss, so staleness is bounded.
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      },
    );
  },
);

/**
 * POST /api/iscarb/assessment/report
 * Body: { studentId: string, specialization?: string }
 * Returns PDF built from live recomputation — never from client data.
 */
export const POST = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (req, ctx) => {
    const body = await parseJSON(req);
    if (!body) return jsonErrorResponse("Invalid request body");

    const payload = body as Record<string, any>;
    const requestedStudentId = payload.studentId as string | undefined;
    const resolved = await resolveOwnedStudentId(ctx.session, requestedStudentId);
    if (!resolved.ok) return apiError(resolved.error, resolved.status);

    const studentId = resolved.studentId;
    const specialization = (payload.specialization as string | undefined) ?? null;

    const report = await buildLiveEmployabilityReport(studentId, specialization);
    if (isErrorResult(report)) return apiError(report.error, report.status);

    try {
      const pdfComponent = React.createElement(PremiumEmployabilityReportPDF, { report });
      const buffer = await renderToBuffer(pdfComponent);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${studentId}_employability_report.pdf"`,
          "Cache-Control": "private, no-store",
          "X-IsCarb-Report-Modules": String(report.results.length),
          "X-IsCarb-Report-Composite": String(report.profile.composite),
        },
      });
    } catch (e: any) {
      console.error("PDF generation error:", e);
      return apiError("Report generation failed. Please try again.", 500);
    }
  },
);
