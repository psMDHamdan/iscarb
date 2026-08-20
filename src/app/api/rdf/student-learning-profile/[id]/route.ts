import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("StudentLearningProfile", async (id) => {
  return (db as any).studentLearningProfile.findUnique({
    where: { id },
  });
});
