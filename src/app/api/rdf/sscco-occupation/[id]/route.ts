import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("SsccoOccupation", async (id) => {
  return (db as any).ssccoOccupation.findUnique({
    where: { id },
  });
});
