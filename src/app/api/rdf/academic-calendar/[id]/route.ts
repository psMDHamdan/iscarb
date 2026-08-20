import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("OrgAcademicCalendar", async (id) => {
  return (db as any).orgAcademicCalendar.findUnique({
    where: { id },
  });
});
