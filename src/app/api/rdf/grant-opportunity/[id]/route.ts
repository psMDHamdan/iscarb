import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("GrantOpportunity", async (id) => {
  return (db as any).grantOpportunity.findUnique({
    where: { id },
  });
});
