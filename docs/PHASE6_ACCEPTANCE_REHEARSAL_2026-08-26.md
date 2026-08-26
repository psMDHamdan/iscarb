# Phase 6 — Acceptance Rehearsal (Live)

**Date:** 2026-08-26  
**URL under test:** https://demo.iscarb.org  
**Release:** `e127a138ac7bdb7853329848e3aac746c15c534a`  
**Mode:** Report only — **no fixes applied**  
**Method:** Live HTTPS API + route probes against production VM (not local mocks)

### Environment confirmation

| Item | Evidence |
|------|----------|
| Health | `GET /api/health` → **200**, `commitSha: e127a138…`, postgres/redis ok |
| Faculty account | `faculty@iscarb.edu` login **200**, role `faculty` |
| Fresh student | `reviewer.p6.1787714534956@iscarb.test` signup **201**, specialty `Computer Science / IT` |

Raw machine evidence: `scripts/_phase6_acceptance_out.json`, `scripts/_phase6_faculty_out.json`

---

## Product E2E confirmation

| Product | End-to-end on live URL? | Notes |
|---------|-------------------------|-------|
| **Employability assessment** | **PARTIAL** | Signup → 47 MCQs → score 47/47 → report **200** with dimension counts summing to **47**. Full submit/`batch-score` finalize returned **409 NO_ANSWERS**; certificate correctly blocked (**409**) until completed attempt. |
| **Faculty copilot** | **FAIL (blocked)** | Create project **201**, CLO approve **200**, source upload **202**. Plan job accepted (**202**, claimed `slideCount: 20`) but after ~5 min poll: **0 slides**, project `status: failed`, plan approve **422 PLAN_GATE_FAILED**. Generate posted **202** with **`slidesQueued: 0`**. Model-runs: **0**. Full ~24 min generation **did not complete** (never meaningfully started). |

---

## Verdict table — ISC-QA / reviewer findings #1–#14

