import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Internship", async (id) => {
  return (db as any).internship.findUnique({
    where: { id },
  });
});
