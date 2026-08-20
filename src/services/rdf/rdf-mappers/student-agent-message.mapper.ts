/**
 * StudentAgentMessage entity mapper — converts Prisma StudentAgentMessage to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentAgentMessageEntity {
  id: string;
  agentId: string;
  studentId: string;
  role: string;
  content: string;
  metaJson: string;
}

export const studentAgentMessageMapper: RdfMapper<StudentAgentMessageEntity> = {
  entityType: "StudentAgentMessage",
  classUri: classUri("StudentAgentMessage"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentAgentMessage", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentAgentMessage")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:agentId", entity.agentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:role", entity.role, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:content", entity.content, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:metaJson", entity.metaJson, "xsd:string"));

    return { triples, graph };
  },
};
