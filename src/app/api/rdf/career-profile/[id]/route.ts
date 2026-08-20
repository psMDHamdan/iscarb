import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("CareerProfile", async (id) => {
  return (db as any).careerProfile.findUnique({
    where: { id },
  });
});
