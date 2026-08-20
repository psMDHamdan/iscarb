/**
 * iSCARB Database RLS — Tenant Context Setter
 * ===========================================================================
 * Sets the PostgreSQL session variable `app.current_university_id` on every
 * request so RLS policies (Section 11.1.1) can enforce tenant isolation
 * at the database level.
 *
 * Must be called after JWT validation in API middleware.
 * ===========================================================================
 */
import "server-only";
import { db } from "@/lib/db";

/**
 * Validate university ID to prevent SQL injection.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
function validateUniversityId(value: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(value);
}

/**
 * Set the tenant context for the current database session.
 * This enables RLS policies to filter rows by universityId.
 *
 * @param universityId - The authenticated user's university ID from JWT
 */
export async function setTenantContext(universityId: string | null): Promise<void> {
  const value = universityId || '';
  // Validate input to prevent SQL injection
  if (value && !validateUniversityId(value)) {
    throw new Error('Invalid university ID format');
  }
  // Use $executeRaw with parameterized value for safe SET
  await db.$executeRaw`SELECT set_config('app.current_university_id', ${value}, false)`;
}

/**
 * Clear the tenant context (e.g., on logout or for system-level operations).
 */
export async function clearTenantContext(): Promise<void> {
  await db.$executeRaw`SET app.current_university_id = ''`;
}

/**
 * Get the current tenant context (for debugging/logging).
 */
export async function getTenantContext(): Promise<string | null> {
  const result = await db.$queryRaw<{ app: { current_university_id: string } }>`
    SHOW app.current_university_id
  `;
  return result?.[0]?.app?.current_university_id || null;
}
