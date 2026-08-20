import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Semester", async (id) => {
  return (db as any).semester.findUnique({
    where: { id },
  });
});
