/**
 * QTI Multi-Format Projection Adapter (Milestone 1 — Feature F3).
 * ===============================================================
 * Projects canonical LearningExperience assessments into IMS QTI 2.1/3.0 XML
 * packages bundled as standard IMS Content Packaging ZIP archives.
 * - Strict 4-option MCQ structure.
 * - Faculty rationales & distractor diagnoses formatted in <modalFeedback>.
 * - Clean LMS interoperability (Canvas, Blackboard, Moodle).
 * - Zero Jargon sanitization of assessment stems, options, and rationales.
 */

import * as JSZipModule from "jszip";
const JSZip = ((JSZipModule as any).default || JSZipModule) as typeof import("jszip");

import { BaseProjectionAdapter } from "./base-adapter";
import { cleanJargon } from "./utils/jargon-cleaner";
import {
  generateImsManifestXml,
  generateQtiItemXml,
  generateQtiTestXml,
  sanitizeQtiIdentifier,
} from "./utils/xml-helpers";
import type { LearningExperience, AssessmentItem } from "../types/learning-experience";
import type { QtiPackageResult, QtiProjectionOptions } from "./types";

export class QtiProjectionAdapter extends BaseProjectionAdapter<
  LearningExperience,
  QtiPackageResult,
  QtiProjectionOptions
> {
  readonly format = "QTI_ZIP";
  readonly name = "QtiProjectionAdapter";

  async executeProjection(
    input: LearningExperience,
    options?: QtiProjectionOptions
  ): Promise<QtiPackageResult> {
    const rawAssessments = input.assessments || [];
    const assessments = rawAssessments.length > 0
      ? rawAssessments
      : this.deriveFallbackAssessments(input);

    const testId = sanitizeQtiIdentifier(options?.packageIdentifier || `test_${input.id}`);
    const itemIds = assessments.map((item, idx) => sanitizeQtiIdentifier(item.id || `item_${idx + 1}`));
    const itemXmls: Record<string, string> = {};

    const zip = new (JSZip as any)();

    // 1. Generate Assessment Items XML
    assessments.forEach((item, idx) => {
      const safeId = itemIds[idx];
      const correctOption = item.correctOptionId || "A";
      const rawMisconceptionDiagnosis = item.distractorExplanations?.[correctOption] || undefined;
      const misconceptionDiagnosis = rawMisconceptionDiagnosis
        ? cleanJargon(rawMisconceptionDiagnosis, "faculty")
        : undefined;

      const itemXml = generateQtiItemXml({
        itemId: safeId,
        title: cleanJargon(`Question ${idx + 1}: ${item.assessmentType || "MCQ"}`),
        stem: cleanJargon(item.stem),
        options: (item.options || []).map((opt) => ({
          id: opt.id,
          text: cleanJargon(opt.text),
          isCorrect: opt.isCorrect ?? (opt.id === correctOption),
        })),
        correctOptionId: correctOption,
        instructorRationale: cleanJargon(item.instructorRationale || "", "faculty"),
        misconceptionDiagnosis,
      });

      itemXmls[safeId] = itemXml;
      zip.file(`items/item_${safeId}.xml`, itemXml);
    });

    // 2. Generate Assessment Test XML
    const testXml = generateQtiTestXml({
      testId,
      title: cleanJargon(input.title),
      itemIds,
    });
    zip.file("assessment.xml", testXml);

    // 3. Generate IMS Content Packaging Manifest
    const manifestXml = generateImsManifestXml({
      manifestId: `manifest_${input.id}`,
      title: cleanJargon(input.title),
      testId,
      itemIds,
    });
    zip.file("imsmanifest.xml", manifestXml);

    // 4. Generate ZIP Archive Buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const filename = `qti-package-${sanitizeQtiIdentifier(input.id)}.zip`;

    return {
      zipBuffer,
      filename,
      manifestXml,
      testXml,
      itemXmls,
      itemCount: assessments.length,
    };
  }

  /**
   * Derives default assessment items from concept blocks if no explicit assessments are present.
   */
  private deriveFallbackAssessments(input: LearningExperience): AssessmentItem[] {
    const blocks = input.conceptBlocks || [];
    return blocks.map((block, idx) => {
      const options = [
        { id: "A" as const, text: cleanJargon(block.academicTruth || block.coreIdea), isCorrect: true },
        {
          id: "B" as const,
          text: cleanJargon(block.misconceptions?.[0]?.commonBelief || "Opposite causal direction holds true."),
          isCorrect: false,
          misconceptionKey: "CONFUSION_OF_TERMS" as const,
        },
        {
          id: "C" as const,
          text: cleanJargon(block.misconceptions?.[1]?.commonBelief || "Boundary conditions can be neglected."),
          isCorrect: false,
          misconceptionKey: "REVERSE_CAUSALITY" as const,
        },
        {
          id: "D" as const,
          text: cleanJargon(block.misconceptions?.[2]?.commonBelief || "Principle applies universally without constraint."),
          isCorrect: false,
          misconceptionKey: "EDGE_CASE_NEGLECT" as const,
        },
      ];

      return {
        id: `assess-derived-${idx + 1}`,
        experienceId: input.id,
        conceptBlockId: block.id,
        assessmentType: idx === blocks.length - 1 ? "TRANSFER_CHALLENGE" : "DIAGNOSTIC_MCQ",
        bloomLevel: "apply",
        difficulty: "medium",
        stem: cleanJargon(`Which core scientific principle governs ${block.title}?`),
        options,
        correctOptionId: "A",
        instructorRationale: cleanJargon(`Option A is correct: ${block.academicTruth}. Options B, C, D represent documented student misconceptions.`, "faculty"),
        distractorExplanations: {
          A: "Correct explanation",
          B: "Confusion of terms",
          C: "Reverse causality",
          D: "Edge case neglect",
        },
        orderIndex: idx + 1,
        isFinalGate: idx === blocks.length - 1,
        createdAt: new Date(),
      };
    });
  }
}
