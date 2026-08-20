/**
 * InterviewPrep entity mapper — converts Prisma InterviewPrep to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface InterviewPrepEntity {
  id: string;
  studentId: string;
  targetSsco?: string | null;
  targetTitle?: string | null;
}

export const interviewPrepMapper: RdfMapper<InterviewPrepEntity> = {
  entityType: "InterviewPrep",
  classUri: classUri("InterviewPrep"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("InterviewPrep", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("InterviewPrep")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    if (entity.targetSsco != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetSsco", entity.targetSsco, "xsd:string"));
    }
    if (entity.targetTitle != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:targetTitle", entity.targetTitle, "xsd:string"));
    }

    return { triples, graph };
  },
};
