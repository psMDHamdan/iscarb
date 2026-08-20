/**
 * Environment variables validation and export.
 * ===========================================================================
 * Central place to access all env vars with type safety and defaults.
 * This is the file imported by services (e.g., rdf-dashboard.service.ts)
 * as `import { env } from "@/env.mjs"`.
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "3000",
  HOST: process.env.HOST || "localhost",

  // Database
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://postgres:iscarb_dev_password@127.0.0.1:5433/iscarb",

  // Redis
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6380",

  // RDF / SPARQL (Apache Fuseki or similar)
  RDF_SPARQL_ENDPOINT:
    process.env.RDF_SPARQL_ENDPOINT || "http://localhost:3030/iscarb/query",

  // Auth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "dev-secret-key-change-in-production",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  ISCARB_JWT_SECRET:
    process.env.ISCARB_JWT_SECRET ||
    "your-secret-key-change-in-production-min-32-chars-1234567890ab",

  // AI / DeepSeek-or-GPT-OSS (served through the NVIDIA API)
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || "",
  NVIDIA_BASE_URL:
    process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL || "openai/gpt-oss-20b",
};
