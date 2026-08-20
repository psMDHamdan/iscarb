/**
 * Regression lock for the single specialization → Job-Fit routing path.
 *
 * Covers EVERY row in docs/SPECIALIZATION_SYSTEMS_MAP_2026-08-03.md §4 overlap
 * table (not a sample). If a second routing system is reintroduced, or any alias
 * silently drifts to the wrong three modules, this suite fails loudly.
 *
 * Contract: exactly 47 modules every time (UNIVERSAL_MODULES with Job-Fit swapped in).
 */
import { describe, expect, it } from "vitest";
import {
  resolveAssessmentModuleSet,
  V1_UNIVERSAL_MODULE_CODES,
  JOBFIT_TRACKS,
  normalizeSpec,
} from "../catalog";

const V1_UNIVERSAL = [...V1_UNIVERSAL_MODULE_CODES];

type Case = {
  /** Exact input string from the systems-map overlap table (or edge case). */
  input: string;
  /** Exact three Job-Fit module codes expected after the merge. */
  jobFit: [string, string, string];
  /** curated = registry hit; generic = fallback templates. */
  source: "curated" | "generic";
};

/**
 * Overlap-table checklist — one Case per distinct input form listed in §4.
 * Where the map listed "A / B" variants on one row, each form is a separate Case.
 */
