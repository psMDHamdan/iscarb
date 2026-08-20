import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Patent", async (id) => {
  return (db as any).patent.findUnique({
    where: { id },
  });
});
