import { db } from "../src/lib/db.js";

const experienceId = "cmt30736l001vonfe7y3mya0t";
const exp = await db.studentLectureExperience.findUnique({
  where: { id: experienceId }
});
console.log("Found experience:", exp);
