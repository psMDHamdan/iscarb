/**
 * Pass 17: Multi-Format Projection Adapters.
 * ==========================================
 * Projects canonical LearningExperience into presentation, LMS, student UX, and handbook formats.
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import { StudentUxAdapter } from "../../../projections/student-ux-adapter";
import { PptxProjectionAdapter } from "../../../projections/pptx-projection-adapter";
import { QtiProjectionAdapter } from "../../../projections/qti-projection-adapter";
import { DocxProjectionAdapter } from "../../../projections/docx-projection-adapter";

export class Pass17Projections implements PipelinePass {
  readonly passNumber = 17;
  readonly passName = "Multi-Format Projection Adapters";
  readonly description = "Generates multi-format views (Student UX JSON, PPTX deck, QTI package, Docx guide) without mutating canonical model.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const canonical = ctx.canonicalExperience;
    if (!canonical) {
      throw new Error("Cannot execute Pass 17 Projections without assembled canonicalExperience (Pass 16).");
    }

    const studentUxAdapter = new StudentUxAdapter();
    const pptxAdapter = new PptxProjectionAdapter();
    const qtiAdapter = new QtiProjectionAdapter();
    const docxAdapter = new DocxProjectionAdapter();

    const [uxResult, pptxResult, qtiResult, docxResult] = await Promise.all([
      studentUxAdapter.project(canonical),
      pptxAdapter.project(canonical),
      qtiAdapter.project(canonical),
      docxAdapter.project(canonical),
    ]);

    ctx.projections = {
      studentUxJson: uxResult.data,
      pptxOutline: pptxResult.data,
      qtiPackageJson: qtiResult.data,
      docxGuideJson: docxResult.data,
    };

    return ctx;
  }
}

export const pass17Projections = new Pass17Projections();
