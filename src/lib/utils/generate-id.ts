/**
 * Cryptographically secure ID generation utility.
 *
 * Uses `crypto.randomUUID()` (Node.js ≥ 14.17 built-in) with fallback
 * to the `uuid` v4 package for older environments.
 *
 * Satisfies Requirements 3.1, 3.2, 3.3, 3.4 — all entity identifiers,
 * session tokens, and correlation IDs must come from a CSPRNG source,
 * never from `Math.random()`.
 */
import { randomUUID } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID v4 string using a cryptographically secure source.
 *
 * @returns A UUID v4 string, e.g. "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateId(): string {
  try {
    return randomUUID();
  } catch {
    return uuidv4();
  }
}

/**
 * Generate a short random token suitable for use in composite identifiers
 * (e.g., "quiz_<token>", "build-<token>") using a cryptographically secure
 * source. Returns 8 hex characters derived from a UUID v4.
 *
 * NOTE: For primary keys or foreign keys that must conform to UUID v4 format,
 * use `generateId()` directly.
 */
export function generateToken(length = 8): string {
  const id = generateId();
  // Strip hyphens and take the first `length` characters
  return id.replace(/-/g, '').slice(0, length);
}
