import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("University", async (id) => {
  return db.university.findUnique({
    where: { id },
  });
});
