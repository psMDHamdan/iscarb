# iSCARB Deployment Guide — Google Cloud Dammam (VM / Container)

Long-lived Node.js process deployment for the iSCARB platform. **Not serverless.**  
Lecture generation runs in-process for minutes — use a VM or container with generous timeouts and memory (≥2 GB recommended).

**Branch:** `clean-code`  
**Node:** 22 LTS (see `.nvmrc`)  
**Build:** `npm run build:docker` (sets `IS_DOCKER=true` → Next.js `output: "standalone"`)  
**Start:** `node server.js` (from standalone output root)  
**Migrations:** explicit deploy step — **never at container boot**

---

## 1. Deployment audit (source of truth)

### Runtime requirements

| Item | Value |
|------|-------|
| Node.js | **22.x** (`engines: >=18.17`, pinned **22** in Dockerfile / `.nvmrc`) |
| npm | **≥ 9** (`packageManager: npm@10.8.2`) |
| Database | PostgreSQL **16+** with **pgvector** extension |
| Cache | Redis **7+** |
| Object storage | S3-compatible (GCS bucket with S3 interoperability for in-Kingdom storage) |
| Process model | Single long-lived Node process (Docker or PM2) |
| Not used | Vercel / serverless (`vercel.json` removed; jobs run in-process via `src/lib/lecture/queue.ts`) |

### Build & start commands

```bash
# Install
npm ci

# Generate Prisma client (also runs on postinstall)
npx prisma generate

# Production build (standalone output for Docker/PM2)
npm run build:docker
# equivalent: IS_DOCKER=true NODE_ENV=production NODE_OPTIONS=--max-old-space-size=8192 next build

# Apply migrations (deploy step — run BEFORE first start and on every schema release)
npm run db:migrate:deploy
# equivalent: npx prisma migrate deploy

# Start (after copying standalone artifacts — see Docker/PM2 sections)
NODE_ENV=production node scripts/validate-env.mjs && node server.js
```

### External services

| Service | Purpose | Required? |
|---------|---------|-----------|
| PostgreSQL + pgvector | Primary datastore, embeddings | **Yes** |
| Redis | Sessions, rate limits, queues, cache | **Yes** |
| S3-compatible object storage | Faculty uploads, exports | **Yes** (prod) |
| NVIDIA API (`integrate.api.nvidia.com`) | AI inference (lecture + assessment) | **Yes** (AI features) |
| SMTP | Password reset / email notifications | Optional |
| Web Push (VAPID) | Browser notifications | Optional |
| Sentry | Error capture | Optional |
| OpenTelemetry OTLP | Distributed tracing | Optional |
| Apache Fuseki / SPARQL | RDF sync layer | Optional (disabled if unset) |
| `QStash` | — | **Not used** (in-process queue on VM) |

### Health check

```
GET /api/health
```

Returns **200** when PostgreSQL **and** Redis are reachable; **503** otherwise. Fuseki status is reported but non-blocking.

Response includes **`commitSha`**: `process.env.GIT_COMMIT_SHA` or `"unknown"`, with header **`Cache-Control: no-store`**, so reviewers can confirm which release is under test.

```bash
# Docker build with release identity
docker build --build-arg GIT_COMMIT_SHA="$(git rev-parse HEAD)" -t iscarb-api .

# Or at runtime (compose / PM2)
export GIT_COMMIT_SHA="$(git rev-parse HEAD)"
```

### Environment variables

See [`.env.example`](.env.example) for the full list with placeholders. Summary:

