# iSCARB Demo Handover — Independent Evaluation

**Prepared for:** Supervising professor / independent evaluator  
**Prepared by:** Yousef Samman  
**Date:** 26 August 2026  
**Demo environment:** https://demo.iscarb.org  
**Software release under evaluation:** `7c10e1e` (`clean-code` branch)  
**Confirm live release:** open https://demo.iscarb.org/api/health and verify `commitSha` starts with `7c10e1e`, and that `postgres` and `redis` are `ok`.

---

## 1. Purpose of this handover

This document invites you to evaluate a **live, long-running deployment** of **iSCARB** — a platform with two complementary products:

1. **Employability Assessment** — a 47-question student readiness exam with scoring, report, and certificate.  
2. **Faculty Lecture Copilot** — an AI-assisted lecture planner/generator that produces a 20-slide lecture package from course CLOs and uploaded source material.

### Why this demo exists

Earlier work showed that **serverless / short-lived** hosting cannot reliably run the faculty generation pipeline, which needs **tens of minutes** of continuous compute. This demo is hosted on a **dedicated Azure Ubuntu virtual machine** with Docker, PostgreSQL, Redis, HTTPS (Caddy), and an in-process generation queue — so both products can be exercised end-to-end without artificial request timeouts.

This handover is **not** a claim of finished commercial production. It is a structured invitation to verify that the two products work on a stable live URL, with known limitations disclosed honestly.

---

## 2. What was delivered (scope of this milestone)

| Deliverable | Status |
|-------------|--------|
| Public HTTPS demo at **demo.iscarb.org** | Live |
| Employability assessment: signup → 47 MCQs → submit → report → certificate PNG | Verified on this release |
| Faculty copilot: create project → CLOs → source upload → plan (20 slides) → full generate → Studio review | Verified on this release |
| Release identity in health endpoint (`commitSha`) | Live |
| Pre-invite acceptance rehearsal + P0 fixes | Completed (see §6) |

**Your role in evaluation:** independent acceptance of the **live demo behaviour**, not a code review of the full repository (unless you choose to go deeper).

---

## 3. How to access the system

| Audience | Entry point | Credentials / notes |
|----------|-------------|---------------------|
| Public site | https://demo.iscarb.org | No login |
| Health check | https://demo.iscarb.org/api/health | Confirm release SHA above |
| **Student path** | https://demo.iscarb.org/**signup** | Create a **new** account each session. Recommended specialty: **Computer Science / IT** |
| **Faculty path** | https://demo.iscarb.org/login → Faculty area | Email: **`faculty@iscarb.edu`** · Password: **`Faculty@123!`** |

**Important:** Use **`/signup`**, not `/register`. The `/register` path returns **404** by design of the current app routes.

**Optional quick look (already generated lecture):**  
https://demo.iscarb.org/faculty/lecture/cmt9klgva001knr01habl9z06/studio  
Log in as faculty first. This shows a completed generate run without waiting ~30 minutes. For formal acceptance, please also create a **new** project (checklist §5.B).

---

## 4. Success criteria (how to judge “pass”)

Treat the demo as successful if **all** of the following hold:

### Product A — Employability assessment

| # | Criterion | Pass if… |
|---|-----------|----------|
| A1 | Registration works | New student can sign up at `/signup` and reach the assessment |
| A2 | Full exam length | Student receives **47** MCQ items for CS/IT |
| A3 | Fair presentation | Correct option is **not** always first (shuffle) |
| A4 | Submit completes | Finishing the exam produces a **results/report** (composite + four dimensions) |
| A5 | Counts reconcile | Dimension module counts sum to **47** |
| A6 | Certificate integrity | After completion, certificate downloads as a **PNG**; before completion / with spoofed score URL params, certificate is **refused** |

### Product B — Faculty lecture copilot

| # | Criterion | Pass if… |
|---|-----------|----------|
| B1 | Project bootstrap | Faculty can create a project, approve CLOs, and upload source material |
| B2 | Plan stage | Plan produces **20** slides and can be approved |
| B3 | Long generation | “Generate all” **completes** on the live VM (expect **~20–40 minutes**; do not treat duration alone as failure) |
| B4 | Studio content | Project reaches **`review`** with real slide titles/body (not permanently empty / failed at plan) |
| B5 | Non-blocking density | Density/quality **warnings** may appear; they should not by themselves erase the generated deck |

### Environment

| # | Criterion | Pass if… |
|---|-----------|----------|
| E1 | Correct build | Health `commitSha` matches **`7c10e1e…`** |
| E2 | Core services | Health shows postgres **ok** and redis **ok** |

---

## 5. Suggested evaluation checklist

### A. Student — Employability assessment (~15–40 minutes)

1. Open https://demo.iscarb.org/signup and create a new account (specialty: **Computer Science / IT**).  
2. Start the employability assessment.  
3. Answer all **47** questions (accuracy is optional for the path test).  
4. Submit / finish.  
5. Confirm the report loads (composite score + four dimensions).  
6. Download the certificate and confirm it is an image (PNG).  
7. Optional integrity checks: try certificate before finishing; try spoofed `?score=` / `?name=` query parameters — both should fail.

### B. Faculty — Lecture copilot (~35–60 minutes, mostly waiting on generate)

