import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("AcademicYear", async (id) => {
  return (db as any).academicYear.findUnique({
    where: { id },
  });
});
