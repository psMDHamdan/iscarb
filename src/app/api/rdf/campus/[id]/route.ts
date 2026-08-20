import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Campus", async (id) => {
  return (db as any).campus.findUnique({
    where: { id },
  });
});
