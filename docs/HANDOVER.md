# iSCARB Handover — Production Readiness (Faculty + Assessment)

**Date:** 20 August 2026 (Asia/Riyadh)  
**Branch:** `clean-code` (only — do not mix with other local copies)  
**Remote:** `https://github.com/Yousef-Samman/isCarb.git`  
**Repo folder:** `isCarb-clean-code-work`  
**Audience:** Backend / lead engineer taking this to production  
**Basis:** Original `AUDITRESULT.md` P0s + remediation on this branch + verification run below  

---

## 1. Executive verdict (post-remediation)

| Product | Production ready? | Status vs Aug 20 audit |
|---------|-------------------|-------------------------|
| **Employability Assessment** | **NOT YET** (code P0s largely closed; live E2E + deploy remain) | P0 code gaps #1–#4 addressed in source; #5 deploy still open |
| **Faculty AI Co-Pilot / Lecture Compiler** | **NOT YET** (honesty gates fixed in source; full live BRD proof remains) | Faculty P0 #1–#6 addressed in source |
| **Overall** | **Do not sign final acceptance** until live staging evidence pack + deploy | Backend claim “all issues solved” is still premature for production sign-off |

**Bottom line:** Critical honesty/security holes from the audit are fixed **in code on `clean-code`**. Production readiness still requires **restart + live API re-proof**, **staging/production deploy**, and a short list of residual backend items below.

---

## 2. Verification audit (this handover run)

### 2.1 Environment observed

| Item | Observed |
|------|----------|
| Git branch | `clean-code` |
| Docker Postgres | `iscarb-postgres` healthy on **5433** |
| Docker Redis | `iscarb-redis` healthy on **6380** |
| Local Next | Process answered on `http://localhost:3000` |
| Auth on certificate | Unauthenticated `GET /api/iscarb/assessment/certificate` → **401** |
| Translate live probe | Unauthenticated `POST /translate` with `{}` → **400** `"No text to translate"` — handler ran |
| Public pages | `/login` **200**; `/faculty` **200**; `/assessment` **200** (audit originally expected 307→login for faculty/assessment — see residual) |

**Important:** Source for translate **does** wrap `guard({ tier: "ai" })`. A 400 without 401 strongly suggests the **running Next process is stale** (started before the translate guard landed) **or** an auth-bypass path is active for that route only. Backend must **restart `next dev` / redeploy**, then re-probe translate expecting **401** without cookies.

### 2.2 Automated tests (actual output)

**Suite A — P0-focused (after scoring-source fix)**

```
Test Files  7 passed (7)
     Tests  82 passed (82)
```

Includes: certificate-eligibility, finalize-attempt-report, scoring-source, clo-validator, jaheziah-resolver, tenant-guard, faculty-lecture-compiler.

**Suite B — Security + challenger publish checks**

```
Test Files  4 passed (4)
     Tests  383 passed (383)
```

Includes: `challenger-m2-adversarial`, `multi-tenancy`, `authorization`, `rate-limiting`.

**Earlier focused audit (before scoring-source fix):** 224/225 pass; **1 fail** was RDF `scoringSource` casing (`AI` vs `ai`) — **fixed in this handover pass** via `normalizeScoringSource` in `assessment-response.mapper.ts`.

### 2.3 Static regression checks (source)

| Audit failure mode | Source check after fix |
|--------------------|-------------------------|
| Publish `force` / `approveAll` auto-approve | Removed from schema/logic; comment only remains |
| `failedErrorGates: 0` hardcoded | Not present; real count passed |
| Jaheziah hardcoded SKU list | Not present in eligibility route |
| Gate-runner readiness fabricate | `createMany` / empty fabricate block removed |
| publish-readiness `createdAt` | Uses `checkedAt` |
| Translate unprotected | File uses `guard({ tier: "ai", ... })` |
| CLO post-approval mutate | `assertApprovedCloTextImmutable` → 409 |
| Cert on incomplete attempt | `assertCertificateEligibility` → 409 |
| Client-only report scoring | Results page calls `POST .../finalize` |

### 2.4 What this audit did **not** re-run live

Full interactive faculty CLO→plan→validate→publish and full 47-question assessment → certificate PNG on a **fresh** server with `ISCARB_AUTH_DISABLED=false`. That remains the backend’s acceptance evidence pack (checklist in §6).

---

## 3. Everything done — why and how

### 3.1 Faculty Lecture Compiler (BRD)

#### F1 — CLO immutability after `cloApprovedAt`
- **Why:** Live audit could change approved CLO text (AC-15 / FR-004 fail).
- **How:** Fingerprint approved vs incoming CLO texts; reject changes with **409** `CLO_TEXT_IMMUTABLE`; identical text = idempotent success.
- **Files:** `clo-validator.ts`, `clos/route.ts`, unit tests.

