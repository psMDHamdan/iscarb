/**
 * Unit tests for computePercentile edge cases
 *
 * Property 8 edge cases
 * Validates: Requirements 4.2
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// server-only is already mocked globally in tests/setup.ts
// but we mock db here since percentile.ts imports it
vi.mock("@/lib/db", () => ({
  db: {
    assessmentResponse: {
      count: vi.fn(),
    },
    employabilityProfile: {
      count: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import {
  computePercentile,
  computeOverallPercentile,
  resolvePercentileMinSample,
} from "../percentile";

const mockCount = db.assessmentResponse.count as ReturnType<typeof vi.fn>;
const mockProfileCount = db.employabilityProfile.count as ReturnType<typeof vi.fn>;

describe("resolvePercentileMinSample", () => {
  it("defaults to 5 when env unset or empty", () => {
    expect(resolvePercentileMinSample(undefined)).toBe(5);
    expect(resolvePercentileMinSample("")).toBe(5);
    expect(resolvePercentileMinSample("   ")).toBe(5);
  });

  it("parses a valid positive integer override", () => {
    expect(resolvePercentileMinSample("20")).toBe(20);
    expect(resolvePercentileMinSample("30")).toBe(30);
  });

  it("falls back to 5 on invalid values", () => {
    expect(resolvePercentileMinSample("0")).toBe(5);
    expect(resolvePercentileMinSample("-3")).toBe(5);
    expect(resolvePercentileMinSample("abc")).toBe(5);
  });
});

describe("computePercentile", () => {
  const prevEnv = process.env.ASSESSMENT_PERCENTILE_MIN_SAMPLE;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ASSESSMENT_PERCENTILE_MIN_SAMPLE;
  });

  afterEach(() => {
    if (prevEnv === undefined) delete process.env.ASSESSMENT_PERCENTILE_MIN_SAMPLE;
    else process.env.ASSESSMENT_PERCENTILE_MIN_SAMPLE = prevEnv;
  });

  it("returns null when fewer than 5 records exist (default MIN_SAMPLE)", async () => {
    mockCount.mockResolvedValueOnce(4);
    const result = await computePercentile("M01", 75);
    expect(result).toBeNull();
    expect(mockCount).toHaveBeenCalledTimes(1);
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          moduleCode: "M01",
          isCurrent: true,
          NOT: { source: { equals: "seed", mode: "insensitive" } },
        }),
      }),
    );
  });

  it("returns null when exactly 0 records exist", async () => {
    mockCount.mockResolvedValueOnce(0);
    const result = await computePercentile("M01", 50);
    expect(result).toBeNull();
    expect(mockCount).toHaveBeenCalledTimes(1);
  });

  it("returns 70 when 7 of 10 records are below the score", async () => {
    mockCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(7);
    const result = await computePercentile("M01", 80);
    expect(result).toBe(70);
    expect(mockCount).toHaveBeenCalledTimes(2);
  });

  it("returns 0 when no records are below the score", async () => {
    mockCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(0);
    const result = await computePercentile("M01", 10);
    expect(result).toBe(0);
  });

  it("returns 100 when all records are below the score", async () => {
    mockCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(10);
    const result = await computePercentile("M01", 99);
    expect(result).toBe(100);
  });

  it("rounds to nearest integer (e.g. 3/7 ≈ 43%)", async () => {
    mockCount
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3);
    const result = await computePercentile("M02", 55);
    expect(result).toBe(43);
  });

  it("returns null when total equals MIN_SAMPLE - 1 (boundary: 4 records)", async () => {
    mockCount.mockResolvedValueOnce(4);
    expect(await computePercentile("M03", 60)).toBeNull();
  });

  it("does not return null when total equals MIN_SAMPLE (boundary: 5 records)", async () => {
    mockCount
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3);
    const result = await computePercentile("M03", 70);
    expect(result).not.toBeNull();
    expect(result).toBe(60);
  });

  it("respects ASSESSMENT_PERCENTILE_MIN_SAMPLE override (e.g. 20)", async () => {
    process.env.ASSESSMENT_PERCENTILE_MIN_SAMPLE = "20";
    mockCount.mockResolvedValueOnce(19); // below override → null
    expect(await computePercentile("M01", 70)).toBeNull();
    expect(mockCount).toHaveBeenCalledTimes(1);

    mockCount.mockClear();
    mockCount
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(8);
    const result = await computePercentile("M01", 80);
    expect(result).toBe(40); // 8/20 * 100
    expect(mockCount).toHaveBeenCalledTimes(2);
  });

  it("passes the correct moduleCode to both count queries", async () => {
    mockCount
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5);
    await computePercentile("M19", 75);
    expect(mockCount).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: expect.objectContaining({ moduleCode: "M19" }) }),
    );
    expect(mockCount).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: expect.objectContaining({ moduleCode: "M19" }) }),
    );
  });
});

describe("computeOverallPercentile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ASSESSMENT_PERCENTILE_MIN_SAMPLE;
  });

  it("returns null when cohort is below MIN_SAMPLE", async () => {
    mockProfileCount.mockResolvedValueOnce(4);
    expect(await computeOverallPercentile(72, "stu-1")).toBeNull();
    expect(mockProfileCount).toHaveBeenCalledWith({
      where: { NOT: { studentId: "stu-1" } },
    });
  });

  it("returns null for non-finite composite", async () => {
    expect(await computeOverallPercentile(Number.NaN, "stu-1")).toBeNull();
    expect(mockProfileCount).not.toHaveBeenCalled();
  });

  it("counts peers with strictly lower composite scores", async () => {
    mockProfileCount.mockResolvedValueOnce(10).mockResolvedValueOnce(6);
    const result = await computeOverallPercentile(80, "stu-self");
    expect(result).toBe(60);
    expect(mockProfileCount).toHaveBeenNthCalledWith(2, {
      where: {
        NOT: { studentId: "stu-self" },
        composite: { lt: 80 },
      },
    });
  });

  it("never applies `{ not: null }` on the required composite field", async () => {
    mockProfileCount.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
    await computeOverallPercentile(55);
    for (const call of mockProfileCount.mock.calls) {
      const composite = call[0]?.where?.composite;
      if (composite && typeof composite === "object" && "not" in composite) {
        expect(composite.not).not.toBeNull();
      }
    }
    expect(mockProfileCount).toHaveBeenNthCalledWith(2, {
      where: { composite: { lt: 55 } },
    });
  });
});
