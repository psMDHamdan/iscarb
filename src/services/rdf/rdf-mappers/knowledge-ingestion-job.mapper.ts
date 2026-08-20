/**
 * KnowledgeIngestionJob entity mapper — converts Prisma KnowledgeIngestionJob to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeIngestionJobEntity {
  id: string;
  sourceId: string;
  status: string;
  startedAt?: Date | null;
  completedAt?: Date | null;
  documentsCount: number;
  errors?: string | null;
  metadata?: string | null;
  createdAt: Date;
}

export const knowledgeIngestionJobMapper: RdfMapper<KnowledgeIngestionJobEntity> = {
  entityType: "KnowledgeIngestionJob",
  classUri: classUri("KnowledgeIngestionJob"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeIngestionJob", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeIngestionJob")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:sourceId", entity.sourceId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.startedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:startedAt", entity.startedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:documentsCount", entity.documentsCount, "xsd:decimal"));
    if (entity.errors != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:errors", entity.errors, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
