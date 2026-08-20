import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Dataset", async (id) => {
  return (db as any).dataset.findUnique({
    where: { id },
  });
});
