/**
 * DOCX Multi-Format Projection Adapter (Milestone 1 — Feature F3).
 * ================================================================
 * Projects canonical LearningExperience into a comprehensive Microsoft Word
 * (.docx) Faculty Delivery Guide, Syllabus, and Confidential Answer Key.
 * Sanitizes all pipeline vocabulary with AST-aware Zero Jargon Leakage.
 */

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
import { BaseProjectionAdapter } from "./base-adapter";
import { cleanJargon } from "./utils/jargon-cleaner";
import type { LearningExperience } from "../types/learning-experience";
import type { DocxGuideResult, DocxProjectionOptions } from "./types";

export class DocxProjectionAdapter extends BaseProjectionAdapter<
  LearningExperience,
  DocxGuideResult,
  DocxProjectionOptions
> {
  readonly format = "DOCX_GUIDE";
  readonly name = "DocxProjectionAdapter";

  async executeProjection(
    input: LearningExperience,
    options?: DocxProjectionOptions
  ): Promise<DocxGuideResult> {
    const docChildren: any[] = [];
    let sectionCount = 0;

    // 1. Document Title & Header
    docChildren.push(
      new Paragraph({
        text: cleanJargon(input.title),
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Faculty Delivery Guide & Master Pedagogical Blueprint", bold: true, size: 28, color: "0E6C3C" }),
        ],
        spacing: { after: 300 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Target Audience: ", bold: true }),
          new TextRun(cleanJargon(input.targetAudience || "Undergraduate / Graduate Students")),
          new TextRun({ text: " | Estimated Duration: ", bold: true }),
          new TextRun(`${input.estimatedDurationMin || 50} Minutes`),
          new TextRun({ text: " | Framework: ", bold: true }),
          new TextRun(cleanJargon(input.pedagogicalFramework || "7-Stage Active Learning")),
        ],
        spacing: { after: 400 },
      })
    );
    sectionCount++;

    // 2. Pedagogical Blueprint & Narrative Arc
    docChildren.push(
      new Paragraph({
        text: "1. Pedagogical Blueprint & Learning Outcomes",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Narrative Arc: ", bold: true }),
          new TextRun(cleanJargon(input.blueprint?.narrativeArc || input.topicDescription || "Comprehensive 7-stage learning journey.")),
        ],
        spacing: { after: 200 },
      })
    );

    if (input.blueprint?.learningOutcomes?.length) {
      docChildren.push(
        new Paragraph({
          text: "Course Learning Outcomes (CLOs):",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 150, after: 100 },
        })
      );
      input.blueprint.learningOutcomes.forEach((clo) => {
        docChildren.push(
          new Paragraph({
            text: `• [CLO-${clo.number}] ${cleanJargon(clo.text)} (Bloom: ${clo.bloomLevel})`,
            spacing: { after: 80 },
          })
        );
      });
    }
    sectionCount++;

    // 3. 5-Layer Content Elaboration per Concept Block
    docChildren.push(
      new Paragraph({
        text: "2. Instructional Sequence & 5-Layer Content Breakdown",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    const sortedBlocks = [...(input.conceptBlocks || [])].sort((a, b) => a.orderIndex - b.orderIndex);
    sortedBlocks.forEach((block) => {
      docChildren.push(
        new Paragraph({
          text: `Stage ${block.orderIndex}: ${block.stageCategory} — ${cleanJargon(block.title)}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 250, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Layer 1 (Academic Truth): ", bold: true, color: "0F172A" }),
            new TextRun(cleanJargon(block.academicTruth || block.coreIdea)),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Layer 2 (Intuition & Mental Model): ", bold: true, color: "0E6C3C" }),
            new TextRun(cleanJargon(block.intuitionMentalModel || "Conceptual analogy")),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Layer 3 (Causal Mechanism): ", bold: true, color: "0F7B8A" }),
            new TextRun(cleanJargon(block.mechanismExplanation || "")),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Layer 4 (Real-World Transfer): ", bold: true, color: "F59E0B" }),
            new TextRun(cleanJargon(block.realWorldTransfer || "")),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Layer 5 (Misconception Alert): ", bold: true, color: "DC2626" }),
            new TextRun(cleanJargon(block.misconceptionAlert || "")),
          ],
          spacing: { after: 200 },
        })
      );
    });
    sectionCount++;

    // 4. Confidential Faculty Answer Key & Rationales Table
    const includeAnswerKey = options?.includeAnswerKey !== false;
    if (includeAnswerKey && input.assessments?.length) {
      docChildren.push(
        new Paragraph({
          text: "3. Confidential Faculty Solution Keys & Distractor Diagnoses",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      const tableRows: TableRow[] = [
        new TableRow({
          children: [
            new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "#", bold: true })] })] }),
            new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Question Stem", bold: true })] })] }),
            new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Correct Key", bold: true })] })] }),
            new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Instructor Pedagogical Rationale", bold: true })] })] }),
          ],
        }),
      ];

      input.assessments.forEach((item, idx) => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(String(idx + 1))] }),
              new TableCell({ children: [new Paragraph(cleanJargon(item.stem))] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Option [${item.correctOptionId}]`, bold: true })] })] }),
              new TableCell({ children: [new Paragraph(cleanJargon(item.instructorRationale || "Standard pedagogical rationale.", "faculty"))] }),
            ],
          })
        );
      });

      docChildren.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      sectionCount++;
    }

    // 5. Student Study Companion Section
    const includeCompanion = options?.includeStudentCompanion !== false;
    if (includeCompanion && input.guide?.studentCompanionJson) {
      const companion = input.guide.studentCompanionJson;
      docChildren.push(
        new Paragraph({
          text: "4. Student Study Companion & Metacognitive Review",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Executive Summary: ", bold: true }),
            new TextRun(cleanJargon(companion.executiveSummary || "")),
          ],
          spacing: { after: 150 },
        })
      );

      if (companion.reflectionQuestions?.length) {
        docChildren.push(
          new Paragraph({
            text: "Metacognitive Reflection Prompts:",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          })
        );
        companion.reflectionQuestions.forEach((q) => {
          docChildren.push(new Paragraph({ text: `• ${cleanJargon(q)}`, spacing: { after: 80 } }));
        });
      }
      sectionCount++;
    }

    // Create docx Document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `faculty-guide-${input.id}.docx`;

    return {
      buffer,
      filename,
      title: cleanJargon(input.title),
      sectionsCount: sectionCount,
    };
  }
}
