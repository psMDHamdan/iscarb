import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("FundingProgram", async (id) => {
  return (db as any).fundingProgram.findUnique({
    where: { id },
  });
});
