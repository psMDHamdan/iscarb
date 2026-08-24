/**
 * Verify visual bug fixes — fresh faculty project with full generate + artifact probe.
 */
import { writeFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://127.0.0.1:3000";
const OUT = "scripts/_verify_visual_fixes_out.json";

const SOURCE_HTML = `<!DOCTYPE html><html><body><article>
<h1>Relational Database Concepts</h1>
<p>A relational database organizes data into tables (relations). Each row is a tuple; each column is an attribute with a declared domain.</p>
<p>Foreign keys enforce referential integrity between tables. Cascading updates and deletes must be designed carefully.</p>
<h2>Normalization and Schema Design</h2>
<p>First normal form requires atomic attribute values. Third normal form removes transitive dependencies.</p>
<h2>SQL Query Optimization</h2>
<p>The query optimizer selects among candidate plans using cost estimates. B-tree indexes support ordered scans.</p>
<h2>Transaction Isolation and ACID</h2>
<p>Atomicity, Consistency, Isolation, and Durability define reliable transactions.</p>
</article></body></html>`;

async function req(path, opts = {}) {
  const { method = "GET", body, cookie, formData } = opts;
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (!formData) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { method, headers, body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, setCookie: res.headers.getSetCookie?.() || [] };
}

function cookieFrom(setCookie) {
  for (const c of setCookie) {
    const m = c.match(/iscarb_session=([^;]+)/);
    if (m) return `iscarb_session=${m[1]}`;
  }
  return null;
}

function normalizeUrl(u) {
  return (u || "").split("?")[0];
}

async function probeProject(db, pid, cookie) {
  const project = await db.lectureProject.findUnique({ where: { id: pid }, select: { generationStateJson: true } });
  const arts = await db.lectureSlideArtifact.findMany({
    where: { projectId: pid, status: { not: "superseded" } },
    orderBy: [{ slideNo: "asc" }, { version: "desc" }],
  });
  const bySlide = new Map();
  for (const a of arts) {
    if (!bySlide.has(a.slideNo)) bySlide.set(a.slideNo, a);
  }

  const slides = [];
  const urlMap = {};
  let emptyBullets = [];
  let errorStubs = [];
  let proxyFails = [];

  for (const [slideNo, a] of bySlide) {
    const c = a.contentJson || {};
    const bullets = c.body?.bullets || c.bullets || [];
    const url = c.visualSpec?.fetchedImageUrl || c.visualSpec?.imageUrl || null;
    if (url) {
      const norm = normalizeUrl(url);
      urlMap[norm] = urlMap[norm] || [];
      urlMap[norm].push(slideNo);
    }
    if (!bullets.length) emptyBullets.push(slideNo);
    if (c.body?.visibleCopy === "Error loading generated content." || c.generationFailed) {
      errorStubs.push(slideNo);
    }

    let proxyStatus = null;
    if (url) {
      const proxyUrl = `${BASE}/api/iscarb/image-proxy?url=${encodeURIComponent(url)}`;
      try {
        const pr = await fetch(proxyUrl, { headers: cookie ? { Cookie: cookie } : {} });
        proxyStatus = pr.status;
        if (pr.status !== 200) proxyFails.push({ slideNo, status: pr.status, url: url.slice(0, 80) });
      } catch (e) {
        proxyStatus = "error";
        proxyFails.push({ slideNo, status: "fetch_error", url });
      }
    }

    slides.push({
      slideNo,
      wordCount: a.wordCount,
      bulletCount: bullets.length,
      bulletsPreview: bullets.slice(0, 2).map((b) => String(b).slice(0, 60)),
      imageUrl: url,
      proxyStatus,
      hasVisualSpec: Boolean(c.visualSpec),
      generationFailed: Boolean(c.generationFailed),
      visibleCopy: String(c.body?.visibleCopy || "").slice(0, 50),
    });
  }

  const dupes = Object.entries(urlMap).filter(([, sns]) => sns.length > 1);

  return {
    projectId: pid,
    slideCount: slides.length,
    slideRetryCounts: project?.generationStateJson?.slideRetryCounts ?? {},
    slides,
    duplicateUrls: dupes,
    emptyBullets,
    errorStubs,
    proxyFails,
    allHaveVisualSpec: slides.every((s) => s.hasVisualSpec && s.imageUrl),
    allDistinctUrls: dupes.length === 0,
    allProxy200: proxyFails.length === 0,
  };
}

async function main() {
  const db = new PrismaClient();
  const login = await req("/api/v1/auth/login", {
    method: "POST",
    body: { email: "faculty@iscarb.edu", password: "Faculty@123!" },
  });
  const cookie = cookieFrom(login.setCookie);
  if (!cookie) throw new Error("login failed");

  const tag = new Date().toISOString().slice(0, 16);
  const create = await req("/api/iscarb/lecture/projects", {
    method: "POST",
    cookie,
    body: {
      title: `Visual Fix Verify ${tag}`,
      courseProfile: {
        courseCode: `VF${Date.now().toString().slice(-5)}`,
        title: "Intro to Relational Databases",
        specialty: "Computer Science & Artificial Intelligence",
        languagePolicy: "en",
        teacherEnteredClos: [
          { id: "c1", number: "1", text: "Explain relational database concepts", bloomLevel: "Understand", weight: 0.4 },
        ],
      },
    },
  });
  const pid = create.json?.project?.id;
  console.log("CREATE", pid, create.status);

  await req(`/api/iscarb/lecture/projects/${pid}/clos`, {
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

  const form = new FormData();
  form.append("file", new Blob([SOURCE_HTML], { type: "text/html" }), "source.html");
  const upload = await req(`/api/iscarb/lecture/projects/${pid}/sources`, { method: "POST", cookie, formData: form });
  const docId = upload.json?.documentId;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const job = await req(`/api/iscarb/lecture/jobs/${docId}`, { cookie });
    if (job.json?.progress?.status === "done") break;
    if (job.json?.progress?.status === "failed") throw new Error("parse failed");
  }

  await req(`/api/iscarb/lecture/projects/${pid}/plan`, { method: "POST", cookie, body: {} });
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const plan = await req(`/api/iscarb/lecture/projects/${pid}/plan`, { cookie });
    if ((plan.json?.slides?.length ?? 0) >= 20) break;
  }

  await req(`/api/iscarb/lecture/projects/${pid}/plan/approve`, { method: "POST", cookie, body: {} });

  const gen = await req(`/api/iscarb/lecture/projects/${pid}/generate`, { method: "POST", cookie, body: {} });
  console.log("GENERATE", gen.status, gen.json);

  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 15000));
    const job = await req(`/api/iscarb/lecture/jobs/${pid}`, { cookie });
    const arts = await req(`/api/iscarb/lecture/projects/${pid}/artifacts`, { cookie });
    const count = (arts.json?.artifacts || []).length;
    console.log(`POLL ${i}`, count, job.json?.progress?.status, job.json?.progress?.progress);
    if (job.json?.progress?.status === "done" || job.json?.progress?.status === "failed") {
      if (count >= 20) break;
    }
    if (count >= 20 && job.json?.progress?.status === "done") break;
  }

  const result = await probeProject(db, pid, cookie);
  writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log("RESULT", JSON.stringify({
    slideCount: result.slideCount,
    allHaveVisualSpec: result.allHaveVisualSpec,
    allDistinctUrls: result.allDistinctUrls,
    allProxy200: result.allProxy200,
    dupes: result.duplicateUrls.length,
    emptyBullets: result.emptyBullets,
    errorStubs: result.errorStubs,
    slideRetryCounts: result.slideRetryCounts,
    proxyFails: result.proxyFails.length,
  }, null, 2));

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
