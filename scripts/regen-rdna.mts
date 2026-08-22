import { generateAllSlides } from "../src/lib/lecture/generation/generation-worker.js";

const PROJECT_ID = "cmt2kcfwl0036onbbun4sjj88";
console.log("Starting regeneration for:", PROJECT_ID);

try {
  await generateAllSlides(PROJECT_ID);
  console.log("DONE");
} catch (err: any) {
  console.error("FAILED:", err.message);
}
process.exit(0);
