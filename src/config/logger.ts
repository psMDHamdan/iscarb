/**
 * iSCARB Structured Logging — Pino.
 * ===========================================================================
 * Emits JSON logs in production, pretty-printed in dev. Every log line carries
 * a stable schema so it can be ingested by Loki/ELK/Datadog.
 *
 *   {
 *     "level": "info",
 *     "time": 1719...,
 *     "service": "iscarb-api",
 *     "env": "production",
 *     "module": "api-guard",
 *     "msg": "...",
 *     "requestId": "...",
 *     "tenant": "KFU",
 *     "route": "/api/iscarb/students",
 *     ...extra fields
 *   }
 *
 * Usage:
 *   import { logger, moduleLogger } from "@/lib/logger";
 *   const log = moduleLogger("career-map");
 *   log.info({ studentId, title }, "career mapping generated");
 *   log.warn({ threshold }, "dean notification dispatched");
 *   log.error({ err: e.message }, "AI call failed — fallback used");
 * ===========================================================================
 */
import "server-only";
import pino from "pino";

const isProd = process.env.NODE_ENV === "production";
const service = process.env.OTEL_SERVICE_NAME || "iscarb-api";
const level = process.env.LOG_LEVEL || (isProd ? "info" : "debug");

const baseLogger = pino({
  name: service,
  level,
  base: {
    service,
    env: process.env.NODE_ENV || "development",
  },
  redact: {
    // Never log secrets — redact by key path.
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.x-iscarb-key",
      "*.apiKey",
      "*.api_key",
      "*.password",
      "*.secret",
      "*.token",
      "NVIDIA_API_KEY",
      "OPENAI_API_KEY",
      "ISCARB_JWT_SECRET",
      "DATABASE_URL",
    ],
    censor: "[REDACTED]",
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  // NB: no transport in dev — pino's thread-stream uses Worker() which
  // Turbopack/Next.js can't resolve (virtual module paths). JSON output
  // is still readable in the terminal.
  ...(isProd
    ? {}
    : {}),
});

export type Logger = typeof baseLogger;

/** Create a child logger scoped to a module (adds module field to every line). */
export function moduleLogger(module: string, extra?: Record<string, unknown>): Logger {
  return baseLogger.child({ module, ...extra });
}

export const logger = baseLogger;
export default baseLogger;
