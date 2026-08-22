import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import type { VisualArtifact, VisualType } from "../../../types/learning-experience";
import { ContentRegistry } from "../../content-registry";
import { chatJson } from "@/lib/ai-engine";
import { MASTER_GENERATION_RULES } from "../../prompts/master-rules";
import { generateVisualSpecification } from "../../../visual/visual-intent-engine";

export class Pass10Visuals implements PipelinePass {
  readonly passNumber = 10;
  readonly passName = "DIVE Dynamic Visual Engine Synthesis";
  readonly description = "Uses VISUAL AI to strictly determine visual necessity and generate specifications avoiding empty charts.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const blocks = ctx.elaboratedBlocks || [];
    const visuals: VisualArtifact[] = [];
    const contentRegistry = ctx.contentRegistry || new ContentRegistry();

    await Promise.all(blocks.map(async (block, idx) => {
      const visualId = `vis-art-${ctx.projectId}-${idx + 1}`;

      const prompt = `
${MASTER_GENERATION_RULES}

You are the VISUAL AI. Your job is to decide what visual (if any) belongs on this slide.
RULE: Select a visual only when it improves understanding.
RULE: Never generate a chart/graph without genuine numerical data in the text.
RULE: If no meaningful visual is needed, explicitly return visualRequired=false and type="none".

SLIDE TEXT:
Title: ${block.title}
Truth: ${block.academicTruth}
Mechanism: ${block.mechanismExplanation}

Generate JSON:
- visualRequired: boolean
- type: one of "PROCESS", "SYSTEM_ARCHITECTURE", "DATA_FLOW", "COMPARISON_MATRIX", "CAUSE_EFFECT", "QUANTITATIVE", "HIERARCHY", or "none"
- reason: short explanation of why this visual helps (or why none is needed)
- contentForVisualizer: a prompt describing what should be drawn (if required)
`;

      const aiResponse = (await chatJson({
        system: "You are the VISUAL AI.",
        user: prompt,
        temperature: 0.1,
      })).json as {
        visualRequired: boolean;
        type: string;
        reason: string;
        contentForVisualizer: string;
      };

      if (!aiResponse.visualRequired || aiResponse.type === "none") {
        const nullArtifact: VisualArtifact = {
          id: visualId,
          experienceId: ctx.projectId,
          conceptBlockId: block.id,
          visualType: "none",
          title: "No Visual",
          purpose: aiResponse.reason,
          learningMessage: "No visual required for this concept.",
          specificationJson: {} as any,
          assetSourceTier: "AI_SYNTHESIS",
          sourcePriority: 0,
          orderIndex: idx + 1,
          createdAt: new Date(),
        };
        visuals.push(nullArtifact);
        block.visualId = visualId;
        return;
      }

      // If required, we fall back to the existing generator using the AI's hint
      const spec = generateVisualSpecification({
        topic: ctx.topicDescription || ctx.title || block.title,
        conceptTitle: block.title,
        academicTruth: block.academicTruth,
        intuitionMentalModel: block.intuitionMentalModel,
        mechanismExplanation: aiResponse.contentForVisualizer,
        realWorldTransfer: block.realWorldTransfer,
        misconceptionAlert: block.misconceptionAlert,
        preferredFamily: aiResponse.type as any,
        slideNo: idx + 1,
      });

      const visualArtifact: VisualArtifact = {
        id: visualId,
        experienceId: ctx.projectId,
        conceptBlockId: block.id,
        visualType: (spec.visualFamily as VisualType) || aiResponse.type,
        title: spec.title || `Visual: ${block.title}`,
        purpose: spec.description || aiResponse.reason,
        learningMessage: spec.pedagogicalRationale || "Visual structure clarifies execution.",
        specificationJson: {
          ...spec,
          layout: typeof spec.layout === "object" ? spec.layout.type : String(spec.layout),
          elements: spec.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type || "NODE", x: n.x, y: n.y })),
          connections: spec.connections.map((c) => ({ from: c.from, to: c.to, label: c.label, style: c.relationType || "SOLID" })),
          labels: spec.nodes.map((n) => n.label),
          annotations: [spec.pedagogicalRationale || "Clarifies structure."],
          studentFocusQuestion: spec.studentFocusQuestion,
        } as any,
        assetSourceTier: "NATIVE_SVG",
        sourcePriority: 5,
        vectorSvgCode: spec.svgMarkup,
        orderIndex: idx + 1,
        createdAt: new Date(),
      };

      block.visualId = visualId;
      visuals.push(visualArtifact);
    }));

    ctx.visuals = visuals.sort((a, b) => a.orderIndex - b.orderIndex);
    ctx.contentRegistry = contentRegistry;
    return ctx;
  }
}

export const pass10Visuals = new Pass10Visuals();
