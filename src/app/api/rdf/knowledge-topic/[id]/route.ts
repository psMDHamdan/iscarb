import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("KnowledgeBaseTopic", async (id) => {
  return (db as any).knowledgeBaseTopic.findUnique({
    where: { id },
  });
});
