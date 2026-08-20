/**
 * KnowledgeBaseSearch entity mapper — converts Prisma KnowledgeBaseSearch to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeBaseSearchEntity {
  id: string;
  query: string;
  userId?: string | null;
  topicMatches: number;
  articleMatches: number;
  resultClicked: boolean;
  clickedItemId?: string | null;
  sessionId?: string | null;
  searchedAt: Date;
}

export const knowledgeBaseSearchMapper: RdfMapper<KnowledgeBaseSearchEntity> = {
  entityType: "KnowledgeBaseSearch",
  classUri: classUri("KnowledgeBaseSearch"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeBaseSearch", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeBaseSearch")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:query", entity.query, "xsd:string"));
    if (entity.userId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:topicMatches", entity.topicMatches, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:articleMatches", entity.articleMatches, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:resultClicked", entity.resultClicked, "xsd:boolean"));
    if (entity.clickedItemId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:clickedItemId", entity.clickedItemId, "xsd:string"));
    }
    if (entity.sessionId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sessionId", entity.sessionId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:searchedAt", entity.searchedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
