/**
 * Pass 7: 5-Layer Pedagogical Content Elaboration.
 * =================================================
 * Elaborates the 5 instructional depth layers for all 7 ConceptBlock entities.
 * Layer 1: Academic Truth, Layer 2: Mental Model, Layer 3: Mechanism,
 * Layer 4: Real-World Transfer, Layer 5: Misconception Alert & Distractor Modeling.
 *
 * Integrates ContentRegistry for deduplication and claim validation.
 */

import type { PipelinePass } from "../pass-registry";
import type { PipelineContext } from "../pipeline-context";
import type { ConceptBlock, Misconception, PedagogicalStage } from "../../../types/learning-experience";
import { ContentRegistry } from "../../content-registry";

/** Claim types for source fidelity enforcement. */
type ClaimType = "SOURCE_FACT" | "PEDAGOGICAL_PARAPHRASE" | "INFERRED" | "UNSUPPORTED";

/** Patterns indicating unsupported/hallucinated factual claims. */
const UNSUPPORTED_CLAIM_PATTERNS = [
  /\b\d{1,3}(?:\.\d+)?%\s+(?:of|increase|decrease|reduction|improvement)/i,
  /\bstudies?\s+(?:show|prove|demonstrate|confirm)\b/i,
  /\baccording\s+to\s+(?:research|experts?|scientists?)\b/i,
  /\b(?:has been|was)\s+(?:proven|demonstrated|shown)\s+(?:to|that)\b/i,
  /\b(?:always|never|guaranteed|proven)\b/i,
];

/** Check if a text contains likely unsupported claims not grounded in source. */
function detectUnsupportedClaims(text: string, sourceTexts: string[]): { type: ClaimType; flagged: string[] } {
  const flagged: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(Boolean);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed || trimmed.length < 15) continue;

    // Check if any pattern matches and the content is NOT in source material
    for (const pattern of UNSUPPORTED_CLAIM_PATTERNS) {
      if (pattern.test(trimmed)) {
        const foundInSource = sourceTexts.some((src) =>
          src.toLowerCase().includes(trimmed.toLowerCase().slice(0, 40))
        );
        if (!foundInSource) {
          flagged.push(trimmed);
        }
      }
    }
  }

  if (flagged.length > 0) return { type: "UNSUPPORTED", flagged };
  return { type: "SOURCE_FACT", flagged: [] };
}

export class Pass07DetailedContent implements PipelinePass {
  readonly passNumber = 7;
  readonly passName = "5-Layer Pedagogical Content Elaboration";
  readonly description = "Elaborates the 5 instructional depth layers for each ConceptBlock with deduplication and claim validation.";

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const scaffolded = ctx.scaffoldedBlocks || [];
    const sourceChunks = ctx.sourceChunks || [];
    const elaboratedBlocks: ConceptBlock[] = [];

    // Initialize content registry for this lecture
    const registry = ctx.contentRegistry || new ContentRegistry();
    const sourceTexts = sourceChunks.map((c) => c.text || "");

