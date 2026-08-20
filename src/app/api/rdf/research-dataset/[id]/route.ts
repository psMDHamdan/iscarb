import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("ResearchDataset", async (id) => {
  return (db as any).researchDataset.findUnique({
    where: { id },
  });
});
