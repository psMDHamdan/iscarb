import { describe, it, expect } from "vitest";
import {
  HookElementSchema,
  ConceptElementSchema,
  MechanismElementSchema,
  MentalModelElementSchema,
  WorkedExampleElementSchema,
  MisconceptionElementSchema,
  PracticeElementSchema,
  ApplicationElementSchema,
  TransferElementSchema,
  ReadinessElementSchema,
  AcademicTruthLayerSchema,
  IntuitionMentalModelLayerSchema,
  MechanismExplanationLayerSchema,
  RealWorldTransferLayerSchema,
  MisconceptionAlertLayerSchema,
  FiveLayerPedagogicalDepthSchema,
  PedagogicalMetadataSchema,
  PedagogicalExperienceBlockSchema,
  createHookElement,
  createConceptElement,
  createMechanismElement,
  createMentalModelElement,
  createWorkedExampleElement,
  createMisconceptionElement,
  createPracticeElement,
  createApplicationElement,
  createTransferElement,
  createReadinessElement,
} from "@/lib/lecture/pedagogy";

describe("Pedagogical Schemas & Element Models", () => {
  describe("10 Core Pedagogical Elements", () => {
    it("SCH-01: Validates HookElement with positive duration and tension provocation", () => {
      const validHook = {
        id: "hook-1",
        elementType: "HOOK" as const,
        headline: "Why does concurrent state corruption happen in distributed databases?",
        tensionContext: "Banks face race conditions when two ATMs withdraw funds concurrently.",
        provocation: "How can two transactions read $100 and both withdraw $100 simultaneously?",
        targetCuriosity: "Discovering isolation invariants and optimistic locking mechanisms.",
        estimatedDurationSec: 90,
      };

      const parsed = HookElementSchema.parse(validHook);
      expect(parsed.id).toBe("hook-1");
      expect(parsed.estimatedDurationSec).toBe(90);

      // Builder test
      const created = createHookElement({
        id: "hook-2",
        headline: "How does CRISPR identify target sequences?",
        tensionContext: "A single base-pair mismatch can lead to lethal off-target genomic cleavage.",
        provocation: "How do Cas9 enzymes scan 3 billion base pairs in milliseconds?",
        targetCuriosity: "Understanding PAM recognition and guide RNA hybridization kinetics.",
        estimatedDurationSec: 60,
      });
      expect(created.elementType).toBe("HOOK");

      // Invalid cases
      expect(() =>
        HookElementSchema.parse({
          ...validHook,
          estimatedDurationSec: -10, // negative duration
        })
      ).toThrow();

      expect(() =>
        HookElementSchema.parse({
          ...validHook,
          headline: "tiny", // too short (<5 chars)
        })
      ).toThrow();
    });

    it("SCH-02: Validates ConceptElement with formal definition and governing invariants", () => {
      const validConcept = {
        id: "concept-1",
        elementType: "CONCEPT" as const,
        title: "ACID Isolation Invariant",
        canonicalDefinition: "Serializability guarantees that concurrent execution yields the exact same state as serial execution.",
        governingInvariants: ["Read-after-write consistency", "Serial schedule equivalence"],
        bloomLevel: "understand" as const,
        prerequisites: ["concept-0"],
        cloIds: ["clo-1"],
      };

      const parsed = ConceptElementSchema.parse(validConcept);
      expect(parsed.governingInvariants.length).toBe(2);

      const created = createConceptElement(validConcept);
      expect(created.title).toBe("ACID Isolation Invariant");

      // Invalid Bloom level
      expect(() =>
        ConceptElementSchema.parse({
          ...validConcept,
          bloomLevel: "invalid_bloom_verb",
        })
      ).toThrow();

      // Empty invariants
      expect(() =>
        ConceptElementSchema.parse({
          ...validConcept,
          governingInvariants: [],
        })
      ).toThrow();
    });

    it("SCH-03: Validates MechanismElement with multi-step causal chain", () => {
      const validMechanism = {
        id: "mech-1",
        elementType: "MECHANISM" as const,
        overview: "Two-phase locking coordinates concurrency by acquiring shared and exclusive locks before releasing.",
        causalChain: [
          {
            stepNumber: 1,
            phase: "Growing Phase",
            trigger: "Transaction issues read/write operation",
            action: "Acquires S-lock or X-lock from lock manager",
            outcome: "Lock granted or transaction queued",
            stateChange: "Lock table entry registered",
          },
          {
            stepNumber: 2,
            phase: "Shrinking Phase",
            trigger: "Commit or rollback triggered",
            action: "Releases all held locks in atomic cascade",
            outcome: "Resources freed for waiting transactions",
            stateChange: "Lock table entry pruned",
          },
        ],
        invariantsEnforced: ["No lock acquired after first lock released"],
        bottlenecks: ["Lock contention on hot row records"],
      };

      const parsed = MechanismElementSchema.parse(validMechanism);
      expect(parsed.causalChain.length).toBe(2);

      const created = createMechanismElement(validMechanism);
      expect(created.causalChain[0].phase).toBe("Growing Phase");

      // Less than 2 causal steps throws
      expect(() =>
        MechanismElementSchema.parse({
          ...validMechanism,
          causalChain: [validMechanism.causalChain[0]],
        })
      ).toThrow();
    });

    it("SCH-04: Validates MentalModelElement with source-target primitive mappings", () => {
      const validMentalModel = {
        id: "mm-1",
        elementType: "MENTAL_MODEL" as const,
        analogyDomain: "Traffic Coordination",
        metaphor: "A four-way traffic light intersection prevents simultaneous collisions by gating lane access.",
        primitiveMappings: [
          {
            sourcePrimitive: "Traffic Light Semaphore",
            targetPrimitive: "Database Mutex Lock",
            rationale: "Both signal exclusive right of way to prevent catastrophic resource collision.",
          },
        ],
        breakdownLimits: "Fails when traffic lights operate independently without synchronization.",
      };

      const parsed = MentalModelElementSchema.parse(validMentalModel);
      expect(parsed.primitiveMappings[0].sourcePrimitive).toBe("Traffic Light Semaphore");

      const created = createMentalModelElement(validMentalModel);
      expect(created.analogyDomain).toBe("Traffic Coordination");
    });

    it("SCH-05: Validates WorkedExampleElement with step-by-step computational reasoning", () => {
      const validExample = {
        id: "we-1",
        elementType: "WORKED_EXAMPLE" as const,
        problemStatement: "Calculate the equilibrium constant K_eq given standard Gibbs free energy delta G = -10 kJ/mol at 298 K.",
        initialConditions: {
          deltaG_joules: -10000,
          temperature_kelvin: 298,
          gasConstant_R: 8.314,
        },
        steps: [
          {
            stepNumber: 1,
            subGoal: "Express the Gibbs free energy relationship",
            mathematicalExpression: "\\Delta G^\\circ = -RT \\ln K_{eq}",
            calculation: "-10000 = -8.314 * 298 * ln(K_eq)",
            explanatoryNote: "Isolate the natural logarithm of K_eq by dividing by -RT.",
            expertTip: "Always convert kJ to J before substituting with R.",
          },
          {
            stepNumber: 2,
            subGoal: "Compute the exponential value",
            mathematicalExpression: "K_{eq} = e^{\\frac{10000}{8.314 \\times 298}}",
            calculation: "K_eq = e^{4.036} = 56.6",
            explanatoryNote: "Exponentiate both sides with base e to find K_eq.",
          },
        ],
        finalSolution: "K_eq = 56.6 (dimensionless)",
        verificationCheck: "Since delta G < 0, K_eq > 1, confirming the forward reaction is spontaneous.",
      };

      const parsed = WorkedExampleElementSchema.parse(validExample);
      expect(parsed.steps.length).toBe(2);
      expect(parsed.initialConditions.deltaG_joules).toBe(-10000);

      const created = createWorkedExampleElement(validExample);
      expect(created.finalSolution).toBe("K_eq = 56.6 (dimensionless)");
    });

    it("SCH-06: Validates MisconceptionElement with structured diagnostic items", () => {
      const validMisconception = {
        id: "misc-1",
        elementType: "MISCONCEPTION" as const,
        alertSummary: "Students frequently confuse heat and temperature during phase transitions.",
        misconceptions: [
          {
            commonBelief: "Temperature must rise whenever heat energy is added to a substance.",
            distractorType: "OVER_GENERALIZATION" as const,
            whyIncorrect: "During a first-order phase change, latent heat breaks intermolecular bonds at constant temperature.",
            refutationEvidence: "Boiling water remains at 100°C at 1 atm regardless of burner flame intensity.",
            correction: "Distinguish between sensible heat (temperature change) and latent heat (phase change).",
            repairStrategy: "Plot temperature vs added heat to observe flat horizontal latent plateaus.",
          },
        ],
      };

      const parsed = MisconceptionElementSchema.parse(validMisconception);
      expect(parsed.misconceptions[0].distractorType).toBe("OVER_GENERALIZATION");

      const created = createMisconceptionElement(validMisconception);
      expect(created.alertSummary).toContain("confuse heat and temperature");
    });

    it("SCH-07: Validates PracticeElement with exactly 4 progressive hints (L1-L4)", () => {
      const validPractice = {
        id: "prac-1",
        elementType: "PRACTICE" as const,
        activityType: "CALCULATE" as const,
        title: "Buffer Capacity Determination",
        prompt: "Calculate the pH of a solution containing 0.1 M acetic acid and 0.1 M sodium acetate (pKa = 4.76).",
        actionVerb: "Calculate",
        scaffoldingLevel: "guided" as const,
        progressiveHints: [
          "Identify the conjugate acid-base pair present in the solution.",
          "Recall the Henderson-Hasselbalch equation relating pH, pKa, and concentration ratio.",
          "Substitute [A-] = 0.1 M and [HA] = 0.1 M: log(0.1/0.1) = log(1) = 0.",
          "Final computation: pH = 4.76 + 0 = 4.76.",
        ] as [string, string, string, string],
        rubricCriteria: [
          {
            criterion: "Equation Selection",
            weight: 0.5,
            descriptor: "Correctly selects and writes the Henderson-Hasselbalch formulation.",
          },
          {
            criterion: "Numerical Computation",
            weight: 0.5,
            descriptor: "Calculates pH = 4.76 accurately with proper significant digits.",
          },
        ],
        modelAnswer: "pH = pKa + log([A-]/[HA]) = 4.76 + log(1) = 4.76",
      };

      const parsed = PracticeElementSchema.parse(validPractice);
      expect(parsed.progressiveHints.length).toBe(4);

      const created = createPracticeElement(validPractice);
      expect(created.actionVerb).toBe("Calculate");

      // Fewer than 4 hints throws
      expect(() =>
        PracticeElementSchema.parse({
          ...validPractice,
          progressiveHints: ["Hint 1", "Hint 2"],
        })
      ).toThrow();
    });

    it("SCH-08: Validates ApplicationElement with authentic trade-offs", () => {
      const validApp = {
        id: "app-1",
        elementType: "APPLICATION" as const,
        industryDomain: "Cloud Storage Systems",
        realWorldScenario: "Designing a high-throughput global key-value store across multiple continents.",
        constraints: ["Must tolerate cross-region network partitions (P)", "Latency under 50ms (L)"],
        tradeoffs: [
          {
            dimensionA: "Strong Consistency",
            dimensionB: "Availability & Low Latency",
            resolution: "Adopt eventual consistency with conflict-free replicated data types (CRDTs).",
          },
        ],
        appliedSolution: "Deploy Cassandra ring topology with local quorum replication.",
        keyLessons: ["Architectural trade-offs dictate consistency models in geo-distributed systems."],
      };

      const parsed = ApplicationElementSchema.parse(validApp);
      expect(parsed.tradeoffs[0].dimensionA).toBe("Strong Consistency");

      const created = createApplicationElement(validApp);
      expect(created.industryDomain).toBe("Cloud Storage Systems");
    });

    it("SCH-09: Validates TransferElement with cross-domain isomorphism", () => {
      const validTransfer = {
        id: "trans-1",
        elementType: "TRANSFER" as const,
        targetDomain: "Cardiovascular Hemodynamics",
        isomorphicScenario: "Blood flow resistance in stenotic arteries behaves analogously to electrical resistance in series circuits.",
        structuralMappings: [
          {
            sourceInvariant: "Ohm's Law: V = I * R",
            targetDomainFeature: "Poiseuille Pressure Drop: Delta P = Q * R_hydraulic",
            transferRule: "Voltage drops map to pressure gradients; electric current maps to volumetric flow rate.",
          },
        ],
        transferChallengePrompt: "Predict what happens to total cardiac workload when arterial radius is halved.",
        evaluationCriteria: ["Correctly applies R proportional to 1/r^4", "Deduces a 16x increase in resistance"],
      };

      const parsed = TransferElementSchema.parse(validTransfer);
      expect(parsed.structuralMappings[0].sourceInvariant).toContain("Ohm's Law");

      const created = createTransferElement(validTransfer);
      expect(created.targetDomain).toBe("Cardiovascular Hemodynamics");
    });

    it("SCH-10: Validates ReadinessElement with 4-option MCQ and distractor diagnosis", () => {
      const validReadiness = {
        id: "read-1",
        elementType: "READINESS" as const,
        stem: "What is the primary operational consequence of reducing database isolation level from Serializable to Read Committed?",
        options: [
          { id: "A" as const, text: "Eliminates dirty reads while allowing non-repeatable reads and phantom reads.", isCorrect: true },
          { id: "B" as const, text: "Guarantees complete serializability under concurrent transaction loads.", isCorrect: false, misconceptionKey: "OVER_GENERALIZATION" as const },
          { id: "C" as const, text: "Causes database crashes during concurrent commits due to lock inversions.", isCorrect: false, misconceptionKey: "REVERSE_CAUSALITY" as const },
          { id: "D" as const, text: "Operates identically to Read Uncommitted with zero lock overhead.", isCorrect: false, misconceptionKey: "CONFUSION_OF_TERMS" as const },
        ],
        correctOptionId: "A" as const,
        instructorRationale: "Option A is correct because Read Committed acquires short-term read locks, preventing dirty reads but leaving open non-repeatable read anomalies.",
        distractorExplanations: {
          A: "Correct explanation",
          B: "Overgeneralization: Confusing Read Committed with Serializable",
          C: "Reverse causality: Lock inversions cause deadlocks, not isolation degradation crashes",
          D: "Confusion of terms: Confusing Read Committed with Read Uncommitted",
        },
        cloId: "clo-db-1",
        bloomLevel: "analyze" as const,
        difficulty: "hard" as const,
        isFinalGate: true,
      };

      const parsed = ReadinessElementSchema.parse(validReadiness);
      expect(parsed.options.length).toBe(4);
      expect(parsed.isFinalGate).toBe(true);

      const created = createReadinessElement(validReadiness);
      expect(created.correctOptionId).toBe("A");
    });
  });

  describe("5-Layer Pedagogical Depth Model", () => {
    it("DEPTH-01: Validates complete 5-layer depth structure", () => {
      const depthData = {
        academicTruth: {
          formalStatement: "In a closed thermodynamic system, entropy never decreases over time (Delta S_universe >= 0).",
          invariants: ["dS >= dq/T for irreversible processes", "Entropy is a state function"],
          boundaryConditions: ["Isolated or closed system", "Macroscopic scale"],
          canonicalCitation: "Clausius (1865)",
        },
        intuitionMentalModel: {
          metaphor: "A shuffled deck of cards naturally becomes disordered rather than spontaneously organizing itself.",
          analogyDomain: "Statistical Probability",
          mappings: [
            {
              sourcePrimitive: "Card permutations",
              targetPrimitive: "Microstates in phase space",
              rationale: "Disordered microstates vastly outnumber ordered ones.",
            },
          ],
          limitations: "Microscopic fluctuations can exhibit transient local entropy decreases.",
        },
        mechanismExplanation: {
          summary: "Energy dispersal occurs spontaneously toward maximum statistical microstate probability.",
          steps: [
            {
              stepNumber: 1,
              phase: "Energy Dispersion",
              trigger: "Thermal contact between reservoirs",
              action: "Heat flows down temperature gradient",
              outcome: "Microstate multiplicity increases",
            },
            {
              stepNumber: 2,
              phase: "Equilibrium",
              trigger: "Equal temperature reached",
              action: "Net entropy production reaches maximum plateau",
              outcome: "Thermodynamic equilibrium established",
            },
          ],
          criticalPath: "Thermal conduction rate across system boundary",
        },
        realWorldTransfer: {
          scenario: "Heat exchanger design in power plants optimizing Carnot efficiency limits.",
          industryContext: "Thermal Power Generation",
          tradeoffs: [
            {
              dimensionA: "Carnot Efficiency",
              dimensionB: "Heat Transfer Rate",
              resolution: "Reversible infinite-time cycle yields 0 power; practical systems balance efficiency vs power output.",
            },
          ],
          lessons: ["Second Law sets hard theoretical efficiency ceilings on all thermal energy conversion."],
        },
        misconceptionAlert: {
          alertMessage: "Students frequently confuse spontaneous local order creation with Second Law violations.",
          misconceptions: [
            {
              commonBelief: "Biological life violates the Second Law because living cells create internal order.",
              distractorType: "EDGE_CASE_NEGLECT" as const,
              whyIncorrect: "Cells are open systems that dissipate heat, increasing net environmental entropy.",
              refutationEvidence: "Calorimetric measurements confirm metabolic heat output exceeds internal entropy decrease.",
              correction: "Apply the Second Law to the total universe (system + surroundings).",
              repairStrategy: "Draw explicit control volume boundaries around open biological systems.",
            },
          ],
          diagnosticDistractors: [
            { id: "A" as const, text: "Total entropy of the universe never decreases in any spontaneous process.", isCorrect: true },
            { id: "B" as const, text: "Entropy can decrease locally in open systems if surrounding entropy increases by more.", isCorrect: false, misconceptionKey: "OVER_GENERALIZATION" as const },
            { id: "C" as const, text: "Living organisms violate thermodynamics by creating order without heat dissipation.", isCorrect: false, misconceptionKey: "EDGE_CASE_NEGLECT" as const },
            { id: "D" as const, text: "Heat naturally flows from cold to hot bodies without external work.", isCorrect: false, misconceptionKey: "REVERSE_CAUSALITY" as const },
          ],
          instructorRationale: "Option A is the formal statement of the Second Law of Thermodynamics.",
        },
      };

      const parsed = FiveLayerPedagogicalDepthSchema.parse(depthData);
      expect(parsed.academicTruth.formalStatement).toContain("entropy never decreases");
      expect(parsed.misconceptionAlert.diagnosticDistractors.length).toBe(4);
    });
  });

  describe("Composite Pedagogical Block Schema", () => {
    it("BLOCK-01: Validates PedagogicalExperienceBlock with depth and elements map", () => {
      const fullBlock = {
        id: "block-discover-1",
        orderIndex: 1,
        stage: "DISCOVER" as const,
        title: "Introduction to Thermodynamic Entropy",
        bloomLevel: "understand" as const,
        cloIds: ["clo-thermo-1"],
        sourceBlockIds: ["src-block-1"],
        depth: {
          academicTruth: {
            formalStatement: "Delta S >= 0 for isolated systems.",
            invariants: ["dS = dq_rev / T"],
            boundaryConditions: ["Isolated system"],
          },
          intuitionMentalModel: {
            metaphor: "Card shuffling analogy illustrates statistical disorder.",
            analogyDomain: "Combinatorics",
            mappings: [
              {
                sourcePrimitive: "Cards",
                targetPrimitive: "Molecules",
                rationale: "Both have discrete microstates.",
              },
            ],
            limitations: "Cards are macroscopic.",
          },
          mechanismExplanation: {
            summary: "Statistical dispersal of energy across accessible microstates.",
            steps: [
              {
                stepNumber: 1,
                phase: "Expansion",
                trigger: "Valve opens",
                action: "Gas molecules explore volume",
                outcome: "Accessible states increase",
              },
              {
                stepNumber: 2,
                phase: "Equilibrium",
                trigger: "Uniform distribution",
                action: "Maximum entropy reached",
                outcome: "Equilibrium",
              },
            ],
            criticalPath: "Molecular diffusion speed",
          },
          realWorldTransfer: {
            scenario: "Designing refrigeration cycles with minimal exergy loss.",
            industryContext: "HVAC Engineering",
            tradeoffs: [
              {
                dimensionA: "Cooling Speed",
                dimensionB: "Exergy Efficiency",
                resolution: "Optimized compressor modulation",
              },
            ],
            lessons: ["Minimize irreversible throttling to improve COP."],
          },
          misconceptionAlert: {
            alertMessage: "Local ordering is possible in non-isolated systems.",
            misconceptions: [
              {
                commonBelief: "Entropy must increase everywhere in every part of the system.",
                distractorType: "OVER_GENERALIZATION" as const,
                whyIncorrect: "Subsystems can decrease in entropy if compensated by surroundings.",
                refutationEvidence: "Freezing water decreases liquid water entropy while releasing latent heat to air.",
                correction: "Calculate Delta S_system + Delta S_surroundings.",
                repairStrategy: "Separate system from surroundings in entropy balance accounting.",
              },
            ],
            diagnosticDistractors: [
              { id: "A" as const, text: "Isolated system entropy is non-decreasing.", isCorrect: true },
              { id: "B" as const, text: "All subsystems must increase in entropy.", isCorrect: false, misconceptionKey: "OVER_GENERALIZATION" as const },
              { id: "C" as const, text: "Spontaneous cooling without work is allowed.", isCorrect: false, misconceptionKey: "REVERSE_CAUSALITY" as const },
              { id: "D" as const, text: "Entropy and energy are identical quantities.", isCorrect: false, misconceptionKey: "CONFUSION_OF_TERMS" as const },
            ],
            instructorRationale: "Option A is correct according to the Second Law.",
          },
        },
        elements: {
          hook: {
            id: "hook-1",
            elementType: "HOOK" as const,
            headline: "Can energy ever be destroyed or lost?",
            tensionContext: "We conserve energy, yet high-grade work degrades into unusable ambient heat.",
            provocation: "If energy is conserved, why do we experience an energy crisis?",
            targetCuriosity: "Exploring the quality versus quantity of thermodynamic energy.",
            estimatedDurationSec: 60,
          },
        },
      };

      const parsed = PedagogicalExperienceBlockSchema.parse(fullBlock);
      expect(parsed.title).toBe("Introduction to Thermodynamic Entropy");
      expect(parsed.elements.hook?.headline).toContain("energy ever be destroyed");
    });
  });
});
