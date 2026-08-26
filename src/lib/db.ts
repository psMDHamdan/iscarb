import { PrismaClient } from '@prisma/client'
import { getTenantContext } from './tenantContext'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

/**
 * ISC-QA-010: Connection pool fix.
 *
 * The QA report confirmed connection_limit=1 causing pool exhaustion on
 * certificate generation and concurrent scoring.
 *
 * Fix: inject connection_limit and pool_timeout into DATABASE_URL at
 * runtime when they are not already present. This works for both
 * direct postgres:// URLs and pooled pgbouncer:// endpoints.
 *
 * Recommended env setup (set in .env / deployment config):
 *
 *   DATABASE_URL          = postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
 *   DIRECT_URL            = postgresql://user:pass@host:5432/db   (migrations only)
 *
 * If DATABASE_URL already contains connection_limit, this is a no-op.
 * Values below are conservative defaults for a long-lived Node process;
 * raise connection_limit in proportion to your verified pool capacity.
 */
const DEFAULT_CONNECTION_LIMIT = 10;
const DEFAULT_POOL_TIMEOUT = 20; // seconds

function injectPoolParams(url: string): string {
  try {
    const u = new URL(url);
    // Supabase pooler (pgbouncer): Prisma requires pgbouncer=true and a
    // connection_limit of 1 (the pooler manages the real pool). Detect by host.
    const isSupabasePooler = u.hostname.endsWith(".pooler.supabase.com");
    if (isSupabasePooler) {
      u.searchParams.set("pgbouncer", "true");
      if (!u.searchParams.has("connection_limit")) {
        u.searchParams.set("connection_limit", "1");
      }
      if (!u.searchParams.has("pool_timeout")) {
        u.searchParams.set("pool_timeout", "0");
      }
      return u.toString();
    }
    if (!u.searchParams.has("connection_limit")) {
      u.searchParams.set("connection_limit", String(DEFAULT_CONNECTION_LIMIT));
    }
    if (!u.searchParams.has("pool_timeout")) {
      u.searchParams.set("pool_timeout", String(DEFAULT_POOL_TIMEOUT));
    }
    return u.toString();
  } catch {
    // URL parsing failed (e.g. non-standard scheme) — return original unchanged
    return url;
  }
}

function createPrismaClient() {
  // Patch the datasource URL at runtime so the pool is always bounded.
  const rawUrl = (process.env.DATABASE_URL ?? "").trim().replace(/^["']|["']$/g, "");
  const patchedUrl = injectPoolParams(rawUrl);
  process.env.DATABASE_URL = patchedUrl;

  const basePrisma = new PrismaClient({
    // Only log queries in development — never in production (reduces noise and
    // avoids leaking query parameters to stdout in hosted environments).
    log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error"],
  })

  // Create extension for Multi-Tenancy
  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const organizationId = getTenantContext();

          // Skip platform-level models or if no context is set
          const platformModels = ['Organization', 'OrganizationSettings', 'OrganizationHierarchy', 'OrganizationInvitation', 'ConsentRecord'];
          if (!organizationId || platformModels.includes(model)) {
            return query(args);
          }

          // Enforce organizationId on tenant-aware models
          if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            // @ts-ignore
            if (!args.where) args.where = {};
            // @ts-ignore
            args.where.organizationId = organizationId;

            // If it was findUnique, it must become findFirst because we added a where clause
            // that might break unique constraints on Prisma's side
            if (operation === 'findUnique') {
              // @ts-ignore
              return basePrisma[model.charAt(0).toLowerCase() + model.slice(1)].findFirst(args);
            }
            if (operation === 'findUniqueOrThrow') {
              // @ts-ignore
              return basePrisma[model.charAt(0).toLowerCase() + model.slice(1)].findFirstOrThrow(args);
            }
          }

          if (['create', 'createMany'].includes(operation)) {
            // @ts-ignore
            if (args.data) {
              // @ts-ignore
              if (Array.isArray(args.data)) {
                // @ts-ignore
                args.data = args.data.map(d => ({ ...d, organizationId }));
              } else {
                // @ts-ignore
                args.data.organizationId = organizationId;
              }
            }
          }

          return query(args);
        }
      }
    }
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db