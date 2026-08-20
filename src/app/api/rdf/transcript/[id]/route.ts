import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("AcademicTranscript", async (id) => {
  return (db as any).academicTranscript.findUnique({
    where: { id },
  });
});
