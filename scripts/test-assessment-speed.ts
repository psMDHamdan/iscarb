/**
 * NVIDIA API speed test — uses all 5 keys with round-robin.
 * Run: npx tsx scripts/test-assessment-speed.ts
 */
import "dotenv/config";

const KEYS = [
  process.env.NVIDIA_API_KEY,
  process.env.NVIDIA_API_KEY_2,
  process.env.NVIDIA_API_KEY_3,
  process.env.NVIDIA_API_KEY_4,
  process.env.NVIDIA_API_KEY_5,
].filter((k): k is string => Boolean(k && k.trim() !== ''))
 .map(k => k.replace(/^["']|["']$/g, ""));

const MODEL = "nvidia/nemotron-3-nano-30b-a3b";

const SYSTEM_PROMPT = `You are an MCQ question generator. Generate ONE multiple-choice question.
Return ONLY valid JSON. All 4 options must be plausible professional choices.`;

const USER_PROMPT = `Generate a MCQ for "Strategic Communication" in Computer Science.
Scenario: A junior developer discovered a bug in production 2 hours before a client demo.
The client is non-technical and the VP of Engineering is unavailable.
The developer must decide how to communicate the issue.

Return JSON only:
{
  "scenario": "2-3 sentence scenario",
  "task": "decision question",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0
}`;

let keyIndex = 0;
function nextKey(): string {
  const key = KEYS[keyIndex % KEYS.length];
  keyIndex++;
  return key;
}

async function generateOne(): Promise<{ latencyMs: number; tokens: number; success: boolean }> {
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${nextKey()}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT },
        ],
        temperature: 0.7,
        max_tokens: 512,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      return { latencyMs: Date.now() - t0, tokens: 0, success: false };
    }

    const data = await response.json();
    const tokens = data?.usage?.completion_tokens ?? 0;
    return { latencyMs: Date.now() - t0, tokens, success: true };
  } catch {
    return { latencyMs: Date.now() - t0, tokens: 0, success: false };
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  iSCARB Speed Test — All 5 Keys");
  console.log("═══════════════════════════════════════════════════════════════\n");
  console.log(`Model:  ${MODEL}`);
  console.log(`Keys:   ${KEYS.length} available\n`);

  // Test 1: Serial (one at a time, rotating keys)
  console.log("─── Test 1: Serial (rotate keys) ───");
  const serialResults = [];
  for (let i = 1; i <= 5; i++) {
    const r = await generateOne();
    serialResults.push(r);
    const icon = r.success ? "✅" : "❌";
    console.log(`  Run ${i}: ${icon} ${r.latencyMs}ms${r.tokens ? ` (${r.tokens} tok)` : ""}`);
    // Small delay between requests
    if (i < 5) await new Promise(r => setTimeout(r, 500));
  }

  const serialSuccess = serialResults.filter(r => r.success);
  const serialAvg = serialSuccess.length > 0
    ? Math.round(serialSuccess.reduce((a, r) => a + r.latencyMs, 0) / serialSuccess.length)
    : 0;

  // Test 2: Parallel (all 5 keys at once)
  console.log("\n─── Test 2: Parallel (5 keys simultaneously) ───");
  const parallelResults = await Promise.all(
    Array.from({ length: 5 }, () => generateOne())
  );
  for (let i = 0; i < parallelResults.length; i++) {
    const r = parallelResults[i]!;
    const icon = r.success ? "✅" : "❌";
    console.log(`  Key ${i + 1}: ${icon} ${r.latencyMs}ms${r.tokens ? ` (${r.tokens} tok)` : ""}`);
  }

  const parallelSuccess = parallelResults.filter(r => r.success);
  const parallelAvg = parallelSuccess.length > 0
    ? Math.round(parallelSuccess.reduce((a, r) => a + r.latencyMs, 0) / parallelSuccess.length)
    : 0;
  const parallelMax = parallelSuccess.length > 0
    ? Math.max(...parallelSuccess.map(r => r.latencyMs))
    : 0;

  // Results
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  RESULTS");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log("  Serial (1 key at a time):");
  console.log(`    Avg latency: ${serialAvg}ms (${(serialAvg / 1000).toFixed(1)}s)`);
  console.log(`    Success:     ${serialSuccess.length}/5\n`);

  console.log("  Parallel (5 keys at once):");
  console.log(`    Avg latency: ${parallelAvg}ms (${(parallelAvg / 1000).toFixed(1)}s)`);
  console.log(`    Max latency: ${parallelMax}ms (${(parallelMax / 1000).toFixed(1)}s)`);
  console.log(`    Success:     ${parallelSuccess.length}/5\n`);

  // Estimates
  console.log("  ⏱️  Estimated 47-Question Exam Time:");
  console.log("  ────────────────────────────────────");

  if (serialAvg > 0) {
    const serialMin = (serialAvg * 47) / 1000 / 60;
    console.log(`  Serial (1 key):     ~${serialMin.toFixed(1)} min`);
  }

  if (parallelMax > 0) {
    // With 5 keys in parallel, we can run 5 questions at a time
    const batches5 = Math.ceil(47 / 5);
    const parallelMin5 = (parallelMax * batches5) / 1000 / 60;
    console.log(`  5 keys parallel:    ~${parallelMin5.toFixed(1)} min`);
  }

  if (parallelMax > 0) {
    // With 40 concurrent (8 per key × 5 keys)
    const batches40 = Math.ceil(47 / 40);
    const parallelMin40 = (parallelMax * batches40) / 1000 / 60;
    console.log(`  40 concurrent:      ~${parallelMin40.toFixed(1)} min`);
  }

  if (serialAvg > 0) {
    // Batched: 4 questions per LLM call
    const batchItems = Math.ceil(47 / 4);
    const batchedMin = (serialAvg * batchItems) / 1000 / 60;
    console.log(`  Batched (4/call):   ~${batchedMin.toFixed(1)} min`);
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
}

main().catch(console.error);
