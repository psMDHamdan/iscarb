# Faculty AI Copilot — Production Readiness Audit

**Date:** 2026-08-24  
**Branch audited:** `clean-code` (commit `33cb4ef` area)  
**Method:** Live API probes as `faculty@iscarb.edu` / `Faculty@123!` against local Next.js dev (`http://127.0.0.1:3000`) + Docker Postgres (`5433`) / Redis (`6380`), cross-checked against current source. Investigation only — no code changes.

**Live limitation:** Full end-to-end completion was **not achievable** in this environment because plan generation fails on fresh projects (see §1). Generation (Studio) was blocked by missing source uploads. Findings distinguish verified runtime behavior from code-only review.

---

## Executive summary

| Area | Verdict |
|------|---------|
| Full workflow E2E | **Broken** — fails at Plan stage; cannot reach Studio → Publish on a fresh project |
| Publish API gating | **Works** — real gate/slide checks; returns `422 PUBLISH_BLOCKED` |
| Publish UI | **Misleading** — still sends dead `force` / `approveAll` flags |
| Plan generation | **Broken** — AI timeout fallback fails `validatePlanStructure`; 0 slides persisted |
| Studio generation | **Blocked without sources** — hard stop `SOURCE_MATERIAL_UNAVAILABLE`; not timing-tested |
| Jaheziah eligibility API | **Honest** in COURSE_READINESS (no approved snapshots) |
| Jaheziah alignment matrix API | **Dishonest** when `OFFICIAL_JAHEZIAH` — fabricates SKUs, artifacts, sources |
| National standards list API | **Dishonest** — hardcoded specialty catalog with `synced: true` |
| NCAAA evidence API | **Honest** — empty requirements when no approved NCAAA snapshot |
| Project-level exports | **Mostly honest** — PDF returns `503`; PPTX/HTML/DOCX/evidence PDF are real |
| Package-level exports | **Risk** — PDF/evidence_pack can serve HTML with `.pdf` extension/MIME |
| Inbox | **Partial** — surfaces gate failures; does not surface draft slides when none exist; `Approve All` mass-approves drafts |
| Tenant scoping | **Partial** — core routes use `getScopedProject`; several legacy routes use `findFirst({ tenantId })` only |

**Database state after audit:** 2 audit projects created; **0** `LectureSlidePlan` rows and **0** `LectureSlideArtifact` rows in the entire DB.

---

## 1. Full workflow — stage-by-stage

**Test projects:**
- `cmt6j0pn50009itmgidok7jqu` — CLO approve failed in probe (wrong request body; see note)
- `cmt6j5osz001eitmg4ytg6md1` — CLO approved; plan job failed

