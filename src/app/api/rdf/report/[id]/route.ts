import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Report", async (id) => {
  return (db as any).report.findUnique({
    where: { id },
  });
});
