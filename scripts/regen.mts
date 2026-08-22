import { generateAllSlides } from "../src/lib/lecture/generation/generation-worker.js";

const PROJECT_ID = "cmt2kcfwl0036onbbun4sjj88";
console.log("Starting regeneration for:", PROJECT_ID);
console.log("Time:", new Date().toISOString());
const start = Date.now();

try {
  await generateAllSlides(PROJECT_ID);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("DONE in", elapsed, "seconds");
} catch (err: any) {
  console.error("FAILED:", err.message);
}
process.exit(0);
