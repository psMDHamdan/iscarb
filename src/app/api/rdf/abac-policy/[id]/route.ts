import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("AbacPolicy", async (id) => {
  return db.abacPolicy.findUnique({
    where: { id },
  });
});