| Stage | Reads prior persisted data? | Performs function? | Persists output? | Advances state? | Verdict | Root cause / evidence |
|-------|----------------------------|--------------------|------------------|-----------------|--------|------------------------|
| **Auth / project create** | N/A | Login + create project | Project + course profile in DB | `status: draft` | **Works** | `POST /api/v1/auth/login` → 200; `POST /api/iscarb/lecture/projects` → 201 |
| **CLO entry / approve** | Reads `teacherEnteredClos` on profile | Validates + sets `cloApprovedAt` | Updates `LectureCourseProfile` | Enables plan/generate | **Works** | `PUT .../clos` with `teacherEnteredClos` + `selectedLectureCloIds` → 200 (`approvedAt` set). Requires lowercase bloom levels + integer weights per `clos/route.ts` schema |
| **CLO immutability** | Reads approved CLOs | Blocks text mutation | No change | — | **Works** | Second `PUT .../clos` with changed text → **409** `CLO_TEXT_IMMUTABLE` |
| **Source Map** | Reads `sourceDocuments` / blocks | Lists mapping summary | Parse worker on upload | `parseStatus` on docs | **Partial** | `GET .../source-map` → 200, `documents: []`, `parseStatus: "parsing"`. No sources uploaded in E2E. Upload is **`POST .../sources`** (multipart); probe `GET .../sources` → **405** (expected — POST only) |
| **Plan (S1–S20)** | Reads approved CLOs; optional blocks | Enqueues `generateISCARBPlan` | Should write 20 `LectureSlidePlan` rows | Should → `planning` | **Broken** | `POST .../plan` → **202** `{ jobId, slideCount: 20 }`. After 120s polling: **0 plans**. Redis job: `status: failed`, error: *"Plan structure validation failed: Layout \"foundation\" used > 2 times consecutively (starting S5)…"* (`lecture:plan:cmt6j5osz001eitmg4ytg6md1`). Project → `status: "failed"`. See `plan-generator.ts` fallback vs `plan-validator.ts` `repetitive_layout` rule |
| **Plan approve** | Would read plans | Faculty approves 20 slots | Sets `approved` on plans | Unlocks studio | **Not reached** | Blocked by plan failure |
| **Studio / generate** | Requires source blocks | `generateAllSlides` worker | `LectureSlideArtifact` rows | `generating` → `review` | **Blocked** | `POST .../generate` → **400** `SOURCE_MATERIAL_UNAVAILABLE` (`documentCount: 0`, `blockCount: 0`). Hard stop in `generate/route.ts` via `checkSourceReadiness`. Comment in route says plan pre-check removed — generation does **not** require 20 plans, but **does** require parsed source |
| **Decision inbox** | Reads artifacts, gate results, alignment/coverage links | Lists pending faculty actions | N/A (read) | Returns synthetic `projectStatus: "review"` | **Partial** | With 0 artifacts, inbox shows **7 gate claim items** (from persisted `LectureGateResult`), not draft slides. `GET .../decisions/inbox` → `totalPending: 7`, all `type: "claim"`. Draft artifact surfacing untested (no artifacts). `projectStatus` is `"review"` whenever not generating — not read from `LectureProject.status` |
| **Quality gates** | Reads artifacts, plans, coverage, etc. | `runAllGates` | Upserts `LectureGateResult` via `gate-runner.ts` | — | **Works (evaluate)** | `POST .../validate` → 200, `failCount: 7` on empty project. Gates correctly fail on 0 slides. **Passing all gates not demonstrated** |
| **Readiness** | Would read `LectureReadinessItem` | CRUD + approval | Persists items | — | **Not reached** | `GET .../readiness` → `{ mode: "COURSE_READINESS", items: [] }` |
| **Alignment matrix** | Joins CLOs, blocks, artifacts, links | Builds matrix rows | N/A | — | **Honest in COURSE_READINESS** | `GET .../alignment-matrix` → `{ mode: "COURSE_READINESS", rows: [] }` for audit project. **Code path for `OFFICIAL_JAHEZIAH` fabricates data** (§4) |
| **Jaheziah eligibility** | Reads course specialty + approved snapshots | `resolveJaheziahMode` | Creates `LectureAlignmentEligibility` | Sets mode | **Works (honest)** | `GET .../jaheziah-eligibility` → `mode: "COURSE_READINESS"`, rationale explains no approved Jaheziah snapshot |
| **NCAAA evidence** | Reads approved NCAAA snapshots + project links | Aggregates requirement status | N/A | — | **Works (honest, empty)** | `GET .../ncaaa-evidence` → `requirements: []`, `synced: false` |
| **Publish** | Reads gates, artifacts, readiness | `evaluatePublishChecks` | Creates `LecturePackageVersion` on success | `approved` | **Works (gating)** | `POST .../publish` → **422** `PUBLISH_BLOCKED` with `failedErrorGates: 7`, `currentSlideCount: 0`. Same with `{ force: true, approveAll: true }` — API ignores extra fields (`publish/route.ts` Zod schema: `{ notes? }` only) |

**Workflow completion:** **No.** A faculty user creating a fresh lecture cannot progress past Plan without uploading sources *and* fixing plan fallback validation. Even with sources, plan generation must succeed before meaningful studio work.

---

## 2. Generation (Studio)