#### F2 — Publish honesty (`force` / `approveAll` / gate counts)
- **Why:** Auto-approve + hardcoded `failedErrorGates: 0` falsified release gates.
- **How:** Removed force/approveAll; pass real failed error-gate count; UI stops sending force flags.
- **Files:** `publish/route.ts`, `faculty/.../publish/page.tsx`.

#### F3 — Jaheziah empty-snapshot honesty
- **Why:** Hardcoded specialty fallback invented CONFIRM_REQUIRED candidates.
- **How:** No approved snapshots → `[]` → `COURSE_READINESS` only.
- **Files:** `jaheziah-eligibility/route.ts`, jaheziah-resolver tests.

#### F4 — Gate-runner readiness fabrication
- **Why:** Empty readiness was invented so GATE-08 could pass.
- **How:** Do not insert fakes; empty set fails readiness_count. Fixed bad `status` select on readiness model.
- **Files:** `gate-runner.ts`.

#### F5 — publish-readiness 500
- **Why:** Ordered by non-existent `createdAt` on `LectureGateResult`.
- **How:** `orderBy: { checkedAt: "desc" }`; summary uses real status/severity enums.
- **Files:** `publish-readiness/route.ts`.

#### F6 — Tenant scoping
- **Why:** Id-only / `OR [{id,tenantId},{id}]` bypassed multi-tenant isolation.
- **How:** Exact `tenantId` match in `getScopedProject`; wired into plan/generate/artifacts/validate/readiness/clos/jaheziah/vision/project/package download.
- **Files:** `tenant-guard.ts` + lecture project routes; tenant-guard tests.

---

### 3.2 Employability Assessment (ISC-QA)

#### A1 — Certificate only when fully complete
- **Why:** Incomplete attempts still minted PNG (often 0/100).
- **How:** Require `completed` attempt + **47/47** scored catalog modules; else **409** `ATTEMPT_INCOMPLETE`.
- **Files:** `certificate-eligibility.ts`, `issue-employability-certificate.tsx`, certificate route, tests.

#### A2 — Protect translate
- **Why:** Open AI translate = cost/abuse (ISC-QA-011).
- **How:** `guard({ tier: "ai", roles: [student, faculty, admin] })`.
- **Files:** `translate/route.ts`.
- **Caveat:** Restart server and confirm live **401** without auth.

#### A3 — Server-side idempotent report build
- **Why:** Report scoring lived in browser `sessionStorage` (ISC-QA-001).
- **How:** `finalizeAttemptReport` + `POST .../attempts/[id]/finalize` + `GET .../report`; results page uses finalize; snapshots persisted; `batch-score` delegates with `requireComplete: true`.
- **Files:** `finalize-attempt-report.ts`, attempts finalize/report routes, `results/[id]/page.tsx`, `batch-score/route.ts`, tests.

#### A4 — Attempt-bound certificate
- **Why:** Prefer `/attempts/{attemptId}/certificate` ownership contract.
- **How:** New attempt certificate route; UI prefers attempt URL; report attaches real attempt id when eligible.
- **Files:** `attempts/[attemptId]/certificate/route.tsx`, report view, report API.

#### A5 — Live staging/production deploy — **NOT DONE**
- **Why:** `iscarb-psi.vercel.app` → `DEPLOYMENT_NOT_FOUND`.
- **How:** Ops — redeploy this branch / restore staging URL. See §5.

#### Bonus fix in this handover audit
- RDF mapper now emits **normalized** `scoringSource` (`AI` → `ai`) so ontology casing contract passes.

---

## 4. What is left for the backend to finish (production readiness)

Prioritized for the **two features** (Assessment + Faculty).

### 4.1 Must-do before acceptance (both features)

| # | Owner task | Why it blocks production |
|---|------------|---------------------------|
| 1 | **Restart / redeploy** app with this `clean-code` build; re-run live probes | Stale process can mask translate auth; live authority > unit tests |
| 2 | **Restore staging/production URL** (Vercel or equivalent) with health check | No client-facing environment = no acceptance |
| 3 | Align `.env` with compose: DB **5433**, Redis **6380**; document in `.env.example` | Wrong ports look like “API broken” |
| 4 | Run **full live evidence pack** (§6) with `ISCARB_AUTH_DISABLED=false`, `EXAM_LIVE_GENERATION=false` | Audit said unit tests ≠ acceptance |
| 5 | Confirm middleware: unauthenticated `/assessment` and `/faculty` redirect to login | This run saw **200** on those pages — verify intentional vs regression |

### 4.2 Employability Assessment — remaining backend work

