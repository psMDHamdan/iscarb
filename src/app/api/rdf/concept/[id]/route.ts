import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Concept", async (id) => {
  return (db as any).concept.findUnique({
    where: { id },
  });
});
