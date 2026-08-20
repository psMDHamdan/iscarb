import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("CapstoneProject", async (id) => {
  return (db as any).capstoneProject.findUnique({
    where: { id },
  });
});
