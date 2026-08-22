/**
 * AI Gateway — Core Types
 * ===========================================================================
 * Centralized type definitions for the AI Gateway abstraction layer.
 * All AI calls flow through this gateway for caching, rate limiting,
 * concurrency control, and observability.
 */

// ─── Request / Response ─────────────────────────────────────────────────────

export interface AIRequest {
  /** Feature identifier for caching and metrics (e.g. "slide_generation", "exam_scoring") */
  feature: string;
  /** System prompt */
  system: string;
  /** User prompt */
  user: string;
  /** Temperature (0-2) */
  temperature?: number;
  /** Model override (defaults to provider default) */
  model?: string;
  /** Max tokens for the response */
  maxTokens?: number;
  /** Request timeout in ms (default: 60s) */
  timeoutMs?: number;
  /** Whether to bypass guardrails (anti-hallucination preamble) */
  guardrails?: boolean;
  /** User ID for per-user quotas (server-side only, never from client) */
  userId?: string;
  /** Whether this request can be cached (default: true for chatJson) */
  cacheable?: boolean;
  /** Cache TTL in seconds (default: 3600) */
  cacheTtlSeconds?: number;
  /** Priority: "interactive" | "background" | "critical" */
  priority?: "interactive" | "background" | "critical";
  /** Request ID for tracing (auto-generated if not provided) */
  requestId?: string;
  /** Whether to use streaming */
  stream?: boolean;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

export interface AIResponse {
  /** Raw text content from the model */
  content: string;
  /** Parsed JSON (null if not JSON) */
  json: unknown;
  /** Token usage */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  /** Latency breakdown */
  latencyMs: number;
  /** Which model actually served the request */
  model: string;
  /** Whether anti-hallucination guardrails were applied */
  guarded: boolean;
  /** Request ID for tracing */
  requestId: string;
  /** Cache status: "hit" | "miss" | "bypass" */
  cacheStatus: "hit" | "miss" | "bypass";
  /** Which provider served the request */
  provider: string;
  /** Whether this was a fallback response */
  isFallback: boolean;
  /** Queue wait time in ms */
  queueWaitMs: number;
  /** Number of retries attempted */
  retryCount: number;
}

export interface AIStreamChunk {
  /** Text delta */
  delta: string;
  /** Whether this is the final chunk */
  done: boolean;
  /** Accumulated text so far */
  accumulated: string;
}

// ─── Provider Interface ─────────────────────────────────────────────────────

export interface AIProviderHealth {
  healthy: boolean;
  latencyMs: number;
  lastChecked: number;
  error?: string;
}

export interface AIProviderConfig {
  /** Provider name (e.g. "nvidia", "openai") */
  name: string;
  /** API base URL */
  baseUrl: string;
  /** API key(s) - will be rotated */
  apiKeys: string[];
  /** Default model */
  defaultModel: string;
  /** Request timeout in ms */
  timeoutMs?: number;
  /** Max retries */
  maxRetries?: number;
  /** Max concurrent requests to this provider */
  maxConcurrency?: number;
  /** Priority (lower = higher priority) */
  priority?: number;
}

export interface AIProvider {
  /** Provider name */
  readonly name: string;
  /** Generate a completion */
  generate(request: AIRequest, model: string): Promise<AIResponse>;
  /** Stream a completion */
  stream(request: AIRequest, model: string): AsyncIterable<AIStreamChunk>;
  /** Health check */
  healthCheck(): Promise<AIProviderHealth>;
  /** Whether this provider is currently available */
  isAvailable(): boolean;
}

// ─── Cache Types ────────────────────────────────────────────────────────────

export interface CacheKey {
  feature: string;
  model: string;
  systemHash: string;
  userHash: string;
  temperature: number;
}

export interface CacheEntry {
  response: AIResponse;
  storedAt: number;
  ttlMs: number;
  hitCount: number;
}

// ─── Concurrency Types ──────────────────────────────────────────────────────

export interface ConcurrencySlot {
  requestId: string;
  feature: string;
  priority: "interactive" | "background" | "critical";
  acquiredAt: number;
}

export interface ConcurrencyState {
  active: number;
  queued: number;
  maxConcurrent: number;
  oldestWaitMs: number;
}

// ─── Metrics Types ──────────────────────────────────────────────────────────

export interface AIMetrics {
  /** Total requests */
  totalRequests: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Average latency */
  avgLatencyMs: number;
  /** P50 latency */
  p50LatencyMs: number;
  /** P95 latency */
  p95LatencyMs: number;
  /** P99 latency */
  p99LatencyMs: number;
  /** 429 error count */
  error429Count: number;
  /** Total error count */
  errorCount: number;
  /** Active concurrent requests */
  activeRequests: number;
  /** Queue depth */
  queueDepth: number;
  /** Fallback usage count */
  fallbackCount: number;
  /** Tokens used */
  totalTokens: number;
  /** Per-feature breakdown */
  byFeature: Record<string, {
    requests: number;
    avgLatencyMs: number;
    cacheHitRate: number;
  }>;
  /** Per-provider breakdown */
  byProvider: Record<string, {
    requests: number;
    errors: number;
    avgLatencyMs: number;
  }>;
}

export interface RequestMetricsEntry {
  requestId: string;
  userId?: string;
  feature: string;
  model: string;
  provider: string;
  cacheStatus: "hit" | "miss" | "bypass";
  queueWaitMs: number;
  latencyMs: number;
  retryCount: number;
  isFallback: boolean;
  promptTokens?: number;
  completionTokens?: number;
  status: "success" | "error" | "timeout" | "rate_limited";
  timestamp: number;
}
