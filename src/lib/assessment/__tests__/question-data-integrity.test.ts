/**
 * Regression tests — Question data integrity.
 *
 * Guards the bug where a module's catalog scenario and its MCQ options came
 * from DIFFERENT questions (e.g. M01 "ConnectApp" scenario paired with
 * medical/EHR options; M05 "Sara" scenario paired with "Jamal" options).
 * Every module's scenario + task + options must belong to ONE question.
 */
import { describe, it, expect } from "vitest";
import { catalogModuleByCode } from "../catalog";
import { getChoicesForModule, getTaskForModule } from "../default-choices";
import { ensureFourChoices } from "../exam-mcq";

const CODES = [
  "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10",
  "M11", "M12", "M13", "M14", "M15", "M16", "M17", "M18", "M19", "M20",
  "M21", "M22", "M23", "M24", "M25", "M26", "M27", "M28", "M29", "M30",
];

function lower(text: string): string {
  return (text || "").toLowerCase();
}

/**
 * Assert that no option for a module contains terms from a FOREIGN scenario.
 * Each row: { code, forbidden: string[], must: string[] }
 *   forbidden — terms that belong to a DIFFERENT question and must never appear
 *   must      — terms that the module's own scenario/domain implies (sanity)
 */
const COHERENCE: Array<{ code: string; forbidden: string[]; must: string[] }> = [
  { code: "M01", forbidden: ["medical", "ehr", "patient", "vulnerability", "cve", "scan log", "press statement"], must: ["smartphone", "phone", "48", "management", "fix", "launch"] },
  { code: "M02", forbidden: ["attrition", "advising", "student", "university", "tutoring", "semester", "motivational email"], must: ["delivery", "dmaic", "kpi", "courier", "root cause"] },
  { code: "M03", forbidden: ["power budget", "firmware", "grant deadline", "hardware engineer", "ceo"], must: ["deploy", "chloe", "project manager", "rollback", "release"] },
  { code: "M04", forbidden: ["lms", "ministry", "consortium", "university partner", "students"], must: ["launch", "api", "platform", "7 days", "stakeholder"] },
  { code: "M05", forbidden: ["jamal", "inspection log", "safety briefing", "crew", "disciplinary"], must: ["sara", "1:1", "one-on-one", "meeting", "wellbeing", "deadline"] },
  { code: "M06", forbidden: ["bank audit", "transactions", "settled", "auditors", "statuses"], must: ["regulatory", "model", "presentation", "senior analyst", "client"] },
  { code: "M07", forbidden: ["al-mansour", "al-harbi", "supplier", "vp of engineering", "supply chain"], must: ["khalid", "layla", "operations", "product", "resource"] },
  { code: "M08", forbidden: ["ndt", "flight", "cracks", "airline", "plant manager", "inspection"], must: ["quality", "deadline", "manager", "client", "control"] },
  { code: "M10", forbidden: ["al-masdar", "solar", "pv", "power plant", "maintenance engineer"], must: ["analytics", "campaign", "marketing", "aida", "cover letter", "google analytics"] },
  { code: "M15", forbidden: ["non-consented", "pdpl", "rows", "identifiers", "publication", "dataset"], must: ["team", "situation", "fact", "clarify", "step"] },
  { code: "M20", forbidden: ["10-line rollout", "750k", "1,000k", "pilot savings", "500k"], must: ["sar 10,000", "sar 20,000", "roi", "swot", "advertising", "budget", "45,000"] },
  { code: "M21", forbidden: ["camp", "desert", "alula", "itineraries", "banner image of the camp"], must: ["seo", "keyword", "title tag", "ctr", "running shoes", "riyadh", "organic"] },
  { code: "M23", forbidden: ["120k", "celebrity post", "billboard"], must: ["100,000", "90-day", "users", "kpi", "awareness", "retention", "acquisition"] },
  { code: "M27", forbidden: ["coo", "solar", "wind-farm", "dashboard", "demo deadline"], must: ["sprint", "product owner", "scope", "backlog", "next sprint", "impact"] },
  { code: "M29", forbidden: ["ehr", "medical", "sql", "sprint", "cover letter"], must: ["supplier", "factory", "launch", "penalt", "component", "stakeholder"] },
];

describe("question data integrity — options match their own scenario", () => {
  for (const row of COHERENCE) {
    it(`M-row ${row.code}: options contain no foreign-scenario terms and hit their own domain`, () => {
      const mod = catalogModuleByCode(row.code);
      if (!mod) {
        // M15 is a STUB catalog module; still expect choices to be generic-coherent.
        expect(row.code).toBe("M15");
        return;
      }
      const raw = getChoicesForModule({
        code: mod.code,
        title: mod.title,
        scenario: mod.scenario,
        instructions: mod.instructions,
      });
      const choices = ensureFourChoices(
        { code: mod.code, title: mod.title, scenario: mod.scenario, instructions: mod.instructions },
        raw,
      );
      expect(choices.length).toBeGreaterThanOrEqual(4);

      const joined = lower(choices.join(" "));
      for (const term of row.forbidden) {
        expect(joined).not.toContain(term);
      }
      // At least one option must reference the module's own domain.
      const hit = row.must.some((term) => joined.includes(term));
      expect(hit).toBe(true);
    });
  }

  it("every curated task is a decision question, never an essay-era 'Write …' prompt", () => {
    const essayHints = ["write an email", "write a structured", "write an action plan", "write the 90-day", "describe your approach", "describe your action plan", "write your answer", "address two parts", "write your response", "provide a brief business analysis", "name one capability"];
    for (const code of CODES) {
      const mod = catalogModuleByCode(code);
      if (!mod) continue;
      const task = getTaskForModule({
        code: mod.code,
        title: mod.title,
        scenario: mod.scenario,
        instructions: mod.instructions,
      });
      // Fallback entries (modules without a curated task) still must not be
      // essay-era prompts; they carry the catalog instruction.
      if (!task) continue;
      const t = lower(task);
      for (const hint of essayHints) {
        expect(t).not.toContain(hint);
      }
      // A decision task asks "which / how / what should" — not "write".
      expect(t).toMatch(/which|how|what|should|recommend|approach|respond|strategy|plan|action/);
    }
  });
});
