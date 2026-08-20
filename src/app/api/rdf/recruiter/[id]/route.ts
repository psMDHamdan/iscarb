import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Recruiter", async (id) => {
  return (db as any).recruiter.findUnique({
    where: { id },
  });
});
