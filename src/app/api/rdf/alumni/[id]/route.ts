import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Alumni", async (id) => {
  return (db as any).alumni.findUnique({
    where: { id },
  });
});
