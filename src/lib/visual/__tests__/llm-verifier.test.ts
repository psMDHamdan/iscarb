import { describe, expect, it } from "vitest";
import {
  buildVerificationPrompt,
  calculateCompositeScore,
  evaluateCandidateDeterministically,
  extractJsonFromLlmOutput,
  parseLLMVerificationResponse,
} from "../llm-verifier";
import type { CandidateImageMetadata, VisualSearchQuery } from "../types";

function createCandidate(overrides: Partial<CandidateImageMetadata> = {}): CandidateImageMetadata {
  return {
    id: "201",
    title: "File:Human_heart_diagram.svg",
    fileName: "Human_heart_diagram.svg",
    cleanTitle: "Human heart diagram",
    url: "https://upload.wikimedia.org/wikipedia/commons/2/20/Human_heart_diagram.svg",
    thumbUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Human_heart_diagram.svg/1200px.png",
    description: "Anatomical schematic diagram showing human heart chambers and blood flow pathways.",
    categories: ["Human heart diagrams", "Circulatory system"],
    artist: "Medical Artist",
    license: "CC BY-SA 4.0",
    width: 1200,
    height: 900,
    aspectRatio: 1.333,
    mimeType: "image/svg+xml",
    ...overrides,
  };
}

describe("LLM Verifier & Scoring Rubric Unit Tests", () => {
  describe("1. 4-Factor Composite Scoring Formula", () => {
    it("should calculate exact weighted composite score according to formula", () => {
      // (10 * 0.35 + 10 * 0.30 + 10 * 0.20 + 10 * 0.15) * 10 = (3.5 + 3.0 + 2.0 + 1.5) * 10 = 100
      const perfect = calculateCompositeScore({
        educationalValue: 10,
        relevance: 10,
        clarity: 10,
        diagrammaticNature: 10,
      });
      expect(perfect.totalWeightedScore).toBe(100.0);
      expect(perfect.confidence).toBe(1.0);

      // (8 * 0.35 + 9 * 0.30 + 7 * 0.20 + 6 * 0.15) * 10 = (2.8 + 2.7 + 1.4 + 0.9) * 10 = 7.8 * 10 = 78.0
      const partial = calculateCompositeScore({
        educationalValue: 8,
        relevance: 9,
        clarity: 7,
        diagrammaticNature: 6,
      });
      expect(partial.totalWeightedScore).toBe(78.0);
      expect(partial.confidence).toBe(0.78);
    });

    it("should clamp individual factors to [0, 10] range", () => {
      const clamped = calculateCompositeScore({
        educationalValue: 15, // should clamp to 10
        relevance: -5, // should clamp to 0
        clarity: 10,
        diagrammaticNature: 10,
      });
      // (10*0.35 + 0*0.30 + 10*0.20 + 10*0.15) * 10 = (3.5 + 0 + 2.0 + 1.5) * 10 = 70.0
      expect(clamped.totalWeightedScore).toBe(70.0);
    });
  });

  describe("2. JSON Extraction and Sanitization", () => {
    it("should extract JSON embedded in markdown fences and strip <think> tags", () => {
      const llmRaw = `<think>
Evaluating candidate diagrams for relevance to the human circulatory system.
Candidate 1 is a vector diagram with high educational value.
</think>
\`\`\`json
{
  "selectedCandidateId": "201",
  "evaluations": [
    {
      "candidateId": "201",
      "status": "ACCEPTED",
      "scores": {
        "educationalValue": 9.5,
        "relevance": 9.5,
        "clarity": 9.0,
        "diagrammaticNature": 9.0
      },
      "reasoningChain": "Clear vector schematic detailing chambers and blood flow."
    }
  ]
}
\`\`\``;

      const parsed = extractJsonFromLlmOutput(llmRaw);
      expect(parsed.selectedCandidateId).toBe("201");
      expect(parsed.evaluations).toHaveLength(1);
    });
  });

  describe("3. Verification Prompt Construction", () => {
    it("should include topic, subject, and all candidate metadata in prompt", () => {
      const query: VisualSearchQuery = {
        topic: "Carnot thermodynamic cycle",
        subject: "physics",
        diagramType: "schematic",
      };
      const candidate = createCandidate({
        id: "501",
        cleanTitle: "Carnot cycle PV indicator diagram",
      });

      const prompt = buildVerificationPrompt(query, [candidate]);
      expect(prompt).toContain("Carnot thermodynamic cycle");
      expect(prompt).toContain("physics");
      expect(prompt).toContain("Candidate #1");
      expect(prompt).toContain("501");
      expect(prompt).toContain("Carnot cycle PV indicator diagram");
      expect(prompt).toContain("REJECT_PORTRAIT_OR_PERSON");
    });
  });

  describe("4. parseLLMVerificationResponse", () => {
    it("should correctly identify accepted candidates exceeding threshold", () => {
      const candidate = createCandidate({ id: "201" });
      const rawJson = JSON.stringify({
        selectedCandidateId: "201",
        evaluations: [
          {
            candidateId: "201",
            status: "ACCEPTED",
            scores: {
              educationalValue: 9.0,
              relevance: 9.0,
              clarity: 8.5,
              diagrammaticNature: 8.5,
            },
            reasoningChain: "Excellent labeled anatomical diagram.",
          },
        ],
      });

      const result = parseLLMVerificationResponse(rawJson, [candidate], 70);
      expect(result.status).toBe("SUCCESS");
      expect(result.selectedCandidate).not.toBeNull();
      expect(result.selectedCandidate?.candidateId).toBe("201");
      expect(result.selectedCandidate?.scores.totalWeightedScore).toBeGreaterThanOrEqual(70);
    });

    it("should reject candidates scoring below threshold and categorize discards", () => {
      const candidate = createCandidate({ id: "301", cleanTitle: "Heart Surgery Photo" });
      const rawJson = JSON.stringify({
        selectedCandidateId: null,
        evaluations: [
          {
            candidateId: "301",
            status: "REJECTED",
            rejectionCode: "REJECT_RAW_UNLABELED_PHOTO",
            rejectionReason: "Unlabeled medical surgery photo without educational annotations.",
            scores: {
              educationalValue: 3.0,
              relevance: 7.0,
              clarity: 4.0,
              diagrammaticNature: 1.0,
            },
            reasoningChain: "Photo lacks schematic labels.",
          },
        ],
      });

      const result = parseLLMVerificationResponse(rawJson, [candidate], 70);
      expect(result.status).toBe("RETRY_NEEDED");
      expect(result.selectedCandidate).toBeNull();
      expect(result.discardedCandidates).toHaveLength(1);
      expect(result.discardedCandidates[0].rejectionCode).toBe("REJECT_RAW_UNLABELED_PHOTO");
    });
  });

  describe("5. Deterministic Evaluation Fallback", () => {
    it("should score educational vector diagrams highly and accept them", () => {
      const candidate = createCandidate({
        cleanTitle: "Human heart blood flow circulation diagram",
        description: "Labeled overview showing systemic and pulmonary pathway in English.",
        mimeType: "image/svg+xml",
      });

      const evaluation = evaluateCandidateDeterministically(candidate, {
        topic: "Human heart blood circulation",
        subject: "biology",
      });

      expect(evaluation.status).toBe("ACCEPTED");
      expect(evaluation.scores.totalWeightedScore).toBeGreaterThanOrEqual(70);
    });

    it("should reject off-topic candidates", () => {
      const candidate = createCandidate({
        cleanTitle: "Unrelated Architecture Blueprint",
        description: "Building plan for residential complex.",
        categories: ["Architecture"],
      });

      const evaluation = evaluateCandidateDeterministically(candidate, {
        topic: "Human heart blood circulation",
        subject: "biology",
      });

      expect(evaluation.status).toBe("REJECTED");
      expect(evaluation.rejectionCode).toBe("REJECT_OFF_TOPIC");
    });
  });
});
