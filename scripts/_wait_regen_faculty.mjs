import { PrismaClient } from "@prisma/client";

const BASE = "http://127.0.0.1:3000";
const PID = "cmt6or2by00o0itmgq8zwe27k";
const SLIDE = 3;
const EXPECT = "/api/iscarb/lecture/projects/cmt6or2by00o0itmgq8zwe27k/slides/3/image?v=a5977c93-d15";

function cookieFrom(setCookie) {
  for (const c of setCookie || []) {
    const m = c.match(/iscarb_session=([^;]+)/);
    if (m) return `iscarb_session=${m[1]}`;
  }
  return null;
}

const db = new PrismaClient();
const login = await fetch(`${BASE}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "faculty@iscarb.edu", password: "Faculty@123!" }),
});
const cookie = cookieFrom(login.headers.getSetCookie?.() || []);

let last = null;
for (let i = 0; i < 180; i++) {
  const job = await fetch(`${BASE}/api/iscarb/lecture/jobs/${PID}`, { headers: { Cookie: cookie } });
  const j = await job.json();
  last = { i, status: j.progress?.status, progress: j.progress?.progress };
  if (i % 5 === 0) console.log("poll", JSON.stringify(last));
  if (j.progress?.status === "done" || j.progress?.status === "failed" || j.progress?.status === "chunk_done") {
    break;
  }
  // Also stop if version bumped and status settled
  const art = await db.lectureSlideArtifact.findFirst({
    where: { projectId: PID, slideNo: SLIDE, status: { not: "superseded" } },
    orderBy: { version: "desc" },
  });
  if (art && art.version > 6 && (j.progress?.progress ?? 0) >= 85) {
    last.versionEarly = art.version;
    break;
  }
  await new Promise((r) => setTimeout(r, 5000));
}

const art = await db.lectureSlideArtifact.findFirst({
  where: { projectId: PID, slideNo: SLIDE, status: { not: "superseded" } },
  orderBy: { version: "desc" },
});
const vs = art?.contentJson?.visualSpec || {};
const out = {
  last,
  version: art?.version,
  status: art?.status,
  facultyUploadedUrl: vs.facultyUploadedUrl || null,
  retained: vs.facultyUploadedUrl === EXPECT,
  storageKey: vs.facultyUploadedStorageKey || null,
  fetchedImageUrl: vs.fetchedImageUrl || null,
};
console.log(JSON.stringify(out, null, 2));
await db.$disconnect();
