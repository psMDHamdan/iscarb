import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("StudyPlan", async (id) => {
  return (db as any).studyPlan.findUnique({
    where: { id },
  });
});
