import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Workflow", async (id) => {
  return (db as any).workflow.findUnique({
    where: { id },
  });
});
