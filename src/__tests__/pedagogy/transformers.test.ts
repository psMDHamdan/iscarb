import { describe, it, expect } from "vitest";
import {
  parseRawToPedagogical,
  buildConceptBlockFromPedagogical,
  extractPedagogicalFromConceptBlock,
  validateZeroJargon,
  validatePedagogicalBlock,
  validatePedagogicalCompleteness,
} from "@/lib/lecture/pedagogy";
import { StudentUxAdapter } from "@/lib/lecture/projections/student-ux-adapter";
import type { LearningExperience } from "@/lib/lecture/types/learning-experience";

describe("Pedagogical Transformers & Canonical Block Converters", () => {
  describe("1. Raw LLM Response to PedagogicalExperienceBlock", () => {
    it("TRANS-01: Parses and normalizes raw model output into a valid pedagogical block", () => {
      const rawLlmResponse = {
        title: "Two-Phase Commit Protocol",
        stageCategory: "EXPLORE",
        bloomLevel: "analyze",
        academicTruth: "2PC guarantees atomic commitment across distributed transaction managers.",
        intuitionMentalModel: "A wedding officiant asking both parties before declaring marriage.",
        mechanismExplanation: {
          summary: "Coordinator queries participants in Prepare phase and commits in Commit phase.",
          causalChain: [
            {
              stepNumber: 1,
              phase: "Prepare Phase",
              trigger: "Transaction commit requested",
              action: "Coordinator broadcasts Prepare message",
              outcome: "Participants respond with VoteCommit or VoteAbort",
            },
            {
              stepNumber: 2,
              phase: "Commit Phase",
              trigger: "All votes collected",
              action: "Coordinator broadcasts GlobalCommit decision",
              outcome: "All participants commit and release locks",
            },
          ],
        },
        realWorldTransfer: {
          scenario: "Distributed database transactions across multi-cloud availability zones.",
          industryDomain: "Cloud Infrastructure",
          tradeoffs: [
            {
              dimensionA: "Atomicity Guarantee",
              dimensionB: "Blocking Latency",
              resolution: "Coordinator failure blocks participants; mitigated with 3PC or Paxos.",
            },
          ],
          keyLessons: ["2PC is a blocking protocol vulnerable to single coordinator failure."],
        },
        misconceptionAlert: {
          alertSummary: "Assuming 2PC is non-blocking under network partitions.",
          misconceptions: [
            {
              commonBelief: "2PC can always resolve transactions when the coordinator crashes.",
              distractorType: "EDGE_CASE_NEGLECT",
              whyIncorrect: "Participants in Prepared state cannot unilaterally abort or commit.",
              refutationEvidence: "Formal proof by Gray and Lamport demonstrates blocking state transitions.",
              correction: "Use consensus-backed replication (e.g. Raft/Paxos) for the coordinator.",
              repairStrategy: "Trace participant state when coordinator fails after sending Prepare.",
            },
          ],
        },
      };

      const block = parseRawToPedagogical(rawLlmResponse, "EXPLORE", 1);
      expect(block.title).toBe("Two-Phase Commit Protocol");
      expect(block.stage).toBe("EXPLORE");
      expect(block.depth.academicTruth.formalStatement).toContain("2PC guarantees atomic commitment");
      expect(block.depth.mechanismExplanation.steps.length).toBe(2);
      expect(block.depth.misconceptionAlert.diagnosticDistractors.length).toBe(4);

      const blockValidation = validatePedagogicalBlock(block);
      expect(blockValidation.valid).toBe(true);
      expect(blockValidation.errors.length).toBe(0);
    });
  });

  describe("2. Bidirectional ConceptBlock Transformation", () => {
    it("TRANS-02: Converts PedagogicalExperienceBlock into canonical ConceptBlock with full fidelity", () => {
      const rawInput = {
        title: "CRISPR-Cas9 Gene Editing",
        stage: "UNDERSTAND",
        academicTruth: "Cas9 endonuclease uses guide RNA to introduce targeted double-strand DNA breaks.",
        coreIdea: "RNA-guided endonuclease targeting",
        intuitionMentalModel: "A molecular search engine and scissors scanning genomic text.",
        mechanismExplanation: "gRNA hybridizes to target DNA sequence adjacent to PAM motif, triggering Cas9 cleavage.",
        realWorldTransfer: "Therapeutic gene knockout in sickle cell disease treating hemoglobinopathies.",
        misconceptionAlert: "Believing Cas9 cuts randomly without sequence specificity.",
      };

      const pedagogicalBlock = parseRawToPedagogical(rawInput, "UNDERSTAND", 2);
      const conceptBlock = buildConceptBlockFromPedagogical(pedagogicalBlock, "exp-123");

      expect(conceptBlock.id).toBe("concept-block-2");
      expect(conceptBlock.experienceId).toBe("exp-123");
      expect(conceptBlock.orderIndex).toBe(2);
      expect(conceptBlock.stageCategory).toBe("UNDERSTAND");
      expect(conceptBlock.title).toBe("CRISPR-Cas9 Gene Editing");
      expect(conceptBlock.academicTruth).toContain("Cas9 endonuclease uses guide RNA");
      expect(conceptBlock.intuitionMentalModel).toContain("molecular search engine and scissors");
      expect(conceptBlock.mechanismExplanation).toContain("gRNA hybridizes to target DNA");
      expect(conceptBlock.realWorldTransfer).toContain("Therapeutic gene knockout");
      expect(conceptBlock.misconceptions.length).toBeGreaterThanOrEqual(1);

      // Extract back from ConceptBlock
      const extractedDepth = extractPedagogicalFromConceptBlock(conceptBlock);
      expect(extractedDepth.academicTruth.formalStatement).toBe(conceptBlock.academicTruth);
      expect(extractedDepth.intuitionMentalModel.metaphor).toBe(conceptBlock.intuitionMentalModel);
      expect(extractedDepth.mechanismExplanation.summary).toBe(conceptBlock.mechanismExplanation);
      expect(extractedDepth.realWorldTransfer.scenario).toBe(conceptBlock.realWorldTransfer);
    });
  });

  describe("3. End-to-End Projection & Zero Jargon Integration", () => {
    it("TRANS-03: Projections generated from pedagogical blocks pass validateZeroJargon with 0 violations", async () => {
      const block1 = parseRawToPedagogical(
        {
          title: "Public Key Cryptography",
          stage: "UNDERSTAND",
          academicTruth: "Asymmetric cryptography uses mathematical trapdoor one-way functions.",
          intuitionMentalModel: "An open padlock that anyone can snap shut, but only the owner has the key.",
          mechanismExplanation: "RSA uses modular exponentiation and prime factorization hardness.",
          realWorldTransfer: "TLS 1.3 key exchange protecting HTTPS web traffic.",
          misconceptionAlert: "Assuming public keys can decrypt messages encrypted with the same public key.",
        },
        "UNDERSTAND",
        1
      );

      const conceptBlock = buildConceptBlockFromPedagogical(block1, "test-exp");

      const mockExperience: LearningExperience = {
        id: "test-exp",
        title: "Foundations of Applied Cryptography",
        topicDescription: "Exploring asymmetric encryption and digital signatures.",
        pedagogicalFramework: "7-Stage Active Learning",
        conceptBlocks: [conceptBlock],
        activities: [
          {
            id: "act-1",
            experienceId: "test-exp",
            conceptBlockId: conceptBlock.id,
            activityType: "PREDICT",
            title: "Trapdoor Function Analysis",
            prompt: "Predict whether computing discrete logarithms is feasible for 2048-bit numbers.",
            actionVerb: "Predict",
            progressiveHints: [
              "Recall the definition of a one-way trapdoor function.",
              "Consider current classical computational limits.",
              "Subexponential algorithms like GNFS still require astronomical time.",
              "Conclude that 2048-bit modular exponentiation is computationally secure.",
            ],
            scaffoldingLevel: "guided",
            orderIndex: 1,
            createdAt: new Date(),
          },
        ],
        assessments: [
          {
            id: "assess-1",
            experienceId: "test-exp",
            conceptBlockId: conceptBlock.id,
            assessmentType: "DIAGNOSTIC_MCQ",
            stem: "Which mathematical property enables public key encryption?",
            options: [
              { id: "A", text: "Trapdoor one-way functions that are easy to compute but hard to invert without a key.", isCorrect: true },
              { id: "B", text: "Linear algebra matrix transformations with constant time inversion.", isCorrect: false, misconceptionKey: "OVER_GENERALIZATION" },
              { id: "C", text: "Inverting hash digests by reversing SHA-256 bitwise operations.", isCorrect: false, misconceptionKey: "REVERSE_CAUSALITY" },
              { id: "D", text: "Symmetric XOR operations with single shared key distribution.", isCorrect: false, misconceptionKey: "CONFUSION_OF_TERMS" },
            ],
            correctOptionId: "A",
            instructorRationale: "Option A accurately defines asymmetric trapdoor functions.",
            distractorExplanations: {
              A: "Correct explanation",
              B: "Linear transformations are invertible in polynomial time",
              C: "Cryptographic hash functions cannot be reversed",
              D: "Confuses symmetric and asymmetric encryption",
            },
            bloomLevel: "understand",
            difficulty: "medium",
            orderIndex: 1,
            isFinalGate: false,
            createdAt: new Date(),
          },
        ],
      };

      // Completeness check
      const completeness = validatePedagogicalCompleteness(mockExperience);
      expect(completeness.valid).toBe(true);

      // Project via StudentUxAdapter
      const adapter = new StudentUxAdapter();
      const projectionResult = await adapter.project(mockExperience);
      expect(projectionResult.success).toBe(true);
      const studentViewModel = projectionResult.data!;

      // Verify zero jargon across the entire projection view model
      const zeroJargonResult = validateZeroJargon(studentViewModel);
      expect(zeroJargonResult.valid).toBe(true);
      expect(zeroJargonResult.violations.length).toBe(0);

      // Verify Hidden-Answer Security
      const projectedConcept = studentViewModel.concepts[conceptBlock.id];
      expect(projectedConcept).toBeDefined();
      expect(projectedConcept.assessment).toBeDefined();
      expect((projectedConcept.assessment as any).correctOptionId).toBeUndefined();
      expect((projectedConcept.assessment as any).instructorRationale).toBeUndefined();
      projectedConcept.assessment?.options.forEach((opt: any) => {
        expect(opt.isCorrect).toBeUndefined();
        expect(opt.misconceptionKey).toBeUndefined();
        expect(opt.misconceptionExplanation).toBeUndefined();
      });
    });
  });
});