const OVERLAP_TABLE_CASES: Case[] = [
  // ── Computer Science / IT ──────────────────────────────────────────────────
  { input: "computer-science", jobFit: ["M30", "M37", "M38"], source: "curated" },
  { input: "Computer Science", jobFit: ["M30", "M37", "M38"], source: "curated" },
  { input: "computer science", jobFit: ["M30", "M37", "M38"], source: "curated" },
  { input: "Computer Science / IT", jobFit: ["M30", "M37", "M38"], source: "curated" },
  { input: "IT", jobFit: ["M30", "M37", "M38"], source: "curated" },
  { input: "it", jobFit: ["M30", "M37", "M38"], source: "curated" },
  { input: "Information Technology", jobFit: ["M30", "M37", "M38"], source: "curated" },
  { input: "information-technology", jobFit: ["M30", "M37", "M38"], source: "curated" },
  { input: "Software Engineering", jobFit: ["M30", "M37", "M38"], source: "curated" },
  { input: "software-engineering", jobFit: ["M30", "M37", "M38"], source: "curated" },
  { input: "CS/IT", jobFit: ["M30", "M37", "M38"], source: "curated" },

  // ── Web Development (hyphenated MUST match spaced — was CS alias collision) ─
  { input: "web-development", jobFit: ["M36", "M37", "M38"], source: "curated" },
  { input: "Web Development", jobFit: ["M36", "M37", "M38"], source: "curated" },
  { input: "Web development", jobFit: ["M36", "M37", "M38"], source: "curated" },
  { input: "WEB DEVELOPMENT", jobFit: ["M36", "M37", "M38"], source: "curated" },

  // ── Accounting / Finance ───────────────────────────────────────────────────
  { input: "accounting", jobFit: ["JOBFIT-ACCOUNTING-FINANCE-1", "JOBFIT-ACCOUNTING-FINANCE-2", "JOBFIT-ACCOUNTING-FINANCE-3"], source: "curated" },
  { input: "Accounting", jobFit: ["JOBFIT-ACCOUNTING-FINANCE-1", "JOBFIT-ACCOUNTING-FINANCE-2", "JOBFIT-ACCOUNTING-FINANCE-3"], source: "curated" },
  { input: "Accounting / Finance", jobFit: ["JOBFIT-ACCOUNTING-FINANCE-1", "JOBFIT-ACCOUNTING-FINANCE-2", "JOBFIT-ACCOUNTING-FINANCE-3"], source: "curated" },
  { input: "Finance", jobFit: ["JOBFIT-ACCOUNTING-FINANCE-1", "JOBFIT-ACCOUNTING-FINANCE-2", "JOBFIT-ACCOUNTING-FINANCE-3"], source: "curated" },
  { input: "finance", jobFit: ["JOBFIT-ACCOUNTING-FINANCE-1", "JOBFIT-ACCOUNTING-FINANCE-2", "JOBFIT-ACCOUNTING-FINANCE-3"], source: "curated" },
  { input: "Islamic Finance", jobFit: ["JOBFIT-ACCOUNTING-FINANCE-1", "JOBFIT-ACCOUNTING-FINANCE-2", "JOBFIT-ACCOUNTING-FINANCE-3"], source: "curated" },
  { input: "islamic-finance", jobFit: ["JOBFIT-ACCOUNTING-FINANCE-1", "JOBFIT-ACCOUNTING-FINANCE-2", "JOBFIT-ACCOUNTING-FINANCE-3"], source: "curated" },
  { input: "Banking", jobFit: ["JOBFIT-ACCOUNTING-FINANCE-1", "JOBFIT-ACCOUNTING-FINANCE-2", "JOBFIT-ACCOUNTING-FINANCE-3"], source: "curated" },
  { input: "banking", jobFit: ["JOBFIT-ACCOUNTING-FINANCE-1", "JOBFIT-ACCOUNTING-FINANCE-2", "JOBFIT-ACCOUNTING-FINANCE-3"], source: "curated" },

  // ── Healthcare / Medicine ──────────────────────────────────────────────────
  { input: "healthcare-medicine", jobFit: ["JOBFIT-HEALTHCARE-MEDICINE-1", "JOBFIT-HEALTHCARE-MEDICINE-2", "JOBFIT-HEALTHCARE-MEDICINE-3"], source: "curated" },
  { input: "Healthcare / Medicine", jobFit: ["JOBFIT-HEALTHCARE-MEDICINE-1", "JOBFIT-HEALTHCARE-MEDICINE-2", "JOBFIT-HEALTHCARE-MEDICINE-3"], source: "curated" },
  { input: "Healthcare", jobFit: ["JOBFIT-HEALTHCARE-MEDICINE-1", "JOBFIT-HEALTHCARE-MEDICINE-2", "JOBFIT-HEALTHCARE-MEDICINE-3"], source: "curated" },

  // ── Health Management (+ medicine alias → health-management, not healthcare-medicine)
  { input: "health-management", jobFit: ["JOBFIT-HEALTH-MANAGEMENT-1", "JOBFIT-HEALTH-MANAGEMENT-2", "JOBFIT-HEALTH-MANAGEMENT-3"], source: "curated" },
  { input: "Health Management", jobFit: ["JOBFIT-HEALTH-MANAGEMENT-1", "JOBFIT-HEALTH-MANAGEMENT-2", "JOBFIT-HEALTH-MANAGEMENT-3"], source: "curated" },
  { input: "Nursing", jobFit: ["JOBFIT-HEALTH-MANAGEMENT-1", "JOBFIT-HEALTH-MANAGEMENT-2", "JOBFIT-HEALTH-MANAGEMENT-3"], source: "curated" },
  { input: "nursing", jobFit: ["JOBFIT-HEALTH-MANAGEMENT-1", "JOBFIT-HEALTH-MANAGEMENT-2", "JOBFIT-HEALTH-MANAGEMENT-3"], source: "curated" },
  { input: "Clinical Nursing", jobFit: ["JOBFIT-HEALTH-MANAGEMENT-1", "JOBFIT-HEALTH-MANAGEMENT-2", "JOBFIT-HEALTH-MANAGEMENT-3"], source: "curated" },
  { input: "clinical-nursing", jobFit: ["JOBFIT-HEALTH-MANAGEMENT-1", "JOBFIT-HEALTH-MANAGEMENT-2", "JOBFIT-HEALTH-MANAGEMENT-3"], source: "curated" },
  { input: "Medicine", jobFit: ["JOBFIT-HEALTH-MANAGEMENT-1", "JOBFIT-HEALTH-MANAGEMENT-2", "JOBFIT-HEALTH-MANAGEMENT-3"], source: "curated" },
  { input: "medicine", jobFit: ["JOBFIT-HEALTH-MANAGEMENT-1", "JOBFIT-HEALTH-MANAGEMENT-2", "JOBFIT-HEALTH-MANAGEMENT-3"], source: "curated" },
  { input: "Public Health", jobFit: ["JOBFIT-HEALTH-MANAGEMENT-1", "JOBFIT-HEALTH-MANAGEMENT-2", "JOBFIT-HEALTH-MANAGEMENT-3"], source: "curated" },
  { input: "public-health", jobFit: ["JOBFIT-HEALTH-MANAGEMENT-1", "JOBFIT-HEALTH-MANAGEMENT-2", "JOBFIT-HEALTH-MANAGEMENT-3"], source: "curated" },

  // ── Cybersecurity ──────────────────────────────────────────────────────────
  { input: "cybersecurity", jobFit: ["JOBFIT-CYBERSECURITY-1", "JOBFIT-CYBERSECURITY-2", "JOBFIT-CYBERSECURITY-3"], source: "curated" },
  { input: "Cybersecurity", jobFit: ["JOBFIT-CYBERSECURITY-1", "JOBFIT-CYBERSECURITY-2", "JOBFIT-CYBERSECURITY-3"], source: "curated" },
  { input: "Information Security", jobFit: ["JOBFIT-CYBERSECURITY-1", "JOBFIT-CYBERSECURITY-2", "JOBFIT-CYBERSECURITY-3"], source: "curated" },
  { input: "information-security", jobFit: ["JOBFIT-CYBERSECURITY-1", "JOBFIT-CYBERSECURITY-2", "JOBFIT-CYBERSECURITY-3"], source: "curated" },

  // ── AI / Data Science ──────────────────────────────────────────────────────
  { input: "ai", jobFit: ["JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-1", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-2", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3"], source: "curated" },
  { input: "AI", jobFit: ["JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-1", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-2", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3"], source: "curated" },
  { input: "Artificial Intelligence / Data Science", jobFit: ["JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-1", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-2", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3"], source: "curated" },
  { input: "Artificial Intelligence", jobFit: ["JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-1", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-2", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3"], source: "curated" },
  { input: "artificial-intelligence", jobFit: ["JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-1", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-2", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3"], source: "curated" },
  { input: "Data Science", jobFit: ["JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-1", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-2", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3"], source: "curated" },
  { input: "data-science", jobFit: ["JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-1", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-2", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3"], source: "curated" },
  { input: "data science", jobFit: ["JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-1", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-2", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3"], source: "curated" },
  { input: "Machine Learning", jobFit: ["JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-1", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-2", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3"], source: "curated" },
  { input: "machine-learning", jobFit: ["JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-1", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-2", "JOBFIT-ARTIFICIAL-INTELLIGENCE-DATA-SCIENCE-3"], source: "curated" },

  // ── Data Analysis (hyphenated MUST match spaced — was AI alias collision) ───
  { input: "data-analysis", jobFit: ["M30", "M31", "M32"], source: "curated" },
  { input: "Data Analysis", jobFit: ["M30", "M31", "M32"], source: "curated" },

  // ── L3 tracks that previously returned 47 modules ──────────────────────────
  { input: "Digital Marketing", jobFit: ["M21", "M22", "M23"], source: "curated" },
  { input: "digital-marketing", jobFit: ["M21", "M22", "M23"], source: "curated" },
  { input: "Business Development", jobFit: ["M24", "M25", "M26"], source: "curated" },
  { input: "business-development", jobFit: ["M24", "M25", "M26"], source: "curated" },
  { input: "Project Management", jobFit: ["M27", "M28", "M29"], source: "curated" },
  { input: "project-management", jobFit: ["M27", "M28", "M29"], source: "curated" },
  { input: "Human Resources", jobFit: ["M33", "M34", "M35"], source: "curated" },
  { input: "human-resources", jobFit: ["M33", "M34", "M35"], source: "curated" },

  // ── Explicit free-text catch-alls from the overlap table ───────────────────
  {
    input: "Supply Chain Management",
    jobFit: [
      "JOBFIT-SUPPLY-CHAIN-MANAGEMENT-1",
      "JOBFIT-SUPPLY-CHAIN-MANAGEMENT-2",
      "JOBFIT-SUPPLY-CHAIN-MANAGEMENT-3",
    ],
    source: "generic",
  },
  {
    input: "Marine Biology",
    jobFit: ["JOBFIT-MARINE-BIOLOGY-1", "JOBFIT-MARINE-BIOLOGY-2", "JOBFIT-MARINE-BIOLOGY-3"],
    source: "generic",
  },
];

const EDGE_CASES = [
  "",
  "   ",
  "a".repeat(5000),
  "Specializ@tion #1!!!",
  "中文专业",
  "Foo\nBar\tBaz",
  "'; DROP TABLE modules; --",
];

function assertFortySeven(input: string, expected: Case["jobFit"], source: Case["source"]) {
  const { modules, mode, jobFitSource } = resolveAssessmentModuleSet(input);
  expect(mode, `mode for "${input}"`).toBe("universal-plus-jobfit");
  expect(jobFitSource, `source for "${input}"`).toBe(source);
  expect(modules.length, `total for "${input}"`).toBe(47);

  for (const code of expected) {
    expect(
      modules.some((m) => m.code === code),
      `expected Job-Fit code ${code} for "${input}"`,
    ).toBe(true);
  }
}

describe("specialization routing merge — overlap table (every row)", () => {
  it.each(OVERLAP_TABLE_CASES)(
    "input %#: '$input' → exactly 47 modules with Job-Fit $jobFit ($source)",
    ({ input, jobFit, source }) => {
      assertFortySeven(input, jobFit, source);
    },
  );
});

describe("specialization routing merge — graceful fallback on hostile inputs", () => {
  it.each(EDGE_CASES)("does not throw for %j and still returns 47 modules", (input) => {
    expect(() => resolveAssessmentModuleSet(input)).not.toThrow();
    const { modules, mode, jobFitSource } = resolveAssessmentModuleSet(input);
    expect(mode).toBe("universal-plus-jobfit");
    expect(jobFitSource).toBe("generic");
    expect(modules.length).toBe(47);
    for (const m of modules) {
      expect(m.scenario.length).toBeGreaterThan(0);
      expect(m.instructions.length).toBeGreaterThan(0);
      expect(m.rubric.reduce((s, c) => s + c.weight, 0)).toBe(100);
    }
  });
});

describe("specialization routing merge — structural guarantees", () => {
  it("exposes exactly one registry (JOBFIT_TRACKS) with no CS/IT blueprint duplicate", () => {
    expect(JOBFIT_TRACKS["computer-science"]?.kind).toBe("catalog");
    if (JOBFIT_TRACKS["computer-science"]?.kind === "catalog") {
      expect(JOBFIT_TRACKS["computer-science"].codes).toEqual(["M30", "M37", "M38"]);
    }
    // Hyphenated and spaced forms must share the Web Development track
    expect(normalizeSpec("Web Development")).toBe("web-development");
    expect(normalizeSpec("web-development")).toBe("web-development");
    expect(normalizeSpec("Data Analysis")).toBe("data-analysis");
    expect(normalizeSpec("data-analysis")).toBe("data-analysis");
  });

  it("never returns catalog-track mode for any overlap input", () => {
    for (const { input } of OVERLAP_TABLE_CASES) {
      const { modules, mode } = resolveAssessmentModuleSet(input);
      expect(mode).toBe("universal-plus-jobfit");
      expect(modules.length).toBe(47);
    }
  });
});
