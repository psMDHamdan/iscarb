import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Discussion", async (id) => {
  return (db as any).discussion.findUnique({
    where: { id },
  });
});
