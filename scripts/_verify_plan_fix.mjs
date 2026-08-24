/**
 * Verify plan stage fix: login → create → upload source → CLO approve → POST /plan
 */
const BASE = "http://127.0.0.1:3000";

async function req(path, { method = "GET", body, cookie, formData } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (!formData) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: formData ?? (body ? JSON.stringify(body) : undefined),
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, setCookie, json, text: text.slice(0, 800) };
}

function cookieFrom(setCookie) {
  for (const c of setCookie) {
    const m = c.match(/iscarb_session=([^;]+)/);
    if (m) return `iscarb_session=${m[1]}`;
  }
  return null;
}

const SOURCE_HTML = `<!DOCTYPE html><html><body>
<h1>Relational Database Foundations</h1><p>Tables store rows with primary keys.</p>
<h2>Normalization and Schema Design</h2><p>Third normal form reduces redundancy.</p>
<h2>SQL Query Optimization</h2><p>Indexes accelerate lookup predicates.</p>
<h2>Transaction Isolation Levels</h2><p>ACID properties govern concurrent access.</p>
<h2>Indexing Strategies</h2><p>B-tree indexes support range scans.</p>
</body></html>`;

async function main() {
  const login = await req("/api/v1/auth/login", {
    method: "POST",
    body: { email: "faculty@iscarb.edu", password: "Faculty@123!" },
  });
  const cookie = cookieFrom(login.setCookie);
  console.log("LOGIN", login.status);
  if (!cookie) throw new Error("No session cookie");

  const create = await req("/api/iscarb/lecture/projects", {
    method: "POST",
    cookie,
    body: {
      title: `Plan Fix Verify ${Date.now()}`,
      courseProfile: {
        courseCode: `PFX${Date.now().toString().slice(-5)}`,
        title: "Database Systems",
        specialty: "Computer Science & Artificial Intelligence",
        languagePolicy: "en",
        teacherEnteredClos: [
          { id: "c1", number: "1", text: "Explain relational database concepts", bloomLevel: "Understand", weight: 0.4 },
        ],
      },
    },
  });
  const pid = create.json?.project?.id;
  console.log("CREATE", create.status, pid);

  const clos = await req(`/api/iscarb/lecture/projects/${pid}/clos`, {
    method: "PUT",
    cookie,
    body: {
      teacherEnteredClos: [
        { id: "c1", number: "1", text: "Explain relational database concepts", bloomLevel: "understand", weight: 40 },
        { id: "c2", number: "2", text: "Design a normalized schema", bloomLevel: "apply", weight: 30 },
        { id: "c3", number: "3", text: "Evaluate query performance", bloomLevel: "evaluate", weight: 30 },
      ],
      selectedLectureCloIds: ["c1", "c2", "c3"],
    },
  });
  console.log("CLO", clos.status, clos.json?.approvedAt ? "approved" : clos.json);

  const form = new FormData();
  form.append("file", new Blob([SOURCE_HTML], { type: "text/html" }), "source.html");
  const upload = await req(`/api/iscarb/lecture/projects/${pid}/sources`, {
    method: "POST",
    cookie,
    formData: form,
  });
  console.log("UPLOAD", upload.status, upload.json);

  if (upload.json?.documentId) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const job = await req(`/api/iscarb/lecture/jobs/${upload.json.documentId}`, { cookie });
      const st = job.json?.progress?.status ?? job.json?.parseStatus;
      console.log(`PARSE_${i}`, st);
      if (st === "done") break;
    }
  }

  const planPost = await req(`/api/iscarb/lecture/projects/${pid}/plan`, {
    method: "POST",
    cookie,
    body: {},
  });
  console.log("PLAN_POST", planPost.status, planPost.json);

  let planCount = 0;
  let projectStatus = "unknown";
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const plan = await req(`/api/iscarb/lecture/projects/${pid}/plan`, { cookie });
    planCount = plan.json?.slides?.length ?? 0;
    projectStatus = plan.json?.project?.status ?? projectStatus;
    const job = await req(`/api/iscarb/lecture/jobs/${pid}`, { cookie });
    console.log(`PLAN_POLL_${i}`, { planCount, projectStatus, jobStatus: job.json?.progress?.status, jobError: job.json?.progress?.error });
    if (planCount >= 20 && projectStatus === "planning") break;
    if (job.json?.progress?.status === "failed") break;
  }

  const gen = await req(`/api/iscarb/lecture/projects/${pid}/generate`, {
    method: "POST",
    cookie,
    body: {},
  });
  console.log("GENERATE", gen.status, gen.json);

  console.log("\n=== RESULT ===");
  console.log("PROJECT_ID", pid);
  console.log("PLAN_COUNT", planCount);
  console.log("PROJECT_STATUS", projectStatus);
  console.log("STUDIO_REACHABLE", gen.status === 202 ? "yes (accepted)" : gen.status === 400 ? gen.json?.error : gen.status);
}

main().catch((e) => { console.error(e); process.exit(1); });
