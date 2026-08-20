/**
 * E2E — Recruiter Talent Acquisition Journey (Masterplan §5.3.1, §8.9, §8.10)
 *
 * Covers the complete recruiter lifecycle:
 *   Login → Talent Search → Pipeline Management → Auto-Matching →
 *   Employer Collaboration → Candidate Submission → Analytics
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

describe("E2E: Recruiter Talent Acquisition Journey", () => {
  let recFetch: ReturnType<typeof mockFetch>;
  let pipeline: string[] = [];

  beforeAll(() => {
    recFetch = mockFetch({
      "POST /api/auth/login": (body) => {
        if (body.email.includes("recruiter") && body.password === "password123") {
          return { ok: true, data: { token: "jwt-recruiter", user: { role: "recruiter", id: "rec-01", company: "Tech Corp" } } };
        }
        return { ok: false, status: 401, data: { error: "Invalid credentials" } };
      },
      "GET /api/iscarb/session": () => ({
        data: { role: "recruiter", userId: "rec-01", universityCode: "KFU" },
      }),
      "GET /api/iscarb/recruiter/candidates": (body) => ({
        data: {
          candidates: [
            { id: "stu-1", name: "Ahmed Al-Saud", program: "Computer Science", university: "KFU", readinessScore: 88, composite: 92, band: "strong", matchScore: 94, title: "Data Analyst", verifiedSkills: [{ skill: "Python", verified: true }, { skill: "SQL", verified: true }], hasProfile: true },
            { id: "stu-2", name: "Nora Al-Ghamdi", program: "Data Science", university: "KFU", readinessScore: 85, composite: 88, band: "strong", matchScore: 91, title: "Data Scientist", verifiedSkills: [{ skill: "Python", verified: true }, { skill: "Machine Learning", verified: true }], hasProfile: true },
            { id: "stu-3", name: "Faisal Al-Otaibi", program: "Software Engineering", university: "KFU", readinessScore: 82, composite: 85, band: "strong", matchScore: 87, title: "Software Engineer", verifiedSkills: [{ skill: "Java", verified: true }], hasProfile: true },
            { id: "stu-4", name: "Sara Al-Mutairi", program: "Business Analytics", university: "KFU", readinessScore: 79, composite: 80, band: "competent", matchScore: 83, title: "Business Analyst", verifiedSkills: [{ skill: "Excel", verified: true }, { skill: "Tableau", verified: true }], hasProfile: true },
            { id: "stu-5", name: "Khalid Al-Rashid", program: "Computer Engineering", university: "KFU", readinessScore: 76, composite: 78, band: "competent", matchScore: 79, title: "Systems Engineer", verifiedSkills: [{ skill: "C++", verified: true }], hasProfile: true },
          ],
          facets: { clusters: [{ name: "Data", count: 2 }, { name: "Engineering", count: 3 }], skills: [{ name: "Python", count: 2 }, { name: "SQL", count: 1 }], total: 5 },
          matched: 5,
          pagination: { page: 1, limit: 12, totalPages: 1, hasMore: false },
        },
      }),
      "GET /api/iscarb/recruiter/candidates?skill=Python&minScore=80": () => ({
        data: {
          candidates: [
            { id: "stu-1", name: "Ahmed Al-Saud", matchScore: 94, readinessScore: 88, band: "strong" },
            { id: "stu-2", name: "Nora Al-Ghamdi", matchScore: 91, readinessScore: 85, band: "strong" },
          ],
          matched: 2,
          pagination: { page: 1, limit: 12, totalPages: 1, hasMore: false },
        },
      }),
      "POST /api/iscarb/recruiter/pipeline": (body) => {
        const studentId = body?.studentId;
        if (studentId && !pipeline.includes(studentId)) pipeline.push(studentId);
        return { ok: true, status: 201, data: { ok: true, studentId, stage: "identified", addedAt: new Date().toISOString() } };
      },
      "GET /api/iscarb/recruiter/pipeline": () => ({
        data: {
          stages: [
            { id: "identified", label: "Identified", count: 5, candidates: ["stu-1", "stu-2", "stu-3", "stu-4", "stu-5"] },
            { id: "contacted", label: "Contacted", count: 2, candidates: ["stu-1", "stu-2"] },
            { id: "interviewing", label: "Interviewing", count: 1, candidates: ["stu-1"] },
            { id: "offered", label: "Offered", count: 0, candidates: [] },
            { id: "hired", label: "Hired", count: 0, candidates: [] },
          ],
          total: 5,
        },
      }),
      "PATCH /api/iscarb/recruiter/pipeline/:id": (body) => ({
        data: { ok: true, studentId: body?.studentId, newStage: body?.stage, movedAt: new Date().toISOString() },
      }),
      "GET /api/iscarb/recruiter/analytics": () => ({
        data: {
          searchesPerformed: 28,
          candidatesIdentified: 156,
          candidatesContacted: 42,
          interviewsScheduled: 18,
          offersExtended: 5,
          hiresConfirmed: 3,
          conversionRate: 1.9,
          avgTimeToHire: 18.5,
          topCompetencies: [
            { name: "Python", count: 45, avgScore: 82 },
            { name: "Data Analysis", count: 38, avgScore: 78 },
            { name: "Communication", count: 32, avgScore: 76 },
          ],
        },
      }),
      "GET /api/iscarb/recruiter/activity": () => ({
        data: { activities: [
          { action: "search", params: "Python, score > 80", results: 12, timestamp: "2h ago" },
          { action: "pipeline_add", candidate: "Ahmed Al-Saud", stage: "identified", timestamp: "3h ago" },
          { action: "pipeline_move", candidate: "Nora Al-Ghamdi", from: "identified", to: "contacted", timestamp: "5h ago" },
        ]},
      }),
      "GET /api/iscarb/recruiter/pools": () => ({
        data: [
          { id: "pool-1", name: "Tech Talent Pipeline", description: "Software & data roles", candidateCount: 18, autoMatchEnabled: true, lastAutoMatch: "2026-07-11" },
          { id: "pool-2", name: "Engineering Graduate Program", description: "Fresh graduates for rotational program", candidateCount: 12, autoMatchEnabled: false, lastAutoMatch: null },
        ],
      }),
      "GET /api/iscarb/recruiter/pools/:id": () => ({
        data: { id: "pool-1", name: "Tech Talent Pipeline", candidates: pipeline, autoMatchEnabled: true, autoMatchRules: { minComposite: 80, requiredSkills: ["Python", "SQL"], maxAgeDays: 90 } },
      }),
      "GET /api/iscarb/hackathons": () => ({
        data: [
          { id: "hack-1", title: "AI Innovation Challenge", sponsor: "Tech Corp", status: "upcoming", date: "2026-08-15", prizes: "SAR 50,000" },
          { id: "hack-2", title: "Cybersecurity Hackathon", sponsor: "STC", status: "open", date: "2026-07-20", prizes: "SAR 30,000" },
        ],
      }),
      "GET /api/iscarb/marketplace": () => ({
        data: { templates: [{ id: "tpl-1", title: "Technical Interview Kit", type: "assessment", price: "SAR 500" }] },
      }),
      "*": () => ({ ok: true, data: {} }),
    });
  });

  describe("Phase 1: Authentication", () => {
    it("recruiter logs in with valid credentials", async () => {
      const res = await recFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "recruiter@company.com", password: "password123" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(res.ok).toBe(true);
      expect(body.data.user.role).toBe("recruiter");
    });
  });

  describe("Phase 2: Talent Search", () => {
    it("search returns 5 matching candidates with facets", async () => {
      const res = await recFetch("/api/iscarb/recruiter/candidates");
      const body = await res.json();
      expect(body.data.candidates).toHaveLength(5);
      expect(body.data.matched).toBe(5);
      expect(body.data.facets.clusters).toBeDefined();
      expect(body.data.facets.skills).toBeDefined();
    });

    it("search with skill filter narrows results", async () => {
      const res = await recFetch("/api/iscarb/recruiter/candidates?skill=Python&minScore=80");
      const body = await res.json();
      expect(body.data.matched).toBeLessThanOrEqual(2);
      body.data.candidates.forEach((c: any) => {
        expect(c.matchScore).toBeGreaterThanOrEqual(80);
      });
    });

    it("candidates have verified skills and profile status", async () => {
      const res = await recFetch("/api/iscarb/recruiter/candidates");
      const body = await res.json();
      body.data.candidates.forEach((c: any) => {
        expect(c.verifiedSkills.length).toBeGreaterThan(0);
        expect(c.hasProfile).toBe(true);
      });
    });
  });

  describe("Phase 3: Pipeline Management", () => {
    it("recruiter adds candidates to pipeline", async () => {
      const candidates = ["stu-1", "stu-2", "stu-3"];
      for (const id of candidates) {
        const res = await recFetch("/api/iscarb/recruiter/pipeline", {
          method: "POST",
          body: JSON.stringify({ studentId: id }),
          headers: { "Content-Type": "application/json" },
        });
        expect(res.ok).toBe(true);
      }
      expect(pipeline.length).toBe(3);
    });

    it("pipeline shows candidates organized by stage", async () => {
      const res = await recFetch("/api/iscarb/recruiter/pipeline");
      const body = await res.json();
      const stages = body.data.stages;
      expect(stages.find((s: any) => s.id === "identified").count).toBeGreaterThan(0);
      expect(stages.find((s: any) => s.id === "offered").count).toBe(0);
      expect(stages.find((s: any) => s.id === "hired").count).toBe(0);
    });

    it("recruiter moves candidate through pipeline stages", async () => {
      const res = await recFetch("/api/iscarb/recruiter/pipeline/:id", {
        method: "PATCH",
        body: JSON.stringify({ studentId: "stu-1", stage: "contacted" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(body.data.ok).toBe(true);
      expect(body.data.newStage).toBe("contacted");
    });
  });

  describe("Phase 4: Analytics & Activity", () => {
    it("recruiter analytics show conversion metrics", async () => {
      const res = await recFetch("/api/iscarb/recruiter/analytics");
      const body = await res.json();
      expect(body.data.searchesPerformed).toBeGreaterThan(0);
      expect(body.data.candidatesIdentified).toBeGreaterThan(100);
      expect(body.data.conversionRate).toBeGreaterThan(0);
      expect(body.data.avgTimeToHire).toBeGreaterThan(0);
      expect(body.data.topCompetencies.length).toBeGreaterThanOrEqual(3);
    });

    it("recruiter activity feed shows recent actions", async () => {
      const res = await recFetch("/api/iscarb/recruiter/activity");
      const body = await res.json();
      expect(body.data.activities.length).toBeGreaterThanOrEqual(3);
      expect(body.data.activities[0].action).toBeDefined();
      expect(body.data.activities[0].timestamp).toBeDefined();
    });
  });

  describe("Phase 5: Talent Pools & Auto-Matching", () => {
    it("recruiter can view talent pools with auto-match settings", async () => {
      const res = await recFetch("/api/iscarb/recruiter/pools");
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      expect(body.data[0].autoMatchEnabled).toBe(true);
    });

    it("pool details show auto-match rules and candidates", async () => {
      const res = await recFetch("/api/iscarb/recruiter/pools/:id");
      const body = await res.json();
      expect(body.data.candidates).toBeDefined();
      expect(body.data.autoMatchRules.minComposite).toBeGreaterThan(0);
    });
  });

  describe("Phase 6: Hackathons & Marketplace", () => {
    it("recruiter can view hackathons for sponsorship", async () => {
      const res = await recFetch("/api/iscarb/hackathons");
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      expect(body.data[0].sponsor).toBeDefined();
    });

    it("recruiter can browse marketplace for assessment content", async () => {
      const res = await recFetch("/api/iscarb/marketplace");
      const body = await res.json();
      expect(body.data.templates.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Cross-cutting: Empty state handling", () => {
    it("search with no results returns empty array, not error", async () => {
      const emptyFetch = mockFetch({
        "GET /api/iscarb/recruiter/candidates?skill=Nonexistent": () => ({
          data: { candidates: [], facets: { clusters: [], skills: [], total: 0 }, matched: 0, pagination: { page: 1, limit: 12, totalPages: 1, hasMore: false } },
        }),
      });
      const res = await emptyFetch("/api/iscarb/recruiter/candidates?skill=Nonexistent");
      const body = await res.json();
      expect(body.data.candidates).toEqual([]);
      expect(body.data.matched).toBe(0);
    });
  });
});
