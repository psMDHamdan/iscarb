#!/usr/bin/env node
/**
 * Standalone production env check — run before `node server.js` or in CI/deploy scripts.
 * Usage: NODE_ENV=production node scripts/validate-env.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function read(name) {
  const fileVar = process.env[`${name}_FILE`];
  if (fileVar) {
    try {
      const fs = require("fs");
      const val = fs.readFileSync(fileVar, "utf8").trim();
      if (val) return val;
    } catch {
      /* fall through */
    }
  }
  const val = process.env[name]?.trim();
  return val || undefined;
}

function requireOne(names, label, errors) {
  if (names.some((n) => read(n))) return;
  errors.push(`${label}: set one of ${names.join(" or ")}`);
}

function validateProductionEnv() {
  if (process.env.NODE_ENV !== "production" || process.env.SKIP_ENV_VALIDATION === "true") {
    if (process.env.NODE_ENV !== "production") {
      console.log("[validate-env] NODE_ENV is not production — skipping strict checks");
    }
    return;
  }

  const errors = [];

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
    errors.push("NEXT_PUBLIC_APP_URL: required in production");
  }

  const hasNvidia =
    read("NVIDIA_API_KEY") ||
    read("NVIDIA_API_KEY_2") ||
    read("OPENAI_API_KEY");
  if (!hasNvidia) {
    errors.push("NVIDIA_API_KEY (or OPENAI_API_KEY): at least one AI provider key is required");
  }

  const hasStorageBucket = read("LECTURE_STORAGE_BUCKET");
  const hasStorageCreds =
    (read("LECTURE_STORAGE_ACCESS_KEY") || read("AWS_ACCESS_KEY_ID")) &&
    (read("LECTURE_STORAGE_SECRET_KEY") || read("AWS_SECRET_ACCESS_KEY"));
  if (!hasStorageBucket || !hasStorageCreds) {
    errors.push(
      "Object storage: LECTURE_STORAGE_BUCKET + access/secret keys required in production",
    );
  }

  if (read("ISCARB_AUTH_DISABLED") === "true") {
    errors.push("ISCARB_AUTH_DISABLED must not be 'true' in production");
  }

  if (errors.length > 0) {
    console.error("Production environment validation failed:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("[validate-env] Production environment OK");
}

validateProductionEnv();
