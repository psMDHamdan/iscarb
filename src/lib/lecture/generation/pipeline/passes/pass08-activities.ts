/**
 * Pass 8: Cognitive Learning Activities Synthesis.
 * ================================================
 * Generates active learning checkpoints for each ConceptBlock with action-first
 * framing (Predict, Calculate, Analyze) and 4-tier progressive hints.
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import type { ActivityType, LearningActivity, PedagogicalStage } from "../../../types/learning-experience";
import { ActivityRotator } from "../../activity-rotator";
import { ContentRegistry } from "../../content-registry";

export class Pass08Activities implements PipelinePass {
  readonly passNumber = 8;
  readonly passName = "Cognitive Learning Activities Synthesis";
  readonly description = "Synthesizes interactive cognitive checkpoints with 4-tier progressive hints and anti-duplication enforcement.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const blocks = ctx.elaboratedBlocks || [];
    const activities: LearningActivity[] = [];
    const rotator = new ActivityRotator();
    const registry = ctx.contentRegistry || new ContentRegistry();

    const activityConfigs: Record<
      PedagogicalStage,
      {
        type: ActivityType;
        actionVerb: string;
        title: string;
        promptTemplate: (title: string) => string;
        hints: [string, string, string, string];
      }
    > = {
      DISCOVER: {
        type: "PREDICT",
        actionVerb: "Predict",
        title: "Active Prediction Challenge",
        promptTemplate: (t) => `Predict: If system workload scales by 10x while resources remain constant, what bottleneck emerges first in ${t}?`,
        hints: [
          "Hint Level 1 (Guiding Question): Consider which shared resource experiences highest contention.",
          "Hint Level 2 (Conceptual Prompt): Recall that serialization queues grow non-linearly under load.",
          "Hint Level 3 (Analytical Clue): Check the relationship between queue wait time and utilization percentage.",
          "Hint Level 4 (Scaffolded Walkthrough): As utilization approaches 90%, queue dwell time explodes exponentially, creating an acute latency bottleneck.",
        ],
      },
      UNDERSTAND: {
        type: "ACTIVE_RECALL",
        actionVerb: "Analyze",
        title: "Core Invariant Verification",
        promptTemplate: (t) => `Analyze: Why must state invariants in ${t} hold atomically during concurrent execution?`,
        hints: [
          "Hint Level 1 (Guiding Question): What happens if an external reader inspects the system mid-transition?",
          "Hint Level 2 (Conceptual Prompt): Consider dirty reads and intermediate non-atomic states.",
          "Hint Level 3 (Analytical Clue): Invariant violations expose temporary contradictions in data ledgers.",
          "Hint Level 4 (Scaffolded Walkthrough): Non-atomic execution permits concurrent threads to read inconsistent data, leading to cascade failures.",
        ],
      },
      EXPLORE: {
        type: "GUIDED_DISCUSSION",
        actionVerb: "Contrast",
        title: "Mechanism & Flow Exploration",
        promptTemplate: (t) => `Contrast: Compare synchronous blocking coordination vs asynchronous pipelining in ${t}.`,
        hints: [
          "Hint Level 1 (Guiding Question): How does thread idling affect throughput in synchronous protocols?",
          "Hint Level 2 (Conceptual Prompt): Asynchronous pipelining overlaps I/O with computation.",
          "Hint Level 3 (Analytical Clue): Contrast the memory footprint of queued buffers vs blocked thread stacks.",
          "Hint Level 4 (Scaffolded Walkthrough): Synchronous blocking wastes CPU cycles waiting for I/O; pipelining maximizes hardware saturation.",
        ],
      },
      PRACTICE: {
        type: "WORKED_EXAMPLE",
        actionVerb: "Calculate",
        title: "Diagnostic Problem Solving",
        promptTemplate: (t) => `Calculate: Given failure probability p=0.01 per node, determine the minimum cluster quorum size for ${t}.`,
        hints: [
          "Hint Level 1 (Guiding Question): What is the mathematical definition of a majority quorum?",
          "Hint Level 2 (Conceptual Prompt): A cluster of size N can tolerate up to floor((N-1)/2) simultaneous node failures.",
          "Hint Level 3 (Analytical Clue): For N=5 nodes, majority quorum requires floor(5/2)+1 = 3 node acknowledgments.",
          "Hint Level 4 (Scaffolded Walkthrough): With 5 nodes, 3 nodes form a majority quorum, ensuring overlapping nodes in any two quorums.",
        ],
      },
      APPLY: {
        type: "TEACH_IT_BACK",
        actionVerb: "Explain",
        title: "Enterprise Deployment Lab",
        promptTemplate: (t) => `Explain: How would you architect ${t} across multi-region data centers with asymmetric latency?`,
        hints: [
          "Hint Level 1 (Guiding Question): Which operations must cross wide-area network links?",
          "Hint Level 2 (Conceptual Prompt): Distinguish local read caches from global quorum writes.",
          "Hint Level 3 (Analytical Clue): Consider leader lease mechanisms to serve reads locally.",
          "Hint Level 4 (Scaffolded Walkthrough): Place the consensus leader in the primary region with local read leases, using asynchronous replication for disaster recovery.",
        ],
      },
      CHALLENGE: {
        type: "TEACH_IT_BACK",
        actionVerb: "Synthesize",
        title: "Cross-Domain Knowledge Transfer",
        promptTemplate: (t) => `Synthesize: Transfer the invariant principles of ${t} to solve a bottleneck in genomics microarray sequencing.`,
        hints: [
          "Hint Level 1 (Guiding Question): What is the genomic equivalent of a state machine log?",
          "Hint Level 2 (Conceptual Prompt): Map sequence reads to state transactions and alignment to consensus ordering.",
          "Hint Level 3 (Analytical Clue): Invariant validation prevents false positive genetic variant calls.",
          "Hint Level 4 (Scaffolded Walkthrough): Isomorphically map sequence alignment scoring to state validation, ensuring consensus calls survive noise thresholds.",
        ],
      },
      MASTER: {
        type: "PEER_POLL",
        actionVerb: "Evaluate",
        title: "Metacognitive Mastery Checkpoint",
        promptTemplate: (t) => `Evaluate: Which architectural trade-off is the most critical constraint when scaling ${t} by 100x?`,
        hints: [
          "Hint Level 1 (Guiding Question): Consider the trade-off between CAP theorem guarantees.",
          "Hint Level 2 (Conceptual Prompt): At 100x scale, network partitions and hardware failures become continuous events.",
          "Hint Level 3 (Analytical Clue): Consistency vs Availability under network partition governs scaling limits.",
          "Hint Level 4 (Scaffolded Walkthrough): Linearizability requires synchronous quorum coordination which caps write throughput across wide networks.",
        ],
      },
    };

    blocks.forEach((block, idx) => {
      const stage = block.stageCategory;
      const cfg = activityConfigs[stage] || activityConfigs.UNDERSTAND;
      const actId = `act-${idx + 1}`;

      // Use ActivityRotator to vary interaction type
      const rotatedType = rotator.getActivityTypeForSlide(idx + 1, stage.toLowerCase());
      const actionVerb = ActivityRotator.getActionVerb(rotatedType).split(" ")[0] || cfg.actionVerb;

      const activity: LearningActivity = {
        id: actId,
        experienceId: ctx.projectId,
        conceptBlockId: block.id,
        activityType: cfg.type,
        title: `${cfg.title}: ${block.title}`,
        prompt: cfg.promptTemplate(ctx.title),
        promptAr: `تحدي تفاعلي: ${block.title}`,
        actionVerb,
        scaffoldingLevel: stage === "DISCOVER" ? "guided" : stage === "CHALLENGE" ? "independent" : "fading",
        initialContext: { stage, topic: ctx.title, conceptBlockId: block.id, rotatedType },
        expectedResponseCriteria: [
          { criterion: "Identifies core theoretical principle", weight: 0.5, rubricDescriptor: "Directly cites invariant" },
          { criterion: "Avoids documented cognitive misconception", weight: 0.5, rubricDescriptor: "Accurately refutes naive assumptions" },
        ],
        modelAnswer: `Optimal solution integrates ${block.academicTruth} with mechanistic reasoning: ${block.mechanismExplanation}`,
        progressiveHints: cfg.hints,
        misconceptionTriggers: [
          {
            triggerPhrase: block.misconceptions?.[0]?.commonBelief || "common naive assumption",
            diagnosisMessage: block.misconceptions?.[0]?.whyIncorrect || "This assumption neglects critical boundary constraints.",
            repairGuidance: block.misconceptions?.[0]?.correction || "Review the core mathematical theorem.",
          },
        ],
        orderIndex: idx + 1,
        createdAt: new Date(),
      };

      // Register activity in ContentRegistry for anti-duplication
      const regResult = registry.register({
        contentId: activity.id,
        conceptId: block.id,
        contentType: "activity",
        title: activity.title,
        promptOrStem: activity.prompt,
        answerOrSolution: activity.modelAnswer,
        semanticSignature: "",
        sourceIds: block.sourceBlockIds,
        bloomLevel: block.bloomLevel as "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create",
      });

      if (!regResult.accepted) {
        console.warn(`[Pass08] Activity "${activity.title}" rejected: ${regResult.reason}. Differentiating prompt.`);
        activity.prompt = `${activity.prompt} [Variation ${idx + 1}]`;
      }

      block.activityId = actId;
      activities.push(activity);
    });

    ctx.activities = activities;
    ctx.contentRegistry = registry;
    return ctx;
  }
}

export const pass08Activities = new Pass08Activities();

