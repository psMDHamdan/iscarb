import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Program", async (id) => {
  return (db as any).program.findUnique({
    where: { id },
  });
});