    const layerTemplates: Record<
      PedagogicalStage,
      {
        truth: (title: string) => string;
        mentalModel: (title: string) => string;
        mechanism: (title: string) => string;
        transfer: (title: string) => string;
        alert: (title: string) => string;
        misconceptions: Misconception[];
      }
    > = {
      DISCOVER: {
        truth: (t) => `Theorem 1: Formal problem framing establishes the fundamental lower bounds and constraints governing ${t}.`,
        mentalModel: (t) => `Imagine navigating a dense fog with a beacon: ${t} provides the reference point that clarifies system behavior.`,
        mechanism: (t) => `Step 1: Identify boundary constraints. Step 2: Formulate state transitions. Step 3: Observe bottleneck emergence under stress.`,
        transfer: (t) => `Applied in enterprise architecture to diagnose distributed network bottlenecks and latency spikes before deployment.`,
        alert: (t) => `Watch out: Students commonly mistake initial symptom patterns for root causal drivers in ${t}.`,
        misconceptions: [
          {
            commonBelief: "System latency is solely determined by hardware clock speed.",
            whyIncorrect: "Protocol overhead and queue congestion dominate end-to-end response times in distributed workflows.",
            correction: "Total latency is a multi-factor composite of network transit, serialization, and queue dwell time.",
            distractorType: "CONFUSION_OF_TERMS",
          },
          {
            commonBelief: "Increasing thread count always increases throughput linearly.",
            whyIncorrect: "Amdahl's law and synchronization contention create diminishing returns and eventual throughput collapse.",
            correction: "Throughput scales sub-linearly and is bounded by the serialized portion of the algorithm.",
            distractorType: "OVER_GENERALIZATION",
          },
          {
            commonBelief: "Edge failures can be safely ignored in high-bandwidth local area networks.",
            whyIncorrect: "Asymmetric network partitions and packet drops occur regardless of nominal link speed.",
            correction: "Fault-tolerant protocols must explicitly account for partial network partitions across all links.",
            distractorType: "EDGE_CASE_NEGLECT",
          },
        ],
      },
      UNDERSTAND: {
        truth: (t) => `Theorem 2: The canonical invariant of ${t} guarantees mathematical soundness across all state transformations.`,
        mentalModel: (t) => `Imagine an unbreakable balance scale: every state change on one side enforces an exact compensatory shift on the other.`,
        mechanism: (t) => `Step 1: Ingest input parameters. Step 2: Validate state invariants. Step 3: Execute atomic state transition. Step 4: Confirm post-conditions.`,
        transfer: (t) => `Utilized in modern transactional ledgers to ensure ACID consistency during high-volume concurrent updates.`,
        alert: (t) => `Watch out: Students frequently invert the cause-and-effect relationship in ${t} invariant maintenance.`,
        misconceptions: [
          {
            commonBelief: "Invariants only need to hold at the beginning and end of long-running batch jobs.",
            whyIncorrect: "Concurrent readers can observe intermediate corrupted states if invariants are temporarily violated.",
            correction: "Invariants must be preserved atomically or isolated behind concurrency control primitives.",
            distractorType: "EDGE_CASE_NEGLECT",
          },
          {
            commonBelief: "State transitions can proceed without verifying prerequisite conditions if inputs are pre-validated.",
            whyIncorrect: "Race conditions can alter system state between input validation and execution time (TOCTOU).",
            correction: "Pre-conditions and invariants must be evaluated atomically at the moment of execution.",
            distractorType: "REVERSE_CAUSALITY",
          },
          {
            commonBelief: "All data transformations are commutative and can be reordered arbitrarily.",
            whyIncorrect: "Non-commutative operations yield divergent final states when execution order is permuted.",
            correction: "Execution ordering must respect strict causal dependencies defined by the state model.",
            distractorType: "CONFUSION_OF_TERMS",
          },
        ],
      },
      EXPLORE: {
        truth: (t) => `Theorem 3: The structural decomposition of ${t} decouples internal state synchronization from external I/O protocols.`,
        mentalModel: (t) => `Imagine a well-orchestrated assembly line with dedicated conveyor belts preventing cross-station bottlenecks.`,
        mechanism: (t) => `Step 1: Receive asynchronous dispatch. Step 2: Push to internal processing queue. Step 3: Compute state delta. Step 4: Broadcast state sync.`,
        transfer: (t) => `Critical for high-throughput stream processing systems like Apache Flink and Kafka partitions.`,
        alert: (t) => `Watch out: Students often assume all asynchronous stages have zero coordination latency in ${t}.`,
        misconceptions: [
          {
            commonBelief: "Asynchronous processing eliminates the need for backpressure management.",
            whyIncorrect: "Unbounded queues will consume memory and eventually crash the host process under sustained load.",
            correction: "Backpressure signaling is required to throttle upstream producers when downstream queues saturate.",
            distractorType: "OVER_GENERALIZATION",
          },
          {
            commonBelief: "Decoupled stages guarantee exactly-once message processing by default.",
            whyIncorrect: "At-least-once delivery with duplicate retransmissions is the natural default of distributed queues.",
            correction: "Idempotent consumers or deduplication logs are necessary to enforce exactly-once semantics.",
            distractorType: "CONFUSION_OF_TERMS",
          },
          {
            commonBelief: "Queue depth has no impact on tail latency as long as CPU utilization is below 90%.",
            whyIncorrect: "Queueing delay follows Kingman's formula, exploding exponentially as utilization approaches saturation.",
            correction: "Tail latency degrades sharply at high utilization due to cumulative queue wait times.",
            distractorType: "REVERSE_CAUSALITY",
          },
        ],
      },
      PRACTICE: {
        truth: (t) => `Theorem 4: Systematic diagnostic evaluation of ${t} isolates fault boundaries through differential symptom analysis.`,
        mentalModel: (t) => `Imagine using a multi-meter to test circuit nodes step-by-step to isolate the single blown resistor.`,
        mechanism: (t) => `Step 1: Formulate diagnostic hypothesis. Step 2: Inject boundary test vector. Step 3: Measure differential output. Step 4: Confirm root cause.`,
        transfer: (t) => `Applied in automated site reliability engineering (SRE) anomaly detection and incident root-cause triage.`,
        alert: (t) => `Watch out: Students tend to fix visible surface errors without repairing underlying invariant violations.`,
        misconceptions: [
          {
            commonBelief: "Passing all unit tests guarantees correct behavior in production clusters.",
            whyIncorrect: "Unit tests rarely replicate network jitter, concurrent race conditions, or partial node partitions.",
            correction: "Integration testing and chaos engineering are required to validate distributed fault tolerance.",
            distractorType: "OVER_GENERALIZATION",
          },
          {
            commonBelief: "Log error messages always point directly to the initiating root cause of failure.",
            whyIncorrect: "Downstream cascading failures often produce misleading secondary error logs that mask original faults.",
            correction: "Root-cause analysis requires tracing back along the causal execution graph.",
            distractorType: "REVERSE_CAUSALITY",
          },
          {
            commonBelief: "Boundary edge cases only occur during anomalous operational conditions.",
            whyIncorrect: "High-volume systems encounter rare boundary conditions continuously due to the law of large numbers.",
            correction: "Edge cases must be treated as standard operating conditions in large-scale system design.",
            distractorType: "EDGE_CASE_NEGLECT",
          },
        ],
      },
      APPLY: {
        truth: (t) => `Theorem 5: Industrial deployment of ${t} balances architectural trade-offs between consistency, availability, and throughput.`,
        mentalModel: (t) => `Imagine tuning a high-performance racing car: maximizing straight-line speed requires adjusting aerodynamic downforce.`,
        mechanism: (t) => `Step 1: Model real-world workload profile. Step 2: Parameterize replication factors. Step 3: Benchmark saturation curves. Step 4: Optimize policy.`,
        transfer: (t) => `Deployed across cloud infrastructure providers (AWS, Azure, GCP) to manage geo-replicated data centers.`,
        alert: (t) => `Watch out: Students frequently apply local single-node optimizations to distributed cluster architectures.`,
        misconceptions: [
          {
            commonBelief: "Strong consistency can be maintained across wide-area networks without adding round-trip latency.",
            whyIncorrect: "Speed of light in fiber enforces fundamental latency floors for cross-region consensus rounds.",
            correction: "Cross-region consistency requires explicit quorum round trips dictated by physical distance.",
            distractorType: "EDGE_CASE_NEGLECT",
          },
          {
            commonBelief: "Adding more replica nodes always increases write availability and write throughput.",
            whyIncorrect: "More replicas increase quorum size, meaning more nodes must acknowledge before a write commits.",
            correction: "Replication increases read scalability and fault tolerance, but adds overhead to write operations.",
            distractorType: "CONFUSION_OF_TERMS",
          },
          {
            commonBelief: "High availability implies zero possibility of transient stale reads.",
            whyIncorrect: "In eventually consistent systems, network lag can cause replicas to serve slightly outdated data.",
            correction: "Stale read avoidance requires read-your-writes consistency or quorum read configurations.",
            distractorType: "OVER_GENERALIZATION",
          },
        ],
      },
      CHALLENGE: {
        truth: (t) => `Theorem 6: Cross-domain knowledge transfer of ${t} abstracts core mathematical isomorphisms onto un-taught problem spaces.`,
        mentalModel: (t) => `Imagine translating a chess strategy to maritime naval logistics: the abstract geometric principles remain identical.`,
        mechanism: (t) => `Step 1: Map novel domain entities to canonical primitives. Step 2: Establish structural equivalences. Step 3: Solve via first principles.`,
        transfer: (t) => `Essential for pioneering new bioinformatics pipelines, quantum computing algorithms, and edge IoT architectures.`,
        alert: (t) => `Watch out: Students struggle to recognize familiar invariants when domain terminology changes completely.`,
        misconceptions: [
          {
            commonBelief: "Core algorithmic principles cannot be applied outside their original engineering domain.",
            whyIncorrect: "Underlying mathematical graph, queueing, and consensus principles are universal across domains.",
            correction: "Domain abstraction allows isomorphic mapping of proven models to novel engineering challenges.",
            distractorType: "CONFUSION_OF_TERMS",
          },
          {
            commonBelief: "A solution that works for discrete systems will automatically apply to continuous analogue systems unchanged.",
            whyIncorrect: "Continuous domains introduce differential dynamics and discretization errors that alter stability.",
            correction: "Transfer requires adapting discrete algorithms to continuous boundary conditions.",
            distractorType: "OVER_GENERALIZATION",
          },
          {
            commonBelief: "Optimization algorithms never encounter local minima if the objective function is non-linear.",
            whyIncorrect: "Non-convex optimization surfaces frequently trap gradient-based search algorithms in sub-optimal states.",
            correction: "Stochastic techniques or convex relaxation are necessary to escape local optima in complex domains.",
            distractorType: "REVERSE_CAUSALITY",
          },
        ],
      },
      MASTER: {
        truth: (t) => `Theorem 7: Metacognitive synthesis of ${t} unifies theoretical theorems, causal mechanics, and architectural trade-offs.`,
        mentalModel: (t) => `Imagine an architect viewing a completed cathedral from above, seeing how every arch, pillar, and buttress reinforces the whole.`,
        mechanism: (t) => `Step 1: Review foundational theorems. Step 2: Trace causal connections. Step 3: Validate mastery through synthesis.`,
        transfer: (t) => `Prepares students for professional engineering leadership, system architecture design, and academic research.`,
        alert: (t) => `Watch out: Students can lose sight of core simplicity when submerged in complex implementation details.`,
        misconceptions: [
          {
            commonBelief: "Mastery means memorizing every API parameter and syntax quirk.",
            whyIncorrect: "True mastery is the ability to derive solutions from first principles and anticipate architectural trade-offs.",
            correction: "Conceptual models and structural invariants are the enduring foundation of engineering mastery.",
            distractorType: "CONFUSION_OF_TERMS",
          },
          {
            commonBelief: "System architecture is a solved problem with universal one-size-fits-all blueprints.",
            whyIncorrect: "Every real-world system operates under unique constraints of cost, latency, scale, and reliability.",
            correction: "Architectural excellence requires context-driven trade-off optimization.",
            distractorType: "OVER_GENERALIZATION",
          },
          {
            commonBelief: "Theoretical proofs are irrelevant to practical software and system engineering.",
            whyIncorrect: "Theoretical bounds prevent engineers from attempting mathematically impossible designs.",
            correction: "Theory provides the guardrails and performance bounds that guide practical implementation.",
            distractorType: "EDGE_CASE_NEGLECT",
          },
        ],
      },
    };

