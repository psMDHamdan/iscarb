import { ImageResponse } from "next/og";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { buildLiveEmployabilityReport } from "@/lib/assessment/live-employability-report";
import { assertCertificateEligibility } from "@/lib/assessment/certificate-eligibility";

/** Stable, opaque credential ID — non-guessable, non-reversible. */
function credentialId(studentId: string): string {
  const secret = process.env.CERTIFICATE_ID_SECRET ?? "iscarb-cert-secret";
  return createHash("sha256")
    .update(`${secret}:${studentId}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

/**
 * Issue an employability certificate PNG only when the attempt is completed
 * and all catalog modules are scored (ISC-QA-002).
 */
export async function issueEmployabilityCertificate(opts: {
  studentId: string;
  attemptId?: string;
}): Promise<Response> {
  const eligibility = await assertCertificateEligibility(opts.studentId, opts.attemptId);
  if (!eligibility.ok) {
    return new Response(eligibility.error, {
      status: eligibility.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Certificate-Error": eligibility.code,
      },
    });
  }

  const report = await buildLiveEmployabilityReport(opts.studentId);
  if ("error" in report) {
    return new Response("No completed assessment found for this student.", {
      status: report.status ?? 404,
    });
  }

  const studentName = report.studentName || "Candidate";
  const displayScore = Math.round(report.profile.composite ?? 0);
  const specialization = report.specialization ?? null;
  const computedAt = report.computedAt;
  const credId = credentialId(opts.studentId);

  let logoBase64 = "";
  try {
    const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public/iscarb-logo.png"));
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    // Logo file not present — render without it
  }

  const dateStr = new Date(computedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          color: "#0f172a",
          fontFamily: "sans-serif",
          padding: "40px",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(0,0,0,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(0,0,0,0) 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            borderRadius: "24px",
            padding: "44px 54px",
            position: "relative",
            background: "rgba(255, 255, 255, 0.65)",
            boxShadow: "0 30px 60px rgba(0, 0, 0, 0.1)",
            alignItems: "center",
            justifyContent: "space-between",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {logoBase64 ? (
                <div
                  style={{
                    display: "flex",
                    background: "rgba(255, 255, 255, 0.95)",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    marginRight: 16,
                  }}
                >
                  <img src={logoBase64} height="36" alt="Logo" />
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: "900",
                    color: "#0f172a",
                    letterSpacing: "3px",
                  }}
                >
                  iSCARB
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "2.5px",
                    marginTop: 2,
                  }}
                >
                  OFFICIAL ASSESSMENT
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                }}
              >
                CREDENTIAL ID
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#0f172a",
                  fontFamily: "monospace",
                  marginTop: 2,
                }}
              >
                {credId}
              </span>
              <span style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>
                Issued on {dateStr}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <span
              style={{
                fontSize: 36,
                color: "#0f172a",
                textTransform: "uppercase",
                letterSpacing: "4px",
                fontWeight: "900",
                fontFamily: "serif",
              }}
            >
              CERTIFICATE OF EMPLOYABILITY
            </span>
            <span
              style={{
                fontSize: 14,
                color: "#059669",
                textTransform: "uppercase",
                letterSpacing: "4px",
                fontWeight: "700",
                marginTop: 10,
              }}
            >
              Assessment
            </span>
            {specialization ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 14,
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: "4px 18px",
                  borderRadius: "50px",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "#059669",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    fontWeight: "bold",
                  }}
                >
                  {specialization} TRACK
                </span>
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              margin: "16px 0",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "#475569",
                fontStyle: "italic",
                marginBottom: 8,
              }}
            >
              This document formally certifies that
            </span>
            <span
              style={{
                fontSize: 52,
                fontWeight: "bold",
                color: "#0f172a",
                fontFamily: "serif",
                letterSpacing: "1px",
              }}
            >
              {studentName}
            </span>
            <span
              style={{
                fontSize: 13,
                color: "#334155",
                maxWidth: 760,
                lineHeight: 1.5,
                marginTop: 14,
              }}
            >
              has successfully completed the comprehensive iSCARB Employability
              Assessment. This evaluation measures candidate proficiency across Core
              Professionalism, Business &amp; Digital Literacy, Technical Job-Fit, and
              Growth Potential.
            </span>
          </div>

          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.9)",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "18px 32px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              gap: 20,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontWeight: "700",
              }}
            >
              Final Score
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontSize: 40,
                  color: "#0f172a",
                  fontWeight: "800",
                  letterSpacing: "-0.5px",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {displayScore}
              </span>
              <span
                style={{
                  fontSize: 16,
                  color: "#64748b",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                }}
              >
                / 100
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
