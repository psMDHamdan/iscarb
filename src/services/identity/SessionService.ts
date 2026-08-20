import { randomBytes } from 'crypto';
import { redis } from '@/config/redis';

export interface SessionData {
  userId: string;
  orgId: string;
  issuedAt: number;
  expiresAt: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
  mfaVerified?: boolean;
}

const SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds

export class SessionService {
  /**
   * Create a new session in Redis and enforce concurrent limits
   */
  static async createSession(
    userId: string,
    orgId: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
    mfaVerified: boolean = false
  ): Promise<string> {
    const sessionId = `sess:${randomBytes(16).toString('hex')}`;
    const now = Math.floor(Date.now() / 1000);

    const sessionData: SessionData = {
      userId,
      orgId,
      issuedAt: now,
      expiresAt: now + SESSION_TTL,
      lastActivity: now,
      ipAddress,
      userAgent,
      mfaVerified,
    };

    if (redis) {
      try {
        await this.enforceConcurrentLimits(userId, role);
        
        // Save session
        await redis.setex(
          `session:${sessionId}`,
          SESSION_TTL,
          JSON.stringify(sessionData)
        );

        // Add to user's set of active sessions
        await redis.sadd(`user_sessions:${userId}`, sessionId);
        await redis.expire(`user_sessions:${userId}`, SESSION_TTL);
      } catch (e) {
        console.warn('Redis error during createSession. Proceeding statelessly.', e);
      }
    }

    return sessionId;
  }

  /**
   * Validate a session by ID
   */
  static async validateSession(sessionId: string): Promise<SessionData | null> {
    if (!redis) {
      return { userId: "stateless", orgId: "stateless", issuedAt: 0, expiresAt: 0, lastActivity: 0 };
    }

    try {
      const dataStr = await redis.get(`session:${sessionId}`);
      if (!dataStr) return null;

      const data = JSON.parse(dataStr) as SessionData;
      
      // Update last activity
      data.lastActivity = Math.floor(Date.now() / 1000);
      await redis.setex(`session:${sessionId}`, SESSION_TTL, JSON.stringify(data));

      return data;
    } catch (e) {
      console.warn('Redis error during validateSession', e);
      return { userId: "stateless", orgId: "stateless", issuedAt: 0, expiresAt: 0, lastActivity: 0 };
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getActiveSessions(userId: string): Promise<{ sessionId: string; data: SessionData }[]> {
    if (!redis) return [];

    try {
      const sessionIds = await redis.smembers(`user_sessions:${userId}`);
      const sessions: { sessionId: string; data: SessionData }[] = [];

      for (const sid of sessionIds) {
        const dataStr = await redis.get(`session:${sid.startsWith('session:') ? sid : `session:${sid}`}`);
        if (dataStr) {
          const data = JSON.parse(dataStr) as SessionData;
          sessions.push({ sessionId: sid.startsWith('session:') ? sid.replace('session:', '') : sid, data });
        }
      }

      // Sort by last activity (most recent first)
      return sessions.sort((a, b) => b.data.lastActivity - a.data.lastActivity);
    } catch (e) {
      console.warn('Redis error during getActiveSessions', e);
      return [];
    }
  }

  /**
   * Check if a session has been explicitly revoked
   */
  static async isSessionRevoked(sessionId: string): Promise<boolean> {
    if (!redis) return false;
    try {
      const revoked = await redis.get(`revoked:${sessionId}`);
      return revoked === "true";
    } catch {
      return false;
    }
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(sessionId: string, userId: string): Promise<void> {
    if (!redis) return;
    
    try {
      const cleanId = sessionId.startsWith("session:") ? sessionId.replace("session:", "") : sessionId;
      await redis.setex(`revoked:${cleanId}`, SESSION_TTL, "true");
      await redis.del(`session:${cleanId}`);
      await redis.srem(`user_sessions:${userId}`, cleanId);
    } catch (e) {
      console.warn('Redis error during revokeSession', e);
    }
  }

  /**
   * Revoke all sessions for a user except the current one
   */
  static async revokeAllSessions(userId: string, currentSessionId: string): Promise<number> {
    if (!redis) return 0;

    try {
      const sessionIds = await redis.smembers(`user_sessions:${userId}`);
      let revokedCount = 0;

      for (const sid of sessionIds) {
        if (sid !== currentSessionId) {
          await redis.del(`session:${sid.startsWith('session:') ? sid : `session:${sid}`}`);
          await redis.srem(`user_sessions:${userId}`, sid);
          revokedCount++;
        }
      }

      return revokedCount;
    } catch (e) {
      console.warn('Redis error during revokeAllSessions', e);
      return 0;
    }
  }

  /**
   * Enforce concurrent session limits per role
   */
  private static async enforceConcurrentLimits(userId: string, role: string) {
    if (!redis) return;

    let limit = 2; // Student default
    switch (role) {
      case 'system':
      case 'admin':
        limit = 10;
        break;
      case 'dean':
        limit = 5;
        break;
      case 'faculty':
      case 'recruiter':
        limit = 3;
        break;
    }

    const activeSessions = await redis.smembers(`user_sessions:${userId}`);
    
    // Check if over limit
    if (activeSessions.length >= limit) {
      // Find the oldest session to revoke (simple implementation: just pop a random one)
      // In a production system we would fetch all session data and delete the oldest `issuedAt`
      const oldestSession = activeSessions[0];
      await this.revokeSession(oldestSession, userId);
    }
  }
}
