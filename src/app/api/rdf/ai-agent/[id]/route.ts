import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("AiAgent", async (id) => {
  return (db as any).aiAgent.findUnique({
    where: { id },
  });
});
