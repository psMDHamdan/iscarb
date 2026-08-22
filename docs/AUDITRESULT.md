# iSCARB Production Readiness Audit Result

**Date:** 20 August 2026 (Asia/Riyadh)  
**Auditor:** Independent local + code audit (Cursor agent)  
**Repo:** `isCarb-clean-code`  
**Specs compared against:**
1. `iSCARB_Technical_QA_and_Remediation_Specification_v1.0` (Employability Assessment)
2. `Faculty-AI-Copilot-BRD-v3.4` (Faculty Lecture Compiler)

**Backend claim under test:** “All feedback points have been solved.”

---

## Executive verdict

| Product | Production ready? | Vs backend claim |
|---------|-------------------|------------------|
| **Employability Assessment** | **NOT YET** | **Partially fixed.** Major August P0s improved in local live tests. Remaining blockers below still open. |
| **Faculty AI Co-Pilot / Lecture Compiler** | **NOT YET** | **Overstated.** Scaffold works; release-gate honesty gaps still fail live. |
| **Overall** | **Do not sign final acceptance** | Claim “all issues solved” is **not accurate**. |

---

## Environment used for this audit

| Item | Value |
|------|-------|
| Local app | `http://localhost:3000` (Next.js 16.3.1) |
| DB | Docker `iscarb-postgres` on host port **5433** (compose) |
| Redis | Docker `iscarb-redis` on host port **6380** |
| Migrations | All **17** Prisma migrations applied successfully |
| Auth mode for decisive API checks | `ISCARB_AUTH_DISABLED=false` |
| Exam generation | `EXAM_LIVE_GENERATION=false` (question bank path) |
| Production URL | `https://iscarb-psi.vercel.app/` → **`DEPLOYMENT_NOT_FOUND`** (not testable) |

**Note for backend:** Local `.env` often points at port **5432**. Compose expects **5433**. Audit process overrode `DATABASE_URL`/`DIRECT_URL`/`REDIS_URL` to compose ports. Without that override, APIs return DB connection failures.

---

## Automated tests executed (actual)

| Suite | Result |
|-------|--------|
| Assessment: keyed MCQ, public payload, specialization routing | **PASS** (87 tests in focused run; earlier full critical suite 146/147 with 1 scoring-source casing fail) |
| Faculty lecture compiler e2e unit suite | **PASS** `56/56` |
| Security suites (earlier run) | **PASS** `394` tests across multi-tenancy / auth / rate-limit / etc. |

Unit tests prove many validators exist. **Live API behavior is the authority for acceptance.**

---

# PART A — Employability Assessment (ISC-QA)

## Live evidence summary

| Check | Observed result | Verdict |
|-------|-----------------|---------|
| Public pages `/login` `/signup` `/terms` `/privacy` `/forgot-password` | HTTP **200** | Improved vs Aug QA |
| Unauth `/assessment`, `/faculty` | HTTP **307** → login | PASS |
| Signup CS/IT (after seeding `ScedField` code `6`) | HTTP **201** | PASS (seed required — empty DB blocks signup) |
| Modules for CS/IT student | **47** modules, curated Job-Fit | PASS |
| Out-of-specialty titles (Sales, HR, Labor Law, SEO, CRM, STUB…) | **0 matches** | PASS (ISC-QA-004/005 largely closed locally) |
| Client payload keys (`correctIndex`, `isCorrect`, `answerKey`…) | **Absent** | PASS (ISC-QA-003) |
| Option shuffle | First choice often **not** best; score of index 0 = **0** keyed_mcq | PASS |
| Score API (3 modules) | HTTP **200**, source `keyed_mcq`, deterministic | PASS (ISC-QA-009 path) |
| Certificate with `?score=100&name=HackedPerson` | PNG rendered; **name = iSCARB QA Local**, **score = 0/100** (not query values) | Query spoof **mitigated** |
| Certificate after only **3/47** scored answers | Still issued PNG **0/100** | **FAIL** — incomplete attempt should not mint credential |
| `POST /api/iscarb/assessment/translate` **no auth** | HTTP **200** + Arabic JSON | **FAIL** (open AI endpoint) |
| Auth-enforced modules/lecture without token | HTTP **401** | PASS when `ISCARB_AUTH_DISABLED=false` |
| Student → lecture projects | HTTP **403** | PASS |
| Production host | `X-Vercel-Error: DEPLOYMENT_NOT_FOUND` | **FAIL** for production acceptance |

### Certificate PNG observation (saved during audit)

- Title: Certificate of Employability  
- Name from DB: **iSCARB QA Local** (not “HackedPerson”)  
- Track: Computer Science / IT  
- Score shown: **0 / 100** after only 3 wrong answers  
- Credential ID present (opaque hash style)

**Implication:** Display data is no longer taken from mutable query params (good), but **completion gate is insufficient** (bad).

---

## ISC-QA scorecard (updated after local live)

