import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.assessmentAttempt.deleteMany();
  console.log("Deleted all assessment attempts");
}

main().catch(console.error).finally(() => db.$disconnect());
