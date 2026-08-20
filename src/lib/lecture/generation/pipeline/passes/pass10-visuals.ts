/**
 * Pass 10: DIVE Dynamic Visual Engine Synthesis.
 * ===============================================
 * Generates instructional vector SVG graphics and structured visual specifications
 * across the 7 canonical visual families (Process, System Architecture, Data Flow,
 * Comparison Matrix, Cause & Effect, Quantitative, Hierarchy).
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import type { VisualArtifact, VisualType } from "../../../types/learning-experience";
import { generateVisualSpecification } from "../../../visual/visual-intent-engine";
import { VisualDeduplicationRegistry } from "../../../visual/deduplication";
import { CANONICAL_VISUAL_FAMILIES } from "../../../visual/types";
import { ImageValidator } from "../../../quality/image-validator";
import { ContentRegistry } from "../../content-registry";


export class Pass10Visuals implements PipelinePass {
  readonly passNumber = 10;
  readonly passName = "DIVE Dynamic Visual Engine Synthesis";
  readonly description = "Synthesizes instructional SVG diagrams and structured visual specifications across 7 visual families with ImageValidator verification.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const blocks = ctx.elaboratedBlocks || [];
    const visuals: VisualArtifact[] = [];
    const registry = new VisualDeduplicationRegistry();
    const contentRegistry = ctx.contentRegistry || new ContentRegistry();

    blocks.forEach((block, idx) => {
      const preferredFamily = CANONICAL_VISUAL_FAMILIES[idx % CANONICAL_VISUAL_FAMILIES.length];
      const visualId = `vis-art-${idx + 1}`;

      // Build structured visual intent
      const visualIntent = {
        description: `Annotated schematic illustrating ${block.title}: ${block.mechanismExplanation.slice(0, 100)}`,
        visualType: preferredFamily,
        prefersDiagram: true,
        conceptId: block.id,
      };

      // Validate visual intent quality
      const intentCheck = ImageValidator.validateVisualIntent(visualIntent);
      if (!intentCheck.valid) {
        console.warn(`[Pass10] Visual intent warning for slide ${idx + 1}: ${intentCheck.reason}`);
      }

      // Generate domain-grounded visual specification
      const spec = generateVisualSpecification({
        topic: ctx.topicDescription || ctx.title || block.title,
        conceptTitle: block.title,
        academicTruth: block.academicTruth,
        intuitionMentalModel: block.intuitionMentalModel,
        mechanismExplanation: block.mechanismExplanation,
        realWorldTransfer: block.realWorldTransfer,
        misconceptionAlert: block.misconceptionAlert,
        preferredFamily,
        slideNo: idx + 1,
      });

      // Register with semantic visual deduplication registry
      registry.register(spec, idx + 1);

      const visualArtifact: VisualArtifact = {
        id: visualId,
        experienceId: ctx.projectId,
        conceptBlockId: block.id,
        visualType: (spec.visualFamily as VisualType) || preferredFamily,
        title: spec.title || `Visual Dynamics: ${block.title}`,
        purpose: spec.description || `Explicate structural transformations in ${block.title}.`,
        learningMessage: spec.pedagogicalRationale || `Visual decoupling illustrates how ${block.academicTruth.slice(0, 60)} operates in real systems.`,
        specificationJson: {
          ...spec,
          visualIntent,
          layout: typeof spec.layout === "object" ? spec.layout.type : String(spec.layout),
          elements: spec.nodes.map((n) => ({
            id: n.id,
            label: n.label,
            type: n.type || "NODE",
            x: n.x,
            y: n.y,
          })),
          connections: spec.connections.map((c) => ({
            from: c.from,
            to: c.to,
            label: c.label,
            style: c.relationType || "SOLID",
          })),
          labels: spec.nodes.map((n) => n.label),
          annotations: [spec.pedagogicalRationale || "Visual structure clarifies invariant execution."],
          studentFocusQuestion: spec.studentFocusQuestion,
        } as any,
        assetSourceTier: "NATIVE_SVG",
        sourcePriority: 5,
        vectorSvgCode: spec.svgMarkup,
        licenseType: "CREATIVE_COMMONS",
        attributionText: "iSCARB DIVE Generative Visual Engine / CC-BY-4.0",
        attribution: {
          author: "iSCARB Dynamic Visual Engine",
          license: "CC-BY-4.0",
          sourceUrl: `https://iscarb.edu.sa/visuals/library/${block.slug || visualId}`,
          domain: "iscarb.edu.sa",
        },
        altText: `Vector schematic illustrating ${spec.visualFamily} data transformation for ${block.title}.`,
        orderIndex: idx + 1,
        createdAt: new Date(),
      };

      // Register in content registry for anti-duplication tracking
      contentRegistry.register({
        contentId: visualId,
        conceptId: block.id,
        contentType: "visual",
        title: visualArtifact.title,
        promptOrStem: visualArtifact.purpose,
        semanticSignature: "",
        sourceIds: block.sourceBlockIds,
        visualId,
      });

      block.visualId = visualId;
      visuals.push(visualArtifact);
    });

    ctx.visuals = visuals;
    ctx.contentRegistry = contentRegistry;
    return ctx;
  }
}

export const pass10Visuals = new Pass10Visuals();