| ID | Priority | Status | Notes |
|----|----------|--------|-------|
| ISC-QA-001 Report reliability | P0 | **PARTIAL** | Scoring API works; report build still largely **client `sessionStorage`** orchestration in code (`report-build-job.ts`). Full 47→report durability **not** proven. |
| ISC-QA-002 Certificate | P0 | **PARTIAL** | Query spoof of name/score mitigated. Still **student-scoped**, not attempt-only. **Issues cert on incomplete attempt.** |
| ISC-QA-003 Option shuffle / bank leak | P0 | **PASS (local)** | Live + unit evidence. |
| ISC-QA-004 Specialty CS content | P0 | **PASS (local)** | 47 modules; CS Job-Fit titles OK. |
| ISC-QA-005 STUB governance | P0 | **PASS (local)** | No STUB in live module list. |
| ISC-QA-006 Report counts | P1 | **NOT FULLY VERIFIED** | Code path improved; no full completed report live. |
| ISC-QA-007 Arabic | P1 | **PARTIAL** | Catalog AR fields present; live path uses **unauthenticated** translate. |
| ISC-QA-008 UI race | P1 | **PASS (code)** | Not re-proven with throttled browser E2E this round. |
| ISC-QA-009 Deterministic MCQ | P1 | **PASS (local)** | `keyed_mcq` scores observed. |
| ISC-QA-010 Performance / pool | P1 | **PARTIAL** | Pool injection in `db.ts`; load test not run; Supabase pooler path still special-cases `connection_limit=1`. |
| ISC-QA-011 Security | P1 | **FAIL open items** | Open translate; CSP still `unsafe-inline`/`unsafe-eval`; `typescript.ignoreBuildErrors: true`. |
| ISC-QA-012 UX consistency | P2/P1 | **PARTIAL** | Some pass/fail UI still outside guarded components (code). |
| ISC-QA-013 Platform scope | P1 | **PARTIAL** | Middleware lock improved; production undeployed. |
| ISC-QA-014 Legal / recovery | P2 | **PASS (local)** | Terms/privacy/forgot-password pages serve. |

---

# PART B — Faculty Lecture Compiler (BRD)

## Live evidence summary

| Check | Observed result | Verdict |
|-------|-----------------|---------|
| Faculty signup (`faculty.*@…`) | HTTP **201**; login role **`faculty`** | PASS (signup JSON landing still says student — cosmetic inconsistency) |
| Create lecture project | HTTP **201**, mode `COURSE_READINESS` | PASS |
| Faculty hub pages | `/faculty/lecture`, project, jaheziah, ncaaa → **200** | PASS |
| CLO approve (valid schema) | HTTP **200**, `cloApprovedAt` set | PASS entry |
| CLO **mutate text after approval** | HTTP **200**; DB text became **`CHANGED TEXT SHOULD BE REJECTED`** | **FAIL AC-15 / FR-004 immutability** |
| Plan generate | HTTP **202**, then GET plan → **20 slides** (S1–S20 functions present) | PASS structure |
| Generate without plan completeness earlier | Blocked with clear errors | PASS gating message |
| Validate with 0 slides | `failCount: 6`, slide_count fail | Gates detect emptiness |
| Validate / publish counts | Publish response showed **`failedErrorGates: 0`** even after failed gates existed | **FAIL** — checklist ignores real gate failures |
| Publish `force` + `approveAll` | Auto-approves artifacts/readiness; still blocked only by “no approved slides” when empty | **FAIL** BRD “no auto-approval” |
| Publish normal incomplete | **422** `expected 20 current slides, found 0` | Expected |
| Jaheziah eligibility (no approved snapshots) | Returned **CONFIRM_REQUIRED** + candidate `Software Engineering (SKU 8.2)` from **hardcoded specialty list** | **FAIL AC-17 honesty** |
| Jaheziah `action: reject` | Mode → **COURSE_READINESS** | PASS decision path |
| NCAAA evidence (no sync) | Empty requirements, `synced: false` | PASS honesty (empty, not fake) |
| Vision contexts | Returned contexts (e.g. HCDP) | PARTIAL — verify source approval chain in ops |
| `publish-readiness` GET | HTTP **500** Internal server error | **FAIL** |
| Student accessing lecture API | **403** | PASS |

### Confirmed code hotspots (still present)

1. `src/app/api/iscarb/lecture/projects/[id]/publish/route.ts` — accepts `force` / `approveAll`; evaluates with **`failedErrorGates: 0` hardcoded**.  
2. `src/app/api/iscarb/lecture/projects/[id]/jaheziah-eligibility/route.ts` — when no approved snapshots, returns **hardcoded specialty list**.  
3. `src/lib/lecture/quality/gate-runner.ts` — can **fabricate readiness items** when empty (code; not fully re-triggered after plan in this pass).  
4. `src/app/api/iscarb/lecture/projects/[id]/clos/route.ts` — comments claim immutability; **live mutate succeeded**.  
5. `src/app/api/iscarb/assessment/translate/route.ts` — **no `guard()`**.

