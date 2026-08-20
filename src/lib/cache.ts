/**
 * Caching Layer — Redis-backed cache with TTL and invalidation
 * WAVE 19: Performance Optimization
 */

import { redis } from '@/config/redis';

export interface CacheConfig {
  ttlSeconds: number;
  key: string;
  invalidateOn?: string[];
}

/**
 * Get value from cache, returning null if not found or expired
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn(`Cache get error for ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.warn(`Cache set error for ${key}:`, error);
  }
}

/**
 * Invalidate cache entry
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.warn(`Cache invalidate error for ${key}:`, error);
  }
}

/**
 * Invalidate multiple cache entries by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn(`Cache pattern invalidate error for ${pattern}:`, error);
  }
}

/**
 * Get or compute and cache a value
 */
export async function getOrComputeCached<T>(
  key: string,
  compute: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  try {
    const cached = await getCached<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    // Fallback to compute if cache read fails
  }

  const value = await compute();
  try {
    await setCached(key, value, ttlSeconds);
  } catch (error) {
    // Continue even if cache set fails
  }

  return value;
}

/**
 * Cache store for commonly accessed data
 */
export const CACHE_KEYS = {
  // Student data
  student: (studentId: string) => `student:${studentId}`,
  studentCompetencies: (studentId: string) => `student:competencies:${studentId}`,
  studentSkills: (studentId: string) => `student:skills:${studentId}`,

  // Career readiness
  careerReadiness: (studentId: string) => `career:readiness:${studentId}`,
  careerMatches: (studentId: string) => `career:matches:${studentId}`,
  salaryInsights: (studentId: string, sector?: string) =>
    `salary:insights:${studentId}${sector ? ':' + sector : ''}`,

  // Dashboard
  dashboard: (studentId: string) => `dashboard:${studentId}`,
  briefing: (studentId: string) => `briefing:${studentId}`,

  // Analytics
  analyticsMetrics: (universityId: string) => `analytics:metrics:${universityId}`,
  analyticsUniqueStudents: (universityId: string) => `analytics:students:${universityId}`,
  analyticsCohortComparison: (universityId: string, cohort: string) =>
    `analytics:cohort:${universityId}:${cohort}`,

  // Assessments
  assessmentResults: (submissionId: string) => `assessment:results:${submissionId}`,
  assessmentModules: (universityId: string) => `assessment:modules:${universityId}`,

  // User data (lighter cache)
  userPermissions: (userId: string) => `user:permissions:${userId}`,
};

/**
 * TTL values for different cache types
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute — user-specific, frequently changing
  MEDIUM: 300, // 5 minutes — aggregate data, moderate change
  LONG: 3600, // 1 hour — reference data, infrequently changed
  VERY_LONG: 86400, // 24 hours — static reference data
};

/**
 * Preset cache configurations
 */
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  CAREER_READINESS: {
    ttlSeconds: CACHE_TTL.MEDIUM,
    key: CACHE_KEYS.careerReadiness('{studentId}'),
    invalidateOn: ['competency', 'skillProgress', 'assessmentSubmission'],
  },
  STUDENT_DASHBOARD: {
    ttlSeconds: CACHE_TTL.SHORT,
    key: CACHE_KEYS.dashboard('{studentId}'),
    invalidateOn: ['enrollment', 'course', 'assessmentSubmission', 'calendar'],
  },
  ANALYTICS_METRICS: {
    ttlSeconds: CACHE_TTL.LONG,
    key: CACHE_KEYS.analyticsMetrics('{universityId}'),
    invalidateOn: ['student', 'assessmentSubmission', 'enrollment'],
  },
};

export default redis;
