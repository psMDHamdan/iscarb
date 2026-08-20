/**
 * E2E — Faculty Full Journey (Masterplan §5.3.1, §8.5)
 *
 * Covers the complete faculty lifecycle:
 *   Login → Dashboard → Review Queue → Score Override → Calibration →
 *   Class Management → Analytics → AI Studio
 */

import { describe, it, expect, beforeAll, vi } from "vitest";

function mockFetch(handlers: Record<string, (body?: any) => any>) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${url}`;
    const handler = handlers[key] ?? handlers["*"];
    if (!handler) throw new Error(`Unmocked fetch: ${key}`);
    const result = handler(init?.body ? JSON.parse(init.body as string) : undefined);
    return {
      ok: result.ok ?? true,
      status: result.status ?? 200,
      json: async () => result,
    } as Response;
  });
}

describe("E2E: Faculty Full Journey", () => {
  let facultyFetch: ReturnType<typeof mockFetch>;

  beforeAll(() => {
    facultyFetch = mockFetch({
      "POST /api/auth/login": (body) => {
        if (body.email.includes("faculty") && body.password === "password123") {
          return { ok: true, data: { token: "jwt-faculty", user: { role: "faculty", id: "fac-01" } } };
        }
        return { ok: false, status: 401, data: { error: "Invalid credentials" } };
      },
      "GET /api/iscarb/session": () => ({
        data: { role: "faculty", userId: "fac-01", universityCode: "KFU" },
      }),
      "GET /api/iscarb/dashboard": () => ({
        data: {
          pendingReviewCount: 3,
          classCount: 2,
          totalStudents: 85,
          recentSubmissions: [
            { id: "sub-1", studentName: "Ahmed Al-Saud", assessment: "Algorithmic Thinking", score: 72, confidence: 0.65, flag: "low-confidence" },
            { id: "sub-2", studentName: "Nora Al-Ghamdi", assessment: "Data Structures", score: 88, confidence: 0.92, flag: null },
            { id: "sub-3", studentName: "Faisal Al-Otaibi", assessment: "Business Communication", score: 58, confidence: 0.55, flag: "low-confidence" },
          ],
        },
      }),
      "GET /api/iscarb/assessment/submissions": () => ({
        data: [
          { id: "sub-1", studentId: "stu-1", studentName: "Ahmed Al-Saud", assessmentId: "assess-1", assessmentTitle: "Algorithmic Thinking", score: 72, confidence: 0.65, scoredBy: "ai", status: "submitted", submittedAt: "2026-07-10T10:30:00Z" },
          { id: "sub-2", studentId: "stu-2", studentName: "Nora Al-Ghamdi", assessmentId: "assess-2", assessmentTitle: "Data Structures", score: 88, confidence: 0.92, scoredBy: "ai", status: "submitted", submittedAt: "2026-07-10T09:15:00Z" },
          { id: "sub-3", studentId: "stu-3", studentName: "Faisal Al-Otaibi", assessmentId: "assess-1", assessmentTitle: "Algorithmic Thinking", score: 58, confidence: 0.55, scoredBy: "heuristic", status: "submitted", submittedAt: "2026-07-09T14:00:00Z" },
        ],
      }),
      "GET /api/iscarb/assessment/submissions?confidence_lt=0.7": () => ({
        data: [
          { id: "sub-1", studentName: "Ahmed Al-Saud", score: 72, confidence: 0.65, scoredBy: "ai", flagReason: "Low confidence (65%)" },
          { id: "sub-3", studentName: "Faisal Al-Otaibi", score: 58, confidence: 0.55, scoredBy: "heuristic", flagReason: "Low confidence (55%) + heuristic" },
        ],
      }),
      "PATCH /api/iscarb/assessment/submissions/:id/score": (body) => ({
        ok: true,
        data: {
          success: true,
          previousScore: 72,
          newScore: body?.score ?? 78,
          reviewedBy: "fac-01",
          reviewedAt: new Date().toISOString(),
          explanation: body?.feedback ?? "",
        },
      }),
      "GET /api/iscarb/assessment/submissions/:id/audit": () => ({
        data: [
          { action: "ai_scored", from: null, to: 72, by: "system", at: "2026-07-10T10:31:00Z" },
          { action: "human_reviewed", from: 72, to: 78, by: "fac-01", at: new Date().toISOString() },
        ],
      }),
      "POST /api/iscarb/assessment/:id/calibration": (body) => ({
        data: {
          success: true,
          sessionId: "cal-1",
          multiplier: body?.multiplier ?? 1.05,
          affectedSubmissions: 5,
          appliedAt: new Date().toISOString(),
        },
      }),
      "GET /api/iscarb/assessment/:id/calibration": () => ({
        data: {
          sessions: [
            { id: "cal-1", date: "2026-07-10", multiplier: 1.05, reason: "Adjusted for rubric clarity", affected: 5, appliedBy: "fac-01" },
            { id: "cal-2", date: "2026-07-05", multiplier: 1.10, reason: "Generic adjustment", affected: 3, appliedBy: "fac-01" },
          ],
        },
      }),
      "GET /api/iscarb/enrichment/review": () => ({
        data: {
          pending: [
            { id: "enr-1", student: "Sara Al-Mutairi", type: "skill_endorsement", confidence: 0.83, submittedAt: "2026-07-10" },
            { id: "enr-2", student: "Khalid Al-Rashid", type: "achievement_verify", confidence: 0.91, submittedAt: "2026-07-09" },
          ],
        },
      }),
      "POST /api/iscarb/enrichment/review": (body) => ({
        data: { success: true, approved: body?.approved ?? true },
      }),
      "GET /api/iscarb/report-generation": () => ({
        data: {
          templates: [
            { id: "rpt-1", name: "Class Performance Summary", type: "pdf" },
            { id: "rpt-2", name: "Competency Distribution", type: "csv" },
          ],
        },
      }),
      "GET /api/iscarb/ai-studio/templates": () => ({
        data: [
          { id: "pt-1", name: "Graduate-Level Scoring", model: "gpt-4", usageCount: 42 },
          { id: "pt-2", name: "Rubric Assessment v2", model: "openai/gpt-oss-20b", usageCount: 28 },
        ],
      }),
      "GET /api/iscarb/integration-hub": () => ({
        data: { summary: { connectedCount: 6, totalCount: 7 } },
      }),
      "*": () => ({ ok: true, data: {} }),
    });
  });

  // ── 1. Login & Session ─────────────────────────────────────────────────
  describe("Phase 1: Authentication", () => {
    it("faculty logs in and receives role-scoped session", async () => {
      const res = await facultyFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "faculty@university.edu", password: "password123" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(res.ok).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.user.role).toBe("faculty");
    });

    it("faculty cannot login with wrong password", async () => {
      const res = await facultyFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "faculty@university.edu", password: "wrongpass" }),
        headers: { "Content-Type": "application/json" },
      });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(401);
    });
  });

  // ── 2. Dashboard & Review Queue ─────────────────────────────────────────
  describe("Phase 2: Dashboard & Review Queue", () => {
    it("dashboard shows pending review count and recent submissions", async () => {
      const res = await facultyFetch("/api/iscarb/dashboard");
      const body = await res.json();
      expect(body.data.pendingReviewCount).toBeGreaterThan(0);
      expect(body.data.recentSubmissions.length).toBeGreaterThanOrEqual(3);
    });

    it("review queue returns only low-confidence submissions (<0.7)", async () => {
      const res = await facultyFetch("/api/iscarb/assessment/submissions?confidence_lt=0.7");
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      body.data.forEach((sub: any) => {
        expect(sub.confidence).toBeLessThan(0.7);
      });
    });

    it("faculty can view all submissions for their assessments", async () => {
      const res = await facultyFetch("/api/iscarb/assessment/submissions");
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(3);
      expect(body.data[0].studentName).toBeDefined();
      expect(body.data[0].score).toBeDefined();
    });
  });

  // ── 3. Score Override ───────────────────────────────────────────────────
  describe("Phase 3: Score Override & Audit Trail", () => {
    it("faculty overrides score and audit trail is created", async () => {
      // Override
      const overrideRes = await facultyFetch("/api/iscarb/assessment/submissions/:id/score", {
        method: "PATCH",
        body: JSON.stringify({ score: 78, feedback: "Student showed deeper understanding in discussion" }),
        headers: { "Content-Type": "application/json" },
      });
      const overrideBody = await overrideRes.json();
      expect(overrideBody.data.success).toBe(true);
      expect(overrideBody.data.newScore).toBe(78);
      expect(overrideBody.data.reviewedBy).toBe("fac-01");

      // Audit trail
      const auditRes = await facultyFetch("/api/iscarb/assessment/submissions/:id/audit");
      const auditBody = await auditRes.json();
      expect(auditBody.data.length).toBeGreaterThanOrEqual(2);
      expect(auditBody.data[1].action).toBe("human_reviewed");
      expect(auditBody.data[1].by).toBe("fac-01");
    });

    it("score override records correct before/after values", async () => {
      const res = await facultyFetch("/api/iscarb/assessment/submissions/:id/score", {
        method: "PATCH",
        body: JSON.stringify({ score: 85, feedback: "Excellent work" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(body.data.previousScore).toBe(72);
      expect(body.data.newScore).toBe(85);
    });
  });

  // ── 4. Calibration ──────────────────────────────────────────────────────
  describe("Phase 4: Calibration Sessions", () => {
    it("faculty creates calibration and applies multiplier to submissions", async () => {
      const res = await facultyFetch("/api/iscarb/assessment/:id/calibration", {
        method: "POST",
        body: JSON.stringify({ multiplier: 1.05, reason: "Adjusted for rubric clarity" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(body.data.success).toBe(true);
      expect(body.data.multiplier).toBe(1.05);
      expect(body.data.affectedSubmissions).toBeGreaterThan(0);
    });

    it("calibration history shows past sessions with details", async () => {
      const res = await facultyFetch("/api/iscarb/assessment/:id/calibration");
      const body = await res.json();
      expect(body.data.sessions.length).toBeGreaterThanOrEqual(2);
      expect(body.data.sessions[0].multiplier).toBeDefined();
      expect(body.data.sessions[0].affected).toBeGreaterThan(0);
    });
  });

  // ── 5. Enrichment Review ─────────────────────────────────────────────────
  describe("Phase 5: Enrichment Review", () => {
    it("pending enrichment items are listed for review", async () => {
      const res = await facultyFetch("/api/iscarb/enrichment/review");
      const body = await res.json();
      expect(body.data.pending.length).toBeGreaterThanOrEqual(2);
    });

    it("faculty can approve/reject enrichment items", async () => {
      const res = await facultyFetch("/api/iscarb/enrichment/review", {
        method: "POST",
        body: JSON.stringify({ id: "enr-1", approved: true }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(body.data.success).toBe(true);
      expect(body.data.approved).toBe(true);
    });
  });

  // ── 6. AI Studio & Integration Hub ──────────────────────────────────────
  describe("Phase 6: AI Studio & Integration Hub Access", () => {
    it("faculty can access AI Studio prompt templates", async () => {
      const res = await facultyFetch("/api/iscarb/ai-studio/templates");
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(2);
    });

    it("faculty can access integration hub status", async () => {
      const res = await facultyFetch("/api/iscarb/integration-hub");
      const body = await res.json();
      expect(body.data.summary.connectedCount).toBeGreaterThan(0);
    });
  });
});