| Question | Finding |
|----------|---------|
| Does generation complete without timeout? | **Not verified live.** Blocked by `SOURCE_MATERIAL_UNAVAILABLE` before worker starts. |
| How long does it take? | **Not measured.** Plan AI race timeout is **45s** (`plan-generator.ts`); generation worker has no documented wall-clock timeout in `queue.ts` / `generation-worker.ts`. |
| Do all slides persist? | **Not verified.** 0 artifacts in DB after probes. Worker code writes artifacts with `status: "draft"` or `"flagged"` (`generation-worker.ts` ~L154). |
| Subset regeneration? | **Not verified live.** `POST .../generate` with `{ slideNos: [3,7] }` returned same **400** source error. Code path: `enqueueGeneration(id, requested)` → `generateAllSlides(projectId, targets)` supports subset (`generate/route.ts`, `queue.ts`). |
| Plan prerequisite | Route comment says 20 approved plans no longer required; **source material is mandatory** (`checkSourceReadiness`). |

**Code note:** After successful generation, `persist-handoffs.ts` is intended to write real coverage/alignment/NCAAA link rows from artifacts — never invoked in this audit because generation never ran.

---

## 3. Publish gating

### Live behavior (project `cmt6j0pn50009itmgidok7jqu`, incomplete deck)

```
POST /api/iscarb/lecture/projects/{id}/publish
Body: { "force": true, "approveAll": true }
→ 422 { "error": "PUBLISH_BLOCKED", "blockers": ["7 error gate(s) not resolved", "expected 20 current slides, found 0"], "counts": { "failedErrorGates": 7, "unapprovedSlides": 0, "currentSlideCount": 0, "requiredSlideCount": 20 } }

POST /api/iscarb/lecture/projects/{id}/publish
Body: {}
→ 422 (identical blockers)
```

```
GET .../publish-readiness
→ 200 { "canPublish": false, "blockers": [...], "counts": { "failedErrorGates": 7, ... } }
```

### Code path (real logic — not dead code)

`publish/route.ts`:
1. Counts `lectureGateResult` where `status: "fail"` AND `severity: "error"` (not waived).
2. Builds inventory via `publishInventoryFromRows` / `latestCurrentArtifacts` — requires **20 current approved slides** and approved readiness items.
3. Returns **422** with explicit `counts` — no `force` / `approveAll` handling.

**Verdict:** Publish API **blocks correctly** on failing gates and missing slides. It does **not** mass-approve.

### UI mismatch (still broken UX)

`src/app/faculty/lecture/[id]/publish/page.tsx` L631:
```typescript
publish.mutate({ approveAll: true, force: true });
```
These fields are **silently ignored** by the API. Faculty may believe they are force-publishing; they are not.

### Separate bypass: Inbox “Approve All”

`POST .../decisions/inbox` mass-approves all `draft`/`flagged` artifacts and accepts pending alignment/coverage links (`inbox/route.ts` L214–227). This is **not** publish, but it can approve slides without individual review. Publish still requires gates + 20 approved slides.

---

## 4. Data honesty — real vs fabricated

| Surface | Real data? | Evidence |
|---------|------------|----------|
| **Jaheziah eligibility** (`GET .../jaheziah-eligibility`) | **Yes (empty/honest)** | Live: `COURSE_READINESS`, no fake specialty. Code: `loadRealStandards()` returns `[]` when no approved snapshots; never fabricates (`jaheziah-eligibility/route.ts` L18–30) |
| **National standards catalog** (`GET /api/iscarb/lecture/national-standards`) | **No — fabricated fallback** | Live: `synced: true` with 5 hardcoded specialties (`snapshot-bio-2026`, etc.) despite **0** approved Jaheziah snapshots in DB. Code: `national-standards/route.ts` L28–34 explicit hardcoded array when `ids.length === 0`, still returns `synced: true` L37 |
| **Alignment matrix** (`GET .../alignment-matrix`) | **Honest in COURSE_READINESS; fabricated in OFFICIAL_JAHEZIAH** | Live audit project: empty rows. Code when `mode === "OFFICIAL_JAHEZIAH"`: injects default CLOs (L125–129), `defaultSku` strings like `"SKU 8.2 Defensive Programming"` (L157–159), and if `rows.length === 0` **fabricates entire matrix** with fake `src-*`, `art-*`, `ass-*`, `out-*` ids and `"accept"` decisions (L195–238) |
| **Inbox alignment items** | **Dishonest label when `standardOutcomeId` null** | `inbox/route.ts` L160: `const outcomeTitle = link.standardOutcomeId \|\| "SKU 8.2 Fundamentals of Software Security"` |
| **NCAAA evidence** (`GET .../ncaaa-evidence`) | **Yes (empty/honest)** | Live: `requirements: []`, `synced: false`. Status derived only from persisted links (`ncaaa-evidence/route.ts` L79–83) |
| **NCAAA report sections** | **N/A (not probed with evidence)** | `POST` only; requires existing evidence links. GET → 405 |
| **Plan ID binding** | **Honest (drop unknowns)** | `remapPlanIds` drops tokens like `JAH-CS-*` not matching real CLO/block ids (`plan-generator.ts` L107–127). Fallback uses real CLO cuid ids |
| **persist-handoffs** | **Honest by design** | Comments + code: no invented Jaheziah SKUs; NCAAA not auto-met (`persist-handoffs.ts` header, `extractOfficialOutcomeIds`) |

