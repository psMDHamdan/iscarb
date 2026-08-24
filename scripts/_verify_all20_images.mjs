/**
 * Fresh full faculty generation + strict 20/20 image URL verification.
 */
import { writeFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://127.0.0.1:3000";
const OUT = "scripts/_verify_all20_images_out.json";

const SOURCE_HTML = `<!DOCTYPE html><html><body><article>
<h1>Relational Database Concepts</h1>
<p>A relational database organizes data into tables (relations). Each row is a tuple; each column is an attribute with a declared domain. The primary key uniquely identifies each row.</p>
<p>Foreign keys enforce referential integrity between tables. Cascading updates and deletes must be designed carefully to avoid orphaned records.</p>
<h2>Normalization and Schema Design</h2>
<p>First normal form requires atomic attribute values. Third normal form removes transitive dependencies. Boyce-Codd normal form strengthens 3NF for overlapping candidate keys.</p>
<h2>SQL Query Optimization</h2>
<p>The query optimizer selects among candidate plans using cost estimates derived from table statistics. Indexes accelerate equality and range predicates. B-tree indexes support ordered scans.</p>
<h2>Transaction Isolation and ACID</h2>
<p>Atomicity, Consistency, Isolation, and Durability define reliable transactions. Isolation levels include Read Committed, Repeatable Read, and Serializable.</p>
<h2>Indexing Strategies in Practice</h2>
<p>Selectivity and cardinality guide index choice. Composite indexes should order columns by equality filters first, then range filters.</p>
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

function norm(u) {
  return (u || "").split("?")[0];
}

async function probeAll(db, pid, cookie) {
  const project = await db.lectureProject.findUnique({ where: { id: pid }, select: { generationStateJson: true } });
  const arts = await db.lectureSlideArtifact.findMany({
    where: { projectId: pid, status: { not: "superseded" } },
    orderBy: [{ slideNo: "asc" }, { version: "desc" }],
  });
  const bySlide = new Map();
  for (const a of arts) {
    if (!bySlide.has(a.slideNo)) bySlide.set(a.slideNo, a);
  }

  const urlMap = {};
  const slides = [];

  for (let slideNo = 1; slideNo <= 20; slideNo++) {
    const a = bySlide.get(slideNo);
    const c = a?.contentJson || {};
    const bullets = c.body?.bullets || c.bullets || [];
    const url = c.visualSpec?.fetchedImageUrl || c.visualSpec?.imageUrl || null;
    const hasSvg = Boolean(c.visualSpec?.svgCode);
    const visualType = c.visualSpec?.visualType || null;

    let proxyStatus = null;
    let proxyError = null;
    if (url) {
      const n = norm(url);
      urlMap[n] = urlMap[n] || [];
      urlMap[n].push(slideNo);
      try {
        const pr = await fetch(`${BASE}/api/iscarb/image-proxy?url=${encodeURIComponent(url)}`, {
          headers: cookie ? { Cookie: cookie } : {},
        });
        proxyStatus = pr.status;
        if (pr.status !== 200) proxyError = (await pr.text()).slice(0, 80);
      } catch (e) {
        proxyStatus = "error";
        proxyError = String(e.message || e);
      }
    }

    slides.push({
      slideNo,
      wordCount: a?.wordCount ?? null,
      bulletCount: bullets.length,
      bulletsPreview: bullets.slice(0, 1).map((b) => String(b).slice(0, 50)),
      imageUrl: url,
      imageUrlShort: url ? url.split("?")[0].replace("https://", "") : null,
      proxyStatus,
      proxyError,
      hasVisualSpec: Boolean(c.visualSpec),
      hasSvg,
      visualType,
      nullReason: !url
        ? !c.visualSpec
          ? "no visualSpec object"
          : "visualSpec present but imageUrl/fetchedImageUrl empty"
        : null,
    });
  }

  const dupes = Object.entries(urlMap).filter(([, sns]) => sns.length > 1);

  return {
    projectId: pid,
    slideCount: bySlide.size,
    slideRetryCounts: project?.generationStateJson?.slideRetryCounts ?? {},
    slides,
    duplicateUrls: dupes.map(([url, sns]) => ({ url, slideNos: sns, count: sns.length })),
    summary: {
      all20Present: bySlide.size === 20,
      allNonNullImageUrl: slides.every((s) => s.imageUrl),
      allProxy200: slides.every((s) => s.imageUrl && s.proxyStatus === 200),
      nullSlides: slides.filter((s) => !s.imageUrl).map((s) => ({ slideNo: s.slideNo, nullReason: s.nullReason })),
      emptyBullets: slides.filter((s) => s.bulletCount === 0).map((s) => s.slideNo),
      dupeGroupCount: dupes.length,
      maxDupeSize: dupes.reduce((m, [, sns]) => Math.max(m, sns.length), 0),
    },
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
      title: `All20 Images Verify ${tag}`,
      courseProfile: {
        courseCode: `A2${Date.now().toString().slice(-5)}`,
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
  if (!pid) throw new Error("create failed");

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
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const job = await req(`/api/iscarb/lecture/jobs/${docId}`, { cookie });
    const st = job.json?.progress?.status;
    if (st === "done") break;
    if (st === "failed") throw new Error("parse failed: " + JSON.stringify(job.json));
  }

  await req(`/api/iscarb/lecture/projects/${pid}/plan`, { method: "POST", cookie, body: {} });
  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const plan = await req(`/api/iscarb/lecture/projects/${pid}/plan`, { cookie });
    if ((plan.json?.slides?.length ?? 0) >= 20) break;
  }

  await req(`/api/iscarb/lecture/projects/${pid}/plan/approve`, { method: "POST", cookie, body: {} });

  const gen = await req(`/api/iscarb/lecture/projects/${pid}/generate`, { method: "POST", cookie, body: {} });
  console.log("GENERATE", gen.status, gen.json);

  for (let i = 0; i < 150; i++) {
    await new Promise((r) => setTimeout(r, 15000));
    const job = await req(`/api/iscarb/lecture/jobs/${pid}`, { cookie });
    const st = job.json?.progress?.status;
    const prog = job.json?.progress?.progress;
    const arts = await req(`/api/iscarb/lecture/projects/${pid}/artifacts`, { cookie });
    const count = (arts.json?.artifacts || []).length;
    console.log(`POLL ${i}`, { count, st, prog });
    if (st === "done" && count >= 20) break;
    if (st === "failed") throw new Error("generation failed: " + JSON.stringify(job.json));
  }

  const result = await probeAll(db, pid, cookie);
  writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(result.summary, null, 2));
  console.log("\n=== PER-SLIDE ===");
  for (const s of result.slides) {
    console.log(
      `S${String(s.slideNo).padStart(2)} | bullets:${s.bulletCount} | proxy:${s.proxyStatus ?? "N/A"} | ${s.imageUrlShort ?? "NULL"}${s.nullReason ? " (" + s.nullReason + ")" : ""}`
    );
  }
  if (result.duplicateUrls.length) {
    console.log("\n=== DUPLICATES ===");
    console.log(JSON.stringify(result.duplicateUrls, null, 2));
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
