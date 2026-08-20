import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Experiment", async (id) => {
  return (db as any).experiment.findUnique({
    where: { id },
  });
});
