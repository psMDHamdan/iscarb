import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Policy", async (id) => {
  return (db as any).policy.findUnique({
    where: { id },
  });
});
