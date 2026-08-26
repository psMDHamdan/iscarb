# ─────────────────────────────────────────────────────────────────────────────
#  iSCARB — production Dockerfile (long-lived Node process)
#  Build:  docker build --build-arg GIT_COMMIT_SHA=$(git rev-parse HEAD) -t iscarb-api .
#  Migrate: docker compose run --rm migrate   OR   sh scripts/migrate-deploy.sh
#  Run:     docker run -d --env-file .env.production -p 3000:3000 iscarb-api
# ─────────────────────────────────────────────────────────────────────────────
#  Secrets are injected at runtime via env / Docker secrets — never baked in.
#  Migrations run as an explicit deploy step (see scripts/migrate-deploy.sh).
#  Deployment path: VM / Docker only — not serverless.

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ── Stage: migrate (explicit deploy step — NOT used at app boot) ─────────────
FROM node:22-alpine AS migrate
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --no-audit --no-fund && npx prisma generate
CMD ["npx", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV IS_DOCKER=true

# Placeholders satisfy import-time client constructors during `next build` only.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    OPENAI_API_KEY=build-time-placeholder-not-a-secret \
    NVIDIA_API_KEY=build-time-placeholder-not-a-secret \
    JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIB...\n-----END PRIVATE KEY-----" \
    JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIB...\n-----END PUBLIC KEY-----"

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Injected at build time so GET /api/health can report the release under test.
ARG GIT_COMMIT_SHA=unknown
ENV GIT_COMMIT_SHA=$GIT_COMMIT_SHA

RUN apk add --no-cache openssl wget
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/scripts/validate-env.mjs ./scripts/validate-env.mjs

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1

# Migrations are NOT run here — operator runs `npx prisma migrate deploy` before start.
CMD ["sh", "-c", "node scripts/validate-env.mjs && node server.js"]
