import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Hackathon", async (id) => {
  return (db as any).hackathon.findUnique({
    where: { id },
  });
});
