import { triggerPipelineGeneration } from "../src/lib/lecture/generation/pipeline-trigger.js";

const PROJECT_ID = "cmt30736l001vonfe7y3mya0t";
console.log("Starting multi-agent generation for:", PROJECT_ID);

try {
  await triggerPipelineGeneration(PROJECT_ID);
  console.log("Triggered successfully in the background.");
} catch (err: any) {
  console.error("FAILED:", err.message);
}
