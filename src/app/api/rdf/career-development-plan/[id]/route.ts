import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("CareerDevelopmentPlan", async (id) => {
  return (db as any).careerDevelopmentPlan.findUnique({
    where: { id },
  });
});
