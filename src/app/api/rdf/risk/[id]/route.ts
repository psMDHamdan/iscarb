import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Risk", async (id) => {
  return (db as any).risk.findUnique({
    where: { id },
  });
});
