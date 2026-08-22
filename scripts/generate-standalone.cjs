/**
 * generate-standalone.cjs
 * =======================
 * Generates lecture content directly via the NVIDIA API, bypassing Next.js.
 * This avoids the OOM that happens when the Next.js server tries to compile
 * all routes + run the generation worker in the same process.
 */

const { PrismaClient } = require("@prisma/client");
const https = require("https");
const http = require("http");

const prisma = new PrismaClient();

// ─── NVIDIA API Configuration ───
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "meta/llama-3.1-8b-instruct";

// Get API keys from env
function getApiKeys() {
  const keys = [];
  for (let i = 1; i <= 4; i++) {
    const key = process.env[`NVIDIA_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  // Also check single key
  if (keys.length === 0 && process.env.NVIDIA_API_KEY) {
    keys.push(process.env.NVIDIA_API_KEY);
  }
  return keys;
}

async function callLLM(prompt, apiKey, maxTokens = 2000) {
  const body = JSON.stringify({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
  });

  return new Promise((resolve, reject) => {
    const url = new URL(NVIDIA_API_URL);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 60000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.message?.content || "";
            resolve(content);
          } catch (e) {
            reject(new Error(`Parse error: ${data.substring(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
    req.write(body);
    req.end();
  });
}

async function generateSlideContent(slidePlan, sourceBlocks, apiKey) {
  const blockText = sourceBlocks
    .map((b, i) => `[Block ${i + 1}] ${b.text?.substring(0, 500) || ""}`)
    .join("\n\n");

  const prompt = `You are generating educational content for a university lecture slide.

SLIDE PLAN:
- Title: ${slidePlan.title}
- Function: ${slidePlan.function}
- Interaction: ${slidePlan.interactionType || "none"}

SOURCE MATERIAL:
${blockText}

Generate a JSON object with this EXACT structure:
{
  "title": "specific, engaging slide title",
  "body": {
    "visibleCopy": "2-3 sentence core explanation of this concept",
    "bullets": ["bullet 1 - key concept", "bullet 2 - mechanism or example", "bullet 3 - application or insight"],
    "studentAction": {
      "type": "poll",
      "stem": "engaging question that tests understanding of this concept",
      "options": ["option A - plausible", "option B - plausible", "option C - plausible", "option D - plausible"],
      "correctIndex": 0,
      "rationale": "why the correct answer is right and others are wrong"
    }
  },
  "studentExperience": {
    "headline": "short attention-grabbing headline",
    "hook": "engaging scenario or question that creates curiosity (2-3 sentences)",
    "coreContent": {
      "explanation": "full teaching explanation in student-friendly language (100-200 words)",
      "analogy": "real-world analogy that makes this concept click",
      "steps": ["step 1 of how this works", "step 2", "step 3", "step 4", "step 5"]
    },
    "interactive": {
      "type": "poll",
      "prompt": "thought-provoking question related to this concept",
      "options": ["A", "B", "C", "D"],
      "hints": ["hint 1: structural clue", "hint 2: partial mechanism", "hint 3: near-answer"],
      "reveal": "correct answer explanation"
    },
    "commonPitfalls": [],
    "realWorld": null
  }
}

Rules:
- NO truncation (no "..." anywhere)
- NO source text copied directly (paraphrase everything)
- Every bullet must be a complete sentence
- The hook must create genuine curiosity
- The explanation must be 100-200 words of real teaching
- The analogy must use a real-world comparison students can relate to
- The steps must show a logical progression
- Return ONLY valid JSON, no markdown`;

  try {
    const response = await callLLM(prompt, apiKey);
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`  ⚠️ Slide ${slidePlan.slideNo}: No JSON in response`);
      return null;
    }
    const content = JSON.parse(jsonMatch[0]);
    return content;
  } catch (e) {
    console.log(`  ⚠️ Slide ${slidePlan.slideNo}: ${e.message}`);
    return null;
  }
}

async function main() {
  const projectId = "cmsqdwo440012onexo4tvu1ky";
  const apiKeys = getApiKeys();

  console.log("=== STANDALONE GENERATION ===");
  console.log("Project:", projectId);
  console.log("API Keys:", apiKeys.length);

  if (apiKeys.length === 0) {
    console.log("ERROR: No NVIDIA API keys found");
    return;
  }

  // Load slide plans
  const plans = await prisma.lectureSlidePlan.findMany({
    where: { projectId },
    orderBy: { slideNo: "asc" },
  });
  console.log("Slide plans:", plans.length);

  // Load source blocks
  const blocks = await prisma.lectureSourceBlock.findMany({
    where: { projectId },
    orderBy: { id: "asc" },
  });
  console.log("Source blocks:", blocks.length);

  // Generate each slide
  let successCount = 0;
  let failCount = 0;
  const keyIndex = 0; // Use first key

  for (const plan of plans) {
    console.log(`\nGenerating slide ${plan.slideNo}: "${plan.title}"...`);

    const content = await generateSlideContent(plan, blocks, apiKeys[keyIndex]);

    if (!content) {
      failCount++;
      continue;
    }

    // Add metadata
    content.slideNo = plan.slideNo;
    content.function = plan.function;
    content.wordCount = JSON.stringify(content).split(/\s+/).length;

    // Save to database
    try {
      await prisma.lectureSlideArtifact.create({
        data: {
          projectId,
          slidePlanId: plan.id,
          slideNo: plan.slideNo,
          version: 1,
          contentJson: content,
          wordCount: content.wordCount,
          bulletCount: content.body?.bullets?.length || 0,
          status: "approved",
        },
      });
      successCount++;
      console.log(`  ✅ Saved (${content.wordCount} words, ${content.body?.bullets?.length || 0} bullets)`);
    } catch (e) {
      console.log(`  ❌ DB error: ${e.message}`);
      failCount++;
    }

    // Rate limit: wait 1 second between calls
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Success: ${successCount}/${plans.length}`);
  console.log(`Failed: ${failCount}/${plans.length}`);

  // Quick quality check
  const allArts = await prisma.lectureSlideArtifact.findMany({
    where: { projectId },
    orderBy: { slideNo: "asc" },
  });

  console.log(`\n=== QUALITY CHECK ===`);
  for (const a of allArts) {
    const c = a.contentJson;
    const se = c?.studentExperience;
    const str = JSON.stringify(c || {});
    const dots = (str.match(/\.\.\./g) || []).length;
    const hasHook = !!se?.hook && se.hook.length > 20;
    const hasExplanation = !!se?.coreContent?.explanation && se.coreContent.explanation.length > 50;
    const hasSteps = se?.coreContent?.steps?.length > 0;
    const hasAnalogy = !!se?.coreContent?.analogy;

    const pass = hasHook && hasExplanation && hasSteps && hasAnalogy && dots === 0;
    console.log(
      pass ? "✅" : "❌",
      `Slide ${a.slideNo}:`,
      c.title?.substring(0, 40),
      `| ${a.wordCount}w | dots:${dots} | hook:${hasHook} | expl:${hasExplanation} | steps:${hasSteps} | analogy:${hasAnalogy}`
    );
  }

  await prisma.$disconnect();
}

main().catch(console.error);
