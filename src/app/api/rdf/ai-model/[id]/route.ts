import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("AiModel", async (id) => {
  return (db as any).aiModel.findUnique({
    where: { id },
  });
});
