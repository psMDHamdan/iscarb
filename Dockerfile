# ─────────────────────────────────────────────────────────────────────────────
#  iSCARB — multi-stage production Dockerfile
#  Build: docker build -t iscarb-api .
#  Run:   docker compose up -d  (uses docker-compose.yml)
# ─────────────────────────────────────────────────────────────────────────────
#  Production secrets: do NOT bake a .env into the image. Secrets are injected
#  at runtime via Docker Secrets / Vault / the orchestrator's env plane.
#  See docker-compose.yml → `secrets:` + environment mapping.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json bun.lock* ./
# The root `postinstall` runs `prisma generate`, so the schema must be present
# before install or npm exits 1 and takes the whole build down.
COPY prisma ./prisma
RUN npm install --no-audit --no-fund

# ── Stage 2: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js imports every route module during "Collecting page data", and some
# modules construct clients (OpenAI, Prisma) at import time. These placeholders
# only satisfy those constructors during the build — they are NOT secrets, they
# never reach the runner stage (separate FROM), and the real values are injected
# at runtime. Do not add NEXT_PUBLIC_* here: those get inlined into client JS.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    OPENAI_API_KEY=sk-build-time-placeholder-not-a-secret \
    NVIDIA_API_KEY=build-time-placeholder-not-a-secret \
    NEXTAUTH_SECRET=build-time-placeholder-not-a-secret \
    ISCARB_JWT_SECRET=build-time-placeholder-not-a-secret-min-32-chars

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client (schema.prisma already targets PostgreSQL)
RUN npx prisma generate
# Create the migration artifacts from the production schema so `prisma migrate
# deploy` can apply them at boot.
RUN npx prisma migrate dev --create-only --name init --skip-seed 2>/dev/null || true
RUN npm run build

# ── Stage 3: runner (minimal) ───────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy standalone Next.js output + public assets + prisma schema + migrations
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# Prisma CLI is needed for `migrate deploy` at boot.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000

# ── Boot sequence ───────────────────────────────────────────────────────────
# 1. Apply pending migrations (idempotent; uses DATABASE_URL from env at runtime)
# 2. Start the Next.js standalone server
# Secrets are read from /run/secrets/* or env at runtime — never baked in.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/iscarb/overview >/dev/null 2>&1 || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node server.js"]