---

# PART C — What the backend can claim as done

These are **real improvements** vs the August production QA report:

1. CS/IT specialty routing no longer serves HR/sales/marketing Job-Fit titles (local live).  
2. No STUB module titles in the live 47-module set.  
3. Option shuffle + stripping of answer keys from client modules payload.  
4. Deterministic keyed MCQ scoring path works end-to-end for scored modules.  
5. Certificate no longer paints attacker-supplied `name`/`score` from query string.  
6. Legal pages + forgot-password exist locally.  
7. Faculty lecture project create + S1–S20 plan generation works.  
8. Role separation student vs faculty on lecture APIs when auth is enforced.  
9. Large unit/e2e-unit suites exist and largely pass.

---

# PART D — Must-fix before acceptance (priority for backend)

## P0 — Assessment

1. **Do not issue certificate until attempt is fully completed** (47/47 scored + COMPLETED status). Incomplete 0/100 cert is a release blocker.  
2. **Protect `/api/iscarb/assessment/translate`** with auth + rate limit (or remove public AI translate).  
3. Move report build to **server-side idempotent job** (close ISC-QA-001 properly).  
4. Prefer certificate contract **`/attempts/{attemptId}/certificate`** (attempt ownership).  
5. Restore a **live staging/production deployment** (current Vercel URL is dead).

## P0 — Faculty Lecture Compiler

1. **Enforce CLO immutability** after `cloApprovedAt` (reject text changes — currently accepted live).  
2. **Remove or admin-gate `force` / `approveAll`**; pass **real** `failedErrorGates` into publish checks.  
3. **Remove hardcoded Jaheziah specialty fallback**; empty approved snapshots ⇒ `COURSE_READINESS` only.  
4. Stop fabricating readiness items in gate-runner; fail the gate instead.  
5. Fix **`publish-readiness` 500**.  
6. Ensure tenant scoping on all lecture routes (code audit still flags id-only access patterns on some endpoints).

## P1

- Harden CSP (drop `unsafe-eval`).  
- Complete Arabic assessment content without open translate.  
- Full 47-answer → report → certificate E2E on staging with video evidence.  
- BRD AC-01…AC-29 reference proofs (CPIT455 / BIO 343) on staging.  
- Align `.env.example` / local docs: DB port **5433** for compose.

---

# PART E — Reproduction notes for backend

### Assessment

```text
1. docker compose up -d postgres redis
2. DATABASE_URL / DIRECT_URL → 127.0.0.1:5433/iscarb
3. prisma migrate deploy
4. Ensure ScedField code "6" exists (otherwise student.create FK fails)
5. ISCARB_AUTH_DISABLED=false EXAM_LIVE_GENERATION=false next dev -p 3000
6. POST /api/v1/auth/signup specialty="Computer Science / IT"
7. GET /api/iscarb/assessment/modules → expect 47, no Sales/HR/STUB, no correctIndex
8. POST /api/iscarb/assessment/score with specialization + moduleCode + selectedIndex + response
9. GET /api/iscarb/assessment/certificate → currently returns PNG even if incomplete (BUG)
10. POST /api/iscarb/assessment/translate without cookie → currently 200 (BUG)
```

### Faculty

```text
1. Signup email containing "faculty" → login role faculty
2. POST /api/iscarb/lecture/projects with courseProfile + CLOs
3. PUT .../clos with {id,number,text,bloomLevel,weight} → approve
4. PUT .../clos again with changed text → currently 200 and persisted (BUG)
5. POST .../plan → 202; GET .../plan → 20 slides
6. GET .../jaheziah-eligibility with no approved snapshots → CONFIRM_REQUIRED + hardcoded SE candidate (BUG)
7. POST .../publish {force:true, approveAll:true} → counts.failedErrorGates stays 0 (BUG)
```

---

# PART F — Recommendation to product / client

**Do not accept final payment / production sign-off yet.**

Treat assessment as **substantially remediated but not gate-complete**.  
Treat faculty lecture compiler as **MVP scaffold with critical enforcement holes**.

**Suggested commercial posture:** recognize progress on assessment integrity items that now pass locally; hold final acceptance until P0 list above is closed and re-verified on a **live staging URL** with an evidence pack (tests + screenshots/video).

---

## Sign-off block (for this audit only)

| Role | Decision | Date |
|------|----------|------|
| Independent auditor (this report) | **REJECT production acceptance** | 20 Aug 2026 |
| Backend / development lead | _pending response_ | |
| Product owner | _pending_ | |
| Client representative | _pending_ | |

---

*End of AUDITRESULT. No application source code was modified to produce this report (infra: docker compose up, migrations, temporary ScedField seed, local process env overrides only).*
