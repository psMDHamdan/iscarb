/**
 * Bounded-concurrency helpers for scoring many answers in parallel.
 * One failure must not abort siblings (allSettled semantics).
 */

export type SettledResult<T> =
  | { status: "fulfilled"; value: T }
  | { status: "rejected"; reason: unknown };

/**
 * Run `fn` over `items` with at most `limit` in flight at once.
 * Unlike chunked Promise.all, a free slot immediately takes the next item
 * (no barrier waiting for the slowest member of a fixed batch).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<SettledResult<R>[]> {
  const n = items.length;
  const results: SettledResult<R>[] = new Array(n);
  if (n === 0) return results;

  const workers = Math.max(1, Math.min(Math.floor(limit) || 1, n));
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= n) return;
      try {
        const value = await fn(items[i]!, i);
        results[i] = { status: "fulfilled", value };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}
