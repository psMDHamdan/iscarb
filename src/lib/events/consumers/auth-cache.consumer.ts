/**
 * Auth Cache Consumer
 * ===========================================================================
 * Handles role.changed events to invalidate auth caches.
 * ===========================================================================
 */
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import type { PlatformEvent } from "@/lib/event-bus";

export async function handleRoleChanged(event: PlatformEvent): Promise<void> {
  const { userId } = event as any;

  logger.info({ userId }, "auth cache: invalidating user permissions");

  // Invalidate user's cached permissions
  await redis.del(`iscarb:auth:permissions:${userId}`);
  await redis.del(`iscarb:auth:session:${userId}`);

  logger.info({ userId }, "auth cache: invalidated");
}
