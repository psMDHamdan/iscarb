import { triggerPipelineGeneration } from "../src/lib/lecture/generation/pipeline-trigger.js";
import { db } from "../src/lib/db.js";

const PROJECT_ID = "cmt2kcfwl0036onbbun4sjj88";
console.log("Starting multi-agent generation for:", PROJECT_ID);

try {
  await triggerPipelineGeneration(PROJECT_ID);
  
  // Wait a moment for background processing (though it runs synchronously in the runner promise here)
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log("DONE");
} catch (err: any) {
  console.error("FAILED:", err.message);
}
process.exit(0);
