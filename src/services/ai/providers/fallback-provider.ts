/**
 * Fallback AI Provider
 * ===========================================================================
 * Wraps another provider as a fallback when the primary is unavailable.
 * Can also return cached/stale results or simple heuristic responses.
 */
import type {
  AIProvider,
  AIProviderHealth,
  AIRequest,
  AIResponse,
  AIStreamChunk,
} from "../types";

export class FallbackProvider implements AIProvider {
  readonly name: string;
  private inner: AIProvider | null;
  private enabled: boolean;

  constructor(name: string, inner?: AIProvider) {
    this.name = name;
    this.inner = inner ?? null;
    this.enabled = true;
  }

  async generate(request: AIRequest, model: string): Promise<AIResponse> {
    if (this.inner && this.inner.isAvailable() && this.enabled) {
      try {
        const response = await this.inner.generate(request, model);
        return { ...response, isFallback: true, provider: this.name };
      } catch {
        // Fall through to heuristic
      }
    }

    // Heuristic fallback for JSON requests
    const latencyMs = 0;
    const fallbackContent = JSON.stringify({
      error: "AI service temporarily unavailable",
      fallback: true,
    });

    return {
      content: fallbackContent,
      json: { error: "AI service temporarily unavailable", fallback: true },
      latencyMs,
      model: "fallback",
      guarded: false,
      requestId: request.requestId ?? "",
      cacheStatus: "bypass",
      provider: this.name,
      isFallback: true,
      queueWaitMs: 0,
      retryCount: 0,
    };
  }

  async *stream(
    request: AIRequest,
    model: string
  ): AsyncIterable<AIStreamChunk> {
    if (this.inner && this.inner.isAvailable() && this.enabled) {
      yield* this.inner.stream(request, model);
      return;
    }

    // Yield a single fallback chunk
    yield {
      delta: "AI service temporarily unavailable. Please try again later.",
      done: true,
      accumulated: "AI service temporarily unavailable. Please try again later.",
    };
  }

  async healthCheck(): Promise<AIProviderHealth> {
    if (this.inner) {
      return this.inner.healthCheck();
    }
    return {
      healthy: true, // Fallback is always "healthy" (it degrades gracefully)
      latencyMs: 0,
      lastChecked: Date.now(),
    };
  }

  isAvailable(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
