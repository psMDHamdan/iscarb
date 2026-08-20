/**
 * CareerMockInterview entity mapper — converts Prisma CareerMockInterview to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CareerMockInterviewEntity {
  id: string;
  studentId: string;
  interviewType: string;
  targetRole?: string | null;
  targetCompany?: string | null;
  performanceScore?: number | null;
  duration?: number | null;
  startedAt: Date;
  completedAt?: Date | null;
  aiGeneratedFeedback?: string | null;
  universityId?: string | null;
}

export const careerMockInterviewMapper: RdfMapper<CareerMockInterviewEntity> = {
  entityType: "CareerMockInterview",
  classUri: classUri("CareerMockInterview"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CareerMockInterview", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CareerMockInterview")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:interviewType", entity.interviewType, "xsd:string"));
    if (entity.targetRole != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetRole", entity.targetRole, "xsd:string"));
    }
    if (entity.targetCompany != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetCompany", entity.targetCompany, "xsd:string"));
    }
    if (entity.performanceScore != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:performanceScore", entity.performanceScore, "xsd:decimal"));
    }
    if (entity.duration != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:duration", entity.duration, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:startedAt", entity.startedAt.toISOString(), "xsd:dateTime"));
    if (entity.completedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:completedAt", entity.completedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.aiGeneratedFeedback != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:aiGeneratedFeedback", entity.aiGeneratedFeedback, "xsd:string"));
    }
    if (entity.universityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    }

    return { triples, graph };
  },
};
