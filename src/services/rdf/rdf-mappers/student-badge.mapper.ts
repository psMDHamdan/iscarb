/**
 * StudentBadge entity mapper — converts Prisma StudentBadge to RDF triples.
 */
import type { RdfMapper, MapperResult } from "./types";
import { rdfLiteralTriple, rdfTriple } from "./types";
import { instanceUri, classUri, universityGraph } from "@/config/rdf";

interface StudentBadgeEntity {
  id: string;
  studentId: string;
  earnedAt: Date;
}

export const studentBadgeMapper: RdfMapper<StudentBadgeEntity> = {
  entityType: "StudentBadge",
  classUri: classUri("StudentBadge"),

  toTriples(entity, universityCode): MapperResult {
    const uri = instanceUri("StudentBadge", universityCode, entity.id);
    const graph = universityGraph(universityCode);

    const triples = [
      rdfTriple(uri, "rdf:type", classUri("StudentBadge")),
      rdfLiteralTriple(uri, "iscarb:hasId", entity.id, "xsd:string"),
    ];

    triples.push(rdfLiteralTriple(uri, "iscarb:studentId", entity.studentId, "xsd:string"));
    triples.push(rdfLiteralTriple(uri, "iscarb:earnedAt", entity.earnedAt.toISOString(), "xsd:dateTime"));

    return { triples, graph };
  },
};
