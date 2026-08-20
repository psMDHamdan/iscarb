/**
 * Password reset & history — bcrypt for passwords, HMAC for reset tokens.
 * Tokens: cryptographically random, stored as HMAC (never plaintext), single-use, short TTL.
 * Passwords: bcrypt only (same family as AuthService login).
 */
import "server-only";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { randomBytes, createHmac } from "crypto";

const BCRYPT_ROUNDS = 12;
/** Reset tokens expire after 1 hour. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export class PasswordResetConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordResetConfigError";
  }
}

/**
 * Require a dedicated secret for hashing reset tokens.
 * Fail closed — never use a hardcoded default.
 */
export function requirePasswordResetSecret(): string {
  const secret =
    process.env.PASSWORD_RESET_SECRET?.trim() ||
    process.env.RESET_SECRET?.trim() ||
    "";
  if (!secret || secret.length < 32) {
    throw new PasswordResetConfigError(
      "PASSWORD_RESET_SECRET is not configured (min 32 characters). Password reset is disabled until set.",
    );
  }
  return secret;
}

export function hashResetToken(token: string, secret?: string): string {
  const key = secret ?? requirePasswordResetSecret();
  return createHmac("sha256", key).update(token).digest("hex");
}

export async function hashPassword(raw: string): Promise<string> {
  return bcrypt.hash(raw, BCRYPT_ROUNDS);
}

export async function verifyPassword(raw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(raw, hash);
}

export class PasswordService {
  /**
   * Generate a password reset token, store only its HMAC, return raw token for email.
   * Always returns success-shaped result for unknown emails (anti-enumeration).
   */
  static async requestPasswordReset(
    email: string,
  ): Promise<{ ok: true; token?: string; userId?: string }> {
    requirePasswordResetSecret();

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (!user) {
      return { ok: true };
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    // Invalidate prior unused tokens for this user (single active reset path).
    await db.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await db.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return { ok: true, token, userId: user.id };
  }

  /**
   * Validate token (HMAC lookup), bcrypt-hash new password, mark token used (single-use).
   */
  static async resetPassword(token: string, newPasswordRaw: string): Promise<{ userId: string }> {
    requirePasswordResetSecret();

    if (!token || token.length < 32) {
      throw new Error("Invalid or expired reset token");
    }

    const tokenHash = hashResetToken(token);

    const resetRecord = await db.passwordReset.findFirst({
      where: {
        tokenHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      throw new Error("Invalid or expired reset token");
    }

    await this.checkPasswordHistory(resetRecord.userId, newPasswordRaw);

    const newPasswordHash = await hashPassword(newPasswordRaw);

    await db.$transaction([
      db.user.update({
        where: { id: resetRecord.userId },
        data: { password: newPasswordHash },
      }),
      db.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
      // Burn any other unused tokens for this user.
      db.passwordReset.updateMany({
        where: {
          userId: resetRecord.userId,
          used: false,
          id: { not: resetRecord.id },
        },
        data: { used: true },
      }),
      db.passwordHistory.create({
        data: {
          userId: resetRecord.userId,
          passwordHash: newPasswordHash,
        },
      }),
    ]);

    return { userId: resetRecord.userId };
  }

  /**
   * Authenticated password change — verify current with bcrypt, store new with bcrypt.
   */
  static async changePassword(
    userId: string,
    currentPasswordRaw: string,
    newPasswordRaw: string,
  ): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user?.password) {
      throw new Error("User not found");
    }

    const ok = await verifyPassword(currentPasswordRaw, user.password);
    if (!ok) {
      throw new Error("Current password is incorrect");
    }

    await this.checkPasswordHistory(userId, newPasswordRaw);
    const newPasswordHash = await hashPassword(newPasswordRaw);

    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { password: newPasswordHash },
      }),
      db.passwordHistory.create({
        data: {
          userId,
          passwordHash: newPasswordHash,
        },
      }),
    ]);
  }

  private static async checkPasswordHistory(userId: string, newPasswordRaw: string) {
    try {
      const history = await db.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      for (const record of history) {
        const isMatch = await bcrypt.compare(newPasswordRaw, record.passwordHash);
        if (isMatch) {
          throw new Error("Password has been used recently. Please choose a new one.");
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("used recently")) throw err;
      // History table may be unavailable — do not block reset on infra gap.
    }
  }
}
