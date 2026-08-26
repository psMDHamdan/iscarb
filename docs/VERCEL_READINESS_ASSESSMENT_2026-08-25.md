# SUPERSEDED — decision is to deploy on a long-lived VM (see DEPLOYMENT.md), not Vercel. Retained for reference only.

# Vercel Readiness Assessment — 2026-08-25

**Branch:** `clean-code`  
**Scope:** What it takes to run Faculty AI Copilot (and related long jobs) on Vercel given ~300s serverless function limits, given live evidence that full Studio generation takes **~24 minutes**.  
**Stance:** Report only — **no implementation** in this document.  
**Source of truth:** Current code + measured E2E (`docs/FACULTY_E2E_2026-08-24.md`).

---

## Executive verdict

| Question | Answer |
|----------|--------|
| Can the **whole app** run “as-is” on Vercel today? | **No.** Lecture generate/plan/parse (and assessment live exam gen) use **fire-and-forget in-process** work that outlives the HTTP request. On serverless, that work is **killed** when the function freezes/ends. |
| Can **short** faculty APIs (login, Studio UI, upload image, validate, poll jobs, PPTX download) run on Vercel? | **Mostly yes**, with env, Redis (Upstash), Postgres pooling, S3, and raised `maxDuration` where needed. |
| Where must the **24‑minute generation** run? | **Off Vercel serverless** — a long-lived Node worker (VM/container), or a durable job runner that **invokes chunked work** within timeout budgets (QStash/Inngest → worker routes). Chunking alone is not enough unless each chunk stays under ~300s **and** the orchestrator survives. |
| Existing Redis progress? | **Reusable.** Frontend already polls `GET /api/iscarb/lecture/jobs/[jobId]`; workers already write `lecture:generate:{projectId}` / `lecture:plan:{projectId}` / `lecture:job:{documentId}`. |

`DEPLOYMENT.md` already states the product intent: **long-lived Node process — not serverless.** `vercel.json` exists as a partial/stale sketch (references a **missing** worker route).

---

## 1. Long-running / in-process operations (will break on ~300s serverless)

### 1.1 Faculty slide generation (primary blocker)

| | |
|--|--|
| **Entry** | `POST /api/iscarb/lecture/projects/[id]/generate` → `src/app/api/iscarb/lecture/projects/[id]/generate/route.ts` |
| **Queue** | `enqueueGeneration()` in `src/lib/lecture/queue.ts` → `void generateAllSlides(...)` (**in-process, not awaited**) |
| **Work** | `generateAllSlides` → `generateSlideChunk` + `finalizeGeneration` in `src/lib/lecture/generation/generation-worker.ts` |
| **Measured duration** | **~24.1 min** (1,443,141 ms) for full 20-slide Studio run — `docs/FACULTY_E2E_2026-08-24.md` |
| **Why it fails on Vercel** | Route returns **202** immediately, but work continues on the **same Node isolate**. Serverless freezes/terminates the isolate after the response (or at `maxDuration`). In-process `void` promises do **not** survive. Even Pro `maxDuration` (~300s) is **≪ 24 min**. |
| **Where time goes** (same E2E + code phases) | Pre-slide ~**14 min**: `analysing_sources` → `generating_blueprint` (stuck long at progress 8) → `concept_cards_done`. Then `generating_slides` (per-slide LLM + optional repair + `attachVisualSpecs` / Wikimedia) → `generating_readiness` → `done`. Batch size defaults to **20 concurrent** (`LECTURE_BATCH_SIZE`, worker L277) — many sequential LLM/failover timeouts amplify wall clock. |

**Also triggers the same queue path:**

- `src/app/api/iscarb/lecture/artifacts/[id]/decisions/route.ts` — re-generate one slide after decisions (`enqueueGeneration(projectId, [slideNo])`). Single-slide regen can still exceed 300s when blueprint/analysis re-run + LLM timeouts (live probes often sat minutes at `generating_blueprint`).

### 1.2 Faculty plan generation

