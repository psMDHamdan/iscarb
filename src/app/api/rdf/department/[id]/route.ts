import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Department", async (id) => {
  return db.department.findUnique({
    where: { id },
  });
});
