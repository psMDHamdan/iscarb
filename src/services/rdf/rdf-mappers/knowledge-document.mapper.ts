/**
 * KnowledgeDocument entity mapper — converts Prisma KnowledgeDocument to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeDocumentEntity {
  id: string;
  title: string;
  content?: string | null;
  type: string;
  format: string;
  authorId: string;
  organizationId?: string | null;
  status: string;
  version: number;
  qualityScore?: number | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const knowledgeDocumentMapper: RdfMapper<KnowledgeDocumentEntity> = {
  entityType: "KnowledgeDocument",
  classUri: classUri("KnowledgeDocument"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeDocument", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeDocument")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.content != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:format", entity.format, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:authorId", entity.authorId, "xsd:string"));
    if (entity.organizationId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:organizationId", entity.organizationId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:version", entity.version, "xsd:decimal"));
    if (entity.qualityScore != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:qualityScore", entity.qualityScore, "xsd:decimal"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
