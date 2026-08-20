/**
 * CandidateSubmission entity mapper — converts Prisma CandidateSubmission to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface CandidateSubmissionEntity {
  id: string;
  jobId: string;
  studentId: string;
  recruiterId: string;
  status: string;
  feedbackJson?: string | null;
  matchScore?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export const candidateSubmissionMapper: RdfMapper<CandidateSubmissionEntity> = {
  entityType: "CandidateSubmission",
  classUri: classUri("CandidateSubmission"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("CandidateSubmission", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("CandidateSubmission")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:jobId", entity.jobId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:recruiterId", entity.recruiterId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.feedbackJson != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:feedbackJson", entity.feedbackJson, "xsd:string"));
    }
    if (entity.matchScore != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:matchScore", entity.matchScore, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
