import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config();

// We must import the module catalog carefully if it depends on TS paths, or we can just run it with tsx
import { UNIVERSAL_MODULES } from "../src/lib/assessment/catalog";

const NVIDIA_KEYS = [
  process.env.NVIDIA_API_KEY,
  process.env.NVIDIA_API_KEY_2,
  process.env.NVIDIA_API_KEY_3,
  process.env.NVIDIA_API_KEY_4,
  process.env.NVIDIA_API_KEY_5,
].filter(Boolean) as string[];

const MODEL = "meta/llama-3.1-8b-instruct";
const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

let keyCounter = 0;
function getKey() {
  if (NVIDIA_KEYS.length === 0) throw new Error("No NVIDIA API keys found.");
  const k = NVIDIA_KEYS[keyCounter % NVIDIA_KEYS.length];
  keyCounter++;
  return k;
}

const SYSTEM_PROMPT = `You are a professional translator for iSCARB, a Saudi higher education assessment platform.
You will receive JSON containing English text for an assessment scenario, instructions, and multiple-choice options.
You must translate the text into fluent, high-register Modern Standard Arabic (فصحى أكاديمية).
Ensure the tone is professional and culturally appropriate for the Saudi workplace context.
Output STRICT JSON exactly matching the following structure, with NO markdown formatting, NO extra text:
{
  "scenarioAr": "translated scenario here...",
  "instructionsAr": "translated instructions here...",
  "choicesAr": ["choice 1", "choice 2", "choice 3", "choice 4"]
}`;

async function translateModule(mod: any) {
  console.log(`Translating ${mod.code}...`);
  const payload = {
    scenario: mod.scenario,
    instructions: mod.instructions,
    choices: mod.choices || ["A", "B", "C", "D"] // fallback if choices are missing, though shouldn't happen
  };

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(payload) }
    ],
    temperature: 0.1,
    max_tokens: 2048
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getKey()}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const content = data.choices[0].message.content.trim();
      let cleanJson = content.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      console.log(`✓ Translated ${mod.code}`);
      return {
        code: mod.code,
        scenarioAr: parsed.scenarioAr,
        instructionsAr: parsed.instructionsAr,
        choicesAr: parsed.choicesAr
      };
    } catch (err: any) {
      console.warn(`Attempt ${attempt} failed for ${mod.code}: ${err.message}`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error(`Failed to translate ${mod.code} after 3 attempts.`);
}

async function run() {
  console.log(`Starting translation for ${UNIVERSAL_MODULES.length} modules...`);
  
  const results: Record<string, any> = {};
  
  // Concurrency limit of 5 to respect rate limits
  const CONCURRENCY = 5;
  for (let i = 0; i < UNIVERSAL_MODULES.length; i += CONCURRENCY) {
    const chunk = UNIVERSAL_MODULES.slice(i, i + CONCURRENCY);
    const promises = chunk.map(translateModule);
    const resolved = await Promise.all(promises);
    for (const r of resolved) {
      results[r.code] = {
        scenarioAr: r.scenarioAr,
        instructionsAr: r.instructionsAr,
        choicesAr: r.choicesAr
      };
    }
    // Small delay between batches
    await new Promise(r => setTimeout(r, 1000));
  }

  const outPath = path.join(__dirname, "../src/data/catalog-translations.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nSuccess! Wrote translations to ${outPath}`);
}

run().catch(console.error);
