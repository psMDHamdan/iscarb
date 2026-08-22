import { db } from "../src/lib/db.js";

async function run() {
  const exp = await db.learningExperience.findFirst({
    where: { id: "cmt30736l001vonfe7y3mya0t" }
  });
  console.log("LearningExperience projectId:", exp?.projectId);

  process.exit(0);
}
run();
