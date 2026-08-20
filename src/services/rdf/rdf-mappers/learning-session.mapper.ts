/**
 * LearningSession entity mapper — converts Prisma LearningSession to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface LearningSessionEntity {
  id: string;
  userId: string;
  sessionId: string;
  title: string;
  description?: string | null;
  duration: number;
  type: string;
  subject?: string | null;
  activityCount: number;
  qualityScore?: number | null;
  startedAt: Date;
  endedAt?: Date | null;
  metadata?: string | null;
  createdAt: Date;
}

export const learningSessionMapper: RdfMapper<LearningSessionEntity> = {
  entityType: "LearningSession",
  classUri: classUri("LearningSession"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("LearningSession", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("LearningSession")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:userId", entity.userId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:sessionId", entity.sessionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:title", entity.title, "xsd:string"));
    if (entity.description != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:description", entity.description, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:duration", entity.duration, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.subject != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:subject", entity.subject, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:activityCount", entity.activityCount, "xsd:decimal"));
    if (entity.qualityScore != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:qualityScore", entity.qualityScore, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:startedAt", entity.startedAt.toISOString(), "xsd:dateTime"));
    if (entity.endedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:endedAt", entity.endedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.metadata != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
