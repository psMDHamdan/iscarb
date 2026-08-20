/**
 * AI Engine Model Defaults — DeepSeek via NVIDIA
 *
 * chatJson / chatText / chatJsonRaw MUST:
 *   - default to `openai/gpt-oss-20b` when no model is provided
 *   - pass a `temperature` in the API call body (DeepSeek accepts temperature)
 *   - honour an explicit `model` override
 *
 * Validates: Requirements 5.1, 5.2 (updated after K2Think removal)
 *
 * NOTE: The ai-engine's getClient() returns a custom fetch-based client
 * (not the openai SDK), so we mock globalThis.fetch to intercept payloads.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// server-only is mocked in setup.ts; guard here too just in case
vi.mock("server-only", () => ({}));

// DEFAULT_AI_MODEL is computed at module evaluation time from
// OPENAI_CHAT_MODEL. vi.hoisted runs before the static import below is
// evaluated, so the DeepSeek default is asserted regardless of ambient
// shell/CI env (e.g. an exported OPENAI_CHAT_MODEL).
vi.hoisted(() => {
  process.env.OPENAI_CHAT_MODEL = "";
});

// Import AFTER mocks are registered
import { chatJson, chatJsonRaw } from "@/lib/ai-engine";

// ---------------------------------------------------------------------------
// Capture variable — spy on the JSON body passed to fetch()
// ---------------------------------------------------------------------------
let capturedRequestBody: Record<string, unknown> | null = null;

const MOCK_AI_RESPONSE = {
  choices: [{ message: { content: '{"result":"ok"}' } }],
  usage: { prompt_tokens: 10, completion_tokens: 5 },
};

function createMockFetch() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    // Parse the request body to inspect what the engine sent
    if (init?.body) {
      try {
        capturedRequestBody = JSON.parse(init.body as string);
      } catch {
        capturedRequestBody = null;
      }
    }
    return {
      ok: true,
      json: async () => MOCK_AI_RESPONSE,
    };
  });
}

describe("AI Engine Model Defaults (DeepSeek via NVIDIA)", () => {
  beforeEach(() => {
    capturedRequestBody = null;
    vi.stubEnv("NVIDIA_API_KEY", "test-key");
    vi.stubEnv("OPENAI_CHAT_MODEL", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  // ─── chatJson ─────────────────────────────────────────────────────────────

  describe("chatJson", () => {
    it("defaults to openai/gpt-oss-20b when no model is provided", async () => {
      vi.stubGlobal("fetch", createMockFetch());

      const result = await chatJson({
        system: "You are a test assistant",
        user: "Hello",
      });

      expect(result.model).toBe("openai/gpt-oss-20b");
      expect(capturedRequestBody).not.toBeNull();
      expect((capturedRequestBody as Record<string, unknown>).model).toBe(
        "openai/gpt-oss-20b"
      );
    });

    it("passes temperature when provided", async () => {
      vi.stubGlobal("fetch", createMockFetch());

      await chatJson({
        system: "You are a test assistant",
        user: "Hello",
        model: "openai/gpt-oss-20b",
        temperature: 0.4,
      });

      expect(capturedRequestBody).not.toBeNull();
      expect(capturedRequestBody).toHaveProperty("temperature");
      expect((capturedRequestBody as Record<string, unknown>).temperature).toBe(0.4);
    });

    it("defaults temperature to 0.4 when not provided", async () => {
      vi.stubGlobal("fetch", createMockFetch());

      await chatJson({
        system: "You are a test assistant",
        user: "Hello",
        model: "openai/gpt-oss-20b",
      });

      expect(capturedRequestBody).not.toBeNull();
      expect(capturedRequestBody).toHaveProperty("temperature");
      expect((capturedRequestBody as Record<string, unknown>).temperature).toBe(0.4);
    });

    it("honours an explicit model override", async () => {
      vi.stubGlobal("fetch", createMockFetch());

      const result = await chatJson({
        system: "You are a test assistant",
        user: "Hello",
        model: "openai/gpt-oss-120b",
      });

      expect(result.model).toBe("openai/gpt-oss-120b");
      expect((capturedRequestBody as Record<string, unknown>).model).toBe(
        "openai/gpt-oss-120b"
      );
    });
  });

  // ─── chatJsonRaw ──────────────────────────────────────────────────────────

  describe("chatJsonRaw", () => {
    it("defaults to openai/gpt-oss-20b when no model is provided", async () => {
      vi.stubGlobal("fetch", createMockFetch());

      const result = await chatJsonRaw({
        system: "You are a calibrated competency assessor inside iSCARB.",
        user: "Score this response",
      });

      expect(result.model).toBe("openai/gpt-oss-20b");
      expect((capturedRequestBody as Record<string, unknown>).model).toBe(
        "openai/gpt-oss-20b"
      );
    });

    it("sets guarded: false on the result", async () => {
      vi.stubGlobal("fetch", createMockFetch());

      const result = await chatJsonRaw({
        system: "You are a calibrated competency assessor inside iSCARB.",
        user: "Score this response",
        model: "openai/gpt-oss-20b",
      });

      expect(result.guarded).toBe(false);
    });

    it("uses opts.system directly without prepending anti-hallucination preamble", async () => {
      vi.stubGlobal("fetch", createMockFetch());

      const customSystem = "You are a calibrated competency assessor inside iSCARB.";

      await chatJsonRaw({
        system: customSystem,
        user: "Score this response",
        model: "openai/gpt-oss-20b",
      });

      expect(capturedRequestBody).not.toBeNull();
      const messages = (capturedRequestBody as Record<string, unknown>).messages as Array<{
        role: string;
        content: string;
      }>;
      const systemMessage = messages.find((m) => m.role === "system");
      expect(systemMessage?.content).toBe(customSystem);
      expect(systemMessage?.content).not.toContain("ANTI-HALLUCINATION");
    });
  });
});
