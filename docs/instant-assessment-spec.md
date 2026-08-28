# Instant Assessment Generation — Spec

## Overview

When a student clicks "Start Assessment", 47 personalized MCQ questions must be ready within **30 seconds**. The system pre-generates questions at login time (background), and serves them instantly when the user clicks.

---

## Current Flow (Slow)

```
Login → Redirect to /assessment/employability → Click "Start Assessment"
  → POST /api/iscarb/assessment/attempt
  → ensureAttemptExamGeneration() → enqueueAttemptExamGeneration()
  → generateAllForAttempt() → 47 AI calls (serial, ~4s each)
  → Total: ~3-7 minutes ❌ TOO SLOW
```

## Desired Flow (Fast)

```
Login → Pre-generate 47 questions in background (10-30s)
  → Click "Start Assessment"
  → Check if pre-generation is complete
  → If YES: Start immediately (0s wait) ✅
  → If NO: Show progress bar, wait until complete ✅
  → Total: 0-30 seconds ✅
```

---

## Requirements

### R1: Pre-generation at Login
- When student logs in, immediately start generating 47 personalized questions
- Generation runs in background (fire-and-forget)
- Questions are personalized to the student's exact specialization
- Use all 5 NVIDIA API keys in parallel for maximum speed

### R2: Instant Start on Click
- When user clicks "Start Assessment", check if pre-generation is complete
- If complete: Start immediately with 0 wait time
- If in progress: Show progress bar ("Generating questions... 25/47")
- Never block the UI — always show progress

### R3: 30-Second Target
- Pre-generation must complete within 30 seconds
- With fast model (nvidia/nemotron-3-nano-30b-a3b at ~4s) + batching (4 per call) + 5 keys:
  - 47 questions ÷ 4 per batch = ~12 LLM calls
  - 12 calls × 4s = ~48s serial
  - With 5 keys parallel: ~10-15s ✅

### R4: Personalization
- Questions MUST match the student's exact specialization (Computer Science, Business, etc.)
- Each question must be structurally grounded in the specialization domain
- Generic questions are NOT acceptable

### R5: 47 Questions
- Full assessment with 47 modules
- Covers all 4 dimensions (Core Professionalism, Business & Digital, Job-Fit, Growth Potential)

### R6: Progress Indicator
- Show "Preparing your assessment..." with progress bar
- Display "X/47 questions generated"
- Allow user to see real-time progress

---

## Technical Implementation

### 1. Pre-generation at Login

**File:** `src/app/api/v1/auth/login/route.ts`

```typescript
// After successful student login
if (role === "student") {
  void (async () => {
    const userWithStudent = await db.user.findUnique({
      where: { id: user.id },
      select: { student: { select: { id: true, program: true, college: true } } },
    });
    const studentId = userWithStudent?.student?.id;
    const specialization = userWithStudent?.student?.program || userWithStudent?.student?.college;
    if (studentId && specialization) {
      await enqueueSignupExamGeneration(studentId, specialization);
    }
  })();
}
```

### 2. Check Pre-generation Status

**File:** `src/app/api/iscarb/assessment/attempt/route.ts` (GET)

- Check if attempt exists and is ready
- Return `preparing: true/false` and `progress: { done, total }`
- Frontend polls this every 2 seconds

### 3. Frontend Progress UI

**File:** `src/components/views/ActiveAssessmentView.tsx`

```typescript
// Poll while preparing
useEffect(() => {
  if (preparing && attemptId) {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/iscarb/assessment/attempt`, { headers: authHeaders() });
      const { attempt } = await res.json();
      if (!attempt.preparing) {
        setPreparing(false);
        // Load modules and start
      } else {
        setProgress(attempt.progress);
      }
    }, 2000);
    return () => clearInterval(interval);
  }
}, [preparing, attemptId]);
```

### 4. Batch Generation (Speed Optimization)

**File:** `src/lib/assessment/attempt-exam-generator.ts`

- Use `generateSpecializationQuestionBatch()` for 4 questions per LLM call
- Run up to 40 concurrent requests (5 keys × 8 per key)
- Target: 12 batched calls × 4s = ~48s serial, ~10-15s parallel

### 5. Model Configuration

**File:** `.env`

```bash
# Fast model for assessment generation
EXAM_LIVE_GENERATION_MODEL=nvidia/nemotron-3-nano-30b-a3b

# Maximum concurrency for 5 API keys
AI_CONCURRENCY_MAX=40
EXAM_PREPARE_CONCURRENCY=40

# Enable live generation
EXAM_LIVE_GENERATION=true
```

---

## Edge Cases

### E1: Pre-generation Not Complete When User Clicks
- Show progress bar with "Generating questions... X/47"
- Poll every 2 seconds until complete
- Never block the UI

### E2: Pre-generation Fails
- Fall back to question bank (pre-written questions)
- Show warning: "Using default questions. Your specialization-specific questions will be available shortly."
- Allow user to proceed with bank questions

### E3: User Logs Out and Back In
- If previous attempt exists and is ready, reuse it
- If previous attempt exists but not ready, continue generation
- If no previous attempt, start fresh generation

### E4: Multiple Tabs/Open Windows
- Use the same attempt ID across tabs
- Only one generation process should run at a time (idempotent)

### E5: Network Errors During Generation
- Retry with exponential backoff
- Show "Connection lost. Retrying..." to user
- Never lose generated questions (persist after each batch)

---

## Performance Targets

| Metric | Current | Target | How |
|--------|---------|--------|-----|
| Model | meta/llama-3.2-11b-vision-instruct | nvidia/nemotron-3-nano-30b-a3b | Faster model |
| Per-question time | ~9s | ~4s | Faster model |
| Concurrency | 10 | 40 | 5 keys × 8 per key |
| Batch size | 1 (serial) | 4 (batched) | Batch generation |
| 47-question exam | ~7 min | ~15s | All optimizations |
| Wait on click | 3-7 min | 0s (if pre-generated) | Pre-generation at login |

---

## Testing Checklist

- [ ] Login as student → verify pre-generation starts
- [ ] Navigate to /assessment/employability → verify report loads
- [ ] Click "Start Assessment" → verify questions appear within 30s
- [ ] If pre-generation not complete → verify progress bar shows
- [ ] If pre-generation fails → verify fallback to bank questions
- [ ] Verify questions are personalized to student's specialization
- [ ] Verify all 47 questions are present
- [ ] Verify correct answer positions are randomized
- [ ] Verify no duplicate questions
- [ ] Verify Arabic translations are present

---

## Files to Modify

1. `src/app/api/v1/auth/login/route.ts` — Pre-generation at login
2. `src/app/api/iscarb/assessment/attempt/route.ts` — Status check
3. `src/components/views/ActiveAssessmentView.tsx` — Progress UI
4. `src/lib/assessment/attempt-exam-generator.ts` — Batch generation
5. `src/lib/assessment/live-exam-generation.ts` — Concurrency settings
6. `.env` — Model and concurrency configuration

---

## Success Criteria

1. ✅ Student clicks "Start Assessment" → questions appear within 30 seconds
2. ✅ Questions are personalized to student's exact specialization
3. ✅ Progress bar shows real-time generation status
4. ✅ All 47 questions are present and valid
5. ✅ No UI blocking or freezing during generation
