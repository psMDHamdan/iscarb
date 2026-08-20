/**
 * AssessmentQuestionResponse entity mapper — converts Prisma AssessmentQuestionResponse to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AssessmentQuestionResponseEntity {
  id: string;
  submissionId: string;
  questionId: string;
  responseText?: string | null;
  selectedAnswer?: string | null;
  fileUrl?: string | null;
  sequenceNumber: number;
  idempotencyKey?: string | null;
  savedAt: Date;
  submittedAt?: Date | null;
}

export const assessmentQuestionResponseMapper: RdfMapper<AssessmentQuestionResponseEntity> = {
  entityType: "AssessmentQuestionResponse",
  classUri: classUri("AssessmentQuestionResponse"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AssessmentQuestionResponse", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AssessmentQuestionResponse")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:submissionId", entity.submissionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:questionId", entity.questionId, "xsd:string"));
    if (entity.responseText != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:responseText", entity.responseText, "xsd:string"));
    }
    if (entity.selectedAnswer != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:selectedAnswer", entity.selectedAnswer, "xsd:string"));
    }
    if (entity.fileUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:fileUrl", entity.fileUrl, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:sequenceNumber", entity.sequenceNumber, "xsd:decimal"));
    if (entity.idempotencyKey != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:idempotencyKey", entity.idempotencyKey, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:savedAt", entity.savedAt.toISOString(), "xsd:dateTime"));
    if (entity.submittedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:submittedAt", entity.submittedAt.toISOString(), "xsd:dateTime"));
    }

    return { triples, graph };
  },
};
