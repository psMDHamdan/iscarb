import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("DigitalCredential", async (id) => {
  return (db as any).digitalCredential.findUnique({
    where: { id },
  });
});
