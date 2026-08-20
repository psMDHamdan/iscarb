import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Announcement", async (id) => {
  return (db as any).announcement.findUnique({
    where: { id },
  });
});
