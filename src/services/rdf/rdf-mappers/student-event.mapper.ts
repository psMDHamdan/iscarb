/**
 * StudentEvent entity mapper — converts Prisma StudentEvent to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentEventEntity {
  id: string;
  studentId: string;
  eventType: string;
  entityId?: string | null;
  metadata: string;
  createdAt: Date;
}

export const studentEventMapper: RdfMapper<StudentEventEntity> = {
  entityType: "StudentEvent",
  classUri: classUri("StudentEvent"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentEvent", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentEvent")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:eventType", entity.eventType, "xsd:string"));
    if (entity.entityId != null) {
      triples.push(rdfLiteralTriple(uri, "iscarb:entityId", entity.entityId, "xsd:string"));
    }
    triples.push(rdfLiteralTriple(uri, "iscarb:metadata", entity.metadata, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:createdAt", entity.createdAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
