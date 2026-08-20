/**
 * Password Policy for iSCARB
 * ===========================================================================
 * Defines password complexity requirements and validation rules
 * to ensure secure authentication practices.
 */

import { z } from "zod";

/**
 * Password configuration
 */
export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxConsecutiveIdenticalChars: 3,
  preventCommonWords: true,
  maxPasswordAgeDays: 90, // Require change every 90 days
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
  passwordHistorySize: 10, // Remember last 10 passwords
} as const;

/**
 * Zod schema for password validation
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_POLICY.minLength, {
    message: `Password must be at least ${PASSWORD_POLICY.minLength} characters long`,
  })
  .max(PASSWORD_POLICY.maxLength, {
    message: `Password must not exceed ${PASSWORD_POLICY.maxLength} characters`,
  })
  .refine(
    (value) => /[A-Z]/.test(value) || !PASSWORD_POLICY.requireUppercase,
    {
      message: "Password must contain at least one uppercase letter",
    }
  )
  .refine(
    (value) => /[a-z]/.test(value) || !PASSWORD_POLICY.requireLowercase,
    {
      message: "Password must contain at least one lowercase letter",
    }
  )
  .refine(
    (value) => /\d/.test(value) || !PASSWORD_POLICY.requireNumbers,
    {
      message: "Password must contain at least one number",
    }
  )
  .refine(
    (value) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) ||
      !PASSWORD_POLICY.requireSpecialChars,
    {
      message:
        "Password must contain at least one special character (!@#$%^&*()_+-=[]{};':\"|,.<>/?)",
    }
  )
  .refine(
    (value) => {
      // Check for consecutive identical characters
      const maxConsecutive = PASSWORD_POLICY.maxConsecutiveIdenticalChars;
      for (let i = 0; i < value.length; i++) {
        let count = 1;
        while (
          i + count < value.length &&
          value[i + count] === value[i] &&
          count < maxConsecutive
        ) {
          count++;
        }
        if (count > maxConsecutive) {
          return false;
        }
      }
      return true;
    },
    {
      message: `Password cannot have more than ${PASSWORD_POLICY.maxConsecutiveIdenticalChars} consecutive identical characters`,
    }
  )
  .refine(
    (value) => {
      // Basic check for common passwords (in practice, use a more comprehensive list)
      const commonPasswords = [
        "password",
        "123456",
        "12345678",
        "123456789",
        "1234567890",
        "qwerty",
        "abc123",
        "monkey",
        "letmein",
        "dragon",
        "111111",
        "baseball",
        "iloveyou",
        "trustno1",
        "sunshine",
        "master",
        "welcome",
        "password1",
        "superman",
      ];
      const lowerValue = value.toLowerCase();
      return !commonPasswords.some((p) => lowerValue.includes(p));
    },
    {
      message: "Password contains commonly used patterns",
    }
  );

/**
 * Validate a password against the policy
 * @returns {boolean} true if password is valid
 */
export function isValidPassword(password: string): boolean {
  try {
    passwordSchema.parse(password);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get password validation error messages
 * @returns {string[]} array of error messages (empty if valid)
 */
export function getPasswordErrors(password: string): string[] {
  try {
    passwordSchema.parse(password);
    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors.map((err) => err.message);
    }
    return ["Invalid password"];
  }
}

/**
 * Generate a strong random password
 * @param length - length of password (default: 16)
 * @returns {string} generated password
 */
export function generateSecurePassword(length = 16): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{};':\"|,.<>/?";

  // Ensure we have at least one of each required type
  let password =
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    specialChars[Math.floor(Math.random() * specialChars.length)];

  // Fill the rest with random characters
  const allChars = uppercase + lowercase + numbers + specialChars;
  while (password.length < length) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Check if password needs to be rotated based on age
 * @param lastChangedDate - when password was last changed
 * @returns {boolean} true if password needs rotation
 */
export function passwordNeedsRotation(lastChangedDate: Date): boolean {
  const now = new Date();
  const daysSinceChange = Math.floor(
    (now.getTime() - lastChangedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysSinceChange >= PASSWORD_POLICY.maxPasswordAgeDays;
}

/**
 * Hash password (placeholder - in real implementation, use bcrypt or similar)
 * @param password - plain text password
 * @returns {Promise<string>} hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // In a real implementation, you would use bcrypt or argon2
  // For now, we'll just return the password (NOT SECURE - for demo only)
  // WARNING: This is not secure! Replace with proper hashing in production.
  return password;
}

/**
 * Verify password against hash
 * @param password - plain text password
 * @param hashedPassword - hashed password
 * @returns {Promise<boolean>} true if password matches
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // In a real implementation, you would compare the hash
  // For now, we'll just do a direct comparison (NOT SECURE - for demo only)
  // WARNING: This is not secure! Replace with proper verification in
  return password === hashedPassword;
}

export default {
  PASSWORD_POLICY,
  passwordSchema,
  isValidPassword,
  getPasswordErrors,
  generateSecurePassword,
  passwordNeedsRotation,
  hashPassword,
  verifyPassword,
};