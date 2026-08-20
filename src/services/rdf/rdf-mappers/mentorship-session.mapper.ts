/**
 * MentorshipSession entity mapper — converts Prisma MentorshipSession to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface MentorshipSessionEntity {
  id: string;
  mentorId: string;
  mentor: string;
  studentId: string;
  topic: string;
  scheduledAt: Date;
  status: string;
  notes?: string | null;
  rating?: number | null;
  createdAt: Date;
}

export const mentorshipSessionMapper: RdfMapper<MentorshipSessionEntity> = {
  entityType: "MentorshipSession",
  classUri: classUri("MentorshipSession"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("MentorshipSession", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("MentorshipSession")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:mentorId", entity.mentorId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:mentor", entity.mentor, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:topic", entity.topic, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:scheduledAt", entity.scheduledAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:status", entity.status, "xsd:string"));
    if (entity.notes != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:notes", entity.notes, "xsd:string"));
    }
    if (entity.rating != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:rating", entity.rating, "xsd:decimal"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