| # | Finding | Tested behavior on live site | Verdict | Real evidence |
|---|---------|------------------------------|---------|---------------|
| **1** | Report reliability (ISC-QA-001) | After scoring all 47 via `/score`, `GET /api/iscarb/assessment/report` returns **200** with live profile. `POST /batch-score` (finalize submit) returns **409** `NO_ANSWERS` — submit/finalize path inconsistent with per-question scoring. | **PARTIAL** | Report 200, composite 19, dimensions present. Batch-score: `{"error":"You must answer at least one question…","code":"NO_ANSWERS"}`. Attempt answer keys via GET attempt: **0** after 47 score calls. |
| **2** | Certificate ownership / completion (ISC-QA-002) | Incomplete + spoof query (`?score=100&name=HackedPerson`) → **409**. After 47 scores still **409** (“requires completed attempt”). Cross-student report → **404 Attempt not found**. | **CLOSED** (gates) / **PARTIAL** (happy-path mint) | Cert incomplete/spoof **409**; cross-tenant **404**. Could not mint PNG because finalize never completed. Spoof mitigation holds. |
| **3** | Answer-position predictability (ISC-QA-003 shuffle) | Selected option index **0** on first 12 modules: scores `[0,0,0,0,100,0,0,0,0,0,0,0]` via `keyed_mcq` — correct answer is **not** always first. | **CLOSED** | Live score probe; source `keyed_mcq`. |
| **4** | Item-bank / answer-key exposure | Modules payload: **no** `correctIndex` / `answerKey` / `isCorrect`. Key `rubric` present but values are **`[]`** (sanitized empty). Choices are plain option strings (4 MCQ). Forbidden-key scan flagged `rubric` key name on all 47 (empty arrays). | **PARTIAL** | Sample module keys include `rubric` (empty). `hasCorrectIndex: false`. Sanitized sample in `_phase6_acceptance_out.json`. |
| **5** | Specialty match (ISC-QA-004) | CS/IT exam: **47** modules; `jobFitSource: curated`; Job-Fit titles include Algorithms, System Design, Software Security, API Design, DevOps, SQL… No Sales/HR/SEO/CRM titles in scan. | **CLOSED** | `counts.total=47`, universal 29 + jobFit 18; badSpecialtyHits: `[]`. |
| **6** | No draft / STUB content (ISC-QA-005) | Title scan for STUB/TODO/PLACEHOLDER/Lorem: **0 hits**. All `questionType: mcq`, 4 choices each. | **CLOSED** | `draftHits: []`; `questionTypes: ['mcq']`; `choiceLens: [4]`. |
| **7** | Report count reconciliation (ISC-QA-006) | Dimension `moduleCount` sum: 15+5+18+9 = **47**. Weights 0.25+0.2+0.4+0.15 = **1.0**. Selected=scored=reported via report path after 47 `/score` calls. Finalize/`batch-score` path still broken (see #1). | **PARTIAL** | Report dims moduleCountSum **47**; batch-score **409**. |
| **8** | Arabic / RTL (ISC-QA-007) | Catalog/report has `titleAr` / dimension `labelAr` (Arabic script present). Module-0 `scenarioAr`/`choicesAr` **false**. Translate endpoint **requires auth** (**401** anon) — improved vs prior open translate. Full RTL browser layout **not** exercised. | **PARTIAL** | `titleAr: true`; report `labelAr` e.g. `الاحتراف المهني`; translate anon **401**. |
| **9** | Question-state sync (ISC-QA-008) | API-only rehearsal; no throttled browser navigation between questions. | **PARTIAL** | Not re-proven in browser this round. |
| **10** | Deterministic grading (ISC-QA-009) | Same module + same selection scored twice → identical scores (**100/100**), source `keyed_mcq`. | **CLOSED** | `determinism.same: true`. |
| **11** | Performance (ISC-QA-010) | Public routes ~190–976 ms. Score calls ~200–260 ms. Full 47 scores ~10.1 s. Health ~2 ms DB. No load test. | **PARTIAL** | Timings in out JSON; acceptable for single-user; no concurrency test. |
| **12** | Internal-data exposure (ISC-QA-011) | No Prisma/stack/connection-string leaks in auth/score/report error bodies observed. CSP still allows `unsafe-inline`/`unsafe-eval` (header on pages). Fuseki health error string is non-sensitive. False-positive “connection string” tip matched regulatory prose in modules meta — not a real DSN. | **PARTIAL** | Translate locked (**401**). CSP headers still permissive. No stack traces in sampled errors. |
| **13** | Assessment UX (ISC-QA-012) | Save/refresh/timer/flag/skip/finish **not** fully browser-proven. API: score works; batch finish fails (**409**). | **PARTIAL** / **OPEN** for finish path | Finish/`batch-score` **OPEN**. |
| **14** | Public / legal routes (ISC-QA-014) | `/` `/login` `/signup` `/privacy` `/terms` `/api/health` `/forgot-password` → **200**, not error pages. **`/register` → 404** (app uses `/signup`). | **PARTIAL** | `/register` **404**; all others **200**. |

---

## Faculty-specific acceptance checks

| Check | Verdict | Evidence |
|-------|---------|----------|
| Create lecture project | **PASS** | Project `cmt9j90rw004noz0140m96nhd`, HTTP **201** |
| Upload source | **PASS** (accepted) | Upload **202**, `documentId` issued; stats later `sourceParsed: true` |
| Full generation completes ~24 min without kill | **FAIL** | Plan never materialized (0 slides); project **`failed`**; `slidesQueued: 0`; **0** model-runs; no duration to record |
| Slides have images + content | **NOT TESTED** | Blocked by plan failure |
| Density warning shows, does not block | **NOT TESTED** | Blocked |
| Publish path correct | **NOT TESTED** | Blocked (plan approve **422**) |
| Export real file format | **NOT TESTED** | Blocked |

---

## CLOSED vs OPEN/PARTIAL (before inviting reviewer)

### Genuinely CLOSED (with live evidence)

1. **#3** Answer-position / shuffle  
2. **#5** Specialty CS/IT set (47 curated Job-Fit)  
3. **#6** No STUB/draft titles; all MCQ×4  
4. **#10** Deterministic `keyed_mcq` scoring  
5. **#2** (partial credit as gate) Certificate blocked until completed attempt; spoof query does not mint; cross-user report 404  

### Still OPEN / PARTIAL — fix before reviewer (severity)

| Severity | # | Issue |
|----------|---|--------|
| **P0** | Faculty E2E | Plan generation fails on live VM (`status: failed`, 0 slides, 0 model-runs). Cannot prove ~24 min long-lived generation. |
| **P0** | **#1 / #13 finish** | `POST /batch-score` → `NO_ANSWERS` after 47 successful `/score` calls — submit/finalize/certificate happy path broken. |
| **P1** | **#7** | Counts reconcile on **report** GET, but not via official finalize submit. |
| **P1** | **#4** | `rubric` key still present on every module (empty arrays); choices are raw strings (no opaque option IDs). No answer keys — but payload not minimal. |
| **P1** | **#14** | `/register` is **404**; only `/signup` works. If reviewer checklist literally hits `/register`, it fails. |
| **P1** | **#8** | Arabic labels present; full RTL UI + bilingual choices not proven; `choicesAr`/`scenarioAr` missing on sampled module. |
| **P2** | **#9 / #13 UX** | Browser navigation, timer, flag, skip not proven live. |
| **P2** | **#11 / #12** | No load test; CSP still weak (`unsafe-inline`/`unsafe-eval`). |

---

## Final verdict

**Do not invite the independent reviewer yet.**

Assessment core content/security improvements hold on https://demo.iscarb.org (47 MCQ, shuffle, specialty, deterministic scoring, cert gates).  
Critical gaps remain: **exam finalize/submit path**, and **faculty plan→generation is broken on this deploy** — the exact proof that “long-lived VM fixes serverless” was **not** obtained.

### Immediate follow-up (next phase — fixes, not this report)

On the VM, capture why plan failed:

```bash
docker logs iscarb-app --since 2h 2>&1 | grep -iE 'plan|generate|error|NVIDIA|fail|lecture' | tail -100
```

Paste that output before fix work begins.

---

*End of Phase 6 acceptance rehearsal. No application code was changed to produce this report.*