| Priority | Item | Detail |
|----------|------|--------|
| P0 | Live prove certificate gate | 3/47 scored → cert **409**; 47/47 + completed → PNG with DB name/score only |
| P0 | Live prove translate auth | No cookie → **401** (after restart) |
| P0 | Live prove finalize durability | Submit → results → refresh → same report without re-exam |
| P1 | Slim/remove client `report-build-job` scoring path | Handoff answers OK; avoid dual paths long-term |
| P1 | Arabic without open translate | Prefer banked AR fields / approved content over runtime LLM |
| P1 | Attempt-only certificate as primary UX | Wire all deep-links to `/attempts/{id}/certificate` |
| P1 | Performance / pool | Confirm Supabase/pooler settings under load |
| P2 | CSP harden | Drop `unsafe-eval` where possible |
| P2 | `typescript.ignoreBuildErrors` | Turn off for production builds when debt allows |

### 4.3 Faculty Lecture Compiler — remaining backend work

| Priority | Item | Detail |
|----------|------|--------|
| P0 | Live prove CLO 409 after approval | Second PUT with changed text must fail |
| P0 | Live prove publish honesty | Failed gates → non-zero `failedErrorGates`; no force publish |
| P0 | Live prove Jaheziah empty honesty | No approved snapshots → COURSE_READINESS only |
| P0 | Live prove publish-readiness **200** | Was 500 before `checkedAt` fix |
| P1 | BRD AC-01…AC-29 reference proofs | CPIT455 / BIO 343 on staging with video/screenshots |
| P1 | Sweep remaining lecture routes | Any leftover id-only access outside scoped helper |
| P1 | Official sources sync ops | Real approved Jaheziah/NCAAA/Vision snapshots — no seed fakes in prod |
| P1 | national-standards hardcoded seed (if still present) | Align with eligibility honesty |
| P2 | Faculty signup landing copy | Cosmetic: signup JSON still said student |

### 4.4 Explicitly out of scope / do not claim done

- Production payment / final client acceptance  
- “All feedback points solved” without staging evidence  
- Assessment P0 **#5** (deploy) until URL is live  

---

## 5. Ops: restore deployment (Assessment P0 #5)

**Options (pick one):**

1. **Recommended:** Redeploy `clean-code` (or release tag cut from it) to Vercel; fix project link if `iscarb-psi` was deleted; smoke `/login`, `/api` health.  
2. Stand up alternate staging (Azure/Container Apps/etc.) with same compose env contracts.  
3. Temporary private preview URL for auditor only — still must be stable for evidence pack.

**Trade-offs:** (1) fastest path matching prior host; (2) more control/cost; (3) not production but unblocks QA.

---

## 6. Live evidence pack checklist (backend)

Use compose DB **5433** / Redis **6380**, auth **on**.

### Assessment
1. Signup CS/IT student (`ScedField` code `6` seeded if needed).  
2. Modules → 47, no Sales/HR/STUB, no `correctIndex` in client payload.  
3. Score 3 modules only → `GET /certificate` → **409**.  
4. Complete 47 + finalize → certificate PNG; name/score from DB only.  
5. `POST /translate` no auth → **401**.  
6. Submit → `/student/results/{attemptId}` → refresh still shows report.  

### Faculty
1. Faculty signup/login.  
2. Create project → approve CLOs → mutate text → **409**.  
3. Plan generate → 20 slides.  
4. Validate empty/incomplete → failed gates.  
5. Publish without approvals → **422**, real `failedErrorGates`.  
6. Jaheziah no snapshots → COURSE_READINESS.  
7. `GET publish-readiness` → **200**.  
8. Cross-tenant project id → **404**.  

---

## 7. Key new / changed paths (quick map)

```
Faculty
  clos/route.ts, clo-validator.ts
  publish/route.ts, publish-readiness/route.ts, publish/page.tsx
  jaheziah-eligibility/route.ts
  gate-runner.ts
  tenant-guard.ts + scoped lecture routes

Assessment
  certificate-eligibility.ts, issue-employability-certificate.tsx
  certificate/route.tsx
  attempts/[attemptId]/certificate|finalize|report
  translate/route.ts
  finalize-attempt-report.ts, batch-score/route.ts
  student/results/[id]/page.tsx
  assessment-response.mapper.ts (scoringSource normalize)

Docs
  AUDITRESULT.md          — original reject audit
  P0_REMEDIATION_LOG.md   — remediation detail
  HANDOVER.md             — this file
```

---

## 8. Commit guidance (when you ask to commit)

- Branch must remain **`clean-code`**.  
- Include application code + tests + this `HANDOVER.md` (and optionally `AUDITRESULT.md` / `P0_REMEDIATION_LOG.md` if you want the audit trail in-repo).  
- Do **not** commit secrets / `.env`.  
- Message focus on **why**: restore release-gate honesty + assessment credential integrity for production readiness.

---

## 9. Sign-off block

| Role | Decision | Notes |
|------|----------|--------|
| Remediation agent (this handover) | **Code P0s for both features implemented + unit/security verified; not production-accepted** | Live restart + staging deploy + evidence pack required |
| Backend lead | _pending_ | Execute §4–§6 |
| Product / client | _pending_ | After staging evidence |

---

*End of HANDOVER.md*
