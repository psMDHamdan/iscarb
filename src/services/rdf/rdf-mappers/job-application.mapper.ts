/**
 * JobApplication entity mapper — converts Prisma JobApplication to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface JobApplicationEntity {
  id: string;
  studentId: string;
  jobId: string;
  status: string;
  appliedAt: Date;
  reviewedAt?: Date | null;
  interviewedAt?: Date | null;
  decisionAt?: Date | null;
  coverLetter?: string | null;
}

export const jobApplicationMapper: RdfMapper<JobApplicationEntity> = {
  entityType: "JobApplication",
  classUri: classUri("JobApplication"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("JobApplication", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("JobApplication")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:jobId", entity.jobId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:appliedAt", entity.appliedAt.toISOString(), "xsd:dateTime"));
    if (entity.reviewedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reviewedAt", entity.reviewedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.interviewedAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:interviewedAt", entity.interviewedAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.decisionAt) {
      triples.push(rdfLiteralTriple(uri, "iscarb:decisionAt", entity.decisionAt.toISOString(), "xsd:dateTime"));
    }
    if (entity.coverLetter != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:coverLetter", entity.coverLetter, "xsd:string"));
    }

    return { triples, graph };
  },
};
