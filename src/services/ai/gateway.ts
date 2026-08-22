/**
 * AI Gateway — Centralized Entry Point
 * ===========================================================================
 * All AI calls MUST flow through this gateway. No frontend component or
 * backend feature should call NVIDIA directly.
 *
 * Architecture:
 *   Request → Auth → Quota Check → Cache Lookup → Concurrency Slot
 *   → Provider Router → NVIDIA API → Response → Cache → Release Slot
 *
 * Features:
 *   - Response caching (Redis-backed)
 *   - Request coalescing (single-flight)
 *   - Distributed concurrency control
 *   - Per-user usage quotas
 *   - Provider routing with fallback
 *   - Production observability
 *   - Streaming support
 */
import "server-only";
import { createHash } from "crypto";
import { NvidiaProvider } from "./providers/nvidia-provider";
import { FallbackProvider } from "./providers/fallback-provider";
import { sanitizePII } from "@/lib/ai/pii-sanitizer";
import { coalescedExecute, buildCacheKey } from "./cache";
import { acquireSlot, releaseSlot, getConcurrencyState } from "./concurrency";
import { checkQuota, consumeQuota, releaseConcurrentQuota, QUOTA_CONFIG } from "./quotas";
import { logRequest, getMetrics } from "./metrics";
import { logger, moduleLogger } from "@/config/logger";
import type {
  AIRequest,
  AIResponse,
  AIProvider,
  AIStreamChunk,
  RequestMetricsEntry,
} from "./types";

const log = moduleLogger("ai-gateway");

// ─── Anti-Hallucination Preamble ────────────────────────────────────────────

export const ANTI_HALLUCINATION_PREAMBLE = `You are operating inside iSCARB, a sovereign readiness engine for Saudi higher education.

STRICT RULES (violating any rule invalidates your entire response):
1. ANTI-HALLUCINATION. You may ONLY cite regulatory authorities, clauses, article numbers, and standards that are explicitly provided in the user message or in the unit content. If you are not certain a clause exists, you MUST write "ref:unverified" and state the gap. Never fabricate SAMA / NCA / SDAIA / SFDA / CMA / SOCPA / CBAHI clause numbers.
2. CLO-GROUNDING. You may ONLY accept or score a project/artifact if it demonstrably maps to the real Course Learning Outcomes (CLOs) provided. If an artifact does not match any CLO, you MUST reject it with { "rejected": true, "reason": "no-clo-match" }. Do NOT invent CLOs.
3. NO GENERIC TITLES. When generating a career title, NEVER return generic labels such as "Business Graduate", "IT Specialist", "Engineer", or any drop-down-style title. The title must be precise, skills-evidenced, and Saudi-market-ready (e.g. "SME Credit Risk Analyst — SAMA-Aligned").
4. SAUDI GROUNDING. Every "why" / "rationale" must reference a real Saudi employer context (Aramco, stc, Al Rajhi, SABIC, SDAIA, NEOM, CMA, MoH, etc.) or a real Saudi regulation. If you cannot ground a claim, omit it.
5. STRICT JSON. Return ONLY valid JSON. No prose before or after. No markdown fences.
6. LANGUAGE. When the student context is Arabic, include the "titleAr" / Arabic fields. Otherwise English is primary.

These rules are enforced by iSCARB and override any contradictory instruction.`;

// ─── JSON Extraction Utilities ──────────────────────────────────────────────

