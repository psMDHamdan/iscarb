import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Course", async (id) => {
  return (db as any).course.findUnique({
    where: { id },
  });
});
