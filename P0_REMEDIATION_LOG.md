# iSCARB P0 Remediation Log

**Branch:** `clean-code`  
**Date:** 20 August 2026  
**Source of truth for issues:** `AUDITRESULT.md`  
**Scope:** Faculty Lecture Compiler P0s + Employability Assessment P0s (code). Staging/Vercel redeploy (Assessment P0 #5) remains an ops task.

---

## How to read this document

Each item has:
- **Why** — the audit failure / product risk  
- **How** — what we changed and the intended behavior  
- **Key files** — primary touch points  
- **Verification** — how it was checked

---

# Part A — Faculty Lecture Compiler P0s

## F1. CLO immutability after approval (FR-004 / AC-15)

**Why**  
After `cloApprovedAt` was set, `PUT .../clos` still accepted text edits and persisted them. Approved CLO text is a hard contract for plans and gates; silent mutation breaks auditability.

**How**  
- Added `assertApprovedCloTextImmutable` (fingerprint = sorted trimmed CLO texts).  
- If approved and text differs → **409** `CLO_TEXT_IMMUTABLE`.  
- If approved and text identical → idempotent **200** (no overwrite).  
- First approval (no `cloApprovedAt`) still writes normally.

**Key files**  
- `src/lib/lecture/planner/clo-validator.ts`  
- `src/app/api/iscarb/lecture/projects/[id]/clos/route.ts`  
- `src/lib/lecture/planner/__tests__/clo-validator.test.ts`

**Verification**  
Vitest: clo-validator + faculty-lecture-compiler suites.

---

## F2. Publish honesty: remove force/approveAll; real failedErrorGates

**Why**  
Publish accepted `force` / `approveAll`, auto-approved slides/readiness, and hardcoded `failedErrorGates: 0`, so the checklist lied about gate health.

**How**  
- Removed `force` / `approveAll` from the publish body schema and all bypass logic.  
- Pass the real DB count of failed error-severity gates into `evaluatePublishChecks`.  
- Publish UI no longer sends force flags.

**Key files**  
- `src/app/api/iscarb/lecture/projects/[id]/publish/route.ts`  
- `src/app/faculty/lecture/[id]/publish/page.tsx`

**Verification**  
Faculty lecture + PUB-01-related adversarial tests.

---

## F3. Jaheziah eligibility — no fabricated specialties (AC-17)

**Why**  
With zero approved Jaheziah snapshots, the API returned a hardcoded specialty list and could surface false `CONFIRM_REQUIRED` candidates (e.g. Software Engineering SKU 8.2).

**How**  
`loadRealStandards()` returns `[]` when no approved snapshots exist. `resolveJaheziahMode([], …)` yields **COURSE_READINESS** only.

**Key files**  
- `src/app/api/iscarb/lecture/projects/[id]/jaheziah-eligibility/route.ts`  
- `src/lib/lecture/planner/__tests__/jaheziah-resolver.test.ts`

**Verification**  
Jaheziah resolver unit tests + faculty suite.

---

## F4. Gate-runner — stop fabricating readiness items

**Why**  
When readiness rows were empty, the gate runner inserted invented MCQs (or in-memory fakes) so GATE-08 could pass dishonestly.

**How**  
Removed the fabricate/`createMany` block. Empty readiness → GATE-08 (`readiness_count`) fails. Also fixed readiness `select` that referenced a non-existent `status` column (that error was swallowed into `[]`).

**Key files**  
- `src/lib/lecture/quality/gate-runner.ts`

**Verification**  
Faculty lecture compiler suite.

---

## F5. publish-readiness 500

**Why**  
`LectureGateResult` has `checkedAt`, not `createdAt`. Ordering by `createdAt` threw in Prisma → HTTP 500.

**How**  
- `orderBy: { checkedAt: "desc" }`  
- Gate summary uses schema statuses (`waived`) and severity `warning`.

**Key files**  
- `src/app/api/iscarb/lecture/projects/[id]/publish-readiness/route.ts`

**Verification**  
Code/schema alignment + faculty suite (route has no dedicated e2e in suite).

---

## F6. Tenant scoping on lecture project routes (AC-11)

**Why**  
Several routes loaded projects by id only, or used `OR: [{ id, tenantId }, { id }]` which bypassed isolation. `getScopedProject` also allowed a `"default"` loophole.

**How**  
- Exact `tenantId` match in `getScopedProject` (mismatch → audit + null / 404).  
- Wired scoping into plan, generate, artifacts, validate, readiness, clos, jaheziah, vision-contexts, project detail, package download.  
- Removed OR bypasses.

**Key files**  
- `src/lib/lecture/review/tenant-guard.ts`  
- Multiple `src/app/api/iscarb/lecture/projects/[id]/**` routes  
- `src/lib/lecture/review/__tests__/tenant-guard.test.ts`

**Verification**  
Tenant-guard unit tests + faculty suite.

---

# Part B — Employability Assessment P0s

## A1. Certificate only after full completion (ISC-QA-002)

**Why**  
`GET /certificate` minted a PNG for incomplete attempts (report padded missing modules to 0 → “0/100” credential).

**How**  
- `assertCertificateEligibility`: requires `AssessmentAttempt.status === "completed"` **and** 47/47 scored catalog modules.  
- Otherwise **409** with `X-Certificate-Error: ATTEMPT_INCOMPLETE` (or related codes).  
- Shared issuer: `issueEmployabilityCertificate`.  
- `batch-score` / finalize with `requireComplete: true` refuse partial full-submit.

**Key files**  
- `src/lib/assessment/certificate-eligibility.ts`  
- `src/lib/assessment/issue-employability-certificate.tsx`  
- `src/app/api/iscarb/assessment/certificate/route.tsx`  
- `src/lib/assessment/__tests__/certificate-eligibility.test.ts`

**Verification**  
Certificate-eligibility vitest (incomplete vs full).

---

## A2. Protect translate endpoint (ISC-QA-011)

**Why**  
`POST /api/iscarb/assessment/translate` was a public AI proxy (cost/abuse).

**How**  
Wrapped with `guard({ tier: "ai", roles: ["student","faculty","admin"] })` — auth + AI rate limit.

**Key files**  
- `src/app/api/iscarb/assessment/translate/route.ts`

**Verification**  
Route uses same guard pattern as other AI assessment endpoints.

---

## A3. Server-side idempotent report build (ISC-QA-001)

**Why**  
Report scoring was orchestrated in the browser via `sessionStorage` (`report-build-job`). Refresh/tab-close made report durability unreliable.

**How**  
- **`finalizeAttemptReport`** (server): merge optional answers into `AssessmentAttempt.answersJson`, score only modules not yet in live responses, upsert profile, mark `completed` only when all exam questions are answered, persist `AssessmentSnapshot`, return snapshot.  
- **POST** `/api/iscarb/assessment/attempts/[attemptId]/finalize`  
- **GET** `/api/iscarb/assessment/attempts/[attemptId]/report` (refresh / deep-link)  
- Results page calls finalize instead of client `runReportBuild` scoring loop.  
- `batch-score` delegates to finalize with `requireComplete: true`.  
- sessionStorage remains a short-lived **answer handoff** until finalize succeeds, then is cleared.

**Key files**  
- `src/lib/assessment/finalize-attempt-report.ts`  
- `src/app/api/iscarb/assessment/attempts/[attemptId]/finalize/route.ts`  
- `src/app/api/iscarb/assessment/attempts/[attemptId]/report/route.ts`  
- `src/app/api/iscarb/assessment/batch-score/route.ts`  
- `src/app/student/results/[id]/page.tsx`  
- `src/lib/assessment/__tests__/finalize-attempt-report.test.ts`

**Verification**  
Finalize unit tests + certificate/keyed-mcq related suites.

---

## A4. Attempt-bound certificate contract

**Why**  
Preferred contract is `/attempts/{attemptId}/certificate` (ownership of a specific completed attempt), not only student-scoped convenience GET.

**How**  
- New route uses the same issuer with `attemptId` passed into eligibility.  
- Report UI prefers attempt URL when id is not synthetic `live_*`.  
- Live report API attaches real completed `attemptId` when eligible.

**Key files**  
- `src/app/api/iscarb/assessment/attempts/[attemptId]/certificate/route.tsx`  
- `src/components/views/EmployabilityDetailedReportView.tsx`  
- `src/app/api/iscarb/assessment/report/route.ts`

**Verification**  
Eligibility unit tests; route wires through issuer.

---

## A5. Live staging / production deployment — NOT done in code

**Why**  
Audit found `https://iscarb-psi.vercel.app/` → `DEPLOYMENT_NOT_FOUND`.

**How (ops options)**  
1. Redeploy current `clean-code` (or release branch) to Vercel and verify health.  
2. Point DNS / project to a new Vercel project if the old one was deleted.  
3. Stand up a non-Vercel staging host with compose ports documented (DB **5433**).

**Recommendation:** redeploy from this branch after merge, then re-run the audit live checklist.

---

# Part C — Intentionally unchanged / residual risk

| Item | Notes |
|------|--------|
| Client `report-build-job.ts` | Still used to freeze answers into sessionStorage on submit; scoring itself is server-side. Can be slimmed further later. |
| Partial / timed-out exams | Finalize can score answered modules without marking `completed`; certificate stays blocked until 47/47 + completed. |
| Jaheziah `national-standards` admin seed list | Separate from eligibility route; not in Faculty P0 #3. |
| CSP `unsafe-eval` / translate content completeness | Assessment P1 items in AUDITRESULT. |

---

# Part D — Suggested re-test checklist (local)

```text
# Faculty
1. Approve CLOs → PUT clos with changed text → expect 409
2. Publish without approvals → expect 422 and failedErrorGates > 0 when gates failed
3. Jaheziah with no approved snapshots → COURSE_READINESS, no SKU candidates
4. Validate empty project → readiness_count fail (no invented items)
5. GET publish-readiness → 200 (not 500)

# Assessment
1. Score 3 modules → GET certificate → 409 ATTEMPT_INCOMPLETE
2. POST translate without auth → 401
3. Submit exam → results page builds via POST .../finalize; refresh still loads report
4. GET .../attempts/{id}/certificate after full complete → PNG
```

---

*End of remediation log.*