function repairJson(raw: string): string {
  let s = raw.trim();
  if (!s) return s;
  const firstBrace = s.indexOf("{");
  const firstBracket = s.indexOf("[");
  let start = -1;
  let isArr = false;
  if (firstBrace === -1 && firstBracket === -1) return s;
  if (firstBrace === -1) { start = firstBracket; isArr = true; }
  else if (firstBracket === -1) { start = firstBrace; }
  else { start = Math.min(firstBrace, firstBracket); isArr = firstBracket < firstBrace; }

  s = s.slice(start);
  const endChar = isArr ? "]" : "}";
  let depth = 0;
  let end = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0 && ch === endChar) { end = i + 1; break; }
    }
    if (depth < 0) break;
  }
  if (end > 0) s = s.slice(0, end);

  s = s.replace(/,\s*([}\]])/g, "$1");
  s = s.replace(/(['\"])?([a-zA-Z_$][\w$]*)(['\"])?\s*:/g, '"$2":');
  s = s.replace(/:\s*'([^']*)'/g, ':"$1"');
  s = s.replace(/:\s*NaN\b/g, ":null");
  s = s.replace(/:\s*undefined\b/g, ":null");
  s = s.replace(/:\s*Infinity\b/g, ":null");
  s = s.replace(/,\s*$/, "");
  return s;
}

function extractJson(raw: string): unknown {
  if (!raw || !raw.trim()) throw new Error("empty response");

  // Remove <think>...</think> blocks from DeepSeek reasoning models
  let cleanRaw = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  if (!cleanRaw) {
    const inner = raw.match(/<think>([\s\S]*?)<\/think>/);
    if (inner && inner[1]) {
      cleanRaw = inner[1].trim();
    } else {
      cleanRaw = raw.replace(/<\?\/?think>/g, "").trim();
    }
  }
  if (!cleanRaw) throw new Error("empty response");

  try { return JSON.parse(cleanRaw); } catch {}
  const stripped = cleanRaw.replace(/```json\s*/gi, "").replace(/```/g, "");
  try { return JSON.parse(stripped); } catch {}
  const repaired = repairJson(stripped);
  try { return JSON.parse(repaired); } catch {}

  const start = stripped.indexOf("{");
  const startArr = stripped.indexOf("[");
  let s = -1;
  let isArr = false;
  if (start === -1) { s = startArr; isArr = true; }
  else if (startArr === -1) { s = start; }
  else { if (startArr < start) { s = startArr; isArr = true; } else { s = start; } }
  if (s === -1) throw new Error("no JSON found in response");
  const e = isArr ? stripped.lastIndexOf("]") : stripped.lastIndexOf("}");
  if (e === -1) throw new Error("incomplete JSON in response");
  const sliced = stripped.slice(s, e + 1);
  try { return JSON.parse(sliced); } catch {}
  const repairedSliced = repairJson(sliced);
  try { return JSON.parse(repairedSliced); } catch {}

  let cleaned = repairedSliced
    .replace(/[\u0000-\u001F]+/g, " ")
    .replace(/,\s*([}\]])/g, "$1");
  try { return JSON.parse(cleaned); } catch {
    const openBraces = (cleaned.match(/\{/g) || []).length - (cleaned.match(/\}/g) || []).length;
    const openBrackets = (cleaned.match(/\[/g) || []).length - (cleaned.match(/\]/g) || []).length;
    if (openBrackets > 0) cleaned += "]".repeat(openBrackets);
    if (openBraces > 0) cleaned += "}".repeat(openBraces);
    return JSON.parse(cleaned);
  }
}

// ─── Gateway Configuration ──────────────────────────────────────────────────

export interface GatewayConfig {
  /** Primary NVIDIA provider */
  primaryProvider: AIProvider;
  /** Fallback provider (optional) */
  fallbackProvider?: FallbackProvider;
  /** Default cache TTL in seconds */
  defaultCacheTtlSeconds: number;
  /** Whether to enable caching */
  cachingEnabled: boolean;
  /** Whether to enable request coalescing */
  coalescingEnabled: boolean;
}

// ─── Initialize Providers ───────────────────────────────────────────────────

function createNvidiaProvider(): NvidiaProvider {
  const apiKeys = [
    process.env.NVIDIA_API_KEY,
    process.env.NVIDIA_API_KEY_2,
    process.env.NVIDIA_API_KEY_3,
    process.env.NVIDIA_API_KEY_4,
    process.env.NVIDIA_API_KEY_5,
  ].filter((k): k is string => Boolean(k?.trim()));

  return new NvidiaProvider({
    name: "nvidia",
    baseUrl:
      process.env.NVIDIA_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://integrate.api.nvidia.com/v1",
    apiKeys,
    defaultModel: process.env.OPENAI_CHAT_MODEL || "meta/llama-3.1-8b-instruct",
    timeoutMs: 30_000,
    maxRetries: 3,
    maxConcurrency: parseInt(process.env.AI_CONCURRENCY_MAX || "20", 10),
  });
}

