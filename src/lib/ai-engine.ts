import "server-only";

// ─── Default model (DeepSeek served through the NVIDIA API) ───────────────
// iSCARB standardises on DeepSeek via the NVIDIA catalog. Override per-call
// with the `model` option, or globally with OPENAI_CHAT_MODEL.
export const DEFAULT_AI_MODEL =
  process.env.OPENAI_CHAT_MODEL || "meta/llama-3.1-8b-instruct";

// ─── NVIDIA Multi-Key Round-Robin Load Balancer ─────────────────────────
let globalNvidiaKeyCounter = 0;
function getNextNvidiaKeyIndex(totalKeys: number): number {
  if (totalKeys <= 0) return 0;
  const index = globalNvidiaKeyCounter % totalKeys;
  globalNvidiaKeyCounter = (globalNvidiaKeyCounter + 1) % 1_000_000;
  return index;
}


// ─── AI API Concurrency Limiter ─────────────────────────────────────────
// Prevents the "thundering herd" problem: when N parallel requests all fire
// simultaneously, they all get 429'd. Cap in-flight NVIDIA calls.
// Sweet spot = number of NVIDIA keys (5). Live bench at concurrency 4 already
// saw 429s/failover; 8–10 historically caused 100–185s spikes. Override via env.
const AI_CONCURRENCY_MAX = Math.min(
  25,
  Math.max(
    1,
    Number.parseInt(process.env.AI_CONCURRENCY_MAX || "20", 10) || 20,
  ),
);
let activeAICalls = 0;
const pendingQueue: Array<{
  ticket: symbol;
  resolve: () => void;
  reject: (err: Error) => void;
}> = [];

async function acquireAISlot(timeoutMs = 60_000): Promise<void> {
  if (activeAICalls < AI_CONCURRENCY_MAX) {
    activeAICalls++;
    return;
  }
  const ticket = Symbol("ai-slot");
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = pendingQueue.findIndex((e) => e.ticket === ticket);
      if (idx !== -1) {
        pendingQueue.splice(idx, 1);
        reject(
          new Error(`AI concurrency slot wait timed out after ${timeoutMs}ms`)
        );
      }
    }, timeoutMs);
    pendingQueue.push({
      ticket,
      resolve: () => {
        clearTimeout(timer);
        resolve();
      },
      reject: (err: Error) => {
        clearTimeout(timer);
        reject(err);
      },
    });
  });
}

export function clearAIQueue() {
  while (pendingQueue.length > 0) {
    const next = pendingQueue.shift();
    if (next) next.reject(new Error("Queue cleared manually"));
  }
}

function releaseAISlot(): void {
  const next = pendingQueue.shift();
  if (next) {
    next.resolve();
  } else {
    activeAICalls--;
  }
}

const RETRY_BASE_DELAYS_MS = [500, 1000, 2000];
const MAX_RETRIES = RETRY_BASE_DELAYS_MS.length;
// Serverless-friendly: a single model call must never burn the whole function
// budget on a stall. 30s bounds the worst case while still allowing long
// generation calls to complete on capable models.
const FETCH_TIMEOUT_MS = 12_000;

function getRetryDelay(attempt: number, retryAfter?: number): number {
  if (retryAfter && retryAfter > 0) {
    // Respect Retry-After header from the API, capped at 30s
    return Math.min(retryAfter * 1000, 30_000);
  }
  const base = RETRY_BASE_DELAYS_MS[Math.min(attempt, RETRY_BASE_DELAYS_MS.length - 1)];
  // Jitter: ±25% to spread retries across instances/callers
  const jitter = 1 + (Math.random() - 0.5) * 0.5;
  return Math.round(base * jitter);
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES,
): Promise<Response> {
  // Acquire concurrency slot — if the API is already saturated, wait
  await acquireAISlot();
  try {
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const fetchTimer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          if (response.ok) return response;

          const status = response.status;
          if (status === 429 || status >= 500) {
            lastErr = new Error(`HTTP error! status: ${status}`);
            if (attempt < retries) {
              const retryAfter = status === 429
                ? parseInt(response.headers.get("Retry-After") || "0", 10)
                : 0;
              const delay = getRetryDelay(attempt, retryAfter);
              console.warn(
                `fetchWithRetry: ${status} on attempt ${attempt + 1}, retrying in ${delay}ms`
              );
              await new Promise((r) => setTimeout(r, delay));
            }
          } else {
            throw new Error(`HTTP error! status: ${status}`);
          }
        } finally {
          clearTimeout(fetchTimer);
        }
      } catch (err: unknown) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        if (isAbort) {
          throw new Error(`fetchWithRetry: request timed out after ${FETCH_TIMEOUT_MS}ms`);
        }
        if (err instanceof TypeError && attempt < retries) {
          lastErr = err;
          const delay = getRetryDelay(attempt);
          console.warn(
            `fetchWithRetry: network error on attempt ${attempt + 1}, retrying in ${delay}ms`
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastErr || new Error("fetchWithRetry: exhausted retries");
  } finally {
    releaseAISlot();
  }
}