1. Log in with `faculty@iscarb.edu` / `Faculty@123!`.  
2. Create a **new** lecture project.  
3. Enter / approve CLOs; upload a short HTML or PDF source on the course topic.  
4. Run **Plan** → wait until **20** slides appear → approve the plan.  
5. Run **Generate all**. Leave the browser open; allow **20–40 minutes**.  
6. When status is **`review`**, open Studio and spot-check several slides for titles and content.  
7. Optional: try validate / export; note any warnings without treating them as hard failure unless the deck is empty or generation never finishes.

---

## 6. Context — what was broken, what was fixed

Before inviting evaluation, an internal live rehearsal found two **blocking** defects. Both were fixed and re-verified on the demo URL:

| Problem observed | Impact | Resolution |
|------------------|--------|------------|
| Faculty plan failed validation → **0 slides**, project `failed` | Could not prove long-running generation on the VM | Plan recovery / fallback fixed (`8c3546d`); retest produced 20 slides and Studio content |
| Exam submit (`batch-score`) failed after answering all questions | Report/certificate happy path incomplete | Answer hydration + percentile query fix (`8c3546d`, `7c10e1e`); retest: submit **200**, report **200**, certificate PNG **200** |

**Internal verification after fixes:** automated full assessment probe reported `pass: true`; faculty generate completed to `review` with 20 planned slides and visible Studio content.

---

## 7. Scope boundary — what is in vs out

### In scope for this evaluation

- Live HTTPS access to both products on **demo.iscarb.org**  
- End-to-end student assessment path (including certificate after completion)  
- End-to-end faculty plan → generate → Studio review path on a long-lived VM  
- Basic security/integrity behaviours called out in §4 (certificate gates, shuffle, no obvious answer-key leakage)

### Out of scope / not claimed as finished

| Item | Notes |
|------|--------|
| Commercial production hardening | Demo environment; secrets and ops are owner-managed |
| Perfect visual uniqueness | Slide images may duplicate; faculty can replace images |
| Perfect QA gate scores | Some quality gate fails/warns after generate are expected; generation can still complete |
| Full Arabic / RTL bilingual UX | Arabic labels exist in places; full RTL layout is not the acceptance bar for this milestone |
| Load / concurrency testing | Single-user acceptance only |
| `/register` alias | Use `/signup` |
| Optional Fuseki / RDF health | May show an error in `/api/health`; ignore for product acceptance |
| Content pedagogy quality scoring by humans | AI output quality is subjective; judge **pipeline completion + usable Studio artifacts** first |

---

## 8. Known limitations (disclosed, non-blocking)

Please treat these as **known**, not as unexpected failures:

1. **`/register` returns 404** — registration is at **`/signup`**.  
2. **Faculty generation takes ~20–40 minutes** — expected on this architecture.  
3. **Quality warnings / some failed gates** after generate — review the slides; do not require zero warnings for this milestone.  
4. **Image duplication** across slides may occur — replaceable by faculty upload.  
5. **Empty `rubric: []` fields** may appear in API payloads — answer keys / correct indices are not exposed.  
6. **Fuseki line in health** — optional service; ignore.  
7. **CSP headers** are still relatively permissive — tracked as hardening, not a demo blocker.

---

## 9. What feedback is requested

When you have finished evaluation, please reply with:

1. **Pass / Fail / Pass with notes** for Product A (assessment) and Product B (faculty).  
2. Any **blocking** defects (steps to reproduce, screenshots if possible).  
3. Any **non-blocking** observations you want tracked for a later iteration.  
4. Confirmation that health showed release **`7c10e1e`** during your session (or the SHA you actually saw).

### Contact

| | |
|--|--|
| **Owner** | Yousef Samman |
| **Demo URL** | https://demo.iscarb.org |
| **Preferred channel** | Reply to the email that attached this document (or your usual academic channel) |
| **Response goal** | Issues reported with URL + steps will be triaged against the live release SHA |

---

## 10. Suggested invitation email (copy/paste)

**Subject:** iSCARB live demo ready for independent evaluation — demo.iscarb.org

Dear Professor,

Please find attached the handover for the iSCARB live demo.

**URL:** https://demo.iscarb.org  
**Release:** confirm via https://demo.iscarb.org/api/health (`commitSha` should start with `7c10e1e`).

The demo covers both products:

1. **Student employability assessment** — register at **/signup** (not /register), specialty *Computer Science / IT*, complete all 47 questions, submit, check report and certificate.  
2. **Faculty lecture copilot** — login `faculty@iscarb.edu` / `Faculty@123!`, create a lecture, run Plan (20 slides), then Generate all (allow **20–40 minutes**), then review slides in Studio.

A pre-generated Studio sample (optional, after faculty login):  
https://demo.iscarb.org/faculty/lecture/cmt9klgva001knr01habl9z06/studio

Known non-blockers (please do not treat as failures alone): `/register` 404, long generate time, occasional quality warnings, possible image duplication, optional Fuseki health noise.

I would value your Pass / Fail / Pass-with-notes judgment for each product, plus any blocking reproduction notes.

Thank you,  
Yousef Samman

---

## 11. Document control

| Field | Value |
|-------|--------|
| Document type | Professor / evaluator handover |
| Companion engineering note | `docs/PHASE7_REVIEWER_HANDOVER_2026-08-26.md` (more operational detail) |
| Prior rehearsal (historical) | `docs/PHASE6_ACCEPTANCE_REHEARSAL_2026-08-26.md` (pre-fix state) |
| Deployment guide (owner) | `DEPLOYMENT.md` |
| Live release evaluated | `7c10e1e9f26a66d74c3227c9bdfc59a06f97bd03` |

---

*End of professor handover.*