function createFallbackProvider(): FallbackProvider {
  return new FallbackProvider("fallback");
}

// ─── Singleton Gateway ──────────────────────────────────────────────────────

let gatewayInstance: AIGateway | null = null;

export function getGateway(): AIGateway {
  if (!gatewayInstance) {
    gatewayInstance = new AIGateway({
      primaryProvider: createNvidiaProvider(),
      fallbackProvider: createFallbackProvider(),
      defaultCacheTtlSeconds: parseInt(process.env.AI_CACHE_TTL || "3600", 10),
      cachingEnabled: process.env.AI_CACHE_DISABLED !== "true",
      coalescingEnabled: process.env.AI_COALESCING_DISABLED !== "true",
    });
  }
  return gatewayInstance;
}

// ─── Main Gateway Class ─────────────────────────────────────────────────────

export class AIGateway {
  private config: GatewayConfig;
  private defaultModel: string;

  constructor(config: GatewayConfig) {
    this.config = config;
    this.defaultModel =
      process.env.OPENAI_CHAT_MODEL || "meta/llama-3.1-8b-instruct";
  }

  /**
   * Main entry point: generate a completion through the gateway.
   * Handles caching, coalescing, concurrency, quotas, metrics, and fallback.
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const requestId = request.requestId ?? generateRequestId();
    const startTime = Date.now();
    const feature = request.feature || "unknown";

    // 1. Check per-user quota (if userId provided)
    if (request.userId) {
      const quota = await checkQuota(request.userId);
      if (!quota.allowed) {
        log.warn({ requestId, userId: request.userId, reason: quota.reason }, "quota exceeded");
        return {
          content: JSON.stringify({ error: quota.reason, fallback: true }),
          json: { error: quota.reason, fallback: true },
          latencyMs: 0,
          model: "quota_exceeded",
          guarded: false,
          requestId,
          cacheStatus: "bypass",
          provider: "none",
          isFallback: true,
          queueWaitMs: 0,
          retryCount: 0,
        };
      }
    }

    // 2. Sanitize PII from user-derived content before external AI call
    const sanitizedUser = sanitizePII(request.user);
    if (sanitizedUser.redactedCount > 0) {
      log.info(
        { requestId, feature, redacted: sanitizedUser.redactedCount, types: sanitizedUser.detectedTypes },
        "PII redacted from user content"
      );
    }

    // 3. Build system prompt with guardrails
    const system =
      request.guardrails === false
        ? request.system
        : `${ANTI_HALLUCINATION_PREAMBLE}\n\n--- ROLE ---\n${request.system}`;

    // 4. Build cache key (using sanitized user content)
    const cacheKey = buildCacheKey({
      ...request,
      user: sanitizedUser.sanitized,
      system,
    });

    // 5. Execute with coalescing + caching
    const execute = async (): Promise<AIResponse> => {
      let slotId: string | null = null;

      try {
        // Acquire concurrency slot
        slotId = await acquireSlot(
          requestId,
          feature,
          request.priority ?? "interactive",
          request.timeoutMs ?? 60_000
        );

        // Consume user quota
        if (request.userId) {
          await consumeQuota(request.userId);
        }

        // Route to provider (with sanitized user content)
        const model = request.model || this.defaultModel;
        let response: AIResponse;

        try {
          response = await this.config.primaryProvider.generate(
            { ...request, user: sanitizedUser.sanitized, system, requestId },
            model
          );
        } catch (primaryErr) {
          log.warn(
            { requestId, error: (primaryErr as Error).message },
            "primary provider failed, trying fallback"
          );

          if (this.config.fallbackProvider) {
            response = await this.config.fallbackProvider.generate(
              { ...request, user: sanitizedUser.sanitized, system, requestId },
              model
            );
          } else {
            throw primaryErr;
          }
        }

        // Parse JSON if the response looks like JSON
        if (response.content && !response.json) {
          try {
            response.json = extractJson(response.content);
          } catch {
            // Not JSON — that's fine, return raw content
          }
        }

        return {
          ...response,
          requestId,
          cacheStatus: "miss",
          guarded: request.guardrails !== false,
        };
      } finally {
        // Always release concurrency slot
        if (slotId) {
          await releaseSlot(slotId).catch(() => {});
        }
        // Release concurrent quota
        if (request.userId) {
          await releaseConcurrentQuota(request.userId).catch(() => {});
        }
      }
    };

    try {
      let response: AIResponse;

      if (this.config.cachingEnabled && request.cacheable !== false) {
        // Use coalesced execution (cache + single-flight)
        response = await coalescedExecute(
          cacheKey,
          execute,
          request.cacheTtlSeconds ?? this.config.defaultCacheTtlSeconds
        );
      } else {
        // Direct execution (no caching)
        response = await execute();
      }

      // Log metrics
      const metricsEntry: RequestMetricsEntry = {
        requestId,
        userId: request.userId,
        feature,
        model: response.model,
        provider: response.provider,
        cacheStatus: response.cacheStatus,
        queueWaitMs: response.queueWaitMs,
        latencyMs: response.latencyMs,
        retryCount: response.retryCount,
        isFallback: response.isFallback,
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
        status: "success",
        timestamp: Date.now(),
      };
      await logRequest(metricsEntry).catch(() => {});

      return response;
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : "Unknown error";

      // Log error metrics
      const metricsEntry: RequestMetricsEntry = {
        requestId,
        userId: request.userId,
        feature,
        model: request.model || this.defaultModel,
        provider: "nvidia",
        cacheStatus: "bypass",
        queueWaitMs: 0,
        latencyMs,
        retryCount: 0,
        isFallback: false,
        status: errorMsg.includes("429") ? "rate_limited" : "error",
        timestamp: Date.now(),
      };
      await logRequest(metricsEntry).catch(() => {});

      // Return graceful fallback
      log.error({ requestId, feature, error: errorMsg }, "AI gateway error");
      return {
        content: JSON.stringify({
          error: `AI service temporarily unavailable: ${errorMsg}`,
          fallback: true,
        }),
        json: { error: "AI service temporarily unavailable", fallback: true },
        latencyMs,
        model: "fallback",
        guarded: false,
        requestId,
        cacheStatus: "bypass",
        provider: "fallback",
        isFallback: true,
        queueWaitMs: 0,
        retryCount: 0,
      };
    }
  }

  /**
   * Stream a completion through the gateway.
   * For interactive responses (tutor chat, real-time generation).
   */
  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const requestId = request.requestId ?? generateRequestId();

