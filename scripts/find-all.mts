import { db } from "../src/lib/db.js";

async function run() {
  const projects = await db.lectureProject.findMany({
    select: { id: true, title: true }
  });
  console.log("All projects in DB:");
  projects.forEach(p => console.log(p.id, " - ", p.title));
  
  process.exit(0);
}
run();