export async function getClient() {
  const nvidiaKeys = [
    process.env.NVIDIA_API_KEY,
    process.env.NVIDIA_API_KEY_2,
    process.env.NVIDIA_API_KEY_3,
    process.env.NVIDIA_API_KEY_4,
    process.env.NVIDIA_API_KEY_5,
  ].filter((k): k is string => Boolean(k && k.trim() !== ''));

  if (nvidiaKeys.length === 0) {
    throw new Error("No NVIDIA API keys configured.");
  }

  return {
    chat: {
      completions: {
        create: async (body: any) => {
          const NVIDIA_MODEL_MAP: Record<string, string> = {
            // Legacy OpenAI-style slugs → working NVIDIA NIM models. The iSCARB
            // default (openai/gpt-oss-20b, via DEFAULT_AI_MODEL) is NOT remapped
            // — it is served to NVIDIA as-is (the 404 fix in the handover).
            // NOTE: meta/llama-3.3-70b-instruct hangs (never responds) on this
            // endpoint — gpt-4o-mini therefore resolves to the proven-working
            // default instead of the old generic 70B fallback.
            "gpt-4o": "meta/llama-3.1-8b-instruct",
            "gpt-4": "meta/llama-3.1-8b-instruct",
            "gpt-3.5-turbo": "meta/llama-3.1-8b-instruct",
            "gpt-4o-mini": "openai/gpt-oss-20b",
            "deepseek-r1": "deepseek-ai/deepseek-r1",
          };

          let resolvedModel = body.model || DEFAULT_AI_MODEL;
          if (NVIDIA_MODEL_MAP[resolvedModel]) {
            resolvedModel = NVIDIA_MODEL_MAP[resolvedModel];
          } else if (!resolvedModel.includes("/")) {
            resolvedModel = DEFAULT_AI_MODEL;
          }
          body.model = resolvedModel;

          const startIndex = getNextNvidiaKeyIndex(nvidiaKeys.length);
          let lastError: any = new Error("No NVIDIA keys succeeded");

          for (let offset = 0; offset < nvidiaKeys.length; offset++) {
            const keyIdx = (startIndex + offset) % nvidiaKeys.length;
            const key = nvidiaKeys[keyIdx];

            try {
              const response = await fetchWithRetry("https://integrate.api.nvidia.com/v1/chat/completions", {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${key}`,
                },
                body: JSON.stringify(body),
              }, 1);

              return await response.json();
            } catch (err: any) {
              console.warn(`NVIDIA Key #${keyIdx + 1} failed: ${err.message}. Failing over...`);
              lastError = err;
            }
          }

          throw lastError;
        }
      }
    }
  };
}

export const ANTI_HALLUCINATION_PREAMBLE = `You are operating inside iSCARB, a sovereign readiness engine for Saudi higher education.

STRICT RULES (violating any rule invalidates your entire response):
1. ANTI-HALLUCINATION. You may ONLY cite regulatory authorities, clauses, article numbers, and standards that are explicitly provided in the user message or in the unit content. If you are not certain a clause exists, you MUST write "ref:unverified" and state the gap. Never fabricate SAMA / NCA / SDAIA / SFDA / CMA / SOCPA / CBAHI clause numbers.
2. CLO-GROUNDING. You may ONLY accept or score a project/artifact if it demonstrably maps to the real Course Learning Outcomes (CLOs) provided. If an artifact does not match any CLO, you MUST reject it with { "rejected": true, "reason": "no-clo-match" }. Do NOT invent CLOs.
3. NO GENERIC TITLES. When generating a career title, NEVER return generic labels such as "Business Graduate", "IT Specialist", "Engineer", or any drop-down-style title. The title must be precise, skills-evidenced, and Saudi-market-ready (e.g. "SME Credit Risk Analyst — SAMA-Aligned").
4. SAUDI GROUNDING. Every "why" / "rationale" must reference a real Saudi employer context (Aramco, stc, Al Rajhi, SABIC, SDAIA, NEOM, CMA, MoH, etc.) or a real Saudi regulation. If you cannot ground a claim, omit it.
5. STRICT JSON. Return ONLY valid JSON. No prose before or after. No markdown fences.
6. LANGUAGE. When the student context is Arabic, include the "titleAr" / Arabic fields. Otherwise English is primary.

These rules are enforced by iSCARB and override any contradictory instruction.`;

function withGuardrails(systemPrompt: string): string {
  return `${ANTI_HALLUCINATION_PREAMBLE}\n\n--- ROLE ---\n${systemPrompt}`;
}

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
  s = s.replace(/(['"])?([a-zA-Z_$][\w$]*)(['"])?\s*:/g, '"$2":');
  s = s.replace(/:\s*'([^']*)'/g, ':"$1"');
  s = s.replace(/:\s*NaN\b/g, ':null');
  s = s.replace(/:\s*undefined\b/g, ':null');
  s = s.replace(/:\s*Infinity\b/g, ':null');
  s = s.replace(/,\s*$/, "");
  return s;
}

function extractJson(raw: string): unknown {
  if (!raw || !raw.trim()) throw new Error("empty response");

  // Remove <think>...</think> blocks from DeepSeek reasoning models
  let cleanRaw = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  if (!cleanRaw) {
    // If entire response was inside <think> tags, try extracting from inside <think>
    const inner = raw.match(/<think>([\s\S]*?)<\/think>/);
    if (inner && inner[1]) {
      cleanRaw = inner[1].trim();
    } else {
      cleanRaw = raw.replace(/<\/?think>/g, "").trim();
    }
  }
  if (!cleanRaw) throw new Error("empty response");

  try {
    return JSON.parse(cleanRaw);
  } catch {
  }
  const stripped = cleanRaw.replace(/```json\s*/gi, "").replace(/```/g, "");
  try {
    return JSON.parse(stripped);
  } catch {
  }
  const repaired = repairJson(stripped);
  try {
    return JSON.parse(repaired);
  } catch {
  }
  const start = stripped.indexOf("{");
  const startArr = stripped.indexOf("[");
  let s = -1;
  let isArr = false;
  if (start === -1) {
    s = startArr;
    isArr = true;
  } else if (startArr === -1) {
    s = start;
  } else {
    if (startArr < start) {
      s = startArr;
      isArr = true;
    } else {
      s = start;
    }
  }
  if (s === -1) throw new Error("no JSON found in response");
  const e = isArr ? stripped.lastIndexOf("]") : stripped.lastIndexOf("}");
  if (e === -1) throw new Error("incomplete JSON in response");
  const sliced = stripped.slice(s, e + 1);
  try {
    return JSON.parse(sliced);
  } catch {
  }
  const repairedSliced = repairJson(sliced);
  try {
    return JSON.parse(repairedSliced);
  } catch (err) {
    // Advanced recovery: fix unescaped control chars / missing closing brackets
    let cleaned = repairedSliced
      .replace(/[\u0000-\u001F]+/g, " ")
      .replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(cleaned);
    } catch {
      // Append missing closing braces/brackets if truncated
      const openBraces = (cleaned.match(/\{/g) || []).length - (cleaned.match(/\}/g) || []).length;
      const openBrackets = (cleaned.match(/\[/g) || []).length - (cleaned.match(/\]/g) || []).length;
      if (openBrackets > 0) cleaned += "]".repeat(openBrackets);
      if (openBraces > 0) cleaned += "}".repeat(openBraces);
      return JSON.parse(cleaned);
    }
  }
}

export interface ChatResult {
  content: string;
  json: unknown;
  usage?: { promptTokens?: number; completionTokens?: number };
  latencyMs: number;
  model: string;
  guarded: boolean;
}

export async function chatJson(opts: {
  system: string;
  user: string;
  temperature?: number;
  model?: string;
  guardrails?: boolean;
}): Promise<ChatResult> {
  const t0 = Date.now();
  const client = await getClient();
  const model = opts.model || DEFAULT_AI_MODEL;
  const system = opts.guardrails === false ? opts.system : withGuardrails(opts.system);
  try {
    const res = await client.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: opts.user },
      ],
      temperature: opts.temperature ?? 0.4,
      model,
      max_tokens: 4096,
    } as never);
    const content = res?.choices?.[0]?.message?.content ?? "";
    const json = extractJson(content);
    return {
      content,
      json,
      usage: res?.usage as never,
      latencyMs: Date.now() - t0,
      model,
      guarded: true,
    };
  } catch (err) {
    console.error("AI Engine chatJson failed:", err);
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return {
      content: `{"error": "AI service temporarily unavailable: ${errorMsg}", "fallback": true}`,
      json: { error: "AI service temporarily unavailable", fallback: true },
      latencyMs: Date.now() - t0,
      model: "fallback",
      guarded: true,
    };
  }
}