    // Check quota
    if (request.userId) {
      const quota = await checkQuota(request.userId);
      if (!quota.allowed) {
        yield {
          delta: `Rate limit: ${quota.reason}`,
          done: true,
          accumulated: `Rate limit: ${quota.reason}`,
        };
        return;
      }
    }

    // Sanitize PII from user content
    const sanitizedUser = sanitizePII(request.user);
    if (sanitizedUser.redactedCount > 0) {
      log.info(
        { requestId, redacted: sanitizedUser.redactedCount, types: sanitizedUser.detectedTypes },
        "PII redacted from stream user content"
      );
    }

    const system =
      request.guardrails === false
        ? request.system
        : `${ANTI_HALLUCINATION_PREAMBLE}\n\n--- ROLE ---\n${request.system}`;

    const model = request.model || this.defaultModel;

    try {
      yield* this.config.primaryProvider.stream(
        { ...request, user: sanitizedUser.sanitized, system, requestId },
        model
      );
    } catch (err) {
      if (this.config.fallbackProvider) {
        yield* this.config.fallbackProvider.stream(
          { ...request, user: sanitizedUser.sanitized, system, requestId },
          model
        );
      } else {
        yield {
          delta: "AI service temporarily unavailable. Please try again.",
          done: true,
          accumulated: "AI service temporarily unavailable. Please try again.",
        };
      }
    }
  }

  /**
   * Health check across all providers.
   */
  async healthCheck(): Promise<Record<string, { healthy: boolean; latencyMs: number }>> {
    const results: Record<string, { healthy: boolean; latencyMs: number }> = {};

    const primary = await this.config.primaryProvider.healthCheck();
    results[this.config.primaryProvider.name] = primary;

    if (this.config.fallbackProvider) {
      const fallback = await this.config.fallbackProvider.healthCheck();
      results[this.config.fallbackProvider.name] = fallback;
    }

    return results;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Direct provider call — bypasses Redis-backed quota, concurrency, and cache.
 * Use for high-throughput batch callers that manage their own concurrency.
 * Still applies PII sanitization and anti-hallucination preamble.
 */
async function directGenerate(opts: {
  system: string;
  user: string;
  temperature?: number;
  model?: string;
  guardrails?: boolean;
  feature?: string;
}): Promise<{
  content: string;
  json: unknown;
  usage?: { promptTokens?: number; completionTokens?: number };
  latencyMs: number;
  model: string;
  guarded: boolean;
}> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const model = opts.model || DEFAULT_AI_MODEL;

  // Apply PII sanitization
  const sanitizedUser = sanitizePII(opts.user);
  if (sanitizedUser.redactedCount > 0) {
    log.info(
      { requestId, feature: opts.feature, redacted: sanitizedUser.redactedCount },
      "PII redacted (direct)"
    );
  }

  // Build system with guardrails
  const system =
    opts.guardrails === false
      ? opts.system
      : `${ANTI_HALLUCINATION_PREAMBLE}\n\n--- ROLE ---\n${opts.system}`;

  // Call provider directly
  const gateway = getGateway();
  const response = await (gateway as any).config.primaryProvider.generate(
    {
      feature: opts.feature,
      system,
      user: sanitizedUser.sanitized,
      temperature: opts.temperature,
      requestId,
      guardrails: false, // Already applied above
    },
    model
  );

  // Parse JSON if applicable
  let json: unknown = response.json;
  if (response.content && !json) {
    try {
      json = extractJson(response.content);
    } catch {
      // Not JSON
    }
  }

  return {
    content: response.content,
    json,
    usage: response.usage,
    latencyMs: Date.now() - startTime,
    model: response.model,
    guarded: opts.guardrails !== false,
  };
}

