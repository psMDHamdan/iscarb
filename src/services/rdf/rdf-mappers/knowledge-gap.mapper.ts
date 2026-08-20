/**
 * KnowledgeGap entity mapper — converts Prisma KnowledgeGap to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface KnowledgeGapEntity {
  id: string;
  studentId: string;
  courseId?: string | null;
  topic: string;
  description?: string | null;
  severity: number;
  detectedAt: Date;
  resolvedAt?: Date | null;
  status: string;
  recommendation?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const knowledgeGapMapper: RdfMapper<KnowledgeGapEntity> = {
  entityType: "KnowledgeGap",
  classUri: classUri("KnowledgeGap"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("KnowledgeGap", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("KnowledgeGap")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.courseId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:topic", entity.topic, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:severity", entity.severity, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:detectedAt", entity.detectedAt.toISOString(), "xsd:dateTime"));
    if (entity.resolvedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:resolvedAt", entity.resolvedAt.toISOString(), "xsd:dateTime"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.recommendation != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:recommendation", entity.recommendation, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
