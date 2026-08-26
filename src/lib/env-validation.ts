/**
 * Production environment validation — fail fast at boot if required config is missing.
 * Called from instrumentation.ts (Next.js server start) and scripts/validate-env.mjs.
 */
import "server-only";

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvValidationError";
  }
}

function read(name: string): string | undefined {
  const fileVar = process.env[`${name}_FILE`];
  if (fileVar) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs") as typeof import("fs");
      const val = fs.readFileSync(fileVar, "utf8").trim();
      if (val) return val;
    } catch {
      /* fall through */
    }
  }
  const val = process.env[name]?.trim();
  return val || undefined;
}

function requireOne(names: string[], label: string, errors: string[]): void {
  if (names.some((n) => read(n))) return;
  errors.push(`${label}: set one of ${names.join(" or ")}`);
}

/** Throws EnvValidationError when production-required variables are missing or invalid. */
export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const errors: string[] = [];

  requireOne(["DATABASE_URL"], "PostgreSQL", errors);
  requireOne(["REDIS_URL"], "Redis", errors);
  requireOne(["JWT_PRIVATE_KEY"], "JWT signing key", errors);
  requireOne(["JWT_PUBLIC_KEY"], "JWT verification key", errors);

  const resetSecret = read("PASSWORD_RESET_SECRET") || read("RESET_SECRET");
  if (!resetSecret || resetSecret.length < 32) {
    errors.push("PASSWORD_RESET_SECRET: required in production (min 32 characters)");
  }

  const certSecret = read("CERTIFICATE_ID_SECRET");
  if (!certSecret || certSecret.length < 16) {
    errors.push("CERTIFICATE_ID_SECRET: required in production (min 16 characters)");
  }

  if (!read("NEXT_PUBLIC_APP_URL")) {
    errors.push("NEXT_PUBLIC_APP_URL: required in production (public site URL for links/callbacks)");
  }

  const hasNvidia =
    read("NVIDIA_API_KEY") ||
    read("NVIDIA_API_KEY_2") ||
    read("OPENAI_API_KEY");
  if (!hasNvidia) {
    errors.push("NVIDIA_API_KEY (or OPENAI_API_KEY): at least one AI provider key is required");
  }

  const hasStorageCreds =
    (read("LECTURE_STORAGE_ACCESS_KEY") || read("AWS_ACCESS_KEY_ID")) &&
    (read("LECTURE_STORAGE_SECRET_KEY") || read("AWS_SECRET_ACCESS_KEY"));
  if (read("LECTURE_STORAGE_ACCESS_KEY") && !hasStorageCreds) {
    errors.push(
      "Object storage: set LECTURE_STORAGE_BUCKET, LECTURE_STORAGE_REGION, LECTURE_STORAGE_ACCESS_KEY, LECTURE_STORAGE_SECRET_KEY (in-Kingdom bucket for Dammam deploy)",
    );
  }

  if (read("ISCARB_AUTH_DISABLED") === "true") {
    errors.push("ISCARB_AUTH_DISABLED must not be 'true' in production");
  }

  if (errors.length > 0) {
    throw new EnvValidationError(
      `Production environment validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }
}
