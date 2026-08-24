/** Quick partial regen (3 slides) to verify visualSpec persistence without full 20-slide wait */
const BASE = "http://127.0.0.1:3000";
const PID = process.argv[2] || "cmt6k6ikz002kitmg9n12wuf5";

async function main() {
  const login = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "faculty@iscarb.edu", password: "Faculty@123!" }),
  });
  const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.match(/iscarb_session=[^;]+/)?.[0]).find(Boolean);

  const gen = await fetch(`${BASE}/api/iscarb/lecture/projects/${PID}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ slideNos: [1, 2, 3] }),
  });
  console.log("REGEN", gen.status, await gen.text());

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const job = await fetch(`${BASE}/api/iscarb/lecture/jobs/${PID}`, { headers: { Cookie: cookie } });
    const j = await job.json();
    console.log("JOB", i, j.progress?.status, j.progress?.progress);
    if (j.progress?.status === "done" || j.progress?.status === "failed") break;
  }

  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const arts = await db.lectureSlideArtifact.findMany({
    where: { projectId: PID, slideNo: { in: [1, 2, 3] }, status: { not: "superseded" } },
    orderBy: [{ slideNo: "asc" }, { version: "desc" }],
  });
  const seen = new Set();
  for (const a of arts) {
    if (seen.has(a.slideNo)) continue;
    seen.add(a.slideNo);
    const c = a.contentJson;
    const url = c?.visualSpec?.fetchedImageUrl || c?.visualSpec?.imageUrl;
    console.log(`S${a.slideNo}`, {
      hasVisualSpec: Boolean(c?.visualSpec),
      url: url?.slice(0, 90),
      bullets: c?.body?.bullets?.length,
    });
  }
  await db.$disconnect();
}

main().catch(console.error);
