import { describe, it, expect } from "vitest";
import { generateTopicGroundedFallbackSlides, buildPlanPrompt } from "@/lib/lecture/planner/plan-generator";
import { validatePlanStructure } from "@/lib/lecture/planner/plan-validator";

describe("Plan Generator Improvements (BRD v3.4)", () => {
  it("generates source-grounded concept titles in fallback mode", () => {
    const blocks = [
      { id: "b1", locator: "p.1", criticality: "critical", text: "# CRISPR-Cas9 Gene Editing Mechanisms\nCas9 nuclease introduces double-strand breaks (DSBs) guided by sgRNA." },
      { id: "b2", locator: "p.2", criticality: "normal", text: "## Homology-Directed Repair (HDR) vs Non-Homologous End Joining (NHEJ)\nHDR enables precise sequence insertion." },
      { id: "b3", locator: "p.3", criticality: "critical", text: "### Off-Target Cleavage Mitigation & PAM Recognition\nThe NGG protospacer adjacent motif (PAM) is required." }
    ];
    const clos = [{ id: "c1", number: "CLO1", text: "Analyze CRISPR cleavage kinetics", bloomLevel: "analyze" }];

    const slides = generateTopicGroundedFallbackSlides("CRISPR Gene Editing", clos, blocks);

    expect(slides).toHaveLength(20);
    expect(slides[0].title).toBe("When CRISPR Gene Editing Fails: High-Stakes Impact & Core Tension");
    expect(slides[4].title).toBe("CRISPR-Cas9 Gene Editing Mechanisms");
    expect(slides[5].title).toBe("Homology-Directed Repair (HDR) Vs Non-Homologous End Joining (NHEJ)");
    expect(slides[6].title).toBe("Off-Target Cleavage Mitigation & PAM Recognition");
    expect(slides[8].title).toContain("Cleavage Rate Kinetics");
    expect(slides[12].title).toContain("HDR) Vs Non-Homologous End Joining");
    expect(validatePlanStructure(slides)).toEqual([]);
  });

  it("builds an enriched prompt with slot contract and source fidelity rules", () => {
    const blocks = [{ id: "b1", locator: "p.1", criticality: "critical", text: "Security Architecture & Cryptography" }];
    const clos = [{ id: "c1", number: "CLO1", text: "Defend against side-channel attacks", bloomLevel: "evaluate" }];
    const course = { courseCode: "SEC401", title: "Security Engineering", specialty: "Cybersecurity" };

    const { system, user } = buildPlanPrompt(blocks, clos, course);

    expect(system).toContain("SOURCE FIDELITY");
    expect(system).toContain("S1–S20");
    expect(user).toContain("MANDATORY S1–S20 SLOT CONTRACT");
    expect(user).toContain("TARGET LECTURE TOPIC: Security Engineering");
  });
});