export async function chatText(opts: {
  system: string;
  user: string;
  temperature?: number;
  model?: string;
}): Promise<ChatResult> {
  const t0 = Date.now();
  const client = await getClient();
  const model = opts.model || DEFAULT_AI_MODEL;
  const system = withGuardrails(opts.system);
  try {
    const res = await client.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: opts.user },
      ],
      temperature: opts.temperature ?? 0.4,
      model,
    } as never);
    const content = res?.choices?.[0]?.message?.content ?? "";
    return { content, json: null, usage: res?.usage as never, latencyMs: Date.now() - t0, model, guarded: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return {
      content: `AI service temporarily unavailable: ${errorMsg}. Please try again later.`,
      json: null,
      latencyMs: Date.now() - t0,
      model: "fallback",
      guarded: true,
    };
  }
}

export async function chatJsonRaw(opts: {
  system: string;
  user: string;
  temperature?: number;
  model?: string;
}): Promise<ChatResult> {
  const t0 = Date.now();
  const client = await getClient();
  const resolvedModel = opts.model || DEFAULT_AI_MODEL;
  try {
    const res = await client.chat.completions.create({
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      temperature: opts.temperature ?? 0.4,
      model: resolvedModel,
      max_tokens: 4096,
    } as never);
    const content = res?.choices?.[0]?.message?.content ?? "";
    const json = extractJson(content);
    return {
      content,
      json,
      usage: res?.usage as never,
      latencyMs: Date.now() - t0,
      model: resolvedModel,
      guarded: false,
    };
  } catch (err) {
    console.error("AI Engine chatJsonRaw failed:", err);
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return {
      content: `{"error": "AI service temporarily unavailable: ${errorMsg}", "fallback": true}`,
      json: { error: "AI service temporarily unavailable", fallback: true },
      latencyMs: Date.now() - t0,
      model: resolvedModel,
      guarded: false,
    };
  }
}

