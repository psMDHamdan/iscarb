import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("NetworkingEvent", async (id) => {
  return (db as any).networkingEvent.findUnique({
    where: { id },
  });
});
