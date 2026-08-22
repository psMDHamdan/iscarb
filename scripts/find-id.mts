import { db } from "../src/lib/db.js";

async function run() {
  const artifact = await db.lectureSlideArtifact.findFirst({
    where: { id: "cmt30736l001vonfe7y3mya0t" },
    select: { projectId: true }
  });
  console.log("Artifact with id matches projectId:", artifact?.projectId);

  const proj = await db.lectureProject.findFirst({
    where: { id: "cmt30736l001vonfe7y3mya0t" }
  });
  console.log("Project with id matches:", proj?.id);

  const slidePlans = await db.lectureSlidePlan.findMany({
    take: 5,
    select: { projectId: true, id: true }
  });
  console.log("Sample Project IDs from SlidePlans:", slidePlans.map(p => p.projectId));

  process.exit(0);
}
run();
