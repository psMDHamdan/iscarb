import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Faculty", async (id) => {
  return (db as any).faculty.findUnique({
    where: { id },
  });
});
