import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("CareerPath", async (id) => {
  return (db as any).careerPath.findUnique({
    where: { id },
  });
});
