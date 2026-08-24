# Faculty Visual Bugs — Diagnosis Report

**Date:** 2026-08-24  
**Investigator:** Faculty AI Copilot audit session  
**Live project:** `cmt6k6ikz002kitmg9n12wuf5` (E2E Full Walk 2026-08-24)  
**Faculty credentials used:** `faculty@iscarb.edu`  
**Scope:** Diagnosis only (Bug A + Bug B). No fixes implemented in this pass.

---

## Executive summary

| Bug | User-visible symptom | Root cause (confirmed) |
|-----|---------------------|------------------------|
| **A — Broken / reused images** | Images missing or identical across slides | (1) `visualSpec` is **never persisted** during generation; UI falls back to keyword-matched Unsplash URLs. (2) The dominant match for this DB lecture (`photo-1544383835…`) returns **HTTP 404**, so proxied images fail with **502**. (3) Keyword scoring maps **12/20 slides** to the same URL. |
| **B — “Content generating” empty slides** | Bullet column shows **“Content loading…”** with no bullets | **Not** a stuck generation job. Slides **1, 7, 10, 16** persisted **LLM-fallback stubs** (`visibleCopy: "Error loading generated content."`, `body.bullets: []`). UI placeholder text is misleading. **Unrelated** to density/QA flagged status. |

---

## Evidence project snapshot

| Metric | Value |
|--------|-------|
| Slide artifacts (current) | 20 |
| `contentJson.visualSpec` present | **0 / 20** |
| `contentJson.visualSpec.imageUrl` in DB | **0 / 20** |
| Slides with `body.bullets.length === 0` | **4** (S1, S7, S10, S16) |
| Density gate (post Task 1) | `severity: warning`, `status: warn`, **12** over-40-word findings |
| Publish blockers from density | **None** (`failedErrorGates: 0`) |

Raw probe artifacts: `scripts/_visual_bug_probe.json`, `scripts/_visual_bug_deep.json`, `scripts/_fallback_image_analysis.json`.

---

## Bug A — Slide images broken / reused

### How slide images are supposed to be sourced (code path)

There are **three** image paths in the codebase; only one is wired to the live generation worker:

| Path | File | Used in live generate? |
|------|------|------------------------|
| **A. Visual intelligence (Wikimedia + curated + AI)** | `src/lib/lecture/generation/visual-intelligence.ts` → `generateVisualSpec()` | **Imported but never called** in `generation-worker.ts` (dead import at line 50) |
| **B. Pipeline Pass 11 (AI image synthesis)** | `src/lib/lecture/generation/pipeline/passes/pass11-assets.ts` | Used by **pipeline** flow only; not by `generateSlideChunk()` worker path used for faculty Studio |
| **C. Client-side curated fallback** | `src/lib/lecture/academic-visuals.ts` → `getAcademicVisualForSlide()` | **Active at render time** in `SlidePreviewCard.tsx` when `visualSpec` is absent |

**Studio render path:**

```37:40:src/components/lecture/SlidePreviewCard.tsx
  const currentDisplayImage =
    content?.visualSpec?.fetchedImageUrl ||
    content?.visualSpec?.imageUrl ||
    fallbackVisual.imageUrl;
```

All images are routed through CSP-safe proxy:

```6:10:src/lib/image-proxy.ts
export function proxiedImageUrl(url: string | null | undefined): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `/api/iscarb/image-proxy?url=${encodeURIComponent(url)}`;
  }
```

### Why images do not appear (evidence)

1. **Nothing persisted:** DB probe of all 20 slides shows `hasVisualSpec: false`, `imageUrl: null` for every slide.

2. **Fallback URL is dead:** For database-topic slides, keyword matching selects:

   ```
   https://images.unsplash.com/photo-1544383835-bda2bc66a2e2?auto=format&fit=crop&w=1200&q=80
   ```

   Live fetch (2026-08-24):

   | Request | HTTP status |
   |---------|-------------|
   | Direct to Unsplash | **404** |
   | Via `/api/iscarb/image-proxy?url=…` | **502** (`Upstream image request failed (404)`) |

3. **Some fallbacks work:** Discipline fallback `photo-1677442136019…` (cs_ai) returns **200** direct and via proxy — so slides that miss database keywords can show *an* image while database-keyword slides show broken `<img>`.

4. **Not a rendering-only bug:** The `<img>` tag is present; upstream asset + missing persistence are the failures.

### Why the same image is reused (evidence)

