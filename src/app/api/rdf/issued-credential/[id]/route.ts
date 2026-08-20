import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("IssuedCredential", async (id) => {
  return (db as any).issuedCredential.findUnique({
    where: { id },
  });
});
