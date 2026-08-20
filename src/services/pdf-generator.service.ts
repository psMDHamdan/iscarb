// PDF Report Generator Service
// Generates downloadable PDF assessment reports
// src/services/pdf-generator.service.ts

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface PDFReportData {
  studentName: string;
  assessmentTitle: string;
  date: Date;
  score: number;
  confidenceScore: number;
  feedback: string;
  perCriterion: Array<{
    criterion: string;
    scoreGiven: number;
    maxScore: number;
    weight: number;
    reasoning: string;
  }>;
  strengths: string[];
  improvements: string[];
  dimensionalScores: {
    'core-professionalism': number;
    'business-digital': number;
    'job-fit-technical': number;
    'growth-potential': number;
  };
  moduleTitle?: string;
}

export async function generateAssessmentPDF(data: PDFReportData): Promise<Buffer> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Helper function to add text
  const addText = (text: string, size: number, bold: boolean = false, x = margin) => {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    const maxWidth = pageWidth - 2 * margin;
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, yPosition);
    yPosition += lines.length * (size / 2.5);
    return yPosition;
  };

  // Header
  pdf.setFillColor(30, 58, 114); // Dark blue
  pdf.rect(0, 0, pageWidth, 30, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Assessment Report', margin, 20);

  pdf.setTextColor(0, 0, 0);
  yPosition = 40;

  // Section 1: Student Info
  addText('Assessment Details', 12, true);
  yPosition += 5;
  addText(`Student: ${data.studentName}`, 10);
  addText(`Assessment: ${data.assessmentTitle}`, 10);
  if (data.moduleTitle) {
    addText(`Module: ${data.moduleTitle}`, 10);
  }
  addText(`Date: ${data.date.toLocaleDateString()}`, 10);
  yPosition += 10;

  // Section 2: Score Summary
  addText('Score Summary', 12, true);
  yPosition += 5;

  const scorePercentage = data.score;
  const scoreStatus =
    scorePercentage >= 85
      ? 'Exemplary'
      : scorePercentage >= 70
        ? 'Strong'
        : scorePercentage >= 55
          ? 'Proficient'
          : scorePercentage >= 40
            ? 'Developing'
            : 'Weak';

  addText(`Overall Score: ${data.score}/100`, 14, true);
  addText(`Performance Level: ${scoreStatus}`, 11);
  addText(
    `AI Confidence: ${Math.round(data.confidenceScore * 100)}%`,
    10
  );
  addText(`Status: ${data.score >= 60 ? '✓ PASS' : '✗ FAIL'}`, 10);
  yPosition += 10;

  // Section 3: 4D Dimensional Scores
  addText('Competency Profile (4D Framework)', 12, true);
  yPosition += 5;

  const dimensionRows = [
    ['Dimension', 'Score', 'Status'],
    ['Core Professionalism', `${data.dimensionalScores['core-professionalism']}/100`, ''],
    ['Business & Digital', `${data.dimensionalScores['business-digital']}/100`, ''],
    ['Job-Fit Technical', `${data.dimensionalScores['job-fit-technical']}/100`, ''],
    ['Growth Potential', `${data.dimensionalScores['growth-potential']}/100`, ''],
  ];

  (pdf as any).autoTable({
    head: [dimensionRows[0]],
    body: dimensionRows.slice(1),
    startY: yPosition,
    margin: margin,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 58, 114],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 10;

  // Section 4: Per-Criterion Breakdown
  addText('Criterion Breakdown', 12, true);
  yPosition += 5;

  const criterionRows = [
    ['Criterion', 'Score', 'Weight', 'Reasoning'],
  ];

  data.perCriterion.forEach((criterion) => {
    const percentage = (criterion.scoreGiven / criterion.maxScore) * 100;
    criterionRows.push([
      criterion.criterion,
      `${criterion.scoreGiven}/${criterion.maxScore}`,
      `${Math.round(criterion.weight * 100)}%`,
      criterion.reasoning.substring(0, 40) + '...',
    ]);
  });

  (pdf as any).autoTable({
    head: [criterionRows[0]],
    body: criterionRows.slice(1),
    startY: yPosition,
    margin: margin,
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 58, 114],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 10;

  // Add new page if needed
  if (yPosition > pageHeight - 40) {
    pdf.addPage();
    yPosition = margin;
  }

  // Section 5: Feedback
  addText('Detailed Feedback', 12, true);
  yPosition += 5;
  addText(data.feedback, 10);
  yPosition += 10;

  // Section 6: Strengths
  addText('Identified Strengths', 12, true);
  yPosition += 5;
  data.strengths.forEach((strength) => {
    addText(`• ${strength}`, 10);
  });
  yPosition += 10;

  // Section 7: Areas for Improvement
  addText('Areas for Improvement', 12, true);
  yPosition += 5;
  data.improvements.forEach((improvement) => {
    addText(`• ${improvement}`, 10);
  });
  yPosition += 15;

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  const pageCount = pdf.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    pdf.text(
      'Confidential - Generated by AI Assessment Platform',
      margin,
      pageHeight - 10
    );
  }

  // Convert to buffer
  const pdfBytes = pdf.output('arraybuffer');
  return Buffer.from(pdfBytes);
}

/**
 * Generate filename for PDF download
 */
export function generatePDFFilename(studentName: string, assessmentTitle: string): string {
  const date = new Date().toISOString().split('T')[0];
  const sanitized = `${studentName}-${assessmentTitle}-${date}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
  return `assessment-${sanitized}.pdf`;
}
