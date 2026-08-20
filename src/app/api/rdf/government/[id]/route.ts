import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Government", async (id) => {
  return db.government.findUnique({
    where: { id },
  });
});
