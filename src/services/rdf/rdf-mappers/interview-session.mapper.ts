/**
 * InterviewSession entity mapper — converts Prisma InterviewSession to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface InterviewSessionEntity {
  id: string;
  studentId: string;
  type: string;
  employerKey?: string | null;
  targetRole?: string | null;
}

export const interviewSessionMapper: RdfMapper<InterviewSessionEntity> = {
  entityType: "InterviewSession",
  classUri: classUri("InterviewSession"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("InterviewSession", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("InterviewSession")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:type", entity.type, "xsd:string"));
    if (entity.employerKey != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:employerKey", entity.employerKey, "xsd:string"));
    }
    if (entity.targetRole != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetRole", entity.targetRole, "xsd:string"));
    }

    return { triples, graph };
  },
};
