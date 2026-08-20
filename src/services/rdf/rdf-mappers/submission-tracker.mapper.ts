/**
 * SubmissionTracker entity mapper — converts Prisma SubmissionTracker to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface SubmissionTrackerEntity {
  id: string;
  publicationId: string;
  publication: string;
  journalName: string;
  journalISSN?: string | null;
  status: string;
  submittedDate?: Date | null;
  reviewDeadline?: Date | null;
  reviewerComments?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const submissionTrackerMapper: RdfMapper<SubmissionTrackerEntity> = {
  entityType: "SubmissionTracker",
  classUri: classUri("SubmissionTracker"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("SubmissionTracker", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("SubmissionTracker")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:publicationId", entity.publicationId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:publication", entity.publication, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:journalName", entity.journalName, "xsd:string"));
    if (entity.journalISSN != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:journalISSN", entity.journalISSN, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.submittedDate) {
      triples.push(rdfLiteralTriple(uri, "iscarb:submittedDate", entity.submittedDate.toISOString(), "xsd:dateTime"));
    }
    if (entity.reviewDeadline) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reviewDeadline", entity.reviewDeadline.toISOString(), "xsd:dateTime"));
    }
    if (entity.reviewerComments != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:reviewerComments", entity.reviewerComments, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
