import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("CompetencyDefinition", async (id) => {
  return (db as any).competencyDefinition.findUnique({
    where: { id },
  });
});