// ─── Convenience Functions (Backward Compatible) ────────────────────────────

/**
 * Drop-in replacement for the old chatJson function.
 * Maintains the same signature for backward compatibility.
 *
 * Set bypassGateway: true for high-throughput batch callers (e.g. exam
 * generation) that handle their own concurrency and don't need Redis-backed
 * caching/quota overhead. This skips quota checks, concurrency slots, and
 * cache lookups — reducing per-call latency by ~10-15 Redis round trips.
 */
export async function chatJson(opts: {
  system: string;
  user: string;
  temperature?: number;
  model?: string;
  guardrails?: boolean;
  feature?: string;
  userId?: string;
  cacheable?: boolean;
  /** Skip Redis-backed gateway overhead (quota, concurrency, cache). */
  bypassGateway?: boolean;
}): Promise<{
  content: string;
  json: unknown;
  usage?: { promptTokens?: number; completionTokens?: number };
  latencyMs: number;
  model: string;
  guarded: boolean;
}> {
  if (opts.bypassGateway) {
    return directGenerate({
      system: opts.system,
      user: opts.user,
      temperature: opts.temperature,
      model: opts.model,
      guardrails: opts.guardrails,
      feature: opts.feature ?? "chat_json",
    });
  }
  const gateway = getGateway();
  const response = await gateway.generate({
    feature: opts.feature ?? "chat_json",
    system: opts.system,
    user: opts.user,
    temperature: opts.temperature,
    model: opts.model,
    guardrails: opts.guardrails,
    userId: opts.userId,
    cacheable: opts.cacheable,
  });

  return {
    content: response.content,
    json: response.json,
    usage: response.usage,
    latencyMs: response.latencyMs,
    model: response.model,
    guarded: response.guarded,
  };
}

/**
 * Drop-in replacement for the old chatText function.
 */