| Variable | Purpose | Documented in .env.example? |
|----------|---------|----------------------------|
| `DATABASE_URL` | Prisma / Postgres connection | Yes |
| `DIRECT_URL` | Direct DB URL for migrations | Yes |
| `REDIS_URL` | Redis connection | Yes |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | RS256 session tokens | Yes |
| `JWT_*_FILE` | Docker-secret file mounts | Yes (comment) |
| `PASSWORD_RESET_SECRET` | Reset token HMAC (≥32 chars) | Yes |
| `CERTIFICATE_ID_SECRET` | Certificate ID hashing | Yes |
| `ISCARB_AUTH_DISABLED` | Must be `false` in prod | Yes |
| `NEXT_PUBLIC_APP_URL` | Public site URL | Yes |
| `NVIDIA_API_KEY` (+ `_2`…`_5`) | AI inference keys | Yes |
| `NVIDIA_BASE_URL` / `OPENAI_*` | AI endpoint / model | Yes |
| `LECTURE_STORAGE_*` | In-Kingdom object storage | Yes |
| `EXAM_LIVE_GENERATION` | Live AI exam vs question bank | Yes |
| `SMTP_*` / `VAPID_*` | Email / push | Yes |
| `SENTRY_DSN` / `OTEL_*` | Observability | Yes |
| `FUSEKI_*` / `SPARQL_*` | RDF (optional) | Yes |
| `ISCARB_JWT_SECRET` | Legacy HS256 (env.mjs) | Yes |
| `IMPERSONATION_JWT_SECRET` | — | **Not used in current code** |
| `GIT_COMMIT_SHA` | Reported by `GET /api/health` as `commitSha` | Yes |
| `QSTASH_*` | **Unused** — do not set | Commented unused in `.env.example` |

Production boot **fails fast** if required vars are missing (`src/instrumentation.ts` + `scripts/validate-env.mjs`).

---

## 2. Deploy sequence (automated steps)

Run on the VM or in CI **after** cloud resources exist and secrets are injected.

```bash
# 1. Clone / pull release
git clone https://github.com/Yousef-Samman/isCarb.git
cd isCarb && git checkout clean-code

# 2. Install dependencies
npm ci

# 3. Apply database migrations (explicit — NOT at app boot)
export DATABASE_URL="postgresql://..."   # from secret manager
npm run db:migrate:deploy

# 4. Build Docker image OR standalone bundle
docker build -t iscarb-api:latest .
# — OR —
npm run build:docker
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# 5. Start long-lived process
docker run -d --name iscarb \
  --env-file /secure/iscarb.env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  iscarb-api:latest

# 6. Verify health
curl -sf http://localhost:3000/api/health | jq .
```

### Migration command (exact)

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

Wrapper script: [`scripts/migrate-deploy.sh`](scripts/migrate-deploy.sh)  
npm script: `npm run db:migrate:deploy`

**Deploy order:** migrate → build → start. Never rely on boot-time migration.

---

## 3. Docker (recommended for VM)

### Files

- [`Dockerfile`](Dockerfile) — multi-stage, Node 22 Alpine, standalone output
- [`.dockerignore`](.dockerignore) — excludes secrets, tests, local storage

### Build & run

```bash
docker build -t iscarb-api:latest .

# Migrations (one-shot, before start)
docker run --rm --env-file .env.production iscarb-api:latest \
  npx prisma migrate deploy --schema prisma/schema.prisma

# Start app (validates env, then node server.js — NO migrate at boot)
docker run -d --name iscarb --env-file .env.production \
  -p 3000:3000 --restart unless-stopped iscarb-api:latest
```

### Local smoke (Docker Compose)

```bash
docker compose up -d postgres redis
docker compose --profile migrate run --rm migrate
docker compose up -d app
curl http://localhost:3000/api/health
```

Compose sets `SKIP_ENV_VALIDATION=true` for local dev placeholders only.

---

## 4. PM2 alternative (bare VM)

```bash
npm ci
npm run build:docker
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
npm run db:migrate:deploy

cd .next/standalone
NODE_ENV=production pm2 start ../../ecosystem.config.js --env production
pm2 save
```

See [`ecosystem.config.js`](ecosystem.config.js). Memory restart limit: 3 GB.

---

## 5. Object storage (in-Kingdom)

Set in production env (not hardcoded):

```bash
LECTURE_STORAGE_BUCKET=your-ksa-bucket
LECTURE_STORAGE_REGION=me-central2          # Dammam / KSA region
LECTURE_STORAGE_ACCESS_KEY=...
LECTURE_STORAGE_SECRET_KEY=...
# GCS S3 interoperability (if needed):
LECTURE_STORAGE_ENDPOINT=https://storage.googleapis.com
LECTURE_STORAGE_FORCE_PATH_STYLE=true
```

