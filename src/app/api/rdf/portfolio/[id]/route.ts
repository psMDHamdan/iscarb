import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("Portfolio", async (id) => {
  return (db as any).portfolio.findUnique({
    where: { id },
  });
});
