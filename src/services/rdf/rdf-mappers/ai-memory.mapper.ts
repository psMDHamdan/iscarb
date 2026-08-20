/**
 * AiMemory entity mapper — converts Prisma AiMemory to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AiMemoryEntity {
  id: string;
  userId: string;
  type: string;
  content: string;
  summary?: string | null;
  embedding?: string | null;
  metadata?: string | null;
  relevance: number;
  accessCount: number;
  lastAccessedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const aiMemoryMapper: RdfMapper<AiMemoryEntity> = {
  entityType: "AiMemory",
  classUri: classUri("AiMemory"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AiMemory", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AiMemory")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    if (entity.summary != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:summary", entity.summary, "xsd:string"));
    }
    if (entity.embedding != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:embedding", entity.embedding, "xsd:string"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:relevance", entity.relevance, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:accessCount", entity.accessCount, "xsd:decimal"));
    if (entity.lastAccessedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastAccessedAt", entity.lastAccessedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.expiresAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:expiresAt", entity.expiresAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
