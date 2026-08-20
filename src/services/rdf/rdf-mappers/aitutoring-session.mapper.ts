/**
 * AITutoringSession entity mapper — converts Prisma AITutoringSession to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface AITutoringSessionEntity {
  id: string;
  studentId: string;
  courseId: string;
  topicId?: string | null;
  messages: string;
}

export const aitutoringSessionMapper: RdfMapper<AITutoringSessionEntity> = {
  entityType: "AITutoringSession",
  classUri: classUri("AITutoringSession"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("AITutoringSession", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("AITutoringSession")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:courseId", entity.courseId, "xsd:string"));
    if (entity.topicId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:topicId", entity.topicId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:messages", entity.messages, "xsd:string"));

    return { triples, graph };
  },
};
