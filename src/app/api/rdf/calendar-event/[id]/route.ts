import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("CalendarEvent", async (id) => {
  return (db as any).calendarEvent.findUnique({
    where: { id },
  });
});
