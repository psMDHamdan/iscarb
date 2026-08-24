/** Verify density warning + publish (density must not block) */
const BASE = "http://127.0.0.1:3000";
const PID = "cmt6k6ikz002kitmg9n12wuf5";

async function req(path, opts = {}) {
  const { method = "GET", body, cookie } = opts;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json };
}

function cookieFrom(setCookie) {
  for (const c of setCookie || []) {
    const m = c.match(/iscarb_session=([^;]+)/);
    if (m) return `iscarb_session=${m[1]}`;
  }
  return null;
}

async function main() {
  const login = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "faculty@iscarb.edu", password: "Faculty@123!" }),
  });
  const cookie = cookieFrom(login.headers.getSetCookie?.() || []);

  const validate = await req(`/api/iscarb/lecture/projects/${PID}/validate`, {
    method: "POST",
    cookie,
    body: {},
  });
  const densityWarn = validate.json?.warnings?.find((b) => b.gateKey === "density");
  const densityBlock = validate.json?.blockers?.find((b) => b.gateKey === "density");
  console.log("VALIDATE", {
    warnCount: validate.json?.warnCount,
    failCount: validate.json?.failCount,
    densityInBlockers: !!densityBlock,
    densityWarning: densityWarn
      ? {
          status: densityWarn.status,
          severity: densityWarn.severity,
          findingCount: densityWarn.findings?.length,
          sample: densityWarn.findings?.slice(0, 3),
        }
      : null,
  });

  const readiness = await req(`/api/iscarb/lecture/projects/${PID}/readiness`, { cookie });
  for (const item of readiness.json?.items || []) {
    await req(`/api/iscarb/lecture/readiness-items/${item.id}`, {
      method: "PATCH",
      cookie,
      body: { action: "approve" },
    });
  }

  const pubReady = await req(`/api/iscarb/lecture/projects/${PID}/publish-readiness`, { cookie });
  console.log("PUBLISH_READINESS", {
    canPublish: pubReady.json?.canPublish,
    blockers: pubReady.json?.blockers,
    failedErrorGates: pubReady.json?.counts?.failedErrorGates,
    gateSummary: pubReady.json?.gateSummary,
  });

  const pub = await req(`/api/iscarb/lecture/projects/${PID}/publish`, {
    method: "POST",
    cookie,
    body: {},
  });
  console.log("PUBLISH", { status: pub.status, blockers: pub.json?.blockers, counts: pub.json?.counts });
}

main().catch(console.error);
