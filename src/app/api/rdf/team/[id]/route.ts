import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Team", async (id) => {
  return db.team.findUnique({
    where: { id },
  });
});
