/**
 * StudentAgent entity mapper — converts Prisma StudentAgent to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentAgentEntity {
  id: string;
  studentId: string;
  name: string;
  persona: string;
  state: string;
  lastNudge?: string | null;
  streakDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export const studentAgentMapper: RdfMapper<StudentAgentEntity> = {
  entityType: "StudentAgent",
  classUri: classUri("StudentAgent"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentAgent", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentAgent")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:name", entity.name, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:persona", entity.persona, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:state", entity.state, "xsd:string"));
    if (entity.lastNudge != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:lastNudge", entity.lastNudge, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:streakDays", entity.streakDays, "xsd:decimal"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));
    triples.push(rdfLiteralTriple(uri, "iscarb:updatedAt", entity.updatedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
