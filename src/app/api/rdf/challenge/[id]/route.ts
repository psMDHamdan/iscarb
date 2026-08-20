import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Challenge", async (id) => {
  return (db as any).challenge.findUnique({
    where: { id },
  });
});
