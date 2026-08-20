/**
 * KnowledgeBaseFeedback entity mapper — converts Prisma KnowledgeBaseFeedback to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeBaseFeedbackEntity {
  id: string;
  articleId: string;
  article: string;
  userId?: string | null;
  isHelpful?: boolean | null;
  rating?: number | null;
  comment?: string | null;
  submittedAt: Date;
}

export const knowledgeBaseFeedbackMapper: RdfMapper<KnowledgeBaseFeedbackEntity> = {
  entityType: "KnowledgeBaseFeedback",
  classUri: classUri("KnowledgeBaseFeedback"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeBaseFeedback", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeBaseFeedback")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:articleId", entity.articleId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:article", entity.article, "xsd:string"));
    if (entity.userId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    }
    if (entity.isHelpful != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:isHelpful", entity.isHelpful, "xsd:boolean"));
    }
    if (entity.rating != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rating", entity.rating, "xsd:decimal"));
    }
    if (entity.comment != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:comment", entity.comment, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:submittedAt", entity.submittedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
