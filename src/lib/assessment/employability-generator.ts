/**
 * Phase 4: live Job-Fit AI rewrite DISABLED.
 *
 * The employability exam serves published Question Bank content (+ catalog
 * fallback). `generateEmployabilityModules` is a no-op so any stale caller
 * cannot trigger llama-3.1-8b question generation.
 */
import "server-only";

const memoryCache = new Map<
  string,
  {
    scenario: string;
    instructions: string;
    choices: string[];
    generatedAt: string;
  }
>();

/** Read legacy Job-Fit generation cache (always empty after Phase 4). */
export function getCachedJobFitContent(
  studentId: string,
  specialization: string,
  code: string,
): { scenario: string; instructions: string; choices: string[] } | null {
  const cacheKey = `${studentId}_${specialization}_${code}`;
  const hit = memoryCache.get(cacheKey);
  if (!hit) return null;
  return {
    scenario: hit.scenario,
    instructions: hit.instructions,
    choices: Array.isArray(hit.choices) ? hit.choices.map(String) : [],
  };
}

/** No-op — exam path must not live-generate or rewrite questions. */
export async function generateEmployabilityModules(
  modules: unknown[],
  _specialization: string,
  _studentId: string,
) {
  return modules;
}