Because `visualSpec` is null, **every slide** uses `getAcademicVisualForSlide(slideNo, title, bulletsText)` at render time. For this relational-database lecture:

| Fallback bucket | Unsplash photo id | Slides (from keyword simulation) |
|-----------------|-------------------|----------------------------------|
| Database Systems entry | `photo-1544383835…` (**404**) | S2, S3, S5, S6, S8, S9, S10, S11, S13, S14, S15, S18 (**12 slides**) |
| cs_ai discipline fallback | `photo-1677442136019…` (200) | S1, S4, S7, S12, S16, S19, S20 (**7 slides**) |
| Saudi Vision 2030 entry | `photo-1586348943529…` (200) | S17 (**1 slide**) |

This is **not** a cache-key bug assigning one id to all slides — it is **deterministic keyword scoring** in `getAcademicVisualForSlide()` with no per-slide persisted override. Slides sharing topic tokens (database, sql, query, indexing, …) converge on the same TOPIC_IMAGE_MAP row.

Relevant matcher:

```417:420:src/lib/lecture/academic-visuals.ts
    keywords: ["database", "sql", "nosql", "query", "indexing", "relational database", "schema", "transaction", "acid"],
    imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a2e2?auto=format&fit=crop&w=1200&q=80",
    title: "Database Systems",
```

### Per-slide failure matrix (project `cmt6k6ikz002kitmg9n12wuf5`)

| Slide | DB `visualSpec` | Render fallback | Image loads? | Why |
|-------|-----------------|-----------------|--------------|-----|
| 2 | null | Database Systems URL | **No** | Unsplash 404 → proxy 502 |
| 6 | null | Database Systems URL | **No** | Same |
| 17 | null | Vision 2030 URL | **Yes** | Different keyword bucket, URL 200 |
| 1 | null | cs_ai discipline | **Yes** | No DB keyword hit in title/bullets |
| … | null | (see bucket table) | Mixed | 12 slides share broken DB URL |

### Proposed fix shape (not implemented)

1. **Wire generation:** After `generateSlideArtifact()`, call `generateVisualSpec(content)` in `generation-worker.ts` and persist `content.visualSpec` (remove dead import → active call).
2. **Validate curated URLs:** Audit/replace dead Unsplash IDs in `TOPIC_IMAGE_MAP` (at minimum `photo-1544383835…`); add CI check that curated URLs return 200.
3. **Per-slide uniqueness:** Persist `fetchedImageUrl` per slide from Wikimedia search (already implemented in `visual-intelligence.ts`) so `gateVisualUniqueness` can enforce distinct assets.
4. **Optional UX hardening:** Show broken-image state in `SlidePreviewCard` when proxy returns non-200 instead of silent broken `<img>`.

---

## Bug B — Slides stuck on “content generating” / empty body

### Where the UI string comes from

Faculty Studio slide canvas uses `SlidePreviewCard`. When `body.bullets` is empty, it injects a **static placeholder** — not a polling/generation state:

```103:105:src/components/lecture/SlidePreviewCard.tsx
            <ul className={...}>
              {(bullets.length ? bullets : ["Content loading..."]).slice(0, 4).map((b, i) => (
```

There is **no** string `"content generating"` in the lecture Studio path; faculty likely paraphrased **“Content loading…”**. Regeneration overlay is a separate spinner on the slide list item (`studio/page.tsx` ~396), not inside the bullet column.

### What should replace the placeholder

Normal slides store bullets in `contentJson.body.bullets` (see `normalizeArtifact()` in `slide-generator.ts`). The preview should render those bullets (or `visibleCopy` / `studentExperience` text), not a perpetual loading string.

### Affected slides — DB vs UI (evidence)

| Slide | `status` | `body.bullets` | `body.visibleCopy` | Generation origin |
|-------|----------|----------------|--------------------|-------------------|
| **1** | approved | `[]` | `"Error loading generated content."` | `buildFallbackSlide()` stub |
| **7** | approved | `[]` | `"Error loading generated content."` | LLM timeout / failure fallback |
| **10** | approved | `[]` | `"Error loading generated content."` | LLM timeout / failure fallback |
| **16** | approved | `[]` | `"Error loading generated content."` | LLM timeout / failure fallback |

Fallback builder (sets visibleCopy but bullets may be empty when source blocks exhausted):

```941:955:src/lib/lecture/generation/slide-generator.ts
function buildFallbackSlide(...) {
  ...
  return {
    ...
    body: {
      visibleCopy: "Error loading generated content.",
      bullets
    },
```