| | |
|--|--|
| **Entry** | `POST /api/iscarb/lecture/projects/[id]/plan` → `plan/route.ts` |
| **Queue** | `enqueuePlan()` → `void generateISCARBPlan(...)` (`queue.ts`) |
| **Work** | `src/lib/lecture/planner/plan-generator.ts` |
| **Duration** | AI call **hard-capped at 45s** (`Promise.race` + timeout), then fallback + persist. Wall clock typically **&lt; 2 min** if Redis/DB healthy; comment in plan route still claims “QStash on Vercel” but **code does not call QStash**. |
| **Vercel risk** | Borderline if cold start + slow DB + AI near 45s + validation. **Likely OK** with `maxDuration ≥ 60–120` **if** work were **awaited** in the request — but today it is fire-and-forget, so serverless still **drops** the plan job after 202. |

### 1.3 Source document parse

| | |
|--|--|
| **Entry** | `POST .../sources` → `enqueueParse(document.id)` (`sources/route.ts`) |
| **Work** | `parseSourceDocument` in `src/lib/lecture/ingestion/parse-worker.ts` (load from object storage → parse PDF/PPTX/DOCX/HTML → build blocks) |
| **Duration** | Seconds to a few minutes for large PDFs; not measured at 24 min, but **can exceed 300s** for huge uploads + OCR-ish paths. |
| **Vercel risk** | Same fire-and-forget pattern; large file parse + memory also stress serverless limits. |

### 1.4 Alternate 17-pass pipeline (not the Studio path today)

| | |
|--|--|
| **Code** | `src/lib/lecture/generation/pipeline-trigger.ts` — `triggerPipelineGeneration` → `PipelineRunner.run` fire-and-forget |
| **Status** | Parallel architecture; Studio `POST /generate` uses **`generation-worker` / `queue.ts`**, not this trigger. Still a long in-process job if anything calls it. |

### 1.5 Assessment live exam generation

| | |
|--|--|
| **Queue** | `src/lib/assessment/exam-queue.ts` — `void generateAllForAttempt(attemptId)` |
| **Work** | `src/lib/assessment/live-exam-generation.ts` — many AI modules, generate→critique→regenerate; **process-local overlay cache** (documented as unsafe on multi-instance/serverless). |
| **Vercel risk** | Same class of failure as lecture generate; out of faculty-lecture scope but blocks “full app on Vercel.” |

### 1.6 Other routes that can be slow (usually &lt;300s if awaited)

| Route / area | Files | Notes |
|--------------|-------|--------|
| PPTX / HTML / PDF download | `projects/[id]/download/[format]/route.ts`, package export routes | PPTX ~3MB measured OK; PDF may use Chromium (`pdf-renderer.ts`) — **often broken or too heavy on Vercel**. |
| Validate gates | `projects/[id]/validate/route.ts` | Sync DB + gate eval; should stay under 300s. |
| Faculty image upload | `.../slides/[slideNo]/image/route.ts` | Short; already `runtime = "nodejs"`. |
| NCAAA draft / AI practice / translate | various `chatJson` routes | Single/few LLM calls; set `maxDuration` carefully. |
| Student evaluate-task | `student/lecture/evaluate-task/route.ts` | Multiple `chatJson` — risk if chained. |

### 1.7 Process-local state that assumes a long-lived Node process

| Mechanism | File | Serverless impact |
|-----------|------|-------------------|
| In-process `void` jobs | `src/lib/lecture/queue.ts`, `exam-queue.ts`, `pipeline-trigger.ts` | **Jobs die** with the isolate |
| `globalSentenceRegistry` | `content-registry.ts` via worker | Cross-slide dedup incomplete across chunks/instances |
| Projection cache `Map` | `projection-cache.ts` | Cache miss storm; correctness OK if invalidated |
| Exam overlay cache | `live-exam-generation.ts` | Documented multi-instance hazard |
| ioredis singleton | `src/config/redis.ts` | Works with Upstash `rediss://` if configured; avoid `CONFIG` on TLS (already skipped) |
| Prisma singleton | `src/lib/db.ts` | Needs **pooled** URL (`connection_limit` / PgBouncer / Prisma Accelerate) on serverless |

