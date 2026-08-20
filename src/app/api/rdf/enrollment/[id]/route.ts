import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Enrollment", async (id) => {
  return (db as any).enrollment.findUnique({
    where: { id },
  });
});
