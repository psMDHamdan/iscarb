/**
 * Interview entity mapper — converts Prisma Interview to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface InterviewEntity {
  id: string;
  submissionId: string;
  scheduledBy: string;
  candidateId: string;
  startTime: Date;
  endTime: Date;
  meetingUrl?: string | null;
  status: string;
  notes?: string | null;
  createdAt: Date;
}

export const interviewMapper: RdfMapper<InterviewEntity> = {
  entityType: "Interview",
  classUri: classUri("Interview"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("Interview", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("Interview")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:submissionId", entity.submissionId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:scheduledBy", entity.scheduledBy, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:candidateId", entity.candidateId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:startTime", entity.startTime.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:endTime", entity.endTime.toISOString(), "xsd:dateTime"));
    if (entity.meetingUrl != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:meetingUrl", entity.meetingUrl, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
