import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("JobPosting", async (id) => {
  return (db as any).jobPosting.findUnique({
    where: { id },
  });
});
