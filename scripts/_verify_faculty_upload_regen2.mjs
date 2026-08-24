/**
 * Focused follow-up: re-upload, student 403, wait for generate status=done, confirm faculty retain.
 */
import { writeFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://127.0.0.1:3000";
const PID = process.argv[2] || "cmt6or2by00o0itmgq8zwe27k";
const SLIDE = Number(process.argv[3] || 3);
const OUT = "scripts/_verify_faculty_upload_regen2.json";

function tinyPng() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
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

async function main() {
  const db = new PrismaClient();
  const evidence = { projectId: PID, slideNo: SLIDE };

  const faculty = await login("faculty@iscarb.edu", "Faculty@123!");
  const student = await login("student@iscarb.edu", "Student@123!");
  evidence.facultyLogin = { status: faculty.status, role: faculty.json?.role };
  evidence.studentLogin = { status: student.status, role: student.json?.role };

  if (!faculty.cookie) throw new Error("faculty login failed");
  if (!student.cookie) throw new Error("student login failed");

  const form = new FormData();
  form.append("file", new Blob([tinyPng()], { type: "image/png" }), "faculty-override.png");
  const up = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/slides/${SLIDE}/image`, {
    method: "POST",
    headers: { Cookie: faculty.cookie },
    body: form,
  });
  const upJson = await up.json();
  evidence.upload = { status: up.status, url: upJson.imageUrl, key: upJson.storageKey, visualSpec: upJson.visualSpec };
  if (up.status !== 200) throw new Error("upload failed");
  const beforeUrl = upJson.imageUrl;

  const stuForm = new FormData();
  stuForm.append("file", new Blob([tinyPng()], { type: "image/png" }), "student.png");
  const stuUp = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/slides/${SLIDE}/image`, {
    method: "POST",
    headers: { Cookie: student.cookie },
    body: stuForm,
  });
  evidence.studentUpload = { status: stuUp.status, body: (await stuUp.text()).slice(0, 300) };

  const beforeArt = await db.lectureSlideArtifact.findFirst({
    where: { projectId: PID, slideNo: SLIDE, status: { not: "superseded" } },
    orderBy: { version: "desc" },
  });
  evidence.beforeVersion = beforeArt?.version;
  evidence.beforeFaculty = beforeArt?.contentJson?.visualSpec?.facultyUploadedUrl;

  const regen = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: faculty.cookie },
    body: JSON.stringify({ slideNos: [SLIDE] }),
  });
  evidence.regenStart = { status: regen.status, body: await regen.json() };

  let last = null;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const job = await fetch(`${BASE}/api/iscarb/lecture/jobs/${PID}`, {
      headers: { Cookie: faculty.cookie },
    });
    const j = await job.json();
    last = { i, status: j.progress?.status, progress: j.progress?.progress, error: j.progress?.error };
    if (i % 10 === 0) console.log("poll", JSON.stringify(last));
    if (j.progress?.status === "done" || j.progress?.status === "failed") {
      evidence.regenDone = last;
      break;
    }
  }
  if (!evidence.regenDone) evidence.regenDone = { ...last, timedOut: true };

  const afterArt = await db.lectureSlideArtifact.findFirst({
    where: { projectId: PID, slideNo: SLIDE, status: { not: "superseded" } },
    orderBy: { version: "desc" },
  });
  evidence.after = {
    version: afterArt?.version,
    facultyUploadedUrl: afterArt?.contentJson?.visualSpec?.facultyUploadedUrl,
    retained: afterArt?.contentJson?.visualSpec?.facultyUploadedUrl === beforeUrl,
    fetchedImageUrl: afterArt?.contentJson?.visualSpec?.fetchedImageUrl,
    imageUrl: afterArt?.contentJson?.visualSpec?.imageUrl,
  };

  writeFileSync(OUT, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
