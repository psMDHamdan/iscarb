/**
 * ResumeAiReview entity mapper — converts Prisma ResumeAiReview to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface ResumeAiReviewEntity {
  id: string;
  studentId: string;
  resumeContent: string;
  strengths: string;
  improvements: string;
  suggestedRevisions: string;
  score?: number | null;
  reviewedAt: Date;
  studentAccepted?: boolean | null;
  createdAt: Date;
}

export const resumeAiReviewMapper: RdfMapper<ResumeAiReviewEntity> = {
  entityType: "ResumeAiReview",
  classUri: classUri("ResumeAiReview"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("ResumeAiReview", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("ResumeAiReview")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:resumeContent", entity.resumeContent, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:strengths", entity.strengths, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:improvements", entity.improvements, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:suggestedRevisions", entity.suggestedRevisions, "xsd:string"));
    if (entity.score != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:score", entity.score, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:reviewedAt", entity.reviewedAt.toISOString(), "xsd:dateTime"));
    if (entity.studentAccepted != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:studentAccepted", entity.studentAccepted, "xsd:boolean"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
