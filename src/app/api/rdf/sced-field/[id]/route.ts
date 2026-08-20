import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("ScedField", async (id) => {
  return (db as any).scedField.findUnique({
    where: { id },
  });
});
