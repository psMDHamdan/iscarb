import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("JobApplication", async (id) => {
  return (db as any).jobApplication.findUnique({
    where: { id },
  });
});
