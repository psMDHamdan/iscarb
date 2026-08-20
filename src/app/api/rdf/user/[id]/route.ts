import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("User", async (id) => {
  return db.user.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: { role: true }
      }
    }
  });
});
