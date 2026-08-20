import { guard, type GuardContext } from "@/lib/api-guard";
import { resolveOwnedStudentId } from "@/lib/assessment/resolve-student";
import { issueEmployabilityCertificate } from "@/lib/assessment/issue-employability-certificate";

/**
 * GET /api/iscarb/assessment/attempts/[attemptId]/certificate
 *
 * Preferred certificate contract (ISC-QA-002): credential is bound to a specific
 * completed attempt owned by the caller (or a studentId faculty/admin may view).
 */
export const GET = guard(
  { tier: "read", roles: ["student", "faculty", "admin"] },
  async (
    req: Request,
    ctx: GuardContext,
    { params }: { params: Promise<{ attemptId: string }> },
  ) => {
    try {
      const { attemptId } = await params;
      const { searchParams } = new URL(req.url);
      const requestedStudentId = searchParams.get("studentId")?.trim() ?? undefined;
      const resolved = await resolveOwnedStudentId(ctx.session, requestedStudentId);
      if (!resolved.ok) {
        return new Response("Unauthorized", { status: resolved.status });
      }

      return await issueEmployabilityCertificate({
        studentId: resolved.studentId,
        attemptId,
      });
    } catch (e: unknown) {
      const traceId = Math.random().toString(36).slice(2, 10);
      console.error(`[attempt-certificate][${traceId}] Certificate generation failed:`, e);
      return new Response(`Certificate generation failed. Reference: ${traceId}`, {
        status: 500,
      });
    }
  },
);
