# Phase 7 — Independent Reviewer Handover

**Date:** 2026-08-26  
**Audience:** Independent QA / acceptance reviewer  
**Environment:** Live HTTPS demo (Azure Ubuntu VM — **not** serverless)  
**Base URL:** https://demo.iscarb.org  
**Branch:** `clean-code`  
**Release under test:** `7c10e1e9f26a66d74c3227c9bdfc59a06f97bd03`  
**Confirm release:** `GET https://demo.iscarb.org/api/health` → `commitSha` must match above; `postgres` + `redis` = `ok`  
*(Fuseki may report an error — optional RDF layer; ignore for acceptance.)*

---

## 1. Invitation verdict

**You may invite the independent reviewer.**

Both products were re-proven on this live URL after P0 fixes:

| Product | Live E2E | Evidence |
|---------|----------|----------|
| **Employability assessment** | **PASS** | Signup → 47 MCQ scores → `POST /batch-score` **200** `completed:true` → report **200** → certificate PNG **200** (`scripts/_phase6_batch_score_out.json`, pass:true) |
| **Faculty lecture copilot** | **PASS** | Create → CLO → upload → plan **20 slides** → generate → project **`review`** with studio content (~20–28 min wall time on VM) |

Earlier Phase 6 blockers (`NO_ANSWERS`, plan `failed` / 0 slides) are **closed** on this release.

---

## 2. Access

| Role | URL | Credentials |
|------|-----|-------------|
| Public / health | https://demo.iscarb.org | — |
| Login | https://demo.iscarb.org/login | — |
| **Faculty** | https://demo.iscarb.org/faculty | Email: `faculty@iscarb.edu` · Password: `Faculty@123!` |
| **Student** | https://demo.iscarb.org/signup | Create a **fresh** account each run (specialty: **Computer Science / IT**) |

**Do not use** `/register` — that path is **404**. Registration is **`/signup`**.

---

## 3. Reviewer checklist

### A. Employability assessment (student)

1. Open `/signup` → create account with specialty **Computer Science / IT**.
2. Start the employability assessment (47 MCQs).
3. Answer all questions (any mix of correct/incorrect is fine).
4. Submit / finish the exam.
5. Confirm:
   - Results / report loads (composite + 4 dimensions).
   - Dimension module counts reconcile to **47**.
   - Certificate download returns a **PNG** (not an error page).
6. Negative checks (recommended):
   - Before finishing: certificate should **not** mint.
   - Spoof query params on certificate URL should **not** mint a fake score/name.
   - Correct answer is **not** always the first choice (shuffle).

### B. Faculty lecture copilot

1. Log in as faculty (`faculty@iscarb.edu`).
2. Create a **new** lecture project (do not rely only on prior rehearsal data).
3. Approve CLOs → upload a short HTML/PDF source on the course topic.
4. Run **Plan** → wait until **20** slides appear → approve plan.
5. Run **Generate all** → leave the tab open; expect **~20–40 minutes** on this VM (long-lived process — do not treat as a timeout failure).
6. When status is **`review`**, open Studio:
   - Slides have titles/body content (not blank forever).
   - Images may be imperfect / duplicated — faculty can replace per slide.
7. Optional: approve slides, run validate (density may **warn**, should not hard-block alone), try export/download if available.

Sample Studio from prior rehearsal (content already generated):  
https://demo.iscarb.org/faculty/lecture/cmt9klgva001knr01habl9z06/studio

---

## 4. What was fixed for this release (context)

| Issue | Fix release |
|-------|-------------|
| Plan failed (`foundation` spam / validation) → 0 slides | `8c3546d` |
| `batch-score` → `NO_ANSWERS` after per-question `/score` | `8c3546d` |
| `batch-score` → **500** (invalid Prisma `{ not: null }` on required `composite`) | `7c10e1e` |

---

## 5. Known non-blockers (disclose, do not treat as P0)

| Item | Notes |
|------|--------|
| `/register` → **404** | Use `/signup` |
| Modules JSON includes empty `rubric: []` key | No answer keys / `correctIndex` exposed |
| Arabic / RTL | Labels/`titleAr` present; full bilingual + RTL layout not fully proven |
| Faculty QA gates | Some fail/warn after generate (`failCount` ~3–4); generation still completes to `review` |
| Auto image duplication | Possible across slides; faculty upload/replace is the intended override |
| Generation duration | ~20–40 min is expected on this VM for full 20-slide generate |
| Fuseki in `/api/health` | Optional; ignore error string |
| CSP | Still relatively permissive (`unsafe-inline` / `unsafe-eval` on pages) |

---

## 6. Ops / support (owner, not reviewer)

| Item | Value |
|------|--------|
| Public URL | https://demo.iscarb.org |
| VM public IP | `20.2.88.93` (HTTPS via Caddy) |
| App bind | `127.0.0.1:3000` (not public) |
| Health | `GET /api/health` |
| Secrets | VM: `~/iscarb-secrets/` (not in git) |
| Redeploy | `git pull` + Docker rebuild with `GIT_COMMIT_SHA` (see `DEPLOYMENT.md`) |

If health shows Redis error immediately after container restart, wait ~30–60s and recheck — warm-up is common.

---

## 7. Evidence artifacts (internal)

| Artifact | Role |
|----------|------|
| `docs/PHASE6_ACCEPTANCE_REHEARSAL_2026-08-26.md` | Pre-fix rehearsal (historical — P0s open then) |
| `scripts/_phase6_batch_score_out.json` | Post-`7c10e1e` full finalize + cert pass |
| `scripts/_phase6_faculty_out.json` | Faculty plan/generate start evidence |
| Health sample | `status:ok`, `commitSha:7c10e1e…`, postgres/redis ok |

---

## 8. Suggested reviewer message (copy/paste)

> Please review **https://demo.iscarb.org** (release `7c10e1e`).  
> Confirm health `commitSha` matches.  
> **Student:** sign up at `/signup` (not `/register`), specialty Computer Science / IT, complete all 47 questions, submit, check report + certificate PNG.  
> **Faculty:** `faculty@iscarb.edu` / `Faculty@123!` — create a lecture, plan 20 slides, run full generate (expect 20–40 min), verify Studio content in `review`.  
> Known non-blockers: `/register` 404, empty `rubric` keys, occasional gate warnings, image dupes, Fuseki health noise.

---

*End of Phase 7 reviewer handover.*
