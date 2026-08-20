/**
 * KnowledgeQualityCheck entity mapper — converts Prisma KnowledgeQualityCheck to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeQualityCheckEntity {
  id: string;
  entityType: string;
  entityId: string;
  checkType: string;
  status: string;
  score?: number | null;
  issues?: string | null;
  recommendations?: string | null;
  lastChecked?: Date | null;
  createdAt: Date;
}

export const knowledgeQualityCheckMapper: RdfMapper<KnowledgeQualityCheckEntity> = {
  entityType: "KnowledgeQualityCheck",
  classUri: classUri("KnowledgeQualityCheck"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeQualityCheck", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeQualityCheck")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:entityType", entity.entityType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:checkType", entity.checkType, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.score != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"));
    }
    if (entity.issues != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:issues", entity.issues, "xsd:string"));
    }
    if (entity.recommendations != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:recommendations", entity.recommendations, "xsd:string"));
    }
    if (entity.lastChecked) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastChecked", entity.lastChecked.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