For these four slides, **`bullets` resolved to `[]`** (no usable source-block snippets), so the UI shows **“Content loading…”** even though generation **finished** and rows are **approved**.

### Is this related to flagged / density QA?

**No — separate failure mode.**

| Check | Result |
|-------|--------|
| Current artifact status for S1/S7/S10/S16 | `approved` (not `flagged`) |
| Content present in DB? | **Yes** — title + `visibleCopy` + `visualIntent`; bullets intentionally empty |
| Density gate | Flags **other** slides (S2, S4, …) for word count; does **not** cause empty bullets |
| Stuck job / `generating` project status | Project is `review`; generation job completed 20/20 |

During initial E2E, all 20 slides were briefly `flagged` for QA; post inbox approve-all they became `approved`. The four empty-bullet slides retain **fallback content**, not a missing persistence race.

### Proposed fix shape (not implemented)

1. **UI:** In `SlidePreviewCard`, if `bullets.length === 0`, fall back to `[visibleCopy]` or show explicit **“Generation failed — regenerate slide”** when `visibleCopy === "Error loading generated content."`.
2. **Generation:** Improve `buildFallbackSlide()` to always populate ≥1 bullet from plan title / scoped blocks; or re-queue failed slides instead of persisting empty-bullet stubs.
3. **Studio honesty:** Replace **“Content loading…”** with copy that distinguishes *in-flight* (regen spinner) vs *failed/empty persisted* states.

---

## Task 1 confirmation — Density gate is warning-only (implemented)

Changes applied in this session (plus prior in-progress edits):

| File | Change |
|------|--------|
| `src/lib/lecture/quality/types.ts` | `GATE_SEVERITY.density` → `"warning"` |
| `src/lib/lecture/quality/gates/density.gate.ts` | `status: "warn"` when findings exist |
| `src/lib/lecture/quality/gates/student-experience.gate.ts` | Removed duplicate >40-word check (density owns it) |
| `src/app/api/iscarb/lecture/projects/[id]/validate/route.ts` | Warnings include `status: "warn"` gates (density now visible in API) |

### Live verification (project `cmt6k6ikz002kitmg9n12wuf5`)

**POST `/validate` (after re-run):**

```json
{
  "warnCount": 2,
  "failCount": 0,
  "densityInBlockers": false,
  "densityWarning": {
    "status": "warn",
    "severity": "warning",
    "findingCount": 12,
    "sample": [
      { "slideNo": 2, "message": "51 words — max 40" },
      { "slideNo": 4, "message": "59 words — max 40" },
      { "slideNo": 5, "message": "49 words — max 40" }
    ]
  }
}
```

**`LectureGateResult` row (density):** `severity: warning`, `status: warn`, 12 findings (slides 2, 4, 5, 6, 11, 12, 13, 15, 17, 18, 19, 20).

**POST `/publish-readiness` / `/publish`:**

```json
{
  "failedErrorGates": 0,
  "blockers": ["1 slide(s) not yet approved"]
}
```

Publish **422** was due to **one unapproved slide**, not density or any error gate. With readiness items approved and all slides approved, density warnings alone do **not** block publish (`publish/route.ts` only counts `severity: "error"` + `status: "fail"`).

---

## Recommended approval before implementation

| Priority | Bug | Suggested approach |
|----------|-----|-------------------|
| P0 | A | Call `generateVisualSpec` in worker + persist; fix dead Unsplash URL |
| P1 | A | Per-slide Wikimedia fetch already in `visual-intelligence.ts` — enable it |
| P1 | B | Fix `SlidePreviewCard` empty-bullet fallback + fallback slide content |
| P2 | B | Retry/regen on LLM timeout instead of empty-bullet stub |

---

## Files referenced

- `src/lib/lecture/generation/generation-worker.ts` — slide generation (visual spec not invoked)
- `src/lib/lecture/generation/visual-intelligence.ts` — Wikimedia + curated resolver
- `src/lib/lecture/academic-visuals.ts` — client fallback keyword map
- `src/components/lecture/SlidePreviewCard.tsx` — faculty preview + “Content loading…”
- `src/lib/lecture/generation/slide-generator.ts` — `buildFallbackSlide`, `normalizeArtifact`
- `src/app/api/iscarb/image-proxy/route.ts` — CSP proxy (502 on upstream 404)
- `src/lib/lecture/quality/gates/density.gate.ts` — warning-only density gate
