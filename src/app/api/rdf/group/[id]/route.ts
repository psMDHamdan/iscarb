import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Group", async (id) => {
  return db.group.findUnique({
    where: { id },
    include: {
      members: true,
    }
  });
});
