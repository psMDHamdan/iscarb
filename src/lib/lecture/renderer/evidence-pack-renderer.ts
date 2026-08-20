/**
 * Evidence Pack Renderer (TASK-08 §F).
 * ===========================================================================
 * Deterministic PDF containing the audit trail of an approved package:
 * source coverage report, CLO/Bloom matrix, citation/freshness per claim,
 * readiness alignment (incl. official Jaheziah outcome), the approval
 * manifest, and all gate results. Pure function over approved data.
 */
import { jsPDF } from "jspdf";

export interface EvidenceCoverageRow {
  blockId: string;
  locator: string;
  disposition: string;
  reason: string | null;
}

export interface EvidenceCitationRow {
  claim: string;
  sourceKey: string;
  url: string;
  hash: string;
  retrievedAt: string;
}

export interface EvidenceReadinessRow {
  slideNo: number;
  stem: string;
  clo: string;
  outcome: string | null;
}

export interface EvidenceGateRow {
  gateKey: string;
  severity: string;
  status: string;
}

export interface EvidencePackData {
  projectTitle: string;
  manifestHash: string;
  approvedBy: string;
  approvedAt: string;
  coverage: EvidenceCoverageRow[];
  clos: { number: string; text: string; bloomLevel: string }[];
  citations: EvidenceCitationRow[];
  readiness: EvidenceReadinessRow[];
  gates: EvidenceGateRow[];
}

const MARGIN = 15;
const MAX_Y = 277;

export async function renderEvidencePackPDF(data: EvidencePackData): Promise<Buffer> {
  const pdf = new jsPDF();
  let y = 15;

  const line = (text: string, indent = "") => {
    if (y > MAX_Y) {
      pdf.addPage();
      y = MARGIN;
    }
    pdf.text(indent + text, MARGIN, y);
    y += 5;
  };

  pdf.setFontSize(16);
  pdf.text("Evidence Pack", MARGIN, y);
  y += 6;
  pdf.setFontSize(10);
  line(data.projectTitle);
  line(`Approved by ${data.approvedBy} on ${data.approvedAt}`);
  line(`Manifest hash: ${data.manifestHash}`);
  y += 6;

  pdf.setFontSize(12);
  line("1. Source Coverage Report");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  for (const c of data.coverage) {
    line(`${c.locator} — ${c.disposition}${c.reason ? ` (${c.reason})` : ""}`);
  }
  y += 4;

  pdf.setFontSize(12);
  line("2. CLO / Bloom Alignment Matrix");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  for (const c of data.clos) {
    line(`${c.number} — ${c.text} [${c.bloomLevel}]`);
  }
  y += 4;

  pdf.setFontSize(12);
  line("3. Citation / Freshness Report");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  for (const c of data.citations) {
    line(`"${c.claim.slice(0, 80)}"`);
    line(`${c.sourceKey} · ${c.url}`, "  ");
    line(`hash ${c.hash} · retrieved ${c.retrievedAt}`, "  ");
    y += 2;
  }
  y += 4;

  pdf.setFontSize(12);
  line("4. Readiness Item Alignment");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  for (const r of data.readiness) {
    line(
      `Slide ${r.slideNo}: ${r.stem.slice(0, 90)} — CLO ${r.clo}${r.outcome ? ` → outcome ${r.outcome}` : ""}`
    );
  }
  y += 4;

  pdf.setFontSize(12);
  line("5. Gate Results");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  for (const g of data.gates) {
    line(`${g.gateKey} — ${g.status} (${g.severity})`);
  }

  return Buffer.from(pdf.output("arraybuffer"));
}
