/**
 * KnowledgeBaseView entity mapper — converts Prisma KnowledgeBaseView to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeBaseViewEntity {
  id: string;
  articleId: string;
  article: string;
  userId?: string | null;
  sessionId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  viewedAt: Date;
  timeSpent?: number | null;
}

export const knowledgeBaseViewMapper: RdfMapper<KnowledgeBaseViewEntity> = {
  entityType: "KnowledgeBaseView",
  classUri: classUri("KnowledgeBaseView"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeBaseView", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeBaseView")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:articleId", entity.articleId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:article", entity.article, "xsd:string"));
    if (entity.userId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    }
    if (entity.sessionId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sessionId", entity.sessionId, "xsd:string"));
    }
    if (entity.ipHash != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:ipHash", entity.ipHash, "xsd:string"));
    }
    if (entity.userAgent != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userAgent", entity.userAgent, "xsd:string"));
    }
    if (entity.referer != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:referer", entity.referer, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:viewedAt", entity.viewedAt.toISOString(), "xsd:dateTime"));
    if (entity.timeSpent != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:timeSpent", entity.timeSpent, "xsd:decimal"));
    }

    return { triples, graph };
  },
};
