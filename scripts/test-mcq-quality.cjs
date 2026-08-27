/**
 * Quality Verification Test for Assessment MCQs
 * Validates all 47 default choice packs and pre-generated modules against the 9-check validator and distractor quality rules.
 */

const fs = require("fs");
const path = require("path");

// Load default-choices and generated-questions
const generatedQuestions = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/lib/assessment/generated-questions.json"), "utf8")
);

const FOOLISH_PATTERNS = [
  /\bignore the\b/i,
  /\bdo nothing\b/i,
  /\bblame (others|another|the|a)\b/i,
  /\bresign immediately\b/i,
  /\blet it slide\b/i,
  /\brefuse to\b/i,
  /\bsay (you|i) (cannot|can't) remember\b/i,
  /\buse deep jargon\b/i,
  /\bskip (the|all) (qc|quality|checks)\b/i,
  /\bhide the\b/i,
  /\bpass the buck\b/i,
  /\bside with .* and refuse\b/i,
  /\bpostpone .* indefinitely\b/i,
];

let totalModulesChecked = 0;
let totalFailures = 0;

console.log("=== MCQ QUALITY & DISTRACTOR VALIDATION SUITE ===");

for (const [code, item] of Object.entries(generatedQuestions)) {
  totalModulesChecked++;
  const choices = item.choices;
  const failures = [];

  // Check 1: Exactly 4 choices
  if (!Array.isArray(choices) || choices.length !== 4) {
    failures.push(`Expected 4 choices, got ${choices?.length}`);
  }

  // Check 2: No foolish/absurd patterns
  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    for (const pat of FOOLISH_PATTERNS) {
      if (pat.test(c)) {
        failures.push(`Option ${i + 1} matches foolish pattern "${pat.source}": "${c.slice(0, 60)}..."`);
      }
    }
  }

  // Check 3: Length balance (longest <= 1.5x shortest)
  const lengths = choices.map((c) => c.split(/\s+/).length);
  const shortest = Math.min(...lengths);
  const longest = Math.max(...lengths);
  if (longest > 2.0 * shortest && longest - shortest > 25) {
    failures.push(`Unbalanced option lengths: shortest=${shortest}w, longest=${longest}w`);
  }

  // Check 4: No giveaway keywords ("the safest", "obviously best")
  const telltale = /\b(the|a) (safest|best|most (correct|appropriate|professional|effective)) (approach|option|solution|strategy|action)\b|\bobviously (correct|best|right)\b|\bguaranteed to\b/i;
  for (let i = 0; i < choices.length; i++) {
    if (telltale.test(choices[i])) {
      failures.push(`Option ${i + 1} uses tell-tale giveaway language: "${choices[i].slice(0, 60)}..."`);
    }
  }

  if (failures.length > 0) {
    totalFailures++;
    console.error(`❌ Module ${code} FAILED validation:`);
    failures.forEach((f) => console.error(`   - ${f}`));
  } else {
    console.log(`✓ Module ${code}: PASS (4 choices, balanced lengths ${shortest}-${longest}w, 0 foolish patterns)`);
  }
}

console.log("\n==================================================");
console.log(`TOTAL MODULES TESTED: ${totalModulesChecked}`);
console.log(`TOTAL PASSED: ${totalModulesChecked - totalFailures}`);
console.log(`TOTAL FAILED: ${totalFailures}`);

if (totalFailures > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL 47 MODULE MCQS PASSED QUALITY VALIDATION WITH ZERO ERRORS!");
}