export interface PromptQualityResult {
  score: number;
  confidence: number;
  dimensions: {
    name: string;
    score: number;
    note: string;
  }[];
  suggestions: string[];
  antiPatterns: string[];
  latencyMs: number;
  model: string;
  source: "ai" | "fallback";
}

export interface PromptQualityInput {
  prompt: string;
  clos: { id: string; statement: string; bloom: string }[];
  artifact: string;
  context?: string;
}

const PROMPT_QUALITY_SYSTEM = `You are iSCARB's Prompt-Craft Evaluator. iSCARB does NOT punish students for using AI — it evaluates their SKILL in using it. You score how well a student engineered their prompt to reach a verifiable, CLO-aligned artifact.

Score these dimensions (each 0-100):
- specificity: Did the prompt state a precise goal, constraints, and audience? Vague prompts score low.
- context-grounding: Did the prompt include the unit content / Saudi regulatory context / employer scenario?
- clo-alignment: Did the prompt explicitly target the Course Learning Outcomes?
- iterativeness: Does the prompt show refinement (variables, examples, step decomposition)?
- anti-hallucination: Did the prompt instruct the model to cite real clauses and refuse fabrication?

Return STRICT JSON: { "score": number, "confidence": number, "dimensions":[{"name","score","note"}], "suggestions":[string], "antiPatterns":[string] }`;

