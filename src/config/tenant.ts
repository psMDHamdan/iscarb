/**
 * iSCARB Multi-tenancy helper — University isolation.
 * ===========================================================================
 * Every tenant-scoped query MUST apply `tenantWhere(ctx)`. The helper resolves
 * the caller's university from the session. In dev mode (no universityId on
 * session) it returns an empty filter so the demo shows all data.
 *
 * For real production, the session.universityId is set at JWT issuance time
 * from the user's home university, guaranteeing cross-tenant isolation.
 * ===========================================================================
 */
import "server-only";
import type { GuardContext } from "@/lib/api-guard";

export function tenantWhere(ctx: GuardContext): { universityId?: string | null } {
  return ctx.tenant.universityId ? { universityId: ctx.tenant.universityId } : {};
}

/** Resolve the university code for tagging / display. */
export function tenantCode(ctx: GuardContext): string | null {
  return ctx.session.universityCode ?? null;
}
