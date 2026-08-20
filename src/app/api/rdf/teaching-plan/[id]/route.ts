import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("TeachingPlan", async (id) => {
  return (db as any).teachingPlan.findUnique({
    where: { id },
  });
});
