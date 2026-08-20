/**
 * Shared in-memory cache for fast Student Experience projections.
 *
 * Preview/experience GET responses are deterministic projections of the
 * lecture data model (plans + artifacts + readiness items). Recomputing the
 * full 20-concept view model on every request is wasteful, so the projection
 * is cached with a short TTL and explicitly invalidated whenever the
 * underlying rows change (e.g. artifact PATCH).
 */

const projectionCache = new Map<string, { data: unknown; timestamp: number }>();

export const PROJECTION_CACHE_TTL_MS = 60_000;

export function getCachedProjection<T = unknown>(key: string): T | null {
  const entry = projectionCache.get(key);
  if (entry && Date.now() - entry.timestamp < PROJECTION_CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

export function setCachedProjection(key: string, data: unknown): void {
  projectionCache.set(key, { data, timestamp: Date.now() });
}

/** Drop a project's cached projections (canonical + preview keys). */
export function clearProjectionCache(id: string): void {
  projectionCache.delete(id);
  projectionCache.delete(`PREVIEW_${id}`);
}