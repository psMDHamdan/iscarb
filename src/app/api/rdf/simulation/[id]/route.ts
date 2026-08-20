import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Simulation", async (id) => {
  return (db as any).simulation.findUnique({
    where: { id },
  });
});
