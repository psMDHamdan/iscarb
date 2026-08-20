import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Role", async (id) => {
  return db.role.findUnique({
    where: { id },
  });
});