**JAH-CS-* codes:** Not observed in live responses for COURSE_READINESS projects. Would only appear if alignment matrix OFFICIAL path or inbox placeholder strings are shown.

---

## 5. Exports — declared vs actual format

Probed via `GET /api/iscarb/lecture/projects/{id}/download/{format}` on project `cmt6j0pn50009itmgidok7jqu` (**0 artifacts** — empty deck exports).

| Button / format | HTTP | Declared type / filename | Magic bytes | Actual format | Verdict |
|-----------------|------|--------------------------|-------------|---------------|---------|
| **PPTX** | 200 | `application/vnd...presentationml` / `.pptx` | `PK` (OOXML) | ZIP/OOXML | **Correct** |
| **PDF** | 503 | JSON error | `{` | N/A | **Honest failure** — `PDF_UNAVAILABLE` (`projects/.../download/[format]/route.ts` L73–76) |
| **HTML** | 200 | `text/html` / `.html` | `<!DOCTYPE html>` | HTML | **Correct** |
| **Instructor guide (DOCX)** | 200 | `application/vnd...wordprocessingml` / `.docx` | `PK` (OOXML) | DOCX | **Correct** |
| **NCAAA evidence pack** | 200 | `application/pdf` / `.pdf` | `%PDF-1.3` | PDF | **Correct** (rendered from project metadata/gates even with 0 slides) |

### Package download route — mislabel risk (code + prior pattern)

`packages/[versionId]/download/[format]/route.ts`:
- `instructor_guide` MIME map says **`application/pdf`** and extension `.pdf` (L73–88), but dynamic fallback renders **`renderInstructorGuideDOCX`** (L198–199) — DOCX bytes with PDF label if served from this path.
- PDF and `evidence_pack`: on render failure, falls back to **HTML buffer** but may keep PDF `Content-Type` / `.pdf` filename (L204–217).

**Not live-verified** on published package (no approved package version in DB).

---

## 6. Stage handoffs / persistence

| Handoff | Expected source | Current state | Verdict |
|---------|-----------------|---------------|---------|
| **Plan → CLO/block ids** | Real CLO cuids; optional block ids | Fallback plan binds real CLO ids (`c1`,`c2`,`c3`); empty `sourceBlockIds` without upload | **Partial** — never persisted due to validation failure |
| **Generate → artifacts** | 20 slides, draft/flagged | 0 artifacts in DB | **Not exercised** |
| **Generate → coverage links** | `persist-handoffs` from artifact `sourceBlockIds` | No links created | **Not exercised** |
| **Generate → alignment links** | Real CLO + artifact; `standardOutcomeId: null` in COURSE_READINESS | No links | **Not exercised** |
| **Generate → NCAAA evidence links** | From official requirements only | No links | **Not exercised** |
| **Gates → inbox** | Persisted `LectureGateResult` | 7 fail rows surfaced as claims | **Works** |
| **Hub progress** | `/stats` aggregates DB counts | Live stats match: `planExists: false`, `failedGates: 7`, `pendingDecisions: 7` | **Works (read model)**; no separate “lecture progress” table — derived from entities |

**Quality gate evaluation on real slide content:** Not demonstrated — no slides exist to evaluate CLO alignment, source coverage, interaction counts, etc. Gates that **pass** on empty project (e.g. `source_coverage`, `clo_alignment`) may be vacuously passing.

---

## 7. Other issues