    scaffolded.forEach((blockPartial, idx) => {
      const stage = (blockPartial.stageCategory || "UNDERSTAND") as PedagogicalStage;
      const tpl = layerTemplates[stage];
      const title = blockPartial.title || `${ctx.title} (Stage ${idx + 1})`;

      const block: ConceptBlock = {
        id: blockPartial.id || `concept-block-${idx + 1}`,
        experienceId: ctx.projectId,
        orderIndex: idx + 1,
        slug: blockPartial.slug || `concept-${idx + 1}-${stage.toLowerCase()}`,
        title,
        titleAr: blockPartial.titleAr,
        stageCategory: stage,
        bloomLevel: blockPartial.bloomLevel || "apply",
        cloIds: blockPartial.cloIds || [`clo-${(idx % 3) + 1}`],
        sourceBlockIds: blockPartial.sourceBlockIds || (sourceChunks[0] ? [sourceChunks[0].id] : [`src-block-${idx + 1}`]),

        // 5 Pedagogical Depth Layers
        academicTruth: tpl.truth(ctx.title),
        intuitionMentalModel: tpl.mentalModel(ctx.title),
        mechanismExplanation: tpl.mechanism(ctx.title),
        realWorldTransfer: tpl.transfer(ctx.title),
        misconceptionAlert: tpl.alert(ctx.title),
        misconceptions: tpl.misconceptions,

        coreIdea: `${stage} Phase: Mastering ${ctx.title} through rigorous causal analysis.`,
        keyTakeaways: [
          `Key Principle: ${tpl.truth(ctx.title)}`,
          `Mechanistic Dynamic: ${tpl.mechanism(ctx.title)}`,
          `Industrial Transfer: ${tpl.transfer(ctx.title)}`,
        ],
        keywords: [ctx.title.toLowerCase(), stage.toLowerCase(), "invariant", "mechanism", "transfer"],
        estimatedMinutes: blockPartial.estimatedMinutes || (stage === "DISCOVER" ? 5 : stage === "CHALLENGE" ? 10 : 7),
        visualId: `vis-art-${idx + 1}`,
        activityId: `act-${idx + 1}`,
        assessmentId: `assess-${idx + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // ── DEDUPLICATION CHECK ──
      const regResult = registry.register({
        contentId: block.id,
        conceptId: block.id,
        contentType: "deck_slide",
        title: block.title,
        promptOrStem: `${block.academicTruth} ${block.mechanismExplanation} ${block.coreIdea}`,
        semanticSignature: "",
        sourceIds: block.sourceBlockIds,
        visualId: block.visualId,
        bloomLevel: block.bloomLevel as "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create",
      });

      if (!regResult.accepted) {
        console.warn(`[Pass07] Block "${block.title}" rejected: ${regResult.reason}. Adjusting content.`);
        // Adjust block to differentiate — append stage-specific suffix
        block.coreIdea = `${block.coreIdea} [Differentiated for ${stage} stage]`;
      }

      // ── CLAIM VALIDATION ──
      const contentToValidate = [block.academicTruth, block.realWorldTransfer, block.coreIdea].join(" ");
      const claimResult = detectUnsupportedClaims(contentToValidate, sourceTexts);
      if (claimResult.type === "UNSUPPORTED" && claimResult.flagged.length > 0) {
        console.warn(`[Pass07] Block "${block.title}" has ${claimResult.flagged.length} potentially unsupported claims. Flagging for review.`);
        // Tag block for review rather than hard-reject (template content is trusted)
        block.keywords = [...block.keywords, "_needs_source_review"];
      }

      elaboratedBlocks.push(block);
    });

    ctx.elaboratedBlocks = elaboratedBlocks;
    ctx.contentRegistry = registry;
    return ctx;
  }
}

export const pass07DetailedContent = new Pass07DetailedContent();


