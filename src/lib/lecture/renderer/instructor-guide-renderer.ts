import htmlPdf from "html-pdf-node";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Normalizes the third renderer argument: the download route passes the full
 * courseProfile, while the exports route passes the CLO array. Both shapes
 * only feed the header meta box.
 */
function toCourseProfile(courseProfileOrClos: any): any {
  if (Array.isArray(courseProfileOrClos)) {
    return { courseCode: "", title: "", specialty: "" };
  }
  return courseProfileOrClos ?? {};
}

export function renderInstructorGuide(
  artifacts: any[],
  readinessItems: any[],
  courseProfile: any,
): string {
  const slides = [...(artifacts ?? [])].sort((a, b) => (a.slideNo ?? 0) - (b.slideNo ?? 0));
  const itemsBySlide = new Map<number, any[]>();
  for (const item of readinessItems ?? []) {
    const list = itemsBySlide.get(item.slideNo) ?? [];
    list.push(item);
    itemsBySlide.set(item.slideNo, list);
  }

  const slideSections = slides
    .map((slide) => {
      const slideNo = slide.slideNo ?? 0;
      const c = slide.contentJson ?? {};
      const items = itemsBySlide.get(slideNo) ?? [];

      const correctAnswers = items
        .map((it, i) => {
          const opts = Array.isArray(it.options) ? it.options : [];
          const correctIdx = typeof it.correctIndex === "number" ? it.correctIndex : 0;
          const correct = opts[correctIdx];
          const optText =
            typeof correct === "string"
              ? correct
              : typeof correct?.text === "string"
                ? correct.text
                : "—";

          return `<tr>
        <td style="padding:6px;border:1px solid #e5e7eb;font-weight:bold;text-align:center">Q${i + 1}</td>
        <td style="padding:6px;border:1px solid #e5e7eb">${escapeHtml(it.stem)}</td>
        <td style="padding:6px;border:1px solid #e5e7eb;color:#16a34a;font-weight:bold">${escapeHtml(optText)}</td>
        <td style="padding:6px;border:1px solid #e5e7eb">${escapeHtml(it.rationale ?? "")}</td>
      </tr>`;
        })
        .join("");

      const speakerNotes =
        c?.speakerNotes ?? c?.instructorScript ?? c?.notes ?? "No speaker notes provided for this slide.";

      return `<section class="slide-section" style="margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px stroke #e5e7eb">
      <h2 style="color:#0F7B8A;margin-top:1.5rem;font-size:1.25rem">Slide S${slideNo} — ${escapeHtml(c?.title ?? `Slide ${slideNo}`)}</h2>
      <div class="speaker-notes" style="background:#f8fafc;border-left:4px solid #0F7B8A;padding:1rem;margin:1rem 0;font-style:italic;color:#334155">
        <strong>Speaker Notes:</strong><br>${escapeHtml(speakerNotes)}
      </div>
      ${
        items.length > 0
          ? `
        <h3 style="font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-top:1rem">Readiness Item Answer Key</h3>
        <table style="border-collapse:collapse;width:100%;font-size:12px;margin-top:0.5rem">
          <thead>
            <tr style="background:#f1f5f9;text-align:left">
              <th style="padding:6px;border:1px solid #e5e7eb;width:40px;text-align:center">#</th>
              <th style="padding:6px;border:1px solid #e5e7eb">Question Stem</th>
              <th style="padding:6px;border:1px solid #e5e7eb">Correct Answer</th>
              <th style="padding:6px;border:1px solid #e5e7eb">Pedagogical Rationale</th>
            </tr>
          </thead>
          <tbody>
            ${correctAnswers}
          </tbody>
        </table>`
          : ""
      }
    </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Instructor Guide — ${escapeHtml(courseProfile?.courseCode ?? "")} ${escapeHtml(courseProfile?.title ?? "")}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 960px; margin: 0 auto; padding: 2rem; color: #0f172a; line-height: 1.5; }
    h1 { color: #0E6C3C; border-bottom: 2px solid #0E6C3C; padding-bottom: 0.5rem; }
    .meta-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; margin: 1rem 0; font-size: 14px; }
    @media print { .slide-section { page-break-before: always; } }
  </style>
</head>
<body>
  <h1>Instructor Guide & Syllabus</h1>
  <div class="meta-box">
    <p><strong>Course Code:</strong> ${escapeHtml(courseProfile?.courseCode ?? "N/A")} — ${escapeHtml(courseProfile?.title ?? "N/A")}</p>
    <p><strong>Specialization:</strong> ${escapeHtml(courseProfile?.specialty ?? "General")}</p>
    <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString("en-US", { dateStyle: "full" })}</p>
    <p style="color: #dc2626; font-weight: bold; margin-bottom: 0;">⚠️ INSTRUCTOR CONFIDENTIAL — Do not distribute answer key to students</p>
  </div>
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;" />
  ${slideSections || "<p>No slides generated.</p>"}
</body>
</html>`;
}

/**
 * PDF variant of the instructor guide (TASK-08 §E): renders the same HTML and
 * converts it via html-pdf-node, identical to the lecture PDF path.
 */
export async function renderInstructorGuidePDF(
  artifacts: any[],
  readinessItems: any[],
  courseProfileOrClos: any,
): Promise<Buffer> {
  const html = renderInstructorGuide(artifacts, readinessItems, toCourseProfile(courseProfileOrClos));
  const buffer = await htmlPdf.generatePdf(
    { content: html },
    { format: "A4", printBackground: true }
  );
  return Buffer.from(buffer);
}

/**
 * DOCX variant of the instructor guide: builds a real Word document (heading
 * per slide, speaker notes, and the readiness answer-key table) using the
 * `docx` package — deterministic, no LLM calls.
 */
export async function renderInstructorGuideDOCX(
  artifacts: any[],
  readinessItems: any[],
  courseProfileOrClos: any,
): Promise<Buffer> {
  const profile = toCourseProfile(courseProfileOrClos);
  const slides = [...(artifacts ?? [])].sort((a, b) => (a.slideNo ?? 0) - (b.slideNo ?? 0));
  const itemsBySlide = new Map<number, any[]>();
  for (const item of readinessItems ?? []) {
    const list = itemsBySlide.get(item.slideNo) ?? [];
    list.push(item);
    itemsBySlide.set(item.slideNo, list);
  }

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: "Instructor Guide & Syllabus",
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [new TextRun({ text: `Course Code: ${profile?.courseCode ?? "N/A"} — ${profile?.title ?? "N/A"}` })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `Specialization: ${profile?.specialty ?? "General"}` })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleDateString("en-US", { dateStyle: "full" })}`,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "⚠️ INSTRUCTOR CONFIDENTIAL — Do not distribute answer key to students",
          bold: true,
          color: "CC0000",
        }),
      ],
    }),
  ];

  for (const slide of slides) {
    const slideNo = slide.slideNo ?? 0;
    const c = slide.contentJson ?? {};
    const items = itemsBySlide.get(slideNo) ?? [];
    children.push(
      new Paragraph({
        text: `Slide S${slideNo} — ${c?.title ?? `Slide ${slideNo}`}`,
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Speaker Notes: ", bold: true }),
          new TextRun({
            text: c?.speakerNotes ?? c?.instructorScript ?? c?.notes ?? "No speaker notes provided for this slide.",
          }),
        ],
      }),
    );

    if (items.length > 0) {
      const rows = items.map((it, i) => {
        const opts = Array.isArray(it.options) ? it.options : [];
        const correctIdx = typeof it.correctIndex === "number" ? it.correctIndex : 0;
        const correct = opts[correctIdx];
        const optText =
          typeof correct === "string"
            ? correct
            : typeof correct?.text === "string"
              ? correct.text
              : "—";
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: `Q${i + 1}` })] }),
            new TableCell({ children: [new Paragraph({ text: it.stem ?? "" })] }),
            new TableCell({ children: [new Paragraph({ text: optText })] }),
            new TableCell({ children: [new Paragraph({ text: it.rationale ?? "" })] }),
          ],
        });
      });
      children.push(
        new Paragraph({ text: "Readiness Item Answer Key", heading: HeadingLevel.HEADING_3 }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: "#" })] }),
                new TableCell({ children: [new Paragraph({ text: "Question Stem" })] }),
                new TableCell({ children: [new Paragraph({ text: "Correct Answer" })] }),
                new TableCell({ children: [new Paragraph({ text: "Rationale" })] }),
              ],
            }),
            ...rows,
          ],
        }),
      );
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

export const renderInstructorGuideDocx = renderInstructorGuideDOCX;
