/**
 * Verify faculty slide image upload: store, render priority, regen retain, remove, export, auth, validation.
 */
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { PrismaClient } from "@prisma/client";
import path from "path";

const BASE = "http://127.0.0.1:3000";
const OUT = "scripts/_verify_faculty_upload_out.json";
const PID = process.argv[2] || "cmt6or2by00o0itmgq8zwe27k";
const SLIDE = Number(process.argv[3] || 3);

function localStorageRoot() {
  return process.env.LECTURE_STORAGE_LOCAL_ROOT || path.join(process.cwd(), ".lecture-storage");
}

function cookieFrom(setCookie) {
  for (const c of setCookie || []) {
    const m = c.match(/iscarb_session=([^;]+)/);
    if (m) return `iscarb_session=${m[1]}`;
  }
  return null;
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return {
    status: res.status,
    cookie: cookieFrom(res.headers.getSetCookie?.() || []),
    json: await res.json().catch(() => null),
  };
}

/** Minimal valid 1x1 PNG */
function tinyPng() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
}

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

async function main() {
  const db = new PrismaClient();
  const evidence = { projectId: PID, slideNo: SLIDE, steps: {} };

  const faculty = await login("faculty@iscarb.edu", "Faculty@123!");
  if (!faculty.cookie) throw new Error("faculty login failed: " + JSON.stringify(faculty));
  evidence.steps.facultyLogin = { status: faculty.status, role: faculty.json?.role };

  // Snapshot auto image before upload
  const beforeArt = await db.lectureSlideArtifact.findFirst({
    where: { projectId: PID, slideNo: SLIDE, status: { not: "superseded" } },
    orderBy: { version: "desc" },
  });
  if (!beforeArt) throw new Error(`No artifact for project ${PID} slide ${SLIDE}`);
  const beforeVs = beforeArt.contentJson?.visualSpec || {};
  evidence.steps.beforeUpload = {
    fetchedImageUrl: beforeVs.fetchedImageUrl || null,
    imageUrl: beforeVs.imageUrl || null,
    facultyUploadedUrl: beforeVs.facultyUploadedUrl || null,
  };

  // 1) Upload valid PNG
  const form = new FormData();
  form.append("file", new Blob([tinyPng()], { type: "image/png" }), "faculty-override.png");
  const up = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/slides/${SLIDE}/image`, {
    method: "POST",
    headers: { Cookie: faculty.cookie },
    body: form,
  });
  const upJson = await up.json();
  evidence.steps.upload = { status: up.status, body: upJson };
  if (up.status !== 200) throw new Error("upload failed: " + JSON.stringify(upJson));

  const key = upJson.storageKey;
  const localPath = path.join(localStorageRoot(), key);
  evidence.steps.storageFileExists = existsSync(localPath);
  evidence.steps.storageKey = key;
  evidence.steps.facultyUploadedUrl = upJson.imageUrl;
  evidence.steps.localPath = localPath;

  // DB visualSpec
  const art = await db.lectureSlideArtifact.findFirst({
    where: { projectId: PID, slideNo: SLIDE, status: { not: "superseded" } },
    orderBy: { version: "desc" },
  });
  const vs = art?.contentJson?.visualSpec || {};
  evidence.steps.persistedVisualSpec = {
    facultyUploadedUrl: vs.facultyUploadedUrl,
    facultyUploadedStorageKey: vs.facultyUploadedStorageKey,
    fetchedImageUrl: vs.fetchedImageUrl,
    imageUrl: vs.imageUrl,
  };
  evidence.steps.priorityCheck = {
    facultyWins: Boolean(vs.facultyUploadedUrl),
    autoStillPresent: Boolean(vs.fetchedImageUrl || vs.imageUrl),
  };

  // Serve GET (render source)
  const getImg = await fetch(`${BASE}${upJson.imageUrl}`, { headers: { Cookie: faculty.cookie } });
  const getBuf = Buffer.from(await getImg.arrayBuffer());
  evidence.steps.serveGet = {
    status: getImg.status,
    contentType: getImg.headers.get("content-type"),
    bytes: getBuf.length,
    isPng: getBuf.subarray(0, 4).equals(PNG_SIG),
  };

  // Artifacts API reflects faculty URL for Studio render
  const arts = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/artifacts`, {
    headers: { Cookie: faculty.cookie },
  });
  const artsJson = await arts.json();
  const slideArt = (artsJson.artifacts || []).find((a) => a.slideNo === SLIDE);
  evidence.steps.artifactsApiVisualSpec = slideArt?.contentJson?.visualSpec
    ? {
        facultyUploadedUrl: slideArt.contentJson.visualSpec.facultyUploadedUrl,
        fetchedImageUrl: slideArt.contentJson.visualSpec.fetchedImageUrl,
        imageUrl: slideArt.contentJson.visualSpec.imageUrl,
      }
    : null;

  // 2) Bad file type (gif)
  const badForm = new FormData();
  badForm.append("file", new Blob([tinyPng()], { type: "image/gif" }), "bad.gif");
  const bad = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/slides/${SLIDE}/image`, {
    method: "POST",
    headers: { Cookie: faculty.cookie },
    body: badForm,
  });
  evidence.steps.rejectGif = { status: bad.status, body: await bad.json().catch(() => null) };

  // 3) Oversized file (>5MB)
  const big = Buffer.alloc(5 * 1024 * 1024 + 100, 1);
  const bigForm = new FormData();
  bigForm.append("file", new Blob([big], { type: "image/png" }), "big.png");
  const bigRes = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/slides/${SLIDE}/image`, {
    method: "POST",
    headers: { Cookie: faculty.cookie },
    body: bigForm,
  });
  evidence.steps.rejectOversize = { status: bigRes.status, body: await bigRes.json().catch(() => null) };

  // 4) Student cannot upload
  let studentCookie = null;
  for (const [email, password] of [
    ["student@iscarb.edu", "Student@123!"],
    ["student@iscarb.edu", "student123"],
    ["student@iscarb.edu", "Password123!"],
  ]) {
    const s = await login(email, password);
    if (s.status === 200 && s.cookie) {
      studentCookie = s.cookie;
      evidence.steps.studentLogin = { email, status: s.status, role: s.json?.role };
      break;
    }
  }
  if (studentCookie) {
    const stuForm = new FormData();
    stuForm.append("file", new Blob([tinyPng()], { type: "image/png" }), "student.png");
    const stuUp = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/slides/${SLIDE}/image`, {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: stuForm,
    });
    evidence.steps.studentUploadBlocked = {
      status: stuUp.status,
      body: (await stuUp.text()).slice(0, 300),
    };
  } else {
    // Unauthenticated also must not succeed
    const anonForm = new FormData();
    anonForm.append("file", new Blob([tinyPng()], { type: "image/png" }), "anon.png");
    const anonUp = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/slides/${SLIDE}/image`, {
      method: "POST",
      body: anonForm,
    });
    evidence.steps.studentUploadBlocked = {
      skippedStudentLogin: true,
      unauthenticatedStatus: anonUp.status,
      body: (await anonUp.text()).slice(0, 200),
    };
  }

  // 5) Regenerate slide — faculty image must remain
  const beforeUrl = vs.facultyUploadedUrl;
  const regen = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: faculty.cookie },
    body: JSON.stringify({ slideNos: [SLIDE] }),
  });
  evidence.steps.regenStart = { status: regen.status, body: await regen.json().catch(() => null) };
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const job = await fetch(`${BASE}/api/iscarb/lecture/jobs/${PID}`, {
      headers: { Cookie: faculty.cookie },
    });
    const j = await job.json();
    const st = j.progress?.status || j.status;
    if (st === "done" || st === "failed" || st === "completed" || st === "error") {
      evidence.steps.regenDone = { i, status: st, progress: j.progress };
      break;
    }
    if (i === 89) evidence.steps.regenDone = { i, status: st, timedOut: true, progress: j.progress };
  }
  const artAfter = await db.lectureSlideArtifact.findFirst({
    where: { projectId: PID, slideNo: SLIDE, status: { not: "superseded" } },
    orderBy: { version: "desc" },
  });
  const vsAfter = artAfter?.contentJson?.visualSpec || {};
  evidence.steps.afterRegen = {
    facultyUploadedUrl: vsAfter.facultyUploadedUrl,
    retained: Boolean(vsAfter.facultyUploadedUrl) && vsAfter.facultyUploadedUrl === beforeUrl,
    storageKey: vsAfter.facultyUploadedStorageKey,
    autoFetched: vsAfter.fetchedImageUrl || vsAfter.imageUrl,
    version: artAfter?.version,
  };

  // 6) PPTX export embeds faculty PNG (signature present)
  const pptxRes = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/download/pptx`, {
    headers: { Cookie: faculty.cookie },
  });
  const pptxBuf = Buffer.from(await pptxRes.arrayBuffer());
  mkdirSync("scripts", { recursive: true });
  writeFileSync("scripts/_faculty_upload_export.pptx", pptxBuf);
  evidence.steps.pptx = {
    status: pptxRes.status,
    bytes: pptxBuf.length,
    containsPngSignature: pptxBuf.includes(PNG_SIG),
    contentType: pptxRes.headers.get("content-type"),
  };

  // HTML export embeds data URI of faculty image
  const htmlRes = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/download/html`, {
    headers: { Cookie: faculty.cookie },
  });
  const htmlText = await htmlRes.text();
  evidence.steps.html = {
    status: htmlRes.status,
    bytes: htmlText.length,
    containsDataImagePng: htmlText.includes("data:image/png;base64,"),
    containsFacultySlide: htmlText.includes(`data-slide="${SLIDE}"`),
  };

  // 7) Remove / revert
  const del = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/slides/${SLIDE}/image`, {
    method: "DELETE",
    headers: { Cookie: faculty.cookie },
  });
  const delJson = await del.json();
  evidence.steps.remove = { status: del.status, body: delJson };
  const artFinal = await db.lectureSlideArtifact.findFirst({
    where: { projectId: PID, slideNo: SLIDE, status: { not: "superseded" } },
    orderBy: { version: "desc" },
  });
  const vsFinal = artFinal?.contentJson?.visualSpec || {};
  evidence.steps.afterRemove = {
    facultyUploadedUrl: vsFinal.facultyUploadedUrl ?? null,
    revertedTo: vsFinal.fetchedImageUrl || vsFinal.imageUrl || null,
  };

  writeFileSync(OUT, JSON.stringify(evidence, null, 2));
  console.log(
    JSON.stringify(
      {
        uploadOk: evidence.steps.upload.status === 200,
        storageExists: evidence.steps.storageFileExists,
        facultyUrl: evidence.steps.facultyUploadedUrl,
        serveGet: evidence.steps.serveGet,
        rejectGif: evidence.steps.rejectGif.status,
        rejectOversize: evidence.steps.rejectOversize.status,
        studentBlocked: evidence.steps.studentUploadBlocked,
        retainedAfterRegen: evidence.steps.afterRegen?.retained,
        pptx: evidence.steps.pptx,
        html: evidence.steps.html,
        removed: evidence.steps.afterRemove.facultyUploadedUrl == null,
        out: OUT,
      },
      null,
      2
    )
  );

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
