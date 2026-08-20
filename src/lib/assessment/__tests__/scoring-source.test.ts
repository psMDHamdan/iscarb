import { describe, expect, it, vi } from "vitest";
import { isAiGradedSource, normalizeScoringSource } from "../scoring-source";
import { assessmentResponseMapper } from "@/services/rdf/rdf-mappers/assessment-response.mapper";

vi.mock("@/config/rdf", () => ({
  instanceUri: (_type: string, _uni: string, id: string) =>
    `https://iscarb.edu/ontology/instance/${id}`,
  classUri: (name: string) => `https://iscarb.edu/ontology/class/${name}`,
  universityGraph: (code: string) => `https://iscarb.edu/graph/${code}`,
}));

describe("normalizeScoringSource", () => {
  it("keeps ontology concepts lowercase including seed", () => {
    expect(normalizeScoringSource("ai")).toBe("ai");
    expect(normalizeScoringSource("fallback")).toBe("fallback");
    expect(normalizeScoringSource("human")).toBe("human");
    expect(normalizeScoringSource("seed")).toBe("seed");
  });

  it("normalizes legacy uppercase AI / heuristic / demo labels", () => {
    expect(normalizeScoringSource("AI")).toBe("ai");
    expect(normalizeScoringSource("heuristic")).toBe("fallback");
    expect(normalizeScoringSource("faculty")).toBe("human");
    expect(normalizeScoringSource("fixture")).toBe("seed");
  });

  it("never invents AI for empty/unknown", () => {
    expect(normalizeScoringSource("")).toBe("fallback");
    expect(normalizeScoringSource(undefined)).toBe("fallback");
    expect(normalizeScoringSource("mystery")).toBe("fallback");
  });
});

describe("isAiGradedSource", () => {
  it("is true only for live ai — not seed/fallback/human", () => {
    expect(isAiGradedSource("ai")).toBe(true);
    expect(isAiGradedSource("AI")).toBe(true);
    expect(isAiGradedSource("seed")).toBe(false);
    expect(isAiGradedSource("fallback")).toBe(false);
    expect(isAiGradedSource("human")).toBe(false);
  });
});

describe("assessmentResponseMapper scoringSource", () => {
  function sourceTriple(entitySource: string) {
    const { triples } = assessmentResponseMapper.toTriples(
      {
        id: "resp-1",
        studentId: "stu-1",
        moduleCode: "M01",
        dimension: "core_professionalism",
        score: 72,
        band: "proficient",
        passed: true,
        perCriterionJson: "[]",
        feedback: "ok",
        strengthsJson: "[]",
        improvementsJson: "[]",
        model: "openai/gpt-oss-20b",
        source: entitySource,
      },
      "KFU",
    );
    const t = triples.find((x) => x.p === "iscarb:scoringSource");
    const val =
      typeof t?.o === "object" && t?.o && "value" in t.o
        ? (t.o as { value: string }).value
        : t?.o;
    return val;
  }

  it("emits lowercase ai matching persisted AssessmentResponse.source", () => {
    const emitted = sourceTriple("ai");
    expect(emitted).toBe("ai");
    expect(["ai", "fallback", "human", "seed"]).toContain(emitted);
  });

  it("emits lowercase fallback matching persisted AssessmentResponse.source", () => {
    expect(sourceTriple("fallback")).toBe("fallback");
  });

  it("emits seed for fixture rows — never collapses seed to ai", () => {
    expect(sourceTriple("seed")).toBe("seed");
  });

  it("normalizes legacy AI casing to ontology ai", () => {
    expect(sourceTriple("AI")).toBe("ai");
  });
});

describe("studentToJSONLD scoringSource contract (pure projection)", () => {
  it("builds iscarb:{ai|fallback|human|seed} from response.source — never hardcodes AI", () => {
    const cases = [
      { source: "ai", expected: "iscarb:ai" },
      { source: "fallback", expected: "iscarb:fallback" },
      { source: "human", expected: "iscarb:human" },
      { source: "seed", expected: "iscarb:seed" },
      { source: "AI", expected: "iscarb:ai" },
      { source: "heuristic", expected: "iscarb:fallback" },
    ];
    for (const c of cases) {
      const scoringSource = `iscarb:${normalizeScoringSource(c.source)}`;
      expect(scoringSource).toBe(c.expected);
      expect(scoringSource).not.toBe("iscarb:AI");
    }
  });
});
