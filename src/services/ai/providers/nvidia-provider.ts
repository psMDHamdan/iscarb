/**
 * NVIDIA NIM API Provider
 * ===========================================================================
 * Implements the AIProvider interface for NVIDIA's hosted LLM API.
 * Features: multi-key round-robin, exponential backoff, 429 handling,
 * AbortController support, streaming via SSE.
 */
import type {
  AIProvider,
  AIProviderConfig,
  AIProviderHealth,
  AIRequest,
  AIResponse,
  AIStreamChunk,
} from "../types";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [500, 1000, 2000, 4000];

export const DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

export class NvidiaProvider implements AIProvider {
  readonly name = "nvidia";
  private config: AIProviderConfig;
  private keyIndex = 0;
  private healthy = true;
  private lastHealthCheck = 0;
  private healthCheckIntervalMs = 60_000;
  private baseUrl: string;

  // Model alias mapping: legacy OpenAI-style slugs → NVIDIA NIM models
  private static MODEL_MAP: Record<string, string> = {
    "gpt-4o": "nvidia/nemotron-3-nano-30b-a3b",
    "gpt-4": "nvidia/nemotron-3-nano-30b-a3b",
    "gpt-3.5-turbo": "nvidia/nemotron-3-nano-30b-a3b",
    "gpt-4o-mini": "nvidia/nemotron-3-nano-30b-a3b",
    "deepseek-r1": "deepseek-ai/deepseek-r1",
  };

  constructor(config: AIProviderConfig) {
    this.config = {
      timeoutMs: DEFAULT_TIMEOUT_MS,
      maxRetries: DEFAULT_MAX_RETRIES,
      maxConcurrency: 40,
      priority: 1,
      ...config,
    };
    // Configurable base URL: NVIDIA_BASE_URL → OPENAI_BASE_URL → default hosted
    this.baseUrl =
      config.baseUrl ||
      process.env.NVIDIA_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      DEFAULT_NVIDIA_BASE_URL;
  }

  /** Resolve model alias to actual NVIDIA model ID */
  private resolveModel(model: string): string {
    const mapped = NvidiaProvider.MODEL_MAP[model];
    if (mapped) return mapped;
    if (!model.includes("/")) return this.config.defaultModel;
    return model;
  }

  /** Get next API key via round-robin */
  private getNextKey(): string {
    const keys = this.config.apiKeys.filter((k) => k?.trim());
    if (keys.length === 0) throw new Error("No NVIDIA API keys configured");
    const key = keys[this.keyIndex % keys.length];
    this.keyIndex = (this.keyIndex + 1) % keys.length;
    return key;
  }

  /** Calculate retry delay with jitter, respecting Retry-After header */
  private getRetryDelay(attempt: number, retryAfter?: number): number {
    if (retryAfter && retryAfter > 0) {
      return Math.min(retryAfter * 1000, 30_000);
    }
    const base = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
    const jitter = 1 + (Math.random() - 0.5) * 0.5;
    return Math.round(base * jitter);
  }

  async generate(request: AIRequest, model: string): Promise<AIResponse> {
    const resolvedModel = this.resolveModel(model);
    const startTime = Date.now();
    const keys = this.config.apiKeys.filter((k) => k?.trim());

    let lastError: Error | null = null;

    for (let keyOffset = 0; keyOffset < keys.length; keyOffset++) {
      const key = this.getNextKey();

      for (let attempt = 0; attempt <= (this.config.maxRetries ?? DEFAULT_MAX_RETRIES); attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(
          () => controller.abort(),
          request.timeoutMs ?? this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS
        );

        try {
          const response = await fetch(
            `${this.baseUrl}/chat/completions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${key}`,
              },
              body: JSON.stringify({
                model: resolvedModel,
                messages: [
                  { role: "system", content: request.system },
                  { role: "user", content: request.user },
                ],
                temperature: request.temperature ?? 0.4,
                max_tokens: request.maxTokens ?? 4096,
              }),
              signal: controller.signal,
            }
          );

          clearTimeout(timer);

          if (response.ok) {
            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content ?? "";
            const latencyMs = Date.now() - startTime;

            return {
              content,
              json: null, // Caller handles JSON extraction
              usage: data?.usage
                ? {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens,
                  }
                : undefined,
              latencyMs,
              model: resolvedModel,
              guarded: false,
              requestId: request.requestId ?? "",
              cacheStatus: "miss",
              provider: this.name,
              isFallback: false,
              queueWaitMs: 0,
              retryCount: attempt,
            };
          }

          const status = response.status;
          if (status === 429 || status >= 500) {
            lastError = new Error(`HTTP ${status}`);
            if (attempt < (this.config.maxRetries ?? DEFAULT_MAX_RETRIES)) {
              const retryAfter =
                status === 429
                  ? parseInt(response.headers.get("Retry-After") || "0", 10)
                  : 0;
              const delay = this.getRetryDelay(attempt, retryAfter);
              await new Promise((r) => setTimeout(r, delay));
            }
          } else {
            lastError = new Error(`HTTP ${status}`);
            break; // Non-retryable error, try next key
          }
        } catch (err: unknown) {
          clearTimeout(timer);
          const isAbort =
            err instanceof DOMException && err.name === "AbortError";
          if (isAbort) {
            lastError = new Error(
              `Request timed out after ${request.timeoutMs ?? this.config.timeoutMs}ms`
            );
            break; // Timeout, try next key
          }
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < (this.config.maxRetries ?? DEFAULT_MAX_RETRIES)) {
            const delay = this.getRetryDelay(attempt);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
    }

    throw lastError ?? new Error("All NVIDIA keys exhausted");
  }

  async *stream(
    request: AIRequest,
    model: string
  ): AsyncIterable<AIStreamChunk> {
    const resolvedModel = this.resolveModel(model);
    const key = this.getNextKey();
    const startTime = Date.now();
    let accumulated = "";

    const response = await fetch(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: resolvedModel,
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
          temperature: request.temperature ?? 0.4,
          max_tokens: request.maxTokens ?? 4096,
          stream: true,
        }),
        signal: request.signal,
      }
    );

    if (!response.ok) {
      throw new Error(`NVIDIA stream failed: HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            yield { delta: "", done: true, accumulated };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              accumulated += delta;
              yield { delta, done: false, accumulated };
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { delta: "", done: true, accumulated };
  }

  async healthCheck(): Promise<AIProviderHealth> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckIntervalMs) {
      return {
        healthy: this.healthy,
        latencyMs: 0,
        lastChecked: this.lastHealthCheck,
      };
    }

    this.lastHealthCheck = now;
    const startTime = Date.now();

    try {
      const key = this.config.apiKeys[0];
      if (!key) {
        this.healthy = false;
        return {
          healthy: false,
          latencyMs: Date.now() - startTime,
          lastChecked: now,
          error: "No API keys configured",
        };
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);

      const response = await fetch(
        `${this.baseUrl}/models`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${key}` },
          signal: controller.signal,
        }
      );

      clearTimeout(timer);
      this.healthy = response.ok;

      return {
        healthy: this.healthy,
        latencyMs: Date.now() - startTime,
        lastChecked: now,
        error: this.healthy ? undefined : `HTTP ${response.status}`,
      };
    } catch (err) {
      this.healthy = false;
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        lastChecked: now,
        error: err instanceof Error ? err.message : "Health check failed",
      };
    }
  }

  isAvailable(): boolean {
    return this.healthy && this.config.apiKeys.filter((k) => k?.trim()).length > 0;
  }
}
