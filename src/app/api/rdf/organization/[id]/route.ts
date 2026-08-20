import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Organization", async (id) => {
  return db.organization.findUnique({
    where: { id },
    include: {
      settings: true,
      hierarchy: true,
    }
  });
});
