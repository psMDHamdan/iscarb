/**
 * Post-Lecture Report — Concept Bucketing.
 * ===========================================================================
 * Pure function that partitions a student's concept-mastery map into three
 * disjoint groups for display in the Post-Lecture Report.
 *
 * Mastery states (in ascending order):
 *   introduced → practiced → applied → mastered
 *
 * Bucket rules (Requirements 8.2):
 *   strong     — state is "mastered" or "applied"
 *   developing — state is "practiced" AND no misconceptions recorded
 *   review     — state is "introduced" OR misconceptionLog[id] > 0
 *
 * A concept with misconceptions is bumped out of `developing` and into
 * `review` even when its mastery state is "practiced".
 */

/**
 * Partition concept IDs into three disjoint lists based on mastery state
 * and misconception history.
 *
 * @param conceptMastery   Map of conceptId → mastery state string
 * @param misconceptionLog Map of conceptId → count of recorded misconceptions
 * @returns                `{ strong, developing, review }` — three disjoint arrays
 */
export function bucketConcepts(
  conceptMastery: Record<string, string>,
  misconceptionLog: Record<string, number>
): { strong: string[]; developing: string[]; review: string[] } {
  const strong: string[] = [];
  const developing: string[] = [];
  const review: string[] = [];

  for (const [id, state] of Object.entries(conceptMastery)) {
    if (state === "mastered" || state === "applied") {
      strong.push(id);
    } else if (state === "practiced") {
      developing.push(id);
    } else {
      // "introduced" or any unrecognised state → review
      review.push(id);
    }
  }

  // Concepts with recorded misconceptions get bumped to review even if "practiced"
  for (const [id, count] of Object.entries(misconceptionLog)) {
    if (count > 0 && !review.includes(id)) {
      review.push(id);
      const devIdx = developing.indexOf(id);
      if (devIdx !== -1) developing.splice(devIdx, 1);
    }
  }

  return { strong, developing, review };
}