### Authentication / tenant
- Faculty user: `role: faculty`, **`universityId: null`** → tenant resolves to **`"default"`** in guards (`ctx.session.universityId || "default"`).
- `getScopedProject` used on publish, generate, validate, jaheziah, ncaaa, stats, alignment-matrix.
- **Weaker scoping** on some routes: `plan/approve`, `plan/[slideNo]`, `sources` POST use `findFirst({ id, tenantId })` without cross-tenant audit logging.
- Unauthenticated `GET /faculty` → **307** to `/login?next=%2Ffaculty` (middleware).

### Inbox
- Surfaces **gate claims** when no draft artifacts — good for empty deck.
- **`POST .../decisions/inbox`** approves all drafts + alignment/coverage without gate resolution — separate from publish but reduces review rigor.
- Alignment pending items show **fabricated SKU title** when `standardOutcomeId` is null (see §4).

### Project status drift
- After plan failure, project stuck at **`failed`**; hub may still show stages as pending/active based on `/stats`, not `failed` status.
- Inbox returns `projectStatus: "review"` even when project is `draft` or `failed`.

### Source / plan coupling
- Plan route allows topic-only generation (no source required to **start** plan).
- Generate route **requires** parsed source — intentional asymmetry but confusing UX: faculty can approve CLOs, trigger plan, then cannot generate without upload.

### Tests / docs drift
- `plan-generator.test.ts` expects prompt strings `"BRD v3.4 APPENDIX A RULES"` — **fails** against current prompt (MEGA-PROMPT v3.0 mismatch).
- DB after audit: **0** projects with any slide plans — confirms plan pipeline never succeeded locally.

### NCAAA global count quirk
- `stats/route.ts` uses `db.nCAAARequirement.count()` **globally**, not per approved snapshot — `ncaaaTotal` may be nonzero even when project has no synced NCAAA evidence (misleading hub badge if catalog seeded).

---

## 8. Production requirements (prioritized)

### Blocking — must fix before production

1. **Plan generation fallback fails validation (workflow blocker)**  
   - **Problem:** When AI times out or returns placeholders, `generateTopicGroundedFallbackSlides` produces consecutive same `function` values (`foundation`, `deep_dive`, `application`) that violate `validatePlanStructure` `repetitive_layout` rule. Job fails; 0 plans persisted; project → `failed`.  
   - **Why it blocks:** Entire faculty pipeline stops at stage 2; no plan → no studio → no publish.  
   - **Fix shape:** Align fallback slot functions to satisfy validator (vary functions per slide), or relax validator for fallback path, or skip validation only when substituting verified fallback template. Ensure Redis job error surfaces in Plan UI.

2. **National standards API fabricates catalog**  
   - **Problem:** `GET /api/iscarb/lecture/national-standards` returns hardcoded SKUs with `synced: true` when no approved snapshots exist.  
   - **Why it blocks:** Faculty/admin UI implies official ETEC/Jaheziah sync that does not exist — accreditation honesty violation (NFR-11/12).  
   - **Fix shape:** Return `{ synced: false, specialties: [] }` when `approved.length === 0`; remove L28–34 fallback array.

3. **Alignment matrix OFFICIAL_JAHEZIAH fabrication**  
   - **Problem:** `alignment-matrix/route.ts` L195–238 synthesizes fake sources, artifacts, assessments, SKU outcomes with `"accept"` when rows empty.  
   - **Why it blocks:** Published alignment views would show false accreditation mapping.  
   - **Fix shape:** Return empty rows or explicit `insufficient_data` when links/artifacts missing; never inject `art-*` / `SKU 8.2` placeholders.

4. **End-to-end verification gap**  
   - **Problem:** No path verified from upload → plan → generate → approve → publish in current environment.  
   - **Why it blocks:** Unknown failures remain in studio, handoffs, exports on real content.  
   - **Fix shape:** After (1), run scripted E2E with sample PDF upload, NVIDIA/AI keys, and gate pass — capture timings and artifact statuses.

### Important — required for trustworthy production

5. **Publish UI sends ignored bypass flags**  
   - **Problem:** `publish/page.tsx` sends `{ approveAll: true, force: true }`.  
   - **Fix shape:** Remove dead fields; disable publish button when `publish-readiness.canPublish === false`; show blockers from API.

