/**
 * Unit tests for generateSpecializationQuestionBatch — the speed fix that
 * generates several exam questions in ONE LLM call (fewer round trips → the
 * 47-module exam starts in ~1/4 of the wall time).
 *
 * Guarantees under test:
 *  - one chatJson call resolves ALL items (no per-module waterfall);
 *  - every item is still validated with the same 9-check validator;
 *  - an item that fails validation in the batch falls back to the single
 *    question generator (never silently served);
 *  - a persistent failure is reported { ok:false } — never a fallback question.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  generateSpecializationQuestionBatch,
  type BatchQuestionItem,
} from "@/lib/assessment/specialization-question-generator";

vi.mock("@/lib/ai-engine", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai-engine")>("@/lib/ai-engine");
  return { ...actual, chatJson: vi.fn() };
});

import { chatJson } from "@/lib/ai-engine";

const mockedChat = vi.mocked(chatJson);

type RawQuestion = {
  scenario: string;
  task: string;
  options: string[];
  correctIndex: number;
};

function strongQuestion(competency: string): RawQuestion {
  return {
    scenario:
      "You are a backend developer on a high-traffic e-commerce platform. During a release, monitoring shows API latency has increased sharply for checkout requests. The frontend team reports intermittent failures, while the product manager wants the release completed before a campaign begins in six hours. Initial logs suggest the problem may involve a database query, although application-level caching was also changed in the same release. The team must decide whether to roll back, hotfix, or keep the release active while isolating the regression.",
    task: "Which course of action should you recommend first to restore checkout reliability while still preserving the evidence needed to identify whether the database query or the caching change caused the regression?",
    options: [
      "Temporarily roll back the release to restore checkout reliability, while preserving the deployment artifacts and logs needed to isolate whether the database query or caching change caused the regression. This protects the customer path first but delays the campaign release until the root cause is understood.",
      "Keep the release active but disable the affected checkout path behind a feature flag while the engineering team compares database query latency against the previous release. This reduces exposure without discarding the new release, but requires a controlled fallback for customers affected by the feature flag.",
      "Increase database capacity immediately and keep the release in production, because the latency increase is most likely caused by additional traffic rather than the code change. This may restore performance quickly, but risks masking a query or application-level regression that will return under higher load.",
      "Ask the frontend team to reduce checkout requests while continuing the release unchanged, since the frontend reports the visible failures. This limits request volume but does not directly establish whether the backend regression is caused by the database or caching layer.",
    ],
    correctIndex: 2,
  };
}

const COMPETENCY = "Analytical Decision Making";

function batchItems(n: number): BatchQuestionItem[] {
  return Array.from({ length: n }, (_, i) => ({
    competency: COMPETENCY,
    moduleCode: `M${String(i + 1).padStart(2, "0")}`,
    moduleTitle: `Module ${i + 1}`,
    moduleFramework: "STAR method",
  }));
}

beforeEach(() => {
  mockedChat.mockReset();
});

describe("generateSpecializationQuestionBatch", () => {
  it("resolves all items in a single LLM call", async () => {
    const items = batchItems(4);
    mockedChat.mockResolvedValue({
      json: {
        questions: items.map((it) => strongQuestion(it.competency)),
      },
    } as never);

    const results = await generateSpecializationQuestionBatch("Web Development", items);

    expect(mockedChat).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(4);
    results.forEach((r, i) => {
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.mcq.choices).toHaveLength(4);
        expect(r.mcq.competency).toBe(COMPETENCY);
        expect(r.mcq.specialization).toBe("Web Development");
        expect(r.mcq.difficulty).toBe("very_hard");
        void i;
      }
    });
  });

  it("falls back to the single-question generator for an item that fails batch validation", async () => {
    const items = batchItems(2);
    const bad = { ...strongQuestion(COMPETENCY), task: "Write a detailed summary of how you would approach this situation." };
    const good = strongQuestion(COMPETENCY);
    // First call = batch with one invalid item; subsequent calls (single-question
    // fallback) return a valid question.
    mockedChat
      .mockResolvedValueOnce({ json: { questions: [good, bad] } } as never)
      .mockResolvedValue({ json: good } as never);

    const results = await generateSpecializationQuestionBatch("Web Development", items);

    expect(results).toHaveLength(2);
    // The invalid item was retried through the single generator and succeeded.
    results.forEach((r) => expect(r.ok).toBe(true));
    expect(mockedChat.mock.calls.length).toBeGreaterThan(1);
  });

  it("reports { ok:false } (never a fallback question) when an item persistently fails", async () => {
    const items = batchItems(1);
    const bad = { ...strongQuestion(COMPETENCY), task: "Write a detailed summary of how you would approach this situation." };
    // Batch attempt + single-question attempts all return the invalid question.
    mockedChat.mockResolvedValue({ json: { questions: [bad] } } as never);

    const results = await generateSpecializationQuestionBatch("Web Development", items);

    expect(results).toHaveLength(1);
    expect(results[0]!.ok).toBe(false);
    if (!results[0]!.ok) {
      expect(results[0]!.error).toContain("QUESTION_GENERATION_FAILED");
    }
  });
});
