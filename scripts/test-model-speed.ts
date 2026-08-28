/**
 * Quick model speed test — measures NVIDIA API response time for MCQ generation.
 * Run: npx tsx scripts/test-model-speed.ts
 */

import "dotenv/config";

const NVIDIA_KEYS = [
  process.env.NVIDIA_API_KEY,
  process.env.NVIDIA_API_KEY_2,
  process.env.NVIDIA_API_KEY_3,
  process.env.NVIDIA_API_KEY_4,
  process.env.NVIDIA_API_KEY_5,
].filter((k): k is string => Boolean(k && k.trim() !== ''));

// Models to test — mix of small/fast and current default
const MODELS_TO_TEST = [
  "nvidia/mistral-nemo-minitron-8b-8k-instruct",
  "nvidia/nemotron-3-nano-30b-a3b",
  "nvidia/nemotron-3.5-lightning-30b-a3b",
  "nvidia/nemotron-nano-3-30b-a3b",
  "nvidia/llama-3.1-nemotron-51b-instruct",
  "meta/llama-3.2-11b-vision-instruct",
  "mistralai/mistral-nemotron",
  "deepseek-ai/deepseek-v4-flash-0731",
  "google/gemma-3-4b-it",
  "google/gemma-3-12b-it",
  "zyphra/zamba2-7b-instruct",
  "aisingapore/sea-lion-7b-instruct",
  "microsoft/phi-3.5-moe-instruct",
  "openai/gpt-oss-20b",
];

const TEST_PROMPT = {
  system: `You are an assessment question generator. Generate ONE multiple-choice question.
Return ONLY valid JSON with this structure:
{
  "scenario": "A realistic professional scenario (3-5 sentences)",
  "task": "A specific decision question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0
}`,
  user: `Generate a MCQ for "Strategic Communication" in "Computer Science".
The scenario should involve a junior developer needing to explain a technical issue to non-technical management.
All 4 options must be plausible professional responses.`,
};

async function testModel(modelName: string, apiKey: string): Promise<{
  model: string;
  latencyMs: number;
  success: boolean;
  tokensGenerated: number;
  error?: string;
}> {
  const t0 = Date.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: TEST_PROMPT.system },
          { role: "user", content: TEST_PROMPT.user },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      return {
        model: modelName,
        latencyMs: Date.now() - t0,
        success: false,
        tokensGenerated: 0,
        error: `HTTP ${response.status}: ${errText.slice(0, 80)}`,
      };
    }

    const data = await response.json();
    const latencyMs = Date.now() - t0;
    const content = data?.choices?.[0]?.message?.content ?? "";
    const tokensGenerated = data?.usage?.completion_tokens ?? 0;

    // Validate JSON response
    try {
      JSON.parse(content);
      return {
        model: modelName,
        latencyMs,
        success: true,
        tokensGenerated,
      };
    } catch {
      return {
        model: modelName,
        latencyMs,
        success: false,
        tokensGenerated,
        error: "Invalid JSON response",
      };
    }
  } catch (err) {
    return {
      model: modelName,
      latencyMs: Date.now() - t0,
      success: false,
      tokensGenerated: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  NVIDIA Model Speed Test — MCQ Generation");
  console.log("═══════════════════════════════════════════════════════════════\n");

  if (NVIDIA_KEYS.length === 0) {
    console.error("❌ No NVIDIA API keys found in environment variables.");
    process.exit(1);
  }

  console.log(`✅ Found ${NVIDIA_KEYS.length} NVIDIA API key(s)\n`);
  console.log("Testing models (2 runs each)...\n");

  const results: Array<{
    model: string;
    avgLatencyMs: number;
    successRate: number;
    avgTokens: number;
  }> = [];

  for (const model of MODELS_TO_TEST) {
    console.log(`\n🔄 Testing: ${model}`);
    console.log("─".repeat(60));

    const runResults = [];
    for (let run = 0; run < 2; run++) {
      const keyIdx = run % NVIDIA_KEYS.length;
      const result = await testModel(model, NVIDIA_KEYS[keyIdx]!);
      runResults.push(result);

      const status = result.success ? "✅" : "❌";
      const latency = `${result.latencyMs}ms`;
      const tokens = result.tokensGenerated > 0 ? ` (${result.tokensGenerated} tokens)` : "";
      console.log(`  Run ${run + 1}: ${status} ${latency}${tokens}${result.error ? ` — ${result.error}` : ""}`);
    }

    const successful = runResults.filter((r) => r.success);
    const avgLatency = successful.length > 0
      ? Math.round(successful.reduce((a, r) => a + r.latencyMs, 0) / successful.length)
      : 0;
    const avgTokens = successful.length > 0
      ? Math.round(successful.reduce((a, r) => a + r.tokensGenerated, 0) / successful.length)
      : 0;

    results.push({
      model,
      avgLatencyMs: avgLatency,
      successRate: successful.length / 2,
      avgTokens,
    });
  }

  // Summary table
  console.log("\n\n═══════════════════════════════════════════════════════════════");
  console.log("  RESULTS SUMMARY — Working Models (sorted by speed)");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const working = results.filter((r) => r.successRate > 0);
  const sorted = [...working].sort((a, b) => a.avgLatencyMs - b.avgLatencyMs);

  console.log("Model".padEnd(50) + "Latency".padEnd(12) + "Tokens".padEnd(8) + "Status");
  console.log("─".repeat(80));

  for (const r of sorted) {
    const isFastest = r === sorted[0];
    const marker = isFastest ? " 🏆" : "";
    console.log(
      `${r.model}${marker}`.padEnd(50) +
      `${r.avgLatencyMs}ms`.padEnd(12) +
      `${r.avgTokens}`.padEnd(8) +
      `${Math.round(r.successRate * 100)}%`
    );
  }

  const failed = results.filter((r) => r.successRate === 0);
  if (failed.length > 0) {
    console.log("\n❌ Not available (404):");
    for (const r of failed) {
      console.log(`   ${r.model}`);
    }
  }

  if (sorted.length > 0) {
    const fastest = sorted[0];
    console.log(`\n🏆 Fastest working model: ${fastest.model}`);
    console.log(`   Average latency: ${fastest.avgLatencyMs}ms`);
    console.log(`   Tokens per response: ${fastest.avgTokens}`);

    const oldModel = results.find((r) => r.model === "meta/llama-3.2-11b-vision-instruct");
    if (oldModel && oldModel.avgLatencyMs > 0 && fastest.avgLatencyMs > 0) {
      const speedup = (oldModel.avgLatencyMs / fastest.avgLatencyMs).toFixed(1);
      console.log(`\n⚡ Speed improvement vs old default: ${speedup}x faster`);
      console.log(`   Estimated 47-question exam time:`);
      console.log(`     Old: ~${Math.round((oldModel.avgLatencyMs * 47) / 1000 / 60)} minutes`);
      console.log(`     New: ~${Math.round((fastest.avgLatencyMs * 47) / 1000 / 60)} minutes`);
    }
  } else {
    console.log("\n❌ No models worked. Check API keys and network connection.");
  }
}

main().catch(console.error);
