import { db } from "@/lib/db";
import { createRdfRoute } from "@/lib/rdf/generic-rdf-route";

export const GET = createRdfRoute("KnowledgeBaseArticle", async (id) => {
  return (db as any).knowledgeBaseArticle.findUnique({
    where: { id },
  });
});