---

## 2. Current generation execution model (exact trace)

### 2.1 Happy path: Studio generate-all

```
Faculty UI
  → POST /api/iscarb/lecture/projects/{id}/generate
       (generate/route.ts)
       • Pre-checks: CLO approved, alignment mode, source readiness
       • Redis: DEL + HSET lecture:generate:{id} → status=queued
       • enqueueGeneration(id, slideNos?)          ← NOT awaited
       • return 202 { jobId: id, slidesQueued }

  → enqueueGeneration (queue.ts)
       • targets = slideNos || [1..20]
       • void generateAllSlides(projectId, targets)  ← fire-and-forget in SAME process

  → generateAllSlides (generation-worker.ts)
       • await generateSlideChunk(projectId, targets)
            phases: analysing_sources → blueprint → concept cards
                    → per-slide LLM (generateSlideArtifact)
                    → quality/repair → attachVisualSpecs → persist
       • await finalizeGeneration(projectId)
            readiness items, project status → review, Redis status=done

  → UI polls GET /api/iscarb/lecture/jobs/{jobId}
       (jobs/[jobId]/route.ts reads Redis hash lecture:generate:{id}
        then lecture:plan:{id}, then parse job keys)
       GenerationProgress.tsx polls ~every 2.5s
```

**Comments vs reality:**

- `generation-worker.ts` still documents “QStash worker” / chunk windows (`ChunkMeta`, `LECTURE_GENERATE_CHUNK_SIZE` in `queue.ts`), but **`queue.ts` always runs full `generateAllSlides` in-process**.
- `vercel.json` configures `app/api/iscarb/lecture/worker/route.ts` with `maxDuration: 60` — **that file does not exist** in the tree.
- `.env.example` / `DEPLOYMENT.md` mention `QSTASH_*` as “serverless only / N/A for VM”; **no QStash publish/consume code** is wired into `queue.ts`.

### 2.2 Plan path

```
POST .../plan → status generating → enqueuePlan → void generateISCARBPlan
  → Redis lecture:plan:{id}
  → AI (≤45s) or topic-grounded fallback → validatePlanStructure → persist 20 LectureSlidePlan
  → Redis done / failed
```

### 2.3 Why ~24 minutes

Measured E2E: pre-slide pipeline (source analysis + blueprint + concept cards) dominated (~14 min), then slide LLM work + visuals + readiness. NVIDIA key failover / 60s request timeouts (observed in prior session logs) inflate phases that look “stuck” at low progress percentages.

---

## 3. Vercel-compatible architecture (required changes)

### 3.1 Principle

| Layer | Runs on | Responsibility |
|-------|---------|----------------|
| **Vercel (Next.js)** | Serverless / Edge where appropriate | Auth, CRUD, Studio UI, short AI, **enqueue** jobs, **poll** status, downloads that stay under timeout |
| **Durable orchestrator** | QStash **or** Inngest **or** custom queue | Schedule chunks, retries, fan-out; survive beyond 300s |
| **Worker execution** | Prefer **long-lived Node** (Cloud Run / GCE / container) **or** many QStash-invoked Vercel routes each &lt;300s | Run `generateSlideChunk` / plan / parse |

**Honest constraint:** A single 24‑minute `generateAllSlides` call **cannot** be one Vercel function. You must either:

1. **Host a worker off Vercel** and have Vercel only enqueue + poll Redis (simplest, matches `DEPLOYMENT.md`), or  
2. **Chunk** work into many &lt;300s invocations (QStash → `/api/.../worker`) **and** move shared phases (blueprint/analysis) to cache so chunks don’t each re-pay 14 minutes.

Option 2 is a **large** refactor: today `generateSlideChunk` still runs analysis + blueprint + concept cards **inside every chunk invocation** (cached in DB/`generationStateJson` after first success — good foundation), but slide LLM + visuals for 20 slides still exceeded 300s as one job; chunk size would need empirical tuning (e.g. 1–2 slides per invocation under worst-case LLM latency).