6. **Inbox “Approve All” + fabricated alignment labels**  
   - **Problem:** Bulk approve without gate waivers; fake SKU string in alignment messages.  
   - **Fix shape:** Gate error claims should require waive or content fix before bulk approve; use real `standardOutcomeId` or neutral copy (“Unmapped outcome”).

7. **Package export MIME/extension mismatches**  
   - **Problem:** Package route can serve HTML as PDF; instructor guide labeled PDF but renders DOCX.  
   - **Fix shape:** Match project route behavior — 503 on PDF failure; separate `instructor_guide_docx` format with correct MIME.

8. **Source required for generate but not for plan — UX + docs**  
   - **Problem:** Faculty can reach plan stage without sources, then hit hard stop at studio.  
   - **Fix shape:** Gate plan POST on source readiness **or** clearly label studio as blocked until source map complete; hub stage locking.

9. **Tenant scoping consistency**  
   - **Problem:** Mixed `getScopedProject` vs raw `findFirst({ tenantId })`.  
   - **Fix shape:** Migrate remaining lecture project routes to `getScopedProject` + audit on cross-tenant access.

10. **Vacuous gate passes on empty decks**  
    - **Problem:** Gates like `source_coverage` pass with 0 slides (live: 9 pass / 7 fail).  
    - **Fix shape:** Error-severity gates should fail closed when `artifactCount === 0` (partially covered by `student_experience`).

### Polish

11. **Project / inbox status strings** — Align `projectStatus` in inbox and hub with `LectureProject.status` (`failed`, `generating`, etc.).

12. **Stats `ncaaaTotal`** — Scope to approved snapshot requirements for project, not global count.

13. **Test suite drift** — Update `plan-generator.test.ts` and faculty e2e tests to match current prompt/schema.

14. **Faculty seed user** — Ensure `faculty@iscarb.edu` has consistent password, optional `universityId` for multi-tenant testing.

---

## Appendix A — Key file references

| Topic | File |
|-------|------|
| Plan worker + fallback | `src/lib/lecture/planner/plan-generator.ts` |
| Plan validation | `src/lib/lecture/planner/plan-validator.ts` |
| Plan API | `src/app/api/iscarb/lecture/projects/[id]/plan/route.ts` |
| Generate API + source gate | `src/app/api/iscarb/lecture/projects/[id]/generate/route.ts` |
| Publish gating | `src/app/api/iscarb/lecture/projects/[id]/publish/route.ts`, `src/lib/lecture/review/review-logic.ts` |
| Publish UI bypass attempt | `src/app/faculty/lecture/[id]/publish/page.tsx` |
| Inbox + Approve All | `src/app/api/iscarb/lecture/projects/[id]/decisions/inbox/route.ts` |
| Jaheziah eligibility | `src/app/api/iscarb/lecture/projects/[id]/jaheziah-eligibility/route.ts` |
| Fabricated national list | `src/app/api/iscarb/lecture/national-standards/route.ts` |
| Fabricated alignment matrix | `src/app/api/iscarb/lecture/projects/[id]/alignment-matrix/route.ts` |
| NCAAA evidence | `src/app/api/iscarb/lecture/projects/[id]/ncaaa-evidence/route.ts` |
| Handoffs | `src/lib/lecture/generation/persist-handoffs.ts` |
| Project exports | `src/app/api/iscarb/lecture/projects/[id]/download/[format]/route.ts` |
| Package exports | `src/app/api/iscarb/lecture/packages/[versionId]/download/[format]/route.ts` |
| Tenant guard | `src/lib/lecture/review/tenant-guard.ts` |
| Hub stages | `src/app/faculty/lecture/[id]/page.tsx`, `src/app/api/iscarb/lecture/projects/[id]/stats/route.ts` |

## Appendix B — Live probe log locations

- `scripts/_faculty_live_audit_out.txt` — first pass (CLO payload error, publish/gates/exports)
- `scripts/_faculty_e2e_out.txt` — second pass (CLO OK, plan fail, generate blocked)
- Redis key `lecture:plan:cmt6j5osz001eitmg4ytg6md1` — plan failure error message captured via DB probe

---

*Audit performed without modifying application source. Temporary probe scripts remain under `scripts/_*` for reproducibility.*