export async function chatText(opts: {
  system: string;
  user: string;
  temperature?: number;
  model?: string;
  guardrails?: boolean;
  feature?: string;
  userId?: string;
}): Promise<{
  content: string;
  json: unknown;
  usage?: { promptTokens?: number; completionTokens?: number };
  latencyMs: number;
  model: string;
  guarded: boolean;
}> {
  const gateway = getGateway();
  const response = await gateway.generate({
    feature: opts.feature ?? "chat_text",
    system: opts.system,
    user: opts.user,
    temperature: opts.temperature,
    model: opts.model,
    guardrails: opts.guardrails,
    userId: opts.userId,
    cacheable: false, // Text responses are usually user-specific
  });

  return {
    content: response.content,
    json: response.json,
    usage: response.usage,
    latencyMs: response.latencyMs,
    model: response.model,
    guarded: response.guarded,
  };
}

/**
 * Drop-in replacement for the old chatJsonRaw function.
 */
export async function chatJsonRaw(opts: {
  system: string;
  user: string;
  temperature?: number;
  model?: string;
  feature?: string;
  userId?: string;
  /** Skip Redis-backed gateway overhead. */
  bypassGateway?: boolean;
}): Promise<{
  content: string;
  json: unknown;
  usage?: { promptTokens?: number; completionTokens?: number };
  latencyMs: number;
  model: string;
  guarded: boolean;
}> {
  if (opts.bypassGateway) {
    return directGenerate({
      system: opts.system,
      user: opts.user,
      temperature: opts.temperature,
      model: opts.model,
      guardrails: false,
      feature: opts.feature ?? "chat_json_raw",
    });
  }
  const gateway = getGateway();
  const response = await gateway.generate({
    feature: opts.feature ?? "chat_json_raw",
    system: opts.system,
    user: opts.user,
    temperature: opts.temperature,
    model: opts.model,
    guardrails: false,
    userId: opts.userId,
    cacheable: false,
  });

  return {
    content: response.content,
    json: response.json,
    usage: response.usage,
    latencyMs: response.latencyMs,
    model: response.model,
    guarded: false,
  };
}

/**
 * Drop-in replacement for the old evaluatePromptQuality function.
 * Preserves the exact same return type.
 */
export async function evaluatePromptQuality(input: {
  prompt: string;
  clos: { id: string; statement: string; bloom: string }[];
  artifact: string;
  context?: string;
}): Promise<{
  score: number;
  confidence: number;
  dimensions: { name: string; score: number; note: string }[];
  suggestions: string[];
  antiPatterns: string[];
  latencyMs: number;
  model: string;
  source: "ai" | "fallback";
}> {
  // Delegate to the existing implementation in ai-engine.ts
  // This is a shim for backward compatibility
  const { evaluatePromptQuality: impl } = await import("@/lib/ai-engine");
  return impl(input);
}

/**
 * Drop-in replacement for the old validateAgainstCLOs function.
 */
export async function validateAgainstCLOs(input: {
  artifact: string;
  clos: { id: string; statement: string }[];
}): Promise<{
  accepted: boolean;
  rejectedReason: string | null;
  matchedClos: string[];
  confidence: number;
  source: "ai" | "fallback";
}> {
  const { validateAgainstCLOs: impl } = await import("@/lib/ai-engine");
  return impl(input);
}

/**
 * Drop-in replacement for the old withTimeout function.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = "op"
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

/**
 * Drop-in replacement for the old clamp function.
 */
export function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/**
 * Drop-in replacement for the old generateImage function.
 */
export async function generateImage(opts: {
  prompt: string;
  model?: string;
}): Promise<{ url?: string; b64_json?: string; error?: string; fallback: boolean }> {
  const { generateImage: impl } = await import("@/lib/ai-engine");
  return impl(opts);
}

/**
 * Get the default AI model.
 */
export const DEFAULT_AI_MODEL =
  process.env.OPENAI_CHAT_MODEL || "meta/llama-3.1-8b-instruct";

/**
 * Clear the AI queue (for testing/manual intervention).
 */
export function clearAIQueue(): void {
  // No-op — queue is managed by Redis-based concurrency controller
  log.info("AI queue clear requested (no-op with distributed concurrency)");
}
