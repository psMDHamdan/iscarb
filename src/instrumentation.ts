/**
 * Next.js instrumentation hook — runs once when the Node.js server starts.
 * Validates production env before serving traffic.
 */
export async function register() {
  // Edge/middleware workers cannot read Docker secret files — Node server boot
  // already validates via scripts/validate-env.mjs in the container CMD.
  if (process.env.NEXT_RUNTIME === "edge") return;

  if (
    process.env.NODE_ENV === "production" &&
    process.env.SKIP_ENV_VALIDATION !== "true"
  ) {
    const { validateProductionEnv } = await import("@/lib/env-validation");
    validateProductionEnv();
  }
}
