/**
 * Compatibility shim: many modules import `@/lib/prisma` while the canonical
 * Prisma client lives in `@/lib/db`. Re-export it under both the named
 * (`{ prisma }`) and default forms so every existing import resolves.
 */
import { db } from './db';

export const prisma = db;
export default db;
