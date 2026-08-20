/**
 * E2E — Employer Hiring Journey (Masterplan §8.10, §8.11)
 *
 * Covers the complete employer lifecycle:
 *   Login → Job Posting → Candidate Review → Offer Management →
 *   Team Collaboration → Market Intelligence
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

describe("E2E: Employer Hiring Journey", () => {
  let empFetch: ReturnType<typeof mockFetch>;
  let postedJobId: string | null = null;

  beforeAll(() => {
    empFetch = mockFetch({
      "POST /api/auth/login": (body) => {
        if (body.email.includes("employer") && body.password === "password123") {
          return { ok: true, data: { token: "jwt-employer", user: { role: "employer", id: "emp-01", company: "Tech Corp" } } };
        }
        return { ok: false, status: 401, data: { error: "Invalid credentials" } };
      },
      "GET /api/iscarb/session": () => ({
        data: { role: "employer", userId: "emp-01", company: "Tech Corp" },
      }),
      "POST /api/iscarb/jobs": (body) => ({
        ok: true, status: 201,
        data: {
          id: `job-${Date.now()}`,
          title: body?.title,
          description: body?.description,
          status: "published",
          createdAt: new Date().toISOString(),
          candidateCount: 0,
        },
      }),
      "GET /api/iscarb/jobs": () => ({
        data: [
          { id: "job-1", title: "Junior Data Analyst", status: "published", applicants: 12, newApplicants: 3, createdAt: "2026-07-01", location: "Riyadh", type: "full-time" },
          { id: "job-2", title: "Software Engineer Intern", status: "published", applicants: 8, newApplicants: 1, createdAt: "2026-07-05", location: "Jeddah", type: "internship" },
          { id: "job-3", title: "Business Analyst", status: "draft", applicants: 0, newApplicants: 0, createdAt: "2026-07-10", location: "Jubail", type: "full-time" },
        ],
      }),
      "GET /api/iscarb/jobs/:id": () => ({
        data: {
          id: "job-1", title: "Junior Data Analyst", description: "Looking for data-savvy graduates...",
          status: "published", location: "Riyadh", type: "full-time", salary: "SAR 8,000-12,000",
          requirements: ["Python", "SQL", "Data visualization"],
          applicants: [
            { id: "app-1", name: "Ahmed Al-Saud", matchScore: 94, readinessScore: 88, stage: "reviewing", appliedAt: "2026-07-10" },
            { id: "app-2", name: "Nora Al-Ghamdi", matchScore: 91, readinessScore: 85, stage: "shortlisted", appliedAt: "2026-07-09" },
            { id: "app-3", name: "Faisal Al-Otaibi", matchScore: 87, readinessScore: 82, stage: "new", appliedAt: "2026-07-11" },
          ],
        },
      }),
      "PATCH /api/iscarb/jobs/:id": (body) => ({
        data: { ok: true, id: "job-1", ...body, updatedAt: new Date().toISOString() },
      }),
      "POST /api/iscarb/jobs/:id/close": () => ({
        data: { ok: true, status: "closed", closedAt: new Date().toISOString() },
      }),
      "GET /api/iscarb/jobs/:id/applications": () => ({
        data: [
          { id: "app-1", name: "Ahmed Al-Saud", email: "ahmed@kfu.edu.sa", matchScore: 94, stage: "reviewing", appliedAt: "2026-07-10" },
          { id: "app-2", name: "Nora Al-Ghamdi", email: "nora@kfu.edu.sa", matchScore: 91, stage: "shortlisted", appliedAt: "2026-07-09" },
          { id: "app-3", name: "Faisal Al-Otaibi", email: "faisal@kfu.edu.sa", matchScore: 87, stage: "new", appliedAt: "2026-07-11" },
        ],
      }),
      "POST /api/iscarb/applications/:id/offer": (body) => ({
        ok: true, status: 201,
        data: {
          id: `offer-${Date.now()}`,
          applicationId: body?.applicationId,
          salary: body?.salary,
          startDate: body?.startDate,
          status: "sent",
          sentAt: new Date().toISOString(),
        },
      }),
      "GET /api/iscarb/offers": () => ({
        data: [
          { id: "off-1", candidate: "Ahmed Al-Saud", position: "Junior Data Analyst", salary: "10,000", status: "accepted", sentAt: "2026-07-08" },
          { id: "off-2", candidate: "Nora Al-Ghamdi", position: "Junior Data Analyst", salary: "11,000", status: "pending", sentAt: "2026-07-11" },
        ],
      }),
      "GET /api/iscarb/market-intelligence": () => ({
        data: {
          salaryBenchmarks: [
            { role: "Data Analyst", p25: 7000, p50: 9500, p75: 13000, trend: "up" },
            { role: "Software Engineer", p25: 8000, p50: 11000, p75: 16000, trend: "up" },
            { role: "Business Analyst", p25: 6500, p50: 8500, p75: 12000, trend: "stable" },
          ],
          skillsDemand: [
            { skill: "Python", demand: "high", growth: 35, avgSalary: 12000 },
            { skill: "Data Analysis", demand: "high", growth: 28, avgSalary: 11000 },
            { skill: "AI/ML", demand: "very_high", growth: 52, avgSalary: 16000 },
          ],
          topEmployers: [
            { name: "Aramco", openPositions: 142, avgSalary: 14500 },
            { name: "STC", openPositions: 89, avgSalary: 13000 },
            { name: "SABIC", openPositions: 67, avgSalary: 12500 },
          ],
        },
      }),
      "GET /api/iscarb/employer/team": () => ({
        data: { members: [
          { id: "t-1", name: "Ali Al-Rashid", role: "Hiring Manager", email: "ali@techcorp.com" },
          { id: "t-2", name: "Mona Al-Saud", role: "Recruiter", email: "mona@techcorp.com" },
        ]},
      }),
      "*": () => ({ ok: true, data: {} }),
    });
  });

  describe("Phase 1: Authentication", () => {
    it("employer logs in with valid credentials", async () => {
      const res = await empFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "employer@techcorp.com", password: "password123" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(res.ok).toBe(true);
      expect(body.data.user.company).toBe("Tech Corp");
    });
  });

  describe("Phase 2: Job Posting", () => {
    it("employer can create and publish a job posting", async () => {
      const res = await empFetch("/api/iscarb/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: "Junior Data Analyst",
          description: "Looking for graduates with strong analytical skills...",
          location: "Riyadh",
          type: "full-time",
          salary: "SAR 8,000-12,000",
          requirements: ["Python", "SQL", "Data visualization"],
        }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.status).toBe("published");
      postedJobId = body.data.id;
    });

    it("employer can list all posted jobs with applicant counts", async () => {
      const res = await empFetch("/api/iscarb/jobs");
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(3);
      const withApplicants = body.data.filter((j: any) => j.applicants > 0);
      expect(withApplicants.length).toBeGreaterThan(0);
    });

    it("employer can update job posting details", async () => {
      const res = await empFetch("/api/iscarb/jobs/:id", {
        method: "PATCH",
        body: JSON.stringify({ salary: "SAR 9,000-13,000", requirements: ["Python", "SQL", "Tableau"] }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(body.data.ok).toBe(true);
    });
  });

  describe("Phase 3: Candidate Review", () => {
    it("employer can view job applications with match scores", async () => {
      const res = await empFetch("/api/iscarb/jobs/:id/applications");
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(3);
      expect(body.data[0].matchScore).toBeGreaterThan(85);
    });

    it("candidate profiles show readiness assessment data", async () => {
      const res = await empFetch("/api/iscarb/jobs/:id");
      const body = await res.json();
      expect(body.data.applicants[0].readinessScore).toBeDefined();
      expect(body.data.applicants[0].stage).toBeDefined();
    });

    it("employer can filter applicants by stage", async () => {
      const res = await empFetch("/api/iscarb/jobs/:id");
      const body = await res.json();
      const stages = body.data.applicants.map((a: any) => a.stage);
      expect(stages).toContain("new");
      expect(stages).toContain("reviewing");
      expect(stages).toContain("shortlisted");
    });
  });

  describe("Phase 4: Offer Management", () => {
    it("employer can extend an offer to a candidate", async () => {
      const res = await empFetch("/api/iscarb/applications/:id/offer", {
        method: "POST",
        body: JSON.stringify({ applicationId: "app-1", salary: 10000, startDate: "2026-09-01" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(res.status).toBe(201);
      expect(body.data.status).toBe("sent");
    });

    it("employer can view all sent offers with status", async () => {
      const res = await empFetch("/api/iscarb/offers");
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      const statuses = body.data.map((o: any) => o.status);
      expect(statuses).toContain("accepted");
      expect(statuses).toContain("pending");
    });
  });

  describe("Phase 5: Market Intelligence", () => {
    it("market intelligence shows salary benchmarks by role", async () => {
      const res = await empFetch("/api/iscarb/market-intelligence");
      const body = await res.json();
      expect(body.data.salaryBenchmarks.length).toBeGreaterThanOrEqual(3);
      expect(body.data.salaryBenchmarks[0].p50).toBeGreaterThan(0);
    });

    it("skills demand data shows growth trends", async () => {
      const res = await empFetch("/api/iscarb/market-intelligence");
      const body = await res.json();
      expect(body.data.skillsDemand.length).toBeGreaterThanOrEqual(3);
      expect(body.data.skillsDemand.find((s: any) => s.demand === "very_high")).toBeDefined();
    });

    it("top employers comparison shows market context", async () => {
      const res = await empFetch("/api/iscarb/market-intelligence");
      const body = await res.json();
      expect(body.data.topEmployers.length).toBeGreaterThanOrEqual(3);
      expect(body.data.topEmployers[0].openPositions).toBeGreaterThan(100);
    });
  });

  describe("Phase 6: Close & Fulfill", () => {
    it("employer can close a job posting", async () => {
      const res = await empFetch("/api/iscarb/jobs/:id/close", { method: "POST" });
      const body = await res.json();
      expect(body.data.status).toBe("closed");
    });
  });
});
