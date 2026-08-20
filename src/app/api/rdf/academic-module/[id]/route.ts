import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("AcademicModule", async (id) => {
  return (db as any).academicModule.findUnique({
    where: { id },
  });
});
