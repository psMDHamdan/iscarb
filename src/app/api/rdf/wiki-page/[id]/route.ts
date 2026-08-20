import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("WikiPage", async (id) => {
  return (db as any).wikiPage.findUnique({
    where: { id },
  });
});
