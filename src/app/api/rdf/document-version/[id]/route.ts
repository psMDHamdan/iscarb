import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("DocumentVersion", async (id) => {
  return (db as any).documentVersion.findUnique({
    where: { id },
  });
});