export async function evaluatePromptQuality(input: PromptQualityInput): Promise<PromptQualityResult> {
  const t0 = Date.now();
  try {
    const user = `--- TARGET CLOs ---\n${input.clos.map((c) => `- ${c.id} (${c.bloom}): ${c.statement}`).join("\n")}\n\n--- UNIT CONTEXT ---\n${input.context ?? "(not provided)"}\n\n--- STUDENT PROMPT ---\n${input.prompt}\n\n--- ARTIFACT PRODUCED ---\n${input.artifact}\n\nEvaluate the prompt craft. Be strict but fair. A student who uses AI skilfully to reach a precise, CLO-aligned, Saudi-grounded artifact scores high.`;
    const result = await withTimeout(
      chatJson({
        system: PROMPT_QUALITY_SYSTEM,
        user,
        temperature: 0.25,
      }),
      60000,
      "prompt-quality"
    );
    const j = (result.json ?? null) as Record<string, unknown> | null;
    // chatJson soft-fails (API key missing / upstream error) by returning
    // { error, fallback: true } instead of throwing — treat that as fallback.
    const dims = Array.isArray(j?.dimensions) ? (j!.dimensions as PromptQualityResult["dimensions"]) : [];
    const softFail =
      !j ||
      j.fallback === true ||
      typeof j.error === "string" ||
      result.model === "fallback" ||
      dims.length === 0;
    if (softFail) {
      return promptQualityFallback(
        input,
        Date.now() - t0,
        new Error(typeof j?.error === "string" ? j.error : "prompt-quality soft-fail"),
      );
    }
    return {
      score: clamp(Number(j!.score ?? 0), 0, 100),
      confidence: clamp(Number(j!.confidence ?? 0.5), 0, 1),
      dimensions: dims,
      suggestions: Array.isArray(j!.suggestions) ? (j!.suggestions as string[]) : [],
      antiPatterns: Array.isArray(j!.antiPatterns) ? (j!.antiPatterns as string[]) : [],
      latencyMs: Date.now() - t0,
      model: result.model,
      source: "ai",
    };
  } catch (err) {
    return promptQualityFallback(input, Date.now() - t0, err);
  }
}

