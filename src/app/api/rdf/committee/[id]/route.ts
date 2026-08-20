import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Committee", async (id) => {
  return (db as any).committee.findUnique({
    where: { id },
  });
});
