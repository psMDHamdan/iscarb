/**
 * iSCARB Observability — OpenTelemetry traces + Sentry error capture.
 * ===========================================================================
 * Both are OPT-IN via env:
 *   - OTEL_EXPORTER_OTLP_ENDPOINT  → enables OTel OTLP trace export
 *   - SENTRY_DSN                   → enables Sentry error capture
 *
 * In dev without env, all calls are no-ops so the app runs unaffected.
 * The Next.js instrumentation hook (instrumentation.ts) calls initObservability()
 * once at server boot.
 *
 * IMPORTANT: optional peer-deps (@opentelemetry/*, @sentry/nextjs) are imported
 * via a variable specifier so Turbopack cannot statically resolve them and fail
 * the build when they are not installed.
 * ===========================================================================
 */
import "server-only";

let initialised = false;
let sentryClient: { captureException: (e: unknown, ctx?: unknown) => void } | null = null;

/** Dynamic import that defeats static bundler resolution (variable specifier). */
async function optionalImport(spec: string): Promise<Record<string, unknown> | null> {
  try {
    // Use the Function constructor so Turbopack/webpack cannot statically
    // resolve the module specifier (which would fail the build when the
    // optional peer-dep isn't installed).
    const dynImport = new Function("s", "return import(s)") as (s: string) => Promise<Record<string, unknown>>;
    const mod = await dynImport(spec);
    return mod;
  } catch {
    return null;
  }
}

/** Minimal structural type for the optional @sentry/nextjs peer dep (guarded at runtime). */
type SentryLike = {
  init: (opts: Record<string, unknown>) => void;
  setTag: (key: string, value: string) => void;
  captureException: (err: unknown, hint?: unknown) => void;
};

export function initObservability() {
  if (initialised) return;
  initialised = true;

  const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const sentryDsn = process.env.SENTRY_DSN;
  const serviceName = process.env.OTEL_SERVICE_NAME || "iscarb-api";

  // OpenTelemetry — register only if an exporter endpoint is set.
  if (otelEndpoint) {
    const sdkMod = "@opentelemetry/sdk-node";
    const exporterMod = "@opentelemetry/exporter-trace-otlp-http";
    Promise.all([optionalImport(sdkMod), optionalImport(exporterMod)])
      .then(([sdkNs, exporterNs]) => {
        if (!sdkNs || !exporterNs) {
          console.warn("[observability] @opentelemetry packages not installed — tracing disabled");
          return;
        }
        const NodeSDK = sdkNs.NodeSDK as typeof import("@opentelemetry/sdk-node").NodeSDK;
        const OTLPTraceExporter = (exporterNs as typeof import("@opentelemetry/exporter-trace-otlp-http")).OTLPTraceExporter;
        const traceExporter = new OTLPTraceExporter({ url: otelEndpoint });
        const nodeSdk = new NodeSDK({ serviceName, traceExporter });
        nodeSdk.start();
        console.log(`[observability] OpenTelemetry tracing → ${otelEndpoint}`);
      })
      .catch(() => {
        console.warn("[observability] OpenTelemetry init failed");
      });
  }

  // Sentry — register only if a DSN is set.
  if (sentryDsn) {
    optionalImport("@sentry/nextjs")
      .then((SentryNs) => {
        if (!SentryNs) {
          console.warn("[observability] @sentry/nextjs not installed — error capture disabled");
          return;
        }
        const Sentry = SentryNs as unknown as SentryLike;
        Sentry.init({
          dsn: sentryDsn,
          environment: process.env.NODE_ENV,
          tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
          release: process.env.SENTRY_RELEASE || "iscarb@local",
        });
        sentryClient = {
          captureException: (e, ctx) =>
            Sentry.captureException(e, { extra: ctx as Record<string, unknown> }),
        };
        console.log("[observability] Sentry error capture enabled");
      })
      .catch(() => {
        console.warn("[observability] Sentry init failed");
      });
  }
}

/** Capture an exception to Sentry (no-op if not configured). */
export function captureError(err: Error, context?: Record<string, unknown>): void {
  if (sentryClient) sentryClient.captureException(err, context);
  console.error("[iscarb:error]", err.message, context ?? "");
}

/**
 * Start a lightweight span. When OTel is active this maps to a real span;
 * otherwise it returns a no-op handle.
 */
export function startSpan(name: string): { end: () => void } {
  try {
    const tracer = (
      globalThis as unknown as { __iscarbTracer?: { startSpan: (n: string) => { end: () => void } } }
    ).__iscarbTracer;
    if (tracer) return tracer.startSpan(name);
  } catch {
    /* no-op */
  }
  return { end: () => {} };
}

/** Set a tag on the active Sentry scope (best-effort). */
export function setTenantTag(universityCode: string | null): void {
  if (!sentryClient) return;
  optionalImport("@sentry/nextjs").then((SentryNs) => {
    if (!SentryNs) return;
    const Sentry = SentryNs as unknown as SentryLike;
    Sentry.setTag("university", universityCode || "unknown");
  });
}