function promptQualityFallback(input: PromptQualityInput, latencyMs: number, err: unknown): PromptQualityResult {
  const p = input.prompt ?? "";
  const len = p.length;
  const hasClo = input.clos.some((c) => p.includes(c.id) || p.toLowerCase().includes(c.statement.toLowerCase().slice(0, 20)));
  const specificity = clamp(Math.round((len / 40) * 30 + (p.includes("?") ? 5 : 0) + (hasClo ? 25 : 0)), 0, 100);
  const contextGrounding = clamp(Math.round((/sama|nca|sdaia|sfda|cma|socpa|cbahi|aramco|stc|al rajhi|sabic|neom/i.test(p) ? 70 : 20) + (input.context && p.includes(input.context.slice(0, 15)) ? 20 : 0)), 0, 100);
  const cloAlignment = clamp(Math.round(hasClo ? 80 : 30), 0, 100);
  const iterativeness = clamp(Math.round((p.split("\n").length > 2 ? 60 : 25) + (/\$\{|{{|example:/i.test(p) ? 25 : 0)), 0, 100);
  const antiHallucination = clamp(Math.round(/cite|reference|do not fabricate|no hallucin|verifiable|source/i.test(p) ? 75 : 25), 0, 100);
  const score = Math.round(specificity * 0.2 + contextGrounding * 0.2 + cloAlignment * 0.25 + iterativeness * 0.15 + antiHallucination * 0.2);
  return {
    score,
    confidence: 0.6,
    dimensions: [
      { name: "specificity", score: specificity, note: hasClo ? "Prompt references CLOs." : "Add a precise goal and CLO target." },
      { name: "context-grounding", score: contextGrounding, note: /sama|nca|sdaia|aramco|stc/i.test(p) ? "Saudi context present." : "Ground in a Saudi employer/regulator." },
      { name: "clo-alignment", score: cloAlignment, note: hasClo ? "CLO explicitly targeted." : "Name the CLO you are solving for." },
      { name: "iterativeness", score: iterativeness, note: p.split("\n").length > 2 ? "Multi-step prompt." : "Decompose into steps." },
      { name: "anti-hallucination", score: antiHallucination, note: /cite|verifiable/i.test(p) ? "Asks for citations." : "Instruct the model to cite real clauses." },
    ],
    suggestions: [
      "State the target CLO id explicitly at the top of the prompt.",
      "Include the Saudi regulator / employer scenario as context.",
      "Add an explicit 'cite real clauses, refuse fabrication' instruction.",
    ],
    antiPatterns: hasClo ? [] : ["vague-ask", "no-clo-target"],
    latencyMs,
    model: "fallback",
    source: "fallback",
  };
}

export interface CloValidationResult {
  accepted: boolean;
  rejectedReason: string | null;
  matchedClos: string[];
  confidence: number;
  source: "ai" | "fallback";
}

const CLO_VALIDATION_SYSTEM = `You are iSCARB's CLO-Grounding Validator. Given an artifact and the real Course Learning Outcomes, decide whether the artifact demonstrably satisfies at least one CLO. If it does not, REJECT it. Never invent CLOs. Return STRICT JSON: { "accepted": boolean, "rejectedReason": string|null, "matchedClos": [string], "confidence": number }`;

export async function validateAgainstCLOs(input: {
  artifact: string;
  clos: { id: string; statement: string }[];
}): Promise<CloValidationResult> {
  const heuristic = (): CloValidationResult => {
    const artifactLower = input.artifact.toLowerCase();
    const matched = input.clos.filter((c) => {
      const words = c.statement.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      return words.slice(0, 4).some((w) => artifactLower.includes(w));
    });
    return {
      accepted: matched.length > 0,
      // When rejected, always a string (never null) — typeof null === "object".
      rejectedReason: matched.length ? null : "no-clo-match",
      matchedClos: matched.map((c) => c.id),
      confidence: 0.5,
      source: "fallback",
    };
  };

  try {
    const result = await withTimeout(
      chatJson({
        system: CLO_VALIDATION_SYSTEM,
        user: `--- CLOs ---\n${input.clos.map((c) => `- ${c.id}: ${c.statement}`).join("\n")}\n\n--- ARTIFACT ---\n${input.artifact}\n\nValidate. Be strict — a generic essay that does not address any CLO must be rejected.`,
        temperature: 0.15,
      }),
      60000,
      "clo-validation"
    );
    const j = (result.json ?? null) as Record<string, unknown> | null;
    // Soft-fail from chatJson (no throw) → heuristic fallback.
    if (!j || j.fallback === true || typeof j.error === "string" || result.model === "fallback") {
      return heuristic();
    }
    const accepted = Boolean(j.accepted);
    const reasonRaw = j.rejectedReason;
    const rejectedReason = accepted
      ? null
      : reasonRaw != null && String(reasonRaw).trim() !== ""
        ? String(reasonRaw)
        : "rejected-without-reason";
    return {
      accepted,
      rejectedReason,
      matchedClos: Array.isArray(j.matchedClos) ? (j.matchedClos as string[]) : [],
      confidence: clamp(Number(j.confidence ?? 0.5), 0, 1),
      source: "ai",
    };
  } catch {
    return heuristic();
  }
}

export function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export async function withTimeout<T>(promise: Promise<T>, ms: number, label = "op"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

export interface ImageGenerationResult {
  url?: string;
  b64_json?: string;
  error?: string;
  fallback: boolean;
}

export async function generateImage(opts: {
  prompt: string;
  model?: string;
}): Promise<ImageGenerationResult> {
  const nvidiaKeys = [
    process.env.NVIDIA_API_KEY,
    process.env.NVIDIA_API_KEY_2,
    process.env.NVIDIA_API_KEY_3,
    process.env.NVIDIA_API_KEY_4,
    process.env.NVIDIA_API_KEY_5,
  ].filter((k): k is string => Boolean(k && k.trim() !== ''));

  if (nvidiaKeys.length === 0) {
    return { fallback: true, error: "No NVIDIA API keys configured" };
  }

  // Default to black-forest-labs/flux1-schnell or similar NIM image models
  const model = opts.model || "black-forest-labs/flux1-schnell";
  const apiKey = nvidiaKeys[0]; // Use first key for simplicity

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: opts.prompt,
        response_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("NVIDIA Image Gen failed:", errText);
      return { fallback: true, error: `API Error: ${response.status}` };
    }

    const data = await response.json();
    if (data?.data?.[0]?.b64_json) {
      return { fallback: false, b64_json: data.data[0].b64_json };
    } else if (data?.data?.[0]?.url) {
      return { fallback: false, url: data.data[0].url };
    }

    return { fallback: true, error: "No image data returned from API" };
  } catch (err) {
    console.error("generateImage error:", err);
    return { fallback: true, error: err instanceof Error ? err.message : "Network error" };
  }
}