### 3.2 Recommended shape for this codebase

**Phase A — Hybrid (lowest risk for professor demo quality):**

1. Keep generation on a **long-lived worker** (existing Docker/PM2/`DEPLOYMENT.md` path, or Cloud Run always-on / min instances).
2. Optionally put **only the Next UI + short APIs** on Vercel pointing at the same Postgres/Redis/S3.
3. Or put **everything** on the VM (current documented model) — professor tests without Vercel.

**Phase B — True Vercel + background jobs (if product requires Vercel hosting):**

1. Replace `queue.ts` in-process `void` with **QStash publish** (keys already reserved in env) **or Inngest**:
   - `enqueueGeneration` → publish message `{ projectId, slideNos, chunkIndex }`
   - `enqueuePlan` / `enqueueParse` similarly
2. Add **worker route(s)** e.g. `src/app/api/iscarb/lecture/worker/generate/route.ts` (verify signature, call `generateSlideChunk` + conditional `finalizeGeneration`).
3. Orchestrate chunks: after chunk N completes, QStash schedules chunk N+1; last chunk calls `finalizeGeneration`.
4. Keep Redis progress keys **unchanged** so `GenerationProgress.tsx` / `jobs/[jobId]/route.ts` keep working.
5. Set `maxDuration` on worker routes to **300** (Pro) and keep chunk wall clock **&lt; ~240s** with margin.

**QStash vs Inngest vs separate worker:**

| Approach | Fit | Pros | Cons |
|----------|-----|------|------|
| **QStash** | High — env keys already named; `vercel.json` anticipated a worker route | Simple HTTP callbacks into Next | Must implement chunking + signing; still need chunks &lt;300s **or** worker not on Vercel |
| **Inngest** | High | Steps, fan-out, observability | New dependency; rewrite queue |
| **Separate worker process** (Redis list / BullMQ / “HTTP wake” from Vercel) | **Best match for 24‑min jobs** | No 300s ceiling; reuse `generateAllSlides` almost as-is | Second deployable; ops cost |
| **Vercel `waitUntil` / `after()`** | Poor for 24 min | Slightly extends work after response | Still bound by platform limits; **not** a substitute for 24‑min jobs |

### 3.3 Concrete file touch list (when implementing — not done now)

| File | Change |
|------|--------|
| `src/lib/lecture/queue.ts` | Stop `void generate*`; publish to QStash/Inngest/Redis worker queue |
| **New** `src/app/api/iscarb/lecture/worker/**/route.ts` | Authenticated consumer calling `generateSlideChunk` / `generateISCARBPlan` / `parseSourceDocument` |
| `vercel.json` | Fix paths; `maxDuration: 300` on workers; keep enqueue routes short (10–60s) |
| `generate/route.ts`, `plan/route.ts`, `sources/route.ts`, `artifacts/.../decisions/route.ts` | Remain 202 enqueue-only; ensure Redis queued state |
| `generation-worker.ts` | Possibly force smaller chunks; ensure blueprint/analysis always loaded from cache on non-first chunks; avoid re-running 14‑min preamble |
| `exam-queue.ts` + live exam | Same pattern if assessment must work on Vercel |
| Frontend | Likely **no change** if Redis job keys stay stable (`GenerationProgress.tsx`) |
| Env | `QSTASH_*` or Inngest keys; worker URL; Upstash Redis; pooled `DATABASE_URL` |

### 3.4 Redis progress reuse

**Yes — reuse as-is:**

- Generate: `lecture:generate:{projectId}` (`generationJobKey`)
- Plan: `lecture:plan:{projectId}`
- Parse: `lecture:job:{documentId}`
- Poll: `src/app/api/iscarb/lecture/jobs/[jobId]/route.ts` + `GenerationProgress.tsx`

Worker must keep calling existing `setProgress` helpers. Prefer **Upstash Redis** (`rediss://`) on Vercel (`src/config/redis.ts` already documents this).

