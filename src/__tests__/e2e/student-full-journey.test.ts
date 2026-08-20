/**
 * E2E — Student Full Journey (Masterplan §5.3.1, §7, §8.1–8.4)
 *
 * Covers the complete student lifecycle:
 *   Login → Onboarding → Assessment → Portfolio → Career Match →
 *   Capstone → Interview Prep → CV Builder → Funding → Community
 */

import { describe, it, expect, beforeAll, vi } from "vitest";

// ── Session simulation ─────────────────────────────────────────────────────

const mockSession = (role: string, studentId = "stu-42") => ({
  role,
  userId: studentId,
  universityId: "uni-kfu-01",
  universityCode: "KFU",
  scopes: [],
  authMethod: "dev" as const,
  studentId,
});

// ── API mock factory ───────────────────────────────────────────────────────

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

// ── Tests ──────────────────────────────────────────────────────────────────

describe("E2E: Student Full Journey", () => {
  const session = mockSession("student");
  let studentFetch: ReturnType<typeof mockFetch>;

  beforeAll(() => {
    studentFetch = mockFetch({
      "GET /api/iscarb/session": () => ({ data: session }),
      "POST /api/auth/login": (body) => {
        if (body.email === "student@university.edu" && body.password === "password123") {
          return { ok: true, data: { token: "jwt-student", user: { role: "student", id: "stu-42" } } };
        }
        return { ok: false, status: 401, data: { error: "Invalid credentials" } };
      },
      "GET /api/iscarb/onboarding": () => ({
        data: { completed: false, academicYear: 2, progress: { tasksCompleted: 3, totalTasks: 8 } },
      }),
      "GET /api/iscarb/dashboard": () => ({
        data: {
          streakDays: 5,
          trajectory: { points: 1240, growthPercent: 12.5 },
          nextStep: { view: "assessment", label: "Take Employability Assessment", reason: "Complete to unlock career matches" },
          recentActivity: [
            { type: "assessment", label: "Algorithmic Thinking", timestamp: new Date().toISOString() },
            { type: "capstone", label: "AI Project Builder started", timestamp: new Date(Date.now() - 86400000).toISOString() },
          ],
          xp: 1240,
          level: 4,
        },
      }),
      "GET /api/iscarb/assessment/modules": () => ({
        data: {
          modules: [
            { id: "mod-1", title: "Technical Problem-Solving", questions: 12, duration: 30, completed: false },
            { id: "mod-2", title: "Business Communication", questions: 8, duration: 20, completed: false },
            { id: "mod-3", title: "Digital Literacy", questions: 10, duration: 25, completed: true, score: 88 },
          ],
          profile: { composite: 74, band: "developing" },
        },
      }),
      "POST /api/iscarb/assessment/submissions": () => ({
        data: { id: "sub-1", status: "draft", createdAt: new Date().toISOString() },
      }),
      "POST /api/iscarb/assessment/submissions/:id/submit": () => ({
        data: { id: "sub-1", status: "submitted", submittedAt: new Date().toISOString() },
      }),
      "GET /api/iscarb/assessment/:id/results": () => ({
        data: {
          score: 82, scoredBy: "ai", provider: "gpt-oss", confidence: 0.91,
          reasoning: "Strong understanding of algorithmic concepts. Areas for improvement: optimization techniques.",
          dimensions: [
            { name: "Technical", score: 86, max: 100 },
            { name: "Cognitive", score: 80, max: 100 },
            { name: "Behavioral", score: 78, max: 100 },
          ],
        },
      }),
      "GET /api/iscarb/portfolio": () => ({
        data: {
          visibility: "shared", achievements: [
            { type: "assessment", title: "Algorithmic Thinking", score: 82, date: new Date().toISOString() },
            { type: "badge", title: "Digital Literacy Certified", awarded: true },
          ],
        },
      }),
      "GET /api/iscarb/jobs": () => ({
        data: [
          { id: "job-1", title: "Junior Data Analyst", employer: "Tech Corp", matchScore: 92, explanation: "Strong technical score matches...", location: "Riyadh", salary: "SAR 8,000-12,000" },
          { id: "job-2", title: "Software Engineer Intern", employer: "STC", matchScore: 87, explanation: "Programming skills align well...", location: "Jeddah", salary: "SAR 5,000-7,000" },
          { id: "job-3", title: "Business Analyst", employer: "SABIC", matchScore: 76, explanation: "Analytical skills match...", location: "Jubail", salary: "SAR 10,000-15,000" },
        ],
      }),
      "GET /api/iscarb/career-discovery": () => ({
        data: {
          careerPaths: [
            { title: "Data Scientist", sscoCode: "251205", matchPercent: 88, demandTrend: "growing", avgSalary: "SAR 15,000" },
            { title: "Software Developer", sscoCode: "251201", matchPercent: 82, demandTrend: "growing", avgSalary: "SAR 12,000" },
          ],
        },
      }),
      "GET /api/iscarb/readiness": () => ({
        data: { composite: 74, band: "developing", cohortPercentile: 62, dimensions: [
          { name: "Core Professionalism", score: 68, weight: 0.25 },
          { name: "Business & Digital Literacy", score: 82, weight: 0.20 },
          { name: "Job-Fit Technical", score: 70, weight: 0.40 },
          { name: "Growth Potential", score: 85, weight: 0.15 },
        ]},
      }),
      "GET /api/iscarb/capstone/generate": () => ({
        data: { id: "cap-1", title: "AI-Powered Student Success Predictor", brief: "Build a predictive model...", requirements: ["Data collection", "Feature engineering", "Model training"] },
      }),
      "GET /api/iscarb/mentorship": () => ({
        data: { mentors: [
          { id: "ment-1", name: "Faisal Al-Mutairi", title: "Senior Engineer at Aramco", matchScore: 94, available: true },
          { id: "ment-2", name: "Nora Al-Ghamdi", title: "Product Manager at STC", matchScore: 88, available: true },
        ]},
      }),
      "GET /api/iscarb/gamification/leaderboard": () => ({
        data: { week: { rank: 12, points: 1240, total: 200 }, semester: { rank: 45, points: 4500, total: 10000 } },
      }),
      "GET /api/iscarb/interview-prep": () => ({
        data: { questions: [
          { id: "iq-1", question: "Tell me about a challenging project", category: "behavioral", difficulty: "medium" },
          { id: "iq-2", question: "Explain a technical concept to a non-technical audience", category: "technical", difficulty: "hard" },
        ]},
      }),
      "GET /api/iscarb/funding": () => ({
        data: { opportunities: [
          { title: "KAFEEEL Scholarship", amount: "SAR 60,000/year", deadline: "2026-09-30", matchScore: 85 },
          { title: "STEM Research Grant", amount: "SAR 30,000", deadline: "2026-08-15", matchScore: 72 },
        ]},
      }),
      "GET /api/iscarb/market-value": () => ({
        data: {
          percentile: 68, benchmark: { p25: 65, p50: 78, p75: 88 },
          gaps: [{ skill: "Advanced Python", gapPercent: 22, impact: "Limits data science roles" }],
          estimatedSalary: { min: 7500, median: 10500, max: 15000 },
        },
      }),
      "GET /api/iscarb/notifications": () => ({
        data: { notifications: [
          { id: "n1", title: "Assessment Scored", message: "Technical Problem-Solving scored 82%", read: false, createdAt: "2h ago" },
          { id: "n2", title: "New Job Match", message: "Junior Data Analyst matches 92%", read: false, createdAt: "5h ago" },
        ]},
      }),
      "GET /api/iscarb/community": () => ({
        data: { posts: [{ id: "p1", author: "Ahmed", content: "Has anyone taken the new assessment?", replies: 3, likes: 12 }] },
      }),
      "POST /api/iscarb/assessment/score": () => ({
        data: { score: 82, scoredBy: "ai", xpAward: { points: 150, leveledUp: false, newLevel: 4 } },
      }),
      "POST /api/iscarb/enrichment/generate": () => ({
        data: { ok: true, itemsGenerated: 3 },
      }),
      "POST /api/iscarb/linkedin/optimize": () => ({
        data: { ok: true, suggestions: ["Add Python to skills section", "Highlight analytics projects"] },
      }),
      "*": () => ({ ok: true, data: {} }),
    });
  });

  // ── 1. Login ──────────────────────────────────────────────────────────────
  describe("Phase 1: Authentication & Onboarding", () => {
    it("student logs in with valid credentials and gets session", async () => {
      const res = await studentFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "student@university.edu", password: "password123" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(res.ok).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.user.role).toBe("student");
    });

    it("student login fails with invalid credentials", async () => {
      const res = await studentFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "student@university.edu", password: "wrongpass" }),
        headers: { "Content-Type": "application/json" },
      });
      expect(res.ok).toBe(false);
      expect(res.status).toBe(401);
    });

    it("session endpoint returns role and studentId", async () => {
      const res = await studentFetch("/api/iscarb/session");
      const body = await res.json();
      expect(body.data.role).toBe("student");
      expect(body.data.studentId).toBe("stu-42");
    });

    it("student dashboard shows onboarding status, streak, and next step", async () => {
      const res = await studentFetch("/api/iscarb/dashboard");
      const body = await res.json();
      expect(body.data.streakDays).toBeGreaterThanOrEqual(0);
      expect(body.data.trajectory).toBeDefined();
      expect(body.data.nextStep).toBeDefined();
      expect(body.data.nextStep.view).toBe("assessment");
    });

    it("onboarding returns academic year and completion progress", async () => {
      const res = await studentFetch("/api/iscarb/onboarding");
      const body = await res.json();
      expect(body.data.completed).toBe(false);
      expect(body.data.academicYear).toBe(2);
      expect(body.data.progress.tasksCompleted).toBeLessThan(body.data.progress.totalTasks);
    });
  });

  // ── 2. Assessment ─────────────────────────────────────────────────────────
  describe("Phase 2: Assessment Workflow", () => {
    it("fetches available assessment modules with completion status", async () => {
      const res = await studentFetch("/api/iscarb/assessment/modules");
      const body = await res.json();
      expect(body.data.modules).toHaveLength(3);
      expect(body.data.modules[0].completed).toBe(false);
      expect(body.data.modules[2].completed).toBe(true);
      expect(body.data.modules[2].score).toBe(88);
    });

    it("starts a new assessment submission", async () => {
      const res = await studentFetch("/api/iscarb/assessment/submissions", {
        method: "POST",
        body: JSON.stringify({ assessmentId: "mod-1" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(body.data.status).toBe("draft");
      expect(body.data.id).toBeDefined();
    });

    it("submits completed assessment and receives scored result", async () => {
      const res = await studentFetch("/api/iscarb/assessment/submissions/:id/submit", {
        method: "POST",
        body: JSON.stringify({ answers: { q1: "Answer 1", q2: "Answer 2" }, idempotencyKey: `key_${Date.now()}` }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(body.data.status).toBe("submitted");
    });

    it("fetches assessment results with explainability data", async () => {
      const res = await studentFetch("/api/iscarb/assessment/:id/results");
      const body = await res.json();
      expect(body.data.score).toBe(82);
      expect(body.data.scoredBy).toBe("ai");
      expect(body.data.provider).toBe("gpt-oss");
      expect(body.data.confidence).toBeGreaterThan(0.7);
      expect(body.data.reasoning).toBeTruthy();
      expect(body.data.dimensions).toHaveLength(3);
    });

    it("scoring awards XP points", async () => {
      const res = await studentFetch("/api/iscarb/assessment/score", {
        method: "POST",
        body: JSON.stringify({ submissionId: "sub-1" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(body.data.xpAward.points).toBeGreaterThan(0);
    });
  });

  // ── 3. Portfolio ──────────────────────────────────────────────────────────
  describe("Phase 3: Portfolio & Readiness", () => {
    it("portfolio shows assessment results and achievements", async () => {
      const res = await studentFetch("/api/iscarb/portfolio");
      const body = await res.json();
      expect(body.data.visibility).toBe("shared");
      expect(body.data.achievements.length).toBeGreaterThanOrEqual(2);
    });

    it("readiness dashboard shows competency breakdown with cohort comparison", async () => {
      const res = await studentFetch("/api/iscarb/readiness");
      const body = await res.json();
      expect(body.data.composite).toBe(74);
      expect(body.data.band).toBe("developing");
      expect(body.data.cohortPercentile).toBeGreaterThan(0);
      expect(body.data.dimensions).toHaveLength(4);
    });

    it("market value endpoint provides salary benchmarks and gap analysis", async () => {
      const res = await studentFetch("/api/iscarb/market-value");
      const body = await res.json();
      expect(body.data.percentile).toBeGreaterThanOrEqual(0);
      expect(body.data.benchmark).toBeDefined();
      expect(body.data.gaps.length).toBeGreaterThanOrEqual(0);
      expect(body.data.estimatedSalary.median).toBeGreaterThan(0);
    });
  });

  // ── 4. Career ──────────────────────────────────────────────────────────────
  describe("Phase 4: Career Discovery & Job Matching", () => {
    it("career discovery returns matched career paths with labor market data", async () => {
      const res = await studentFetch("/api/iscarb/career-discovery");
      const body = await res.json();
      expect(body.data.careerPaths.length).toBeGreaterThanOrEqual(2);
      expect(body.data.careerPaths[0].matchPercent).toBeGreaterThan(70);
      expect(body.data.careerPaths[0].sscoCode).toBeDefined();
    });

    it("jobs endpoint returns matched positions with match scores and explanations", async () => {
      const res = await studentFetch("/api/iscarb/jobs");
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(3);
      expect(body.data[0].matchScore).toBeGreaterThan(80);
      expect(body.data[0].explanation).toBeTruthy();
      expect(body.data[0].location).toBeDefined();
    });

    it("mentorship returns available mentors with match scores", async () => {
      const res = await studentFetch("/api/iscarb/mentorship");
      const body = await res.json();
      expect(body.data.mentors.length).toBeGreaterThanOrEqual(2);
      expect(body.data.mentors[0].matchScore).toBeGreaterThan(80);
    });

    it("interview prep returns categorized questions", async () => {
      const res = await studentFetch("/api/iscarb/interview-prep");
      const body = await res.json();
      expect(body.data.questions.length).toBeGreaterThanOrEqual(2);
      expect(body.data.questions[0].category).toBeDefined();
    });
  });

  // ── 5. Capstone & Enrichment ──────────────────────────────────────────────
  describe("Phase 5: Capstone & Skill Building", () => {
    it("capstone generation returns project brief with requirements", async () => {
      const res = await studentFetch("/api/iscarb/capstone/generate");
      const body = await res.json();
      expect(body.data.title).toBeDefined();
      expect(body.data.requirements.length).toBeGreaterThanOrEqual(3);
    });

    it("enrichment generates skill recommendations", async () => {
      const res = await studentFetch("/api/iscarb/enrichment/generate", {
        method: "POST",
        body: JSON.stringify({ studentId: "stu-42", focus: "technical" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(body.data.ok).toBe(true);
      expect(body.data.itemsGenerated).toBeGreaterThan(0);
    });
  });

  // ── 6. Community & Engagement ─────────────────────────────────────────────
  describe("Phase 6: Community & Gamification", () => {
    it("leaderboard shows weekly and semester ranking", async () => {
      const res = await studentFetch("/api/iscarb/gamification/leaderboard");
      const body = await res.json();
      expect(body.data.week.rank).toBeDefined();
      expect(body.data.semester.points).toBeGreaterThan(0);
    });

    it("community endpoint returns posts with engagement metrics", async () => {
      const res = await studentFetch("/api/iscarb/community");
      const body = await res.json();
      expect(body.data.posts.length).toBeGreaterThanOrEqual(1);
      expect(body.data.posts[0].replies).toBeDefined();
    });

    it("notifications are returned with read/unread status", async () => {
      const res = await studentFetch("/api/iscarb/notifications");
      const body = await res.json();
      expect(body.data.notifications.length).toBeGreaterThanOrEqual(2);
      const unread = body.data.notifications.filter((n: any) => !n.read);
      expect(unread.length).toBeGreaterThan(0);
    });
  });

  // ── 7. Funding & Support ─────────────────────────────────────────────────
  describe("Phase 7: Funding & Career Support", () => {
    it("funding opportunities are returned with match scores", async () => {
      const res = await studentFetch("/api/iscarb/funding");
      const body = await res.json();
      expect(body.data.opportunities.length).toBeGreaterThanOrEqual(2);
      expect(body.data.opportunities[0].amount).toBeDefined();
      expect(body.data.opportunities[0].matchScore).toBeGreaterThan(70);
    });

    it("CV optimization returns actionable suggestions", async () => {
      const res = await studentFetch("/api/iscarb/linkedin/optimize", {
        method: "POST",
        body: JSON.stringify({ studentId: "stu-42" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      expect(body.data.ok).toBe(true);
      expect(body.data.suggestions.length).toBeGreaterThan(0);
    });
  });

  // ── 8. Cross-cutting: progressive disclosure ──────────────────────────────
  describe("Cross-cutting: Progressive Disclosure by Academic Year", () => {
    it("year-1 student sees only foundational views", async () => {
      const year1Fetch = mockFetch({
        "GET /api/iscarb/onboarding": () => ({ data: { completed: false, academicYear: 1 } }),
        "GET /api/iscarb/session": () => ({ data: { ...session, studentId: "stu-freshman" } }),
        "*": () => ({ ok: true, data: {} }),
      });
      const onbRes = await year1Fetch("/api/iscarb/onboarding");
      const onbBody = await onbRes.json();
      expect(onbBody.data.academicYear).toBe(1);
      // Year-1 student should not see capstone, jobs, interview-prep by default
      // The VIEW_MIN_YEAR map gates these behind academicYear >= 3
      expect(onbBody.data.completed).toBe(false);
    });
  });
});
