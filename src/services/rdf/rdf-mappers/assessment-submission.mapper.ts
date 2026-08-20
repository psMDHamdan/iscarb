/**
 * AssessmentSubmission entity mapper — converts Prisma AssessmentSubmission to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AssessmentSubmissionEntity {
  id: string;
  assessmentId: string;
  studentId: string;
  universityId: string;
  status: string;
  startedAt: Date;
  submittedAt?: Date | null;
  scoredAt?: Date | null;
  totalScore?: number | null;
  totalPoints?: number | null;
  percentageScore?: number | null;
  submissionToken: string;
  attemptNumber: number;
  sessionId?: string | null;
  lastActivityAt: Date;
  aiGeneratedFeedback?: string | null;
  keyWeaknesses?: string | null;
  nextRecommendedAction?: string | null;
}

export const assessmentSubmissionMapper: RdfMapper<AssessmentSubmissionEntity> = {
  entityType: "AssessmentSubmission",
  classUri: classUri("AssessmentSubmission"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AssessmentSubmission", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AssessmentSubmission")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:assessmentId", entity.assessmentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:universityId", entity.universityId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startedAt", entity.startedAt.toISOString(), "xsd:dateTime"));
    if (entity.submittedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:submittedAt", entity.submittedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.scoredAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:scoredAt", entity.scoredAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.totalScore != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:totalScore", entity.totalScore, "xsd:decimal"));
    }
    if (entity.totalPoints != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:totalPoints", entity.totalPoints, "xsd:decimal"));
    }
    if (entity.percentageScore != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:percentageScore", entity.percentageScore, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:submissionToken", entity.submissionToken, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:attemptNumber", entity.attemptNumber, "xsd:decimal"));
    if (entity.sessionId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:sessionId", entity.sessionId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:lastActivityAt", entity.lastActivityAt.toISOString(), "xsd:dateTime"));
    if (entity.aiGeneratedFeedback != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:aiGeneratedFeedback", entity.aiGeneratedFeedback, "xsd:string"));
    }
    if (entity.keyWeaknesses != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:keyWeaknesses", entity.keyWeaknesses, "xsd:string"));
    }
    if (entity.nextRecommendedAction != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:nextRecommendedAction", entity.nextRecommendedAction, "xsd:string"));
    }

    return { triples, graph };
  },
};