---

## 4. What must still run OFF Vercel serverless

| Workload | Why | Hosting options |
|----------|-----|-----------------|
| Full 20-slide generation (~24 min) | Exceeds max function duration even if chunked poorly; heavy LLM + memory | **GCE / Cloud Run (CPU always allocated)** / Docker Compose VM / Railway / Fly long process — same as `DEPLOYMENT.md` |
| Large PDF parse | Time + memory | Same worker |
| Chromium PDF export | Missing/heavy browser on serverless | Worker or omit PDF on Vercel; PPTX-only |
| Optional: entire API | Simplest ops | Skip Vercel for API; Vercel only for static marketing if desired |

**Professor demo options (pragmatic):**

1. **Recommend:** Deploy API+worker on **VM/container** (already documented) — generation works today.  
2. **Vercel frontend + VM API** — CORS/`NEXT_PUBLIC_APP_URL` complexity.  
3. **Vercel-only** — blocked until queue + chunking **or** external worker exists.

---

## 5. Everything else Vercel needs (non-generation)

### 5.1 Environment variables (minimum)

From `.env.example` / `DEPLOYMENT.md` / lecture features:

- `DATABASE_URL` (+ pooled), `DIRECT_URL` (migrations in CI, not at runtime)
- `REDIS_URL` (Upstash `rediss://`)
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`, `PASSWORD_RESET_SECRET`, …
- `NEXT_PUBLIC_APP_URL` (Vercel URL)
- `NVIDIA_API_KEY` (+ failover keys), model base URLs
- `LECTURE_STORAGE_*` (S3-compatible in-Kingdom bucket — **required** for faculty image upload; local `.lecture-storage` will not work on Vercel)
- `ISCARB_AUTH_DISABLED=false`
- If using QStash: `QSTASH_TOKEN`, signing keys
- Optional: Sentry, SMTP, Fuseki (health currently noisy; non-blocking)

### 5.2 Build / config

- Framework: Next.js (`vercel.json` `"framework": "nextjs"`, region `iad1` — consider nearer region to KSA if latency matters; storage is me-central oriented).
- Ensure Prisma generate on build; **migrate deploy in CI**, not on each serverless cold start.
- `IS_DOCKER` / standalone output is for VM — Vercel uses its own Next build (do not require `server.js` on Vercel).
- Fix or remove stale `vercel.json` worker path until implemented.

### 5.3 `maxDuration` guidance (routes that **can** stay on Vercel)

| Route class | Suggested `maxDuration` |
|-------------|-------------------------|
| Enqueue generate/plan/sources | 30–60s (pre-checks + Redis + publish message) |
| Worker chunk (if on Vercel) | **300** (Pro) + hard chunk budget |
| Image upload / validate / jobs poll | 30–60 |
| PPTX download | 60–120 |
| PDF download | Prefer disable on Vercel or worker |

Hobby plan lower caps make worker-on-Vercel **impractical**.

### 5.4 Database / Redis pooling

- `src/lib/db.ts` already injects `connection_limit` / PgBouncer flags — use a **pooler** URL on Vercel.
- Redis: Upstash; avoid process-local rate-limit-only fallbacks for multi-instance correctness.

### 5.5 Object storage

Faculty slide images and source files **must** use `LECTURE_STORAGE_*` S3 path (`storage.ts`). Local fallback is fine for laptop demos only.

---

## 6. Effort estimate + risk

| Work item | Effort (eng-days, rough) | Risk to working generation |
|-----------|--------------------------|----------------------------|
| Documented VM deploy for professor (no Vercel) | **0.5–1** | **Low** — path already works locally / in `DEPLOYMENT.md` |
| Vercel for short APIs only + worker VM for generate | **3–5** | Medium — split deploys, env parity, CORS/auth cookies across domains |
| Replace `queue.ts` with QStash + implement missing worker route + chunk orchestration | **5–10** | **High** — easy to drop jobs, double-finalize, skip readiness, break Redis progress |
| Tune chunks so each &lt;300s under LLM failover | **3–7** empirical | High — timeouts already dominate wall clock |
| Move assessment `exam-queue` similarly | **2–4** | Medium–high for exam product |
| PDF on Vercel | **2–4** or skip | Medium |
| Env/build/pooling/S3 hardening for Vercel | **1–2** | Low if generation stays off-box |

**Highest risk change:** altering `generateAllSlides` / `generateSlideChunk` control flow while faculty demo depends on current behavior (visuals, faculty image preserve, density warn, plan fallback). Prefer **enqueue adapter** first (same worker functions, different trigger) over rewriting the pipeline.

---

## 7. Staged implementation plan (dependency order)

### Stage 0 — Decide hosting for professor (do this first)

- **If deadline is soon:** deploy **VM/container** per `DEPLOYMENT.md`; skip Vercel for generation.  
- **If Vercel is mandatory:** proceed Stage 1–4; expect multi-day work.

### Stage 1 — Make enqueue durable (no algorithm change)

1. Introduce real queue publish in `queue.ts` (QStash **or** Redis list consumed by a **long-lived** worker).  
2. Long-lived worker calls existing `generateAllSlides` / `generateISCARBPlan` / `parseSourceDocument`.  
3. Keep Redis progress + UI pollers.  
4. **Prove** one full 20-slide run still reaches `done` with artifacts.

*Dependency:* Stage 0 choice. This stage alone makes “Vercel UI + off-box worker” viable.

### Stage 2 — Optional: put Next on Vercel

1. Env + pooled DB + Upstash + S3.  
2. Enqueue routes only on Vercel; worker service URL authenticated.  
3. Smoke: login, Studio, upload image, poll job, PPTX.

### Stage 3 — Optional: chunk on serverless workers

1. Implement `worker/generate` route; QStash chain chunks.  
2. Measure per-slide + preamble cache hit timings; set `LECTURE_GENERATE_CHUNK_SIZE` so worst-case &lt; ~240s.  
3. Only then remove dependency on long-lived process for lecture generate.

*Depends on Stage 1 metrics. Skip if Stage 1 worker is acceptable forever.*

### Stage 4 — Assessment + PDF + cleanup

1. Same queue pattern for `exam-queue.ts`.  
2. PDF strategy.  
3. Delete stale comments / fix `vercel.json`; document hybrid architecture in `DEPLOYMENT.md`.

---

## 8. Summary table

| Capability | On Vercel serverless today? | Path forward |
|------------|----------------------------|--------------|
| Faculty login / Studio UI | Yes (with env) | Deploy Next |
| Plan / Generate / Parse as implemented | **No** | External worker or QStash+chunks |
| Job progress UI | Yes (if Redis shared) | Keep Redis hashes |
| Faculty image upload | Yes (needs S3, not local disk) | `LECTURE_STORAGE_*` |
| PPTX export | Likely yes | Test under maxDuration |
| Full 24‑min generation | **Never as one function** | Off-Vercel worker **or** many chunked invocations |

---

## References (code)

- `src/lib/lecture/queue.ts` — in-process fire-and-forget  
- `src/app/api/iscarb/lecture/projects/[id]/generate/route.ts` — 202 + enqueue  
- `src/lib/lecture/generation/generation-worker.ts` — `generateSlideChunk` / `generateAllSlides` / Redis progress  
- `src/lib/lecture/planner/plan-generator.ts` — plan worker + 45s AI race  
- `src/lib/lecture/ingestion/parse-worker.ts` — parse worker  
- `src/components/lecture/GenerationProgress.tsx` — poller  
- `src/app/api/iscarb/lecture/jobs/[jobId]/route.ts` — progress API  
- `vercel.json` — stale worker route + 60s caps  
- `DEPLOYMENT.md` — explicit non-serverless stance  
- `docs/FACULTY_E2E_2026-08-24.md` — **24.1 min** generate measurement  

---

*End of assessment. No code was changed for this document.*