Client: [`src/lib/lecture/storage.ts`](src/lib/lecture/storage.ts) — reads bucket, region, endpoint, and credentials from env.

---

## 6. Manual cloud steps (operator only)

These cannot be done from the repo — perform in **Google Cloud Console** / `gcloud`:

### 6.1 Provision infrastructure (Dammam region)

- [ ] **Compute Engine VM** or **GCE + Docker** (e2-standard-4 or larger; ≥2 GB RAM for app, ≥4 GB if co-located DB)
- [ ] **Cloud SQL PostgreSQL** in `me-central2` (Dammam) with **pgvector** enabled  
      — or self-managed Postgres on the VM with pgvector image (`pgvector/pgvector:pg16`)
- [ ] **Memorystore for Redis** in `me-central2` — or Redis on VM
- [ ] **Cloud Storage bucket** in `me-central2` (in-Kingdom) with HMAC keys for S3 API
- [ ] **VPC / firewall**: allow 443 from load balancer; restrict 5432/6379 to private network only
- [ ] **Static IP + Cloud Load Balancing** (HTTPS termination)
- [ ] **Managed SSL certificate** + DNS A/AAAA record for your domain

### 6.2 Secrets & env

- [ ] Generate RS256 JWT keypair (`JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`)
- [ ] Generate `PASSWORD_RESET_SECRET` (≥32 random chars)
- [ ] Generate `CERTIFICATE_ID_SECRET` (≥16 random chars)
- [ ] Store NVIDIA API key(s) in Secret Manager
- [ ] Store DB password, Redis auth, storage HMAC keys in Secret Manager
- [ ] Create `/secure/iscarb.env.production` on VM or map secrets to container env
- [ ] Set `NEXT_PUBLIC_APP_URL=https://your-domain.edu.sa`
- [ ] Set `ISCARB_AUTH_DISABLED=false`

### 6.3 PDPL / compliance (verify with legal)

- [ ] Confirm PDPL basis for NVIDIA cross-border AI prompt transfer (pilot uses hosted NVIDIA API)
- [ ] Confirm in-Kingdom residency for DB, Redis, object storage, and VM

### 6.4 Post-deploy ops

- [ ] Run `prisma migrate deploy` on each release **before** rolling out new containers
- [ ] Seed reference data if fresh DB (`npm run db:seed` — review scripts first)
- [ ] Configure Sentry / OTLP endpoints if using observability
- [ ] Configure SMTP for password reset emails
- [ ] Set up uptime monitoring on `GET /api/health`
- [ ] Configure log shipping (Pino JSON → Cloud Logging)

---

## 7. What's automated vs manual

| Step | Automated (repo/scripts) | Manual (operator) |
|------|--------------------------|-------------------|
| `npm ci` / Docker build | ✅ | |
| `prisma migrate deploy` | ✅ command provided | Run it with prod `DATABASE_URL` |
| Env validation at boot | ✅ | Provide secrets |
| Health check endpoint | ✅ | Configure LB/monitor |
| Provision VM / Cloud SQL / Redis / bucket | | ✅ GCP Console |
| TLS / DNS | | ✅ |
| NVIDIA / SMTP credentials | | ✅ |
| PDPL sign-off | | ✅ |

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Boot exits immediately | Missing prod env var | Check container logs; run `node scripts/validate-env.mjs` |
| `/api/health` → 503 | DB or Redis unreachable | Verify `DATABASE_URL`, `REDIS_URL`, firewall rules |
| Migrations fail | Wrong `DATABASE_URL` / missing pgvector | Use `DIRECT_URL`; enable `vector` extension |
| Upload fails in prod | Storage env missing | Set all `LECTURE_STORAGE_*` vars |
| Lecture gen killed | Serverless timeout | Must use VM/container — not serverless |

---

## 9. Related docs

- [`docs/iSCARB_Hosting_Deployment_Plan.pdf`](docs/iSCARB_Hosting_Deployment_Plan.pdf) — architecture rationale
- [`docs/HANDOVER.md`](docs/HANDOVER.md) — production readiness / live evidence pack
- [`.env.example`](.env.example) — full env reference

---

*Last updated: deployment readiness pass for Google Cloud Dammam VM/container.*
