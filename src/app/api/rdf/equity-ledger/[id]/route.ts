import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("EquityLedger", async (id) => {
  return (db as any).equityLedger.findUnique({
    where: { id },
  });
});
