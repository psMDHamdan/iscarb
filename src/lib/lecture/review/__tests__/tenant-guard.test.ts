import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    lectureProject: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { getScopedProject } from "@/lib/lecture/review/tenant-guard";

describe("getScopedProject — AC-11 tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the project when tenantId matches exactly", async () => {
    vi.mocked(db.lectureProject.findUnique).mockResolvedValue({
      id: "p1",
      tenantId: "uni-a",
      courseProfileId: "cp1",
      nationalAlignmentMode: "COURSE_READINESS",
    } as any);

    const result = await getScopedProject("p1", "uni-a", "user-1");
    expect(result?.id).toBe("p1");
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });

  it("returns null and audits when tenantId mismatches (no default bypass)", async () => {
    vi.mocked(db.lectureProject.findUnique).mockResolvedValue({
      id: "p1",
      tenantId: "uni-a",
      courseProfileId: "cp1",
      nationalAlignmentMode: "COURSE_READINESS",
    } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(db.auditLog.create).mockResolvedValue({} as any);

    const result = await getScopedProject("p1", "default", "user-1");
    expect(result).toBeNull();
    expect(db.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "cross_tenant_access_blocked" }),
      })
    );
  });
});
