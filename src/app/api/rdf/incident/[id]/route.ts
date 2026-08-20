import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Incident", async (id) => {
  return (db as any).incident.findUnique({
    where: { id },
  });
});
